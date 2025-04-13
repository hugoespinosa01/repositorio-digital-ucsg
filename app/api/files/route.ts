import { NextRequest, NextResponse } from "next/server";
import {
  BlobDeleteOptions,
  BlobDeleteResponse,
  BlobServiceClient,
  BlockBlobClient,
} from "@azure/storage-blob";
import { prisma } from "@/lib/prisma";
import { Documento } from "@/types/file";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import {
  AnalyzedDocument,
  AnalyzeResult,
  AzureKeyCredential,
  DocumentAnalysisClient,
} from "@azure/ai-form-recognizer";
import { loadToPinecone } from "@/lib/pinecone";
import { checkCarrera } from "@/utils/checkCarrera";
import { Materia } from "@/types/materia";
import { normalizeCoordinates } from "@/utils/azureDI";

// API VERSION 2024-11-30
import DocumentIntelligence from "@azure-rest/ai-document-intelligence";
import {
    getLongRunningPoller,
    isUnexpected,
    AnalyzeOperationOutput,
  } from "@azure-rest/ai-document-intelligence";
import { getContainerSize } from "@/lib/azure";

dotenv.config();
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "";

// Cliente API para reconocimiento OCR layout
const newApiVersionClient = DocumentIntelligence(
  process.env["FORM_RECOGNIZER_ENDPOINT"] || "",
  {
    key: process.env["FORM_RECOGNIZER_API_KEY"] || "",
  }
);

interface DocumentField {
  value: any;
  confidence: number;
  values?: any[];
}

interface ExtractedDataFields {
  fields: {
    [field: string]: DocumentField;
  };
  docType: string;
  labelsJson: LabelField[];
  confidence: number;
}

interface ColumnMapping {
  materiaIndex?: number[];
  matriculas?: {
    tipo: "simple" | "agrupada";
    indices: number[];
    headerIndex?: number;
  }[];
  calificacionIndexes?: number[];
  supletorioColumnIndex?: number;
}

type Row = {
  Matr1: {
    value: string | undefined;
  };
  Matr2: {
    value: string | undefined;
  };
  Matr3: {
    value: string | undefined;
  };
};

interface ModelField {
  type: string;
  valueString: string;
  content: string;
  boundingRegions: {
    pageNumber: number;
    polygon: number[];
  }[];
  confidence: number;
  spans: {
    offset: number;
    length: number;
  }[];
}

interface LabelField {
  label: string;
  value: {
    page: number;
    text: string;
    boundingBoxes: number[][];
  }[];
}

export async function GET(request: Request) {
  try {
    const files = await prisma.documento.findMany({
      where: {
        Estado: 1,
      },
    });
    if (!files) {
      return NextResponse.json(
        { error: "Error fetching files" },
        { status: 500 }
      );
    }

    const result = {
      message: "Documentos encontrados con éxito",
      status: 200,
      data: files,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error fetching files:", err);
    const errResponse = {
      error: "Error fetching files",
      status: 500,
      message: err,
    };
    return NextResponse.json(errResponse);
  }
}

/**
 * Almacena y extrae datos del documento subido por el usuario
 * @param request Petición del cliente
 * @returns
 */
export async function POST(request: NextRequest) {
  try {
    //1. Valido el formdata
    const formData = await request.formData();

    if (!formData) {
      return NextResponse.json({ error: "No form data" }, { status: 400 });
    }

    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 2. Convierto el archivo a ArrayBuffer
    const pdfData = await file.arrayBuffer();

    // 3. Hago la extracción de datos con el modelo compuesto
    let extractedData = await extractData(pdfData, "kardex-composed-model-v2");

    // 4. Proceso los datos extraídos
    const { docType, fields, labelsJson, confidence } =
      extractedData as ExtractedDataFields;

    if (!extractedData) {
      throw new Error("Invalid extracted data structure");
    }

    //Human in the loop
    // Si el nivel de confianza es bajo, se requiere validación humana
    if (confidence < 0.9 ) {
        
        // Calcular el tamaño del contenedor para el dataset de entrenamiento, ya que solo es permitido máx. 2GB
        const containerSize = await getContainerSize(containerName, docType);

        if (!((containerSize + file.size) > 2 * 1024 * 1024 * 1024)) {
            // 6. Subo una copia del documento al contenedor del dataset de entrenamiento
            const blobName = await uploadToBlobStorage(pdfData, docType);

            // 8. Corro el análisis Layout para guardar el ocr.json
            await runLayoutAnalysis(pdfData, blobName);

            // Subir el labels.json al blob storage inicial
            let labelsResultJson = await saveToLabelsJson(labelsJson, blobName);
        }
        
    }

    //5. Subo al blob storage
    const blobName = await uploadToBlobStorage(pdfData);

    //8. Validar campos específicos necesarios
    const requiredFields = ["Alumno", "NoIdentificacion", "Carrera"];
    for (const field of requiredFields) {
      if (!fields[field] || !fields[field].value) {
        await deleteBlob(blobName);
        throw new Error(`Missing required field: ${field}`);
      }
    }

    //9. Valido si el documento ya ha sido subido anteriormente
    let cedula = fields.NoIdentificacion.value.replace(/[^0-9]/g, "") ?? "";

    const documentoYaSubido = await prisma.tipoDocumentoKardex.findFirst({
      where: {
        NoIdentificacion: cedula,
        Estado: 1,
      },
    });

    if (documentoYaSubido) {
      await deleteBlob(blobName);
      throw new Error("El documento ya ha sido subido anteriormente");
    }

    // 10. Busco el ID de la carrera
    const carreraArray = await checkCarrera(fields.Carrera.value);

    if (carreraArray.length === 0) {
      throw new Error(
        "El documento no es válido o no se pudo extraer la carrera"
      );
    }

    // 11. Extraigo datos del documento (producto de Azure AI Intelligence)
    const datosExtraidos = {
      alumno: formatData(fields.Alumno.value),
      noIdentificacion: cedula,
      carrera: carreraArray[0].nombre ?? "",
      materiasAprobadas: [] as Materia[],
    };

    // 12. Extraigo las materias aprobadas y las guardo en un array
    await populateDetalleMaterias(datosExtraidos, fields);

    // 13. Busco la carpeta root
    let carpetaRoot = await prisma.carpeta.findFirst({
      where: {
        IdCarpetaPadre: null,
        Estado: 1,
      },
    });

    // 14. Creo la carpeta root si no existe
    if (!carpetaRoot) {
      carpetaRoot = await prisma.carpeta.create({
        data: {
          FechaCreacion: new Date(),
          IdCarpetaPadre: null,
          Nombre: "ucsg", // Carpeta raíz predeterminada
          Tipo: "Carpeta",
          Ruta: "/",
          Estado: 1,
        },
      });
    }

    // 15. Busco el Id de la carpeta de la carrera correspondiente
    let carpetaObjetivo = await prisma.carpeta.findFirst({
      where: {
        IdCarrera: {
          in: carreraArray.map((item) => item.id),
        },
        Estado: 1,
        IdCarpetaPadre: carpetaRoot?.Id,
      },
    });

    // 16. Creo la carpeta de la carrera si no existe
    if (!carpetaObjetivo) {
      carpetaObjetivo = await prisma.carpeta.create({
        data: {
          FechaCreacion: new Date(),
          IdCarrera: carreraArray[0].id,
          IdCarpetaPadre: carpetaRoot?.Id,
          Nombre: datosExtraidos.carrera,
          Estado: 1,
          Tipo: "Carpeta",
          Ruta: `/${carpetaRoot.Nombre}/${datosExtraidos.carrera}`,
        },
      });
    }

    // 16. Busco la carpeta del estudiante
    let carpetaEstudiante = await prisma.carpeta.findFirst({
      where: {
        Nombre: datosExtraidos.alumno,
        IdCarpetaPadre: carpetaObjetivo?.Id,
        Estado: 1,
      },
    });

    // 17. Creo la carpeta del estudiante si no existe
    if (!carpetaEstudiante) {
      carpetaEstudiante = await prisma.carpeta.create({
        data: {
          FechaCreacion: new Date(),
          IdCarpetaPadre: carpetaObjetivo?.Id,
          IdCarrera: carreraArray[0].id,
          Nombre: datosExtraidos.alumno,
          Estado: 1,
          Tipo: "Carpeta",
          Ruta: `/${carpetaRoot?.Nombre}/${carpetaObjetivo?.Nombre}/${datosExtraidos.alumno}`,
        },
      });
    }

    const nombreArchivo =
      datosExtraidos.alumno + " - " + datosExtraidos.noIdentificacion;
    const ruta = `/${carpetaRoot?.Nombre}/${carpetaObjetivo?.Nombre}/${datosExtraidos.alumno}/${nombreArchivo}`;
    const idCarpeta = carpetaEstudiante?.Id;
    const extension = file.name.substring(file.name.lastIndexOf(".") + 1);

    // 19. Creo el documento (archivo)
    const newDocumento = await prisma.documento.create({
      data: {
        IdCarpeta: idCarpeta,
        NombreArchivo: nombreArchivo,
        Ruta: ruta,
        FechaCarga: new Date(),
        Estado: 1,
        Tamano: file.size,
        Extension: extension,
        Tipo: "Archivo",
        RefArchivo: blobName,
      },
    });

    if (!newDocumento) {
      return NextResponse.json(
        { error: "Error creando documento" },
        { status: 500 }
      );
    }

    // 20. Creo el tipo de documento kardex
    const tipoDocKardex = await prisma.tipoDocumentoKardex.create({
      data: {
        IdDocumento: newDocumento.Id,
        Alumno: datosExtraidos.alumno,
        NoIdentificacion: datosExtraidos.noIdentificacion,
        Estado: 1,
        Carrera: datosExtraidos.carrera,
      },
    });

    if (!tipoDocKardex) {
      return NextResponse.json(
        { error: "Error creando tipo de documento kardex" },
        { status: 500 }
      );
    }

    // 21. Creo los detalles del kardex
    for (let materia of datosExtraidos.materiasAprobadas) {
      await prisma.documentoDetalleKardex.create({
        data: {
          Ciclo: materia.Nivel,
          Materia: materia.Materia,
          Periodo: materia.Periodo,
          Calificacion: Number(materia.Calificacion) || null,
          NoMatricula: Number(materia.NoMatricula) || null,
          Estado: 1,
          IdDocumentoKardex: tipoDocKardex.Id,
        },
      });
    }

    // 22. Subo a la base de conocimientos
    await loadToPinecone(file.name, newDocumento as Documento, datosExtraidos);

    const result = {
      message: "Documento creado con éxito",
      status: 200,
      data: newDocumento,
    };
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Error creating document:", err);
    const errResponse = {
      error: "Error creating document",
      status: 500,
      message:
        err instanceof Error ? err.message : "Error desconocido, ver más logs",
    };
    return NextResponse.json(errResponse, { status: 500 });
  }
}

/**
 * Ejecuta el análisis con el modelo 'prebuilt-layout'
 * @param pdfData Archivo PDF a analizar
 * @param fileName Nombre del archivo
 * @returns Datos extraídos del análisis
 */
const runLayoutAnalysis = async (pdfData: ArrayBuffer, fileName: string) => {
  try {
    
    const initialResponse = await newApiVersionClient
      .path("/documentModels/{modelId}:analyze", "prebuilt-layout")
      .post({
        contentType: "application/json",
        body: {
          base64Source: Buffer.from(pdfData).toString("base64"),
        },
        queryParameters: { locale: "es-ES" },
      });

    if (isUnexpected(initialResponse)) {
        throw new Error(`Error: ${initialResponse.body.error.message}`);
    }

    const poller = getLongRunningPoller(newApiVersionClient, initialResponse);
    const result = (await poller.pollUntilDone()).body as AnalyzeOperationOutput;

    return saveToOcrJson(result, fileName);

  } catch (err) {
    console.error("Error during layout analysis:", err);
    throw new Error("Error during layout analysis");
  }
};

const modelToLabelsJson = (
  analyzeResult: AnalyzeResult<AnalyzedDocument>
): LabelField[] => {
  if (!analyzeResult.pages) {
    throw new Error("No pages found in analyze result");
  }

  if (!analyzeResult.documents) {
    throw new Error("No documents found in analyze result");
  }

  // Obtener las dimensiones de las páginas
  const pageDimensions = analyzeResult.pages.map((page) => ({
    width: page.width,
    height: page.height,
    pageNumber: page.pageNumber,
  }));

  // Tomar el primer documento
  const document = analyzeResult.documents[0];

  // Mapear los campos del documento al esquema LabelField
  return Object.entries(document.fields).flatMap(([label, field]) => {
    if (field.kind === "array" && Array.isArray(field.values)) {
      // Manejar campos de tipo array (tablas)
      return field.values.flatMap((row, rowIndex): LabelField[] => {
        if (row.kind === "object" && row.properties) {
          // Para cada fila, procesar sus propiedades
          const results: LabelField[] = [];

          // Para cada fila (DocumentObjectField), procesar sus propiedades
          Object.entries(row.properties).map(([columnName, columnField]) => {
            if (!columnField?.boundingRegions?.length) {
              return; // Ignorar campos sin regiones
            }

            const groupedValues = (columnField.boundingRegions || []).map(
              (region) => {
                const pageDimension = pageDimensions.find(
                  (dim) => dim.pageNumber === region.pageNumber
                );

                if (!pageDimension) {
                  throw new Error(
                    `Dimensiones no encontradas para la página ${region.pageNumber}`
                  );
                }

                if (!pageDimension.width || !pageDimension.height) {
                  throw new Error(
                    `Dimensiones inválidas para la página ${region.pageNumber}`
                  );
                }

                const normalizedBox = normalizeCoordinates(
                  region.polygon,
                  pageDimension.width,
                  pageDimension.height
                );

                return {
                  page: region.pageNumber,
                  text: columnField.content || "",
                  boundingBoxes: [normalizedBox],
                };
              }
            );

            results.push({
              label: `${label}/${rowIndex}/${columnName}`,
              value: groupedValues,
            });
          });

          return results;
        }
        return []; // Si las filas no son objeto o no tienen valores, se ignoran
      });
    } else {
      // Manejar campos normales (no arrays)
      const groupedValues = (field.boundingRegions || []).map((region) => {
        const pageDimension = pageDimensions.find(
          (dim) => dim.pageNumber === region.pageNumber
        );

        if (!pageDimension) {
          throw new Error(
            `Dimensiones no encontradas para la página ${region.pageNumber}`
          );
        }

        if (!pageDimension.width || !pageDimension.height) {
          throw new Error(
            `Dimensiones inválidas para la página ${region.pageNumber}`
          );
        }

        const normalizedBox = normalizeCoordinates(
          region.polygon,
          pageDimension.width,
          pageDimension.height
        );

        return {
          page: region.pageNumber,
          text: field.content || "",
          boundingBoxes: [normalizedBox],
        };
      });

      return [
        {
          label: label,
          value: groupedValues,
        },
      ];
    }
  });
};

const populateDetalleMaterias = async (datosExtraidos: any, fields: any) => {
  // Verifica que "detalle-materias" y sus valores existan antes de iterar

  //Concateno cada array de DetalleMaterias
  let detalleMaterias = fields.DetalleMaterias1.values?.concat(
    fields.DetalleMaterias2?.values,
    fields.DetalleMaterias3?.values,
    fields.DetalleMaterias4?.values
  );

  //Remover undefined
  detalleMaterias = detalleMaterias.filter(
    (materia: any) => materia !== undefined
  );

  if (detalleMaterias) {
    for (const materia of detalleMaterias) {
      // Validación y mapeo seguro
      datosExtraidos.materiasAprobadas.push({
        Nivel: materia.properties?.Nivel?.value ?? "", // Asegúrate de que "Nivel" exista
        Materia: materia.properties?.Materia?.value ?? "",
        Periodo: materia.properties?.Periodo?.value ?? "",
        Calificacion: materia.properties?.Calificacion?.value ?? "",
        NoMatricula: transformDataMatricula(materia.properties),
      });
    }
  }
};

function transformDataMatricula(data: Row): number {
  if (
    data?.Matr1?.value?.includes("+") ||
    data?.Matr1?.value?.includes("A") ||
    data?.Matr1?.value?.includes("1") ||
    data?.Matr1?.value?.includes("*") ||
    data?.Matr1?.value?.includes("4")
  )
    return 1;
  if (
    data?.Matr2?.value?.includes("+") ||
    data?.Matr2?.value?.includes("A") ||
    data?.Matr2?.value?.includes("1") ||
    data?.Matr2?.value?.includes("*") ||
    data?.Matr1?.value?.includes("4")
  )
    return 2;
  if (
    data?.Matr3?.value?.includes("+") ||
    data?.Matr3?.value?.includes("A") ||
    data?.Matr3?.value?.includes("1") ||
    data?.Matr3?.value?.includes("*") ||
    data?.Matr1?.value?.includes("4")
  )
    return 3;
  else return 0;
}

const formatData = (data: string) => {
  if (data.includes("\n")) {
    return data.replace("\n", " ").split("-")[0].trim();
  }

  if (data.includes("-")) {
    return data.split("-")[0].trim();
  }

  return data;
};

const extractData = async (file: ArrayBuffer, model: string) => {
  try {
    // Validar inputs
    if (!(file instanceof ArrayBuffer)) {
      throw new Error("Invalid file data provided");
    }

    if (!model) {
      throw new Error("Model ID is required");
    }

    // Validar credenciales
    const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT;
    const apiKey = process.env.FORM_RECOGNIZER_API_KEY;

    if (!endpoint || !apiKey) {
      throw new Error("Form Recognizer credentials not configured");
    }
    console.log("Starting extraction with model:", model);

    const credential = new AzureKeyCredential(apiKey);
    const client = new DocumentAnalysisClient(endpoint, credential);

    console.log("Beginning document analysis...");
    const poller = await client.beginAnalyzeDocument(model, file);
    console.log("Waiting for analysis to complete...");
    const result = await poller.pollUntilDone();

    if (!result || !result.documents || result.documents.length === 0) {
      throw new Error("No documents found in analysis result");
    }

    console.log("Analysis completed successfully");

    // Validar campos
    const firstDocument = result.documents[0];
    if (!firstDocument.fields) {
      throw new Error("No fields found in document");
    }

    if (!result.pages) {
      throw new Error("No pages found in document");
    }

    const labelsJson = modelToLabelsJson(result);

    return {
      fields: firstDocument.fields,
      docType: firstDocument.docType,
      labelsJson: labelsJson,
      confidence: firstDocument.confidence,
    };
  } catch (err) {
    console.error("Error extracting data in function extractData:", err);
    return NextResponse.json({ error: "Error extracting data", status: 500 });
  }
};

const saveToOcrJson = async (result: AnalyzeOperationOutput, blobName: string) => {
  let fileName = `${blobName}.ocr.json`;

  await uploadJsonToBlobStorage(result, fileName);
};

const saveToLabelsJson = async (result: any, blobName: string) => {
  let labelsResult = {
    $schema:
      "https://schema.cognitiveservices.azure.com/formrecognizer/2021-03-01/labels.json",
    document: blobName,
    labels: result,
  };

  let fileName = `${blobName}.labels.json`;

  await uploadJsonToBlobStorage(labelsResult, fileName);

  return labelsResult;
};

const uploadToBlobStorage = async (
  pdfData: ArrayBuffer,
  docType?: string
): Promise<string> => {
  try {
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const fileName = `${uuidv4()}.pdf`;
    const blobName = docType ? `${docType}/${fileName}` : `${fileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const blobResponse = await blockBlobClient.uploadData(pdfData, {
      blobHTTPHeaders: { blobContentType: "application/pdf" },
    });

    if (!blobResponse) {
      throw new Error("Error uploading blob");
    }

    console.log("Blob subido con éxito");

    return blobName as string;
  } catch (err) {
    console.error("Error uploading blob:", err);
    throw new Error("Error uploading blob");
  }
};

const uploadJsonToBlobStorage = async (
  jsonData: any,
  fileName: string
): Promise<string> => {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = fileName;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const blobResponse = await blockBlobClient.upload(
      JSON.stringify(jsonData),
      JSON.stringify(jsonData).length
    );

    if (!blobResponse) {
      throw new Error("Error uploading blob");
    }

    console.log("Blob subido con éxito");

    return blobName as string;
  } catch (err) {
    console.error("Error uploading blob:", err);
    throw new Error("Error uploading blob");
  }
};

const deleteBlob = async (ref: string): Promise<void> => {
  try {
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Create blob client from container client
    const blockBlobClient: BlockBlobClient =
      containerClient.getBlockBlobClient(ref);

    // include: Delete the base blob and all of its snapshots
    // only: Delete only the blob's snapshots and not the blob itself
    const options: BlobDeleteOptions = {
      deleteSnapshots: "include",
    };

    const blobDeleteResponse: BlobDeleteResponse = await blockBlobClient.delete(
      options
    );

    if (!blobDeleteResponse) {
      throw new Error("Error deleting blob");
    }

    console.log("Blob eliminado con éxito", ref);
  } catch (err) {
    console.error("Error deleting blob:", err);
    throw new Error("Error deleting blob");
  }
};
