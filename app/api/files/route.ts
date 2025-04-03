import { NextRequest, NextResponse } from 'next/server';
import { BlobDeleteOptions, BlobDeleteResponse, BlobServiceClient, BlockBlobClient, ContainerClient } from '@azure/storage-blob';
import { prisma } from '@/lib/prisma';
import { Documento } from '@/types/file';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { AnalyzedDocument, AnalyzeResult, AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import {DocumentIntelligenceClient} from "@azure-rest/ai-document-intelligence"
import { loadToPinecone } from '@/lib/pinecone';
import { checkCarrera } from '@/utils/checkCarrera';
import { Materia } from '@/types/materia';
import { KardexDetalle } from '@/types/kardexDetalle';
import { PDFDocument } from 'pdf-lib';
import { normalizeCoordinates } from '@/utils/azureDI';

dotenv.config();
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || '';

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
}

interface ColumnMapping {
    materiaIndex?: number[];
    matriculas?: {
        tipo: 'simple' | 'agrupada';
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
                Estado: 1
            }
        });
        if (!files) {
            return NextResponse.json({ error: 'Error fetching files' }, { status: 500 });
        }

        const result = {
            message: 'Documentos encontrados con éxito',
            status: 200,
            data: files,
        }

        return NextResponse.json(result);

    } catch (err) {
        console.error('Error fetching files:', err);
        const errResponse = {
            error: 'Error fetching files',
            status: 500,
            message: err,
        }
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
            return NextResponse.json({ error: 'No form data' }, { status: 400 });
        }

        const file = formData.get('file');

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // 2. Convierto el archivo a ArrayBuffer
        const pdfData = await file.arrayBuffer();

        // try {
        //     classifiedDoc = await classifyDocument(pdfData);
        //     console.log('Document classification result:', classifiedDoc);
        // } catch (error) {
        //     console.error('Error during document classification:', error);
        //     throw new Error('Unable to classify document');
        // }

        // // 4. Valido clasificación
        // if (typeof classifiedDoc !== 'string' || !['kardex-computacion', 'kardex-civil'].includes(classifiedDoc)) {
        //     console.error('Invalid document classification:', classifiedDoc);
        //     throw new Error('Invalid document classification');
        // }

        //Aquí debo subir según el docType en la carpeta correspondiente

        //5. Subo al blob storage
        const blobName = await uploadToBlobStorage(pdfData);

        // 6. Proceso los datos según la carrera
        let extractedData = null;

        // Ya hago la extracción de datos con el modelo compuesto
        extractedData = await extractData(pdfData, 'kardex-composed-model-v2');
        console.log('Extracted data:', extractedData);

        // 7. Proceso los datos extraídos
        const { docType, fields, labelsJson } = extractedData as ExtractedDataFields;

        // 8. Corro el análisis Layout para guardar el ocr.json
        await runLayoutAnalysis(pdfData, docType + "/" + blobName);

        // PROBAR LA SUBIDA DE LOS LABELS.JSON
        await saveToLabelsJson(labelsJson, docType + "/" + blobName);

        // Ejecutar análisis para Human In The Loop

        // if (classifiedDoc == 'kardex-computacion') {
        //     try {
        //         extractedData = await extractData(pdfData, 'computacion_formato1_v2');
        //         console.log('Extracted data for computacion:', extractedData);

        //         const { docType } = extractedData as ExtractedDataFields;

        //         // Ejecutar análisis para Human In The Loop
        //         await runLayoutAnalysis(pdfData, docType + "/" +  blobName);
        //     } catch (error) {
        //         await deleteBlob(blobName);
        //         console.error('Error extracting computacion data:', error);
        //         throw new Error('Error extracting data for extractedData');
        //     }
        // } else if (classifiedDoc == 'kardex-civil') {
        //     try {
        //         extractedData = await extractData(pdfData, 'civil_formato_composed_v1');

        //         const { docType } = extractedData as ExtractedDataFields;

        //         // Ejecutar análisis para Human In The Loop
        //         await runLayoutAnalysis(pdfData, docType + "/" +  blobName);
        //         console.log('Extracted data for civil:', extractedData);
        //     } catch (error) {
        //         await deleteBlob(blobName);
        //         console.error('Error extracting civil data:', error);
        //         throw new Error('Error extracting data for extractedData');
        //     }
        // } else {
        //     await deleteBlob(blobName);
        //     throw new Error('Invalid document classification');
        // }

        if (!extractedData) {
            await deleteBlob(blobName);
            throw new Error('Invalid extracted data structure');
        }

        //8. Validar campos específicos necesarios
        const requiredFields = ['Alumno', 'NoIdentificacion', 'Carrera'];
        for (const field of requiredFields) {
            if (!fields[field] || !fields[field].value) {
                await deleteBlob(blobName);
                throw new Error(`Missing required field: ${field}`);
            }
        }

        //9. Valido si el documento ya ha sido subido anteriormente
        let cedula = fields.NoIdentificacion.value.replace(/[^0-9]/g, '') ?? ''

        const documentoYaSubido = await prisma.tipoDocumentoKardex.findFirst({
            where: {
                NoIdentificacion: cedula,
                Estado: 1
            }
        });

        if (documentoYaSubido) {
            await deleteBlob(blobName);
            throw new Error('El documento ya ha sido subido anteriormente');
        }

        // 10. Busco el ID de la carrera
        const carreraArray = await checkCarrera(fields.Carrera.value);

        if (carreraArray.length === 0) {
            throw new Error('El documento no es válido o no se pudo extraer la carrera');
        }

        // 11. Extraigo datos del documento (producto de Azure AI Intelligence)
        const datosExtraidos = {
            alumno: formatData(fields.Alumno.value),
            noIdentificacion: cedula,
            carrera: carreraArray[0].nombre ?? '',
            materiasAprobadas: [] as Materia[]
        }

        // 12. Extraigo las materias aprobadas y las guardo en un array
        await populateDetalleMaterias(datosExtraidos, fields);

        // 13. Busco la carpeta root
        let carpetaRoot = await prisma.carpeta.findFirst({
            where: {
                IdCarpetaPadre: null,
                Estado: 1
            }
        });

        // 14. Creo la carpeta root si no existe
        if (!carpetaRoot) {
            carpetaRoot = await prisma.carpeta.create({
                data: {
                    FechaCreacion: new Date,
                    IdCarpetaPadre: null,
                    Nombre: 'ucsg', // Carpeta raíz predeterminada
                    Tipo: 'Carpeta',
                    Ruta: '/',
                    Estado: 1
                }
            });
        }

        // 15. Busco el Id de la carpeta de la carrera correspondiente
        let carpetaObjetivo = await prisma.carpeta.findFirst({
            where: {
                IdCarrera: {
                    in: carreraArray.map(item => item.id)
                },
                Estado: 1,
                IdCarpetaPadre: carpetaRoot?.Id
            }
        });

        // 16. Creo la carpeta de la carrera si no existe
        if (!carpetaObjetivo) {
            carpetaObjetivo = await prisma.carpeta.create({
                data: {
                    FechaCreacion: new Date,
                    IdCarrera: carreraArray[0].id,
                    IdCarpetaPadre: carpetaRoot?.Id,
                    Nombre: datosExtraidos.carrera,
                    Estado: 1,
                    Tipo: 'Carpeta',
                    Ruta: `/${carpetaRoot.Nombre}/${datosExtraidos.carrera}`
                }
            });
        }

        // 16. Busco la carpeta del estudiante
        let carpetaEstudiante = await prisma.carpeta.findFirst({
            where: {
                Nombre: datosExtraidos.alumno,
                IdCarpetaPadre: carpetaObjetivo?.Id,
                Estado: 1,
            }
        });

        // 17. Creo la carpeta del estudiante si no existe
        if (!carpetaEstudiante) {
            carpetaEstudiante = await prisma.carpeta.create({
                data: {
                    FechaCreacion: new Date,
                    IdCarpetaPadre: carpetaObjetivo?.Id,
                    IdCarrera: carreraArray[0].id,
                    Nombre: datosExtraidos.alumno,
                    Estado: 1,
                    Tipo: 'Carpeta',
                    Ruta: `/${carpetaRoot?.Nombre}/${carpetaObjetivo?.Nombre}/${datosExtraidos.alumno}`
                }
            });
        }

        const nombreArchivo = datosExtraidos.alumno + ' - ' + datosExtraidos.noIdentificacion;
        const ruta = `/${carpetaRoot?.Nombre}/${carpetaObjetivo?.Nombre}/${datosExtraidos.alumno}/${nombreArchivo}`;
        const idCarpeta = carpetaEstudiante?.Id;
        const extension = file.name.substring(file.name.lastIndexOf('.') + 1);

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
            }
        });

        if (!newDocumento) {
            return NextResponse.json({ error: 'Error creando documento' }, { status: 500 });
        }

        // 20. Creo el tipo de documento kardex
        const tipoDocKardex = await prisma.tipoDocumentoKardex.create({
            data: {
                IdDocumento: newDocumento.Id,
                Alumno: datosExtraidos.alumno,
                NoIdentificacion: datosExtraidos.noIdentificacion,
                Estado: 1,
                Carrera: datosExtraidos.carrera
            }
        });

        if (!tipoDocKardex) {
            return NextResponse.json({ error: 'Error creando tipo de documento kardex' }, { status: 500 });
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
                    IdDocumentoKardex: tipoDocKardex.Id
                }
            })
        }

        // 22. Subo a la base de conocimientos
        await loadToPinecone(file.name, newDocumento as Documento, datosExtraidos);

        const result = {
            message: 'Documento creado con éxito',
            status: 200,
            data: newDocumento,
        }
        return NextResponse.json(result);

    } catch (err: any) {
        console.error('Error creating document:', err);
        const errResponse = {
            error: 'Error creating document',
            status: 500,
            message: err instanceof Error ? err.message : 'Error desconocido, ver más logs',
        }
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
        // Validar credenciales
        const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT;
        const apiKey = process.env.FORM_RECOGNIZER_API_KEY;

        if (!endpoint || !apiKey) {
            throw new Error('Form Recognizer credentials not configured');
        }

        console.log('Starting layout analysis...');

        const credential = new AzureKeyCredential(apiKey);
        const client = new DocumentAnalysisClient(endpoint, credential);

        console.log('Beginning document analysis prebuilt-layout...');
        const poller = await client.beginAnalyzeDocument('prebuilt-layout', pdfData);
        console.log('Waiting for analysis to complete...');
        await poller.pollUntilDone();
        const res = poller.getResult() as AnalyzeResult;

        console.log('Layout analysis result:', res);

        return saveToOcrJson(res, fileName);

    } catch (err) {
        console.error('Error during layout analysis:', err);
        throw new Error('Error during layout analysis');
    }
}

const modelToLabelsJson = (
    analyzeResult: AnalyzeResult<AnalyzedDocument>,
): LabelField[] => {
    if (!analyzeResult.pages) {
        throw new Error('No pages found in analyze result');
    }

    if (!analyzeResult.documents) {
        throw new Error('No documents found in analyze result');
    }

    // Obtener las dimensiones de las páginas
    const pageDimensions = analyzeResult.pages.map(page => ({
        width: page.width,
        height: page.height,
        pageNumber: page.pageNumber
    }));

    // Tomar el primer documento
    const document = analyzeResult.documents[0];

    // Mapear los campos del documento al esquema LabelField
    return Object.entries(document.fields).flatMap(([label, field]) => {
        if (field.kind === 'array' && Array.isArray(field.values)) {
            // Manejar campos de tipo array (tablas)
            return field.values.flatMap((row, rowIndex): LabelField[] => {

                if (row.kind === 'object' && row.properties) {

                    // Para cada fila, procesar sus propiedades
                    const results: LabelField[] = [];

                    // Para cada fila (DocumentObjectField), procesar sus propiedades
                    Object.entries(row.properties).map(([columnName, columnField]) => {

                        if (!columnField?.boundingRegions?.length) {
                            return;   // Ignorar campos sin regiones
                        }

                        const groupedValues = (columnField.boundingRegions || []).map(region => {

                            const pageDimension = pageDimensions.find(dim =>
                                dim.pageNumber === region.pageNumber
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
                                boundingBoxes: [normalizedBox]
                            };
                        });

                        results.push({
                            label: `${label}/${rowIndex}/${columnName}`,
                            value: groupedValues
                        });
                    });

                    return results;

                }
                return []; // Si las filas no son objeto o no tienen valores, se ignoran
            });
        } else {
            // Manejar campos normales (no arrays)
            const groupedValues = (field.boundingRegions || []).map(region => {
                const pageDimension = pageDimensions.find(dim =>
                    dim.pageNumber === region.pageNumber
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
                    boundingBoxes: [normalizedBox]
                };
            });

            return [{
                label: label,
                value: groupedValues
            }];
        }
    });
};


const populateDetalleMaterias = async (datosExtraidos: any, fields: any) => {
    // Verifica que "detalle-materias" y sus valores existan antes de iterar

    //Concateno cada array de DetalleMaterias
    let detalleMaterias = fields.DetalleMaterias1.values?.concat(fields.DetalleMaterias2.values, fields.DetalleMaterias3.values, fields.DetalleMaterias4.values);

    //Remover undefined
    detalleMaterias = detalleMaterias.filter((materia: any) => materia !== undefined);

    if (detalleMaterias) {
        for (const materia of detalleMaterias) {
            // Validación y mapeo seguro
            datosExtraidos.materiasAprobadas.push({
                Nivel: materia.properties?.Nivel?.value ?? "", // Asegúrate de que "Nivel" exista
                Materia: materia.properties?.Materia?.value ?? "",
                Periodo: materia.properties?.Periodo?.value ?? "",
                Calificacion: materia.properties?.Calificacion?.value ?? "",
                NoMatricula: transformDataMatricula(materia.properties)
            });
        }
    }
}

function transformDataMatricula(data: Row): number {
    if (data?.Matr1?.value?.includes("+") || data?.Matr1?.value?.includes("A") || data?.Matr1?.value?.includes("1") || data?.Matr1?.value?.includes("*") || data?.Matr1?.value?.includes("4")) return 1;
    if (data?.Matr2?.value?.includes("+") || data?.Matr2?.value?.includes("A") || data?.Matr2?.value?.includes("1") || data?.Matr2?.value?.includes("*") || data?.Matr1?.value?.includes("4")) return 2;
    if (data?.Matr3?.value?.includes("+") || data?.Matr3?.value?.includes("A") || data?.Matr3?.value?.includes("1") || data?.Matr3?.value?.includes("*") || data?.Matr1?.value?.includes("4")) return 3;
    else return 0;
}


const parseData = (tables: any): KardexDetalle[] => {
    const rows: KardexDetalle[] = [];
    let currentCiclo = "";

    tables.forEach((table: any) => {
        if (!table.cells?.length) return;

        const mapping = findTableStructure(table.cells);
        if (!mapping) return;

        // Ordenar las celdas por fila
        const rowMap = new Map<number, Map<number, string>>();

        [...table.cells].sort((a, b) => a.rowIndex - b.rowIndex)
            .forEach(cell => {
                if (!rowMap.has(cell.rowIndex)) {
                    rowMap.set(cell.rowIndex, new Map());
                }
                rowMap.get(cell.rowIndex)?.set(
                    cell.columnIndex,
                    cell.content?.toString().trim() || ""
                );
            });


        // Si hay repetición de encabezados, dividir en dos grupos
        if (mapping.materiaIndex && mapping.materiaIndex.length > 1) {
            // Dividir los índices en dos grupos
            const mitad = Math.floor(mapping.materiaIndex.length / 2);

            const tablas = [
                {
                    materiaIndex: mapping.materiaIndex.slice(0, mitad),
                    matriculas: mapping.matriculas?.slice(0, mitad) || [],
                    calificacionIndexes: mapping.calificacionIndexes?.slice(0, mitad) || []
                },
                {
                    materiaIndex: mapping.materiaIndex.slice(mitad),
                    matriculas: mapping.matriculas?.slice(mitad) || [],
                    calificacionIndexes: mapping.calificacionIndexes?.slice(mitad) || []
                }
            ];

            // Procesar cada grupo como una tabla independiente
            tablas.forEach(subMapping => {
                Array.from(rowMap.keys())
                    .sort((a, b) => a - b)
                    .forEach(rowIndex => {
                        const row = rowMap.get(rowIndex);
                        if (!row) return;

                        const rowObj: { [key: number]: string } = {};
                        row.forEach((value, key) => {
                            rowObj[key] = value;
                        });

                        // Detectar ciclo
                        const cicloDetectado = detectarCiclo(rowObj, mapping, rowIndex);
                        if (cicloDetectado) {
                            currentCiclo = cicloDetectado;
                            return;
                        }

                        // Procesar materia solo si hay contenido válido
                        subMapping.materiaIndex?.forEach(materiaIdx => {
                            const materia = rowObj[materiaIdx]?.trim();
                            if (!materia || materia.toUpperCase().includes("ASIGNATURA")) return;

                            const noMatricula = determineMatricula(rowObj, subMapping.matriculas);
                            const calificacion = findCalificacionFromRow(
                                rowObj,
                                subMapping.calificacionIndexes
                            );

                            if (materia && noMatricula !== null) {
                                rows.push({
                                    Id: rows.length + 1,
                                    Ciclo: currentCiclo,
                                    Materia: materia,
                                    Calificacion: Number(calificacion),
                                    NoMatricula: noMatricula,
                                    IdDocumentoKardex: 0,
                                    Estado: 1,
                                    Periodo: extractPeriodoFromRow(rowObj) || ""
                                });
                            }
                        });
                    });
            });
        } else {
            // Encontrar la fila de encabezado
            const headerRow = Math.min(...mapping.materiaIndex || [0]);

            // Procesar filas en orden
            Array.from(rowMap.keys())
                .sort((a, b) => a - b)
                .forEach(rowIndex => {
                    // Saltar la fila de encabezado
                    if (rowIndex === headerRow) return;

                    const row = rowMap.get(rowIndex);
                    if (!row) return;

                    const rowObj: { [key: number]: string } = {};
                    row.forEach((value, key) => {
                        rowObj[key] = value;
                    });

                    // Detectar ciclo
                    const cicloDetectado = detectarCiclo(rowObj);
                    if (cicloDetectado) {
                        currentCiclo = cicloDetectado;
                        return;
                    }

                    // Procesar materia solo si hay contenido válido
                    mapping.materiaIndex?.forEach(materiaIdx => {
                        const materia = rowObj[materiaIdx]?.trim();
                        if (!materia) return;

                        const noMatricula = determineMatricula(rowObj, mapping.matriculas);
                        const calificacion = findCalificacionFromRow(
                            rowObj,
                            mapping.calificacionIndexes || []
                        );

                        // Usar un valor por defecto (0) si la calificación es null
                        const calificacionFinal = calificacion !== null ? Number(calificacion) : 0;

                        if (materia && noMatricula !== null) {
                            rows.push({
                                Id: rows.length + 1,
                                Ciclo: currentCiclo,
                                Materia: materia,
                                Calificacion: calificacionFinal,
                                NoMatricula: noMatricula,
                                IdDocumentoKardex: 0,
                                Estado: 1,
                                Periodo: extractPeriodoFromRow(rowObj) || ""
                            });
                        }
                    });
                });
        }


    });

    return rows;
};

// Función para encontrar las calificaciones en una fila con base en la palabra clave "PROMED" o "FINAL"
const findCalificacionFromRow = (row: any, calificacionIndexes: number[]): number | null => {
    for (const index of calificacionIndexes) {
        const content = row[index]?.trim().toUpperCase() || "";
        return Number(content.replace(/[^\d.]/g, "")); // Limpia el texto y lo convierte a número
    }
    return null; // No se encontró calificación
};

const detectarCiclo = (
    rowObj: { [key: number]: string },
    mapping?: ColumnMapping,
    currentRowIndex?: number
): string | null => {


    // Expresión regular para extraer solo "NIVEL [algo]"
    const nivelRegex = /NIVEL\s*\d+/i;

    // Si no hay mapping o información de la estructura, procesar normalmente
    if (!mapping || !mapping.materiaIndex || mapping.materiaIndex.length <= 1) {
        const valores = Object.values(rowObj).map(v => v.toString().trim().toUpperCase());
        const posibleCiclo = valores.find(v =>
            v.includes("CICLO") ||
            v.includes("NIVEL") ||
            /^[1-9](ER|DO|RO|TO|NO|MO)?\s*(CICLO|NIVEL)/i.test(v)
        );

        // Si se encontró algo, intentar extraer "NIVEL" con la regex
        if (posibleCiclo) {
            const match = posibleCiclo.match(nivelRegex);
            return match ? match[0] : null;
        }

        return null;
    }

    // Para tablas complejas, solo buscar en las columnas relevantes
    // Determinar en qué sección de la tabla estamos
    const primeraColumnaMateria = Math.min(...mapping.materiaIndex);
    const ultimaColumnaMateria = Math.max(...mapping.materiaIndex) - 1;

    const valores = Object.entries(rowObj)
        .filter(([colIndex]) => {
            const col = parseInt(colIndex);
            // Solo procesar columnas dentro del rango de la sección actual
            return col >= primeraColumnaMateria && col <= ultimaColumnaMateria;
        })
        .map(([_, v]) => v.toString().trim().toUpperCase());

    const posibleCiclo = valores.find(v =>
        v.includes("CICLO") ||
        v.includes("NIVEL") ||
        /^[1-9](ER|DO|RO|TO|NO|MO)?\s*(CICLO|NIVEL)/i.test(v)
    );

    // Intentar extraer "NIVEL" con la regex
    if (posibleCiclo) {
        const match = posibleCiclo.match(nivelRegex);
        return match ? match[0] : null;
    }

    return null;
};


const findTableStructure = (cells: any[]): ColumnMapping | null => {
    const mapping: ColumnMapping = {
        materiaIndex: [],
        matriculas: [],
        calificacionIndexes: []
    };

    // 1. Encontrar todas las ocurrencias de encabezados principales
    const encabezadosPrincipales = cells.filter(cell => {
        const content = cell.content?.toString().trim().toUpperCase() || "";
        return content.includes("ASIGNATURA") ||
            content.includes("MATERIAS") ||
            content.includes("MATRICULA");
    });

    // 2. Contar repeticiones de cada tipo de encabezado
    const conteoEncabezados = encabezadosPrincipales.reduce((acc, cell) => {
        const content = cell.content?.toString().trim().toUpperCase();
        if (content.includes("ASIGNATURA")) acc.asignatura++;
        if (content.includes("MATERIAS")) acc.materias++;
        if (content.includes("MATRICULA")) acc.matricula++;
        return acc;
    }, { asignatura: 0, materias: 0, matricula: 0 });

    // 3. Determinar si algún encabezado se repite
    const hayRepeticiones = conteoEncabezados.asignatura > 1 ||
        conteoEncabezados.materias > 1 ||
        conteoEncabezados.matricula > 1;

    // 4. Procesar según si hay repeticiones o no
    if (!hayRepeticiones) {
        // Caso simple: no hay repeticiones de encabezados
        const headerRow = Math.min(...encabezadosPrincipales.map(cell => cell.rowIndex));
        const headerCells = cells.filter(cell => cell.rowIndex === headerRow);

        headerCells.forEach(cell => {
            const content = cell.content?.toString().trim().toUpperCase();

            if (content.includes("ASIGNATURA") || content.includes("MATERIAS")) {
                mapping.materiaIndex?.push(cell.columnIndex);
            }
            if (content.includes("MATRICULA")) {
                mapping.matriculas?.push({
                    tipo: 'simple',
                    indices: [cell.columnIndex]
                });
            }
            if (content.includes("PROMED") || content.includes("FINAL")) {
                mapping.calificacionIndexes?.push(cell.columnIndex);
            }
            if (content.includes("SUPLET")) {
                mapping.supletorioColumnIndex = cell.columnIndex;
            }
        });
    } else {

        // Caso complejo: hay repeticiones de encabezados
        const headerRows = [...new Set(encabezadosPrincipales.map(cell => cell.rowIndex))].sort();

        headerRows.forEach(headerRow => {
            const headerCells = cells.filter(cell => cell.rowIndex === headerRow);
            const nextRowCells = cells.filter(cell => cell.rowIndex === headerRow + 1);

            headerCells.forEach(cell => {
                const content = cell.content?.toString().trim().toUpperCase();

                if (content.includes("ASIGNATURA") || content.includes("MATERIAS")) {
                    mapping.materiaIndex?.push(cell.columnIndex);
                }
                if (content.includes("MATRICULA")) {
                    // Verificar si hay subencabezados
                    const subheaders = nextRowCells
                        .filter(nextCell => {
                            const content = nextCell.content?.toString().trim();
                            const columnDistance = nextCell.columnIndex - cell.columnIndex;

                            // Verificar si el contenido es un número y convertirlo
                            const num = parseInt(content);

                            // Aceptar '1', '2', '3' o '30' para la tercera matrícula
                            return columnDistance >= -7 &&
                                columnDistance <= 2 &&
                                !isNaN(num) &&
                                (num === 1 || num === 2 || num === 3 || num === 30);
                        })
                        .sort((a, b) => {
                            // Normalizar el valor '30' a '3' para el ordenamiento
                            const getVal = (cell: any) => {
                                const num = parseInt(cell.content?.toString().trim());
                                return num === 30 ? 3 : num;
                            };
                            return getVal(a) - getVal(b);
                        })

                    if (subheaders.length === 3) {
                        mapping.matriculas?.push({
                            tipo: 'agrupada',
                            indices: subheaders.map(sh => sh.columnIndex)
                        });
                    } else {
                        mapping.matriculas?.push({
                            tipo: 'simple',
                            indices: [cell.columnIndex]
                        });
                    }
                }
                if (content.includes("PROMED") || content.includes("FINAL")) {
                    mapping.calificacionIndexes?.push(cell.columnIndex);
                }
                if (content.includes("SUPLET")) {
                    mapping.supletorioColumnIndex = cell.columnIndex;
                }
            });

            // Ahora buscar también en la siguiente fila para capturar "PROMED" o "FINAL"
            nextRowCells.forEach(cell => {
                const content = cell.content?.toString().trim().toUpperCase();

                if (content.includes("PROMED") || content.includes("FINAL")) {
                    mapping.calificacionIndexes?.push(cell.columnIndex);
                }

                if (content.includes("SUPLET")) {
                    mapping.supletorioColumnIndex = cell.columnIndex;
                }
            });

        });


    }

    return mapping;
};

const determineMatricula = (row: any, matriculas: ColumnMapping['matriculas']): number => {
    if (!matriculas) return 0;

    for (const matricula of matriculas) {
        if (matricula.tipo === 'simple') {
            // Para el caso simple, buscamos "+" o "A" en la columna de matrícula
            const content = row[matricula.indices[0]]?.toString().trim().toUpperCase() || "";
            if (content.includes("+") || content.includes("A") || content.includes("1")) return 1;
        } else {
            // Para el caso agrupado, buscamos en las columnas 1,2,3
            for (let i = 0; i < matricula.indices.length; i++) {
                const content = row[matricula.indices[i]]?.toString().trim().toUpperCase() || "";
                if (content.includes("+") || content.includes("A") || content.includes("1")) return i + 1;
            }
        }
    }
    return 0;
};
// Función para extraer el nivel o ciclo desde una fila específica
const extractNivelOCicloFromRow = (row: any): string | null => {
    const contenidoFila = Object.values(row)
        .join(" ")
        .toUpperCase();
    const match = contenidoFila.match(/NIVEL \d{3}|PRIMER CURSO|SEGUNDO CURSO|TERCER CURSO|CUARTO CURSO|QUINTO CURSO|SEXTO CURSO|TERCER CURSO/i);
    return match ? match[0].trim() : null; // Retorna el nivel encontrado o null
};

const extractPeriodoFromRow = (row: any): string | null => {
    const contenidoFila = Object.values(row).join(" ").toUpperCase();

    // Patrones de periodos comunes (meses-año)
    const patronesPeriodo = [
        // Formato "MAYO A SEP/87" o "MAYO-SEP/87" o "MAYO-SEPTIEMBRE 1987"
        /\b(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[\.OA\s\-]+(?:A\s+)?(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[\.OA\s\-\/]+(?:DE\s+)?(?:19|20)?\d{2}\b/,

        // Formato "OCT/87-FEB/88" o "OCT.87-FEB.88" o "OCT-87/FEB-88"
        /\b(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[\.\/\-](?:19|20)?\d{2}[\s\-\/]+(?:A\s+)?(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[\.\/\-](?:19|20)?\d{2}\b/,

        // Formato "ENERO-FEBRERO 1987" o "ENERO A FEBRERO DE 1987"
        /\b(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)[\s\-]+(?:A\s+)?(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)(?:\s+DE)?\s+(?:19|20)?\d{2,4}\b/,

        // Formato "SEMESTRE: MAYO A SEPT/87"
        /\bSEMESTRE\s*:?\s*(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[\.OA\s\-]+(?:A\s+)?(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[\.OA\s\-\/]+(?:DE\s+)?(?:19|20)?\d{2}\b/i,

        // Curso de invierno/verano
        /\bCURSO\s+(?:DE\s+)?(INVIERNO|VERANO)\s+(?:DE\s+)?(?:19|20)?\d{2,4}\b/i,
    ];

    // Verificar cada patrón
    for (const patron of patronesPeriodo) {
        const match = contenidoFila.match(patron);
        if (match) {
            // Limpiamos el resultado para quitar prefijos como "SEMESTRE:" si existen
            let periodo = match[0].replace(/\bSEMESTRE\s*:?\s*/i, "").trim();
            return periodo;
        }
    }

    // Si no se encontró un patrón específico, buscar meses y años cercanos
    const mesCercano = contenidoFila.match(/\b(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC|ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)[\.\s\/\-]+(?:19|20)?\d{2}\b/i);

    if (mesCercano) {
        return mesCercano[0].trim();
    }

    // Búsqueda de años como último recurso
    const matchAnio = contenidoFila.match(/\b(?:19|20)\d{2}\b/);
    if (matchAnio) return matchAnio[0];

    // Búsqueda por palabras clave como último recurso
    const matchPalabrasClave = contenidoFila.match(/\b(?:AÑO|FINAL|SEMESTRE)\b/);
    if (matchPalabrasClave) {
        // Buscar texto cercano que podría contener información del periodo
        const contexto = contenidoFila.substring(
            Math.max(0, contenidoFila.indexOf(matchPalabrasClave[0]) - 30),
            Math.min(contenidoFila.length, contenidoFila.indexOf(matchPalabrasClave[0]) + 50)
        );

        // Intentar encontrar patrones de fecha en el contexto
        const fechaEnContexto = contexto.match(/\b(?:ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[\s\/\.-]+(?:19|20)?\d{2}\b/i);
        if (fechaEnContexto) return fechaEnContexto[0].trim();

        return matchPalabrasClave[0]; // Retornamos la palabra clave en caso de no encontrar nada mejor
    }

    return null; // Si no se encuentra nada, retornamos null
};

const formatData = (data: string) => {
    if (data.includes("\n")) {
        return data.replace("\n", " ").split('-')[0].trim();;
    }

    if (data.includes("-")) {
        return data.split('-')[0].trim();
    }

    return data;
}

const extractData = async (file: ArrayBuffer, model: string) => {
    try {

        // Validar inputs
        if (!file || !(file instanceof ArrayBuffer)) {
            throw new Error('Invalid file data provided');
        }

        if (!model) {
            throw new Error('Model ID is required');
        }

        // Validar credenciales
        const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT;
        const apiKey = process.env.FORM_RECOGNIZER_API_KEY;

        if (!endpoint || !apiKey) {
            throw new Error('Form Recognizer credentials not configured');
        }
        console.log('Starting extraction with model:', model);

        const credential = new AzureKeyCredential(apiKey);
        const client = new DocumentAnalysisClient(endpoint, credential);

        console.log('Beginning document analysis...');
        const poller = await client.beginAnalyzeDocument(model, file);
        console.log('Waiting for analysis to complete...');
        const result = await poller.pollUntilDone();

        if (!result || !result.documents || result.documents.length === 0) {
            throw new Error('No documents found in analysis result');
        }

        console.log('Analysis completed successfully');

        // Validar campos
        const firstDocument = result.documents[0];
        if (!firstDocument.fields) {
            throw new Error('No fields found in document');
        }

        if (!result.pages) {
            throw new Error('No pages found in document');
        }

        const labelsJson = modelToLabelsJson(result);

        return {
            fields: firstDocument.fields,
            docType: firstDocument.docType,
            labelsJson: labelsJson
        };

    } catch (err) {
        console.error('Error extracting data in function extractData:', err);
        return NextResponse.json({ error: 'Error extracting data', status: 500 });
    }
}

const saveToOcrJson = async (result: AnalyzeResult, blobName: string) => {
    let date = new Date().toISOString();

    //Añado una propiedad que es necesaria para el ocr.json
    let resultExtend = result as any;
    resultExtend.stringIndexType = "utf16CodeUnit";

    let ocrResult = {
        "status": "succeeded",
        "createdDateTime": date,
        "lastUpdatedDateTime": date,
        "analyzeResult": resultExtend,
    }

    let fileName = `${blobName}.ocr.json`;

    await uploadJsonToBlobStorage(ocrResult, fileName);
}

const saveToLabelsJson = async (result: any, blobName: string) => {
    let labelsResult = {
        "$schema": "https://schema.cognitiveservices.azure.com/formrecognizer/2021-03-01/labels.json",
        "document": blobName,
        "labels": result
    }

    let fileName = `${blobName}.labels.json`;

    await uploadJsonToBlobStorage(labelsResult, fileName);
}


const extractDetailData = async (file: ArrayBuffer, model: string) => {
    try {

        // Cargar el PDF
        const pdfDoc = await PDFDocument.load(file);
        const pageCount = pdfDoc.getPageCount();

        // Clasificar si es malla curricular
        console.log('Clasificando documento...');
        const resultClassification = await classifyMallaCurricular(file);

        if (!resultClassification) {
            throw new Error('Error classifying malla curricular');
        }

        let pdfToAnalyze;

        // Validar clasificación
        if (resultClassification == 'malla-curricular') {
            console.log('Documento clasificado como malla curricular, excluyendo primera página...');

            // Crear nuevo PDF sin la primera página
            const newPdfDoc = await PDFDocument.create();
            const pagesToCopy = Array.from({ length: pageCount - 1 }, (_, i) => i + 1);
            const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToCopy);
            copiedPages.forEach(page => newPdfDoc.addPage(page));

            const newPdfBytes = await newPdfDoc.save();
            pdfToAnalyze = new Uint8Array(newPdfBytes).buffer;
        } else {
            console.log('Documento no es malla curricular, procesando todas las páginas...');
            // Usar el documento original completo
            pdfToAnalyze = file;
        }

        const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT || "<endpoint>";
        const credential = new AzureKeyCredential(process.env.FORM_RECOGNIZER_API_KEY || "<api key>");
        const client = new DocumentAnalysisClient(endpoint, credential);

        if (!endpoint || !credential) {
            throw new Error('Form Recognizer credentials not configured');
        }

        const modelId = model;

        console.log('Starting document analysis...');
        const poller = await client.beginAnalyzeDocument(modelId, pdfToAnalyze);
        console.log('Waiting for analysis to complete...');
        const result = await poller.pollUntilDone();

        // Validate tables exists and is an array
        if (!result.tables || !Array.isArray(result.tables)) {
            console.error('Invalid tables structure:', result.tables);
            return [];
        }

        return result.tables;
    } catch (err) {
        console.error('Error extracting data:', err);
        return NextResponse.json({ error: 'Error extracting data', status: 500 });
    }
}

// Clasificar malla curricular
// Esto porque en el modelo pre entrenado, coge la primera hoja (malla curricular) como una tabla
// Y eso afecta al pre procesamiento de los datos
const classifyMallaCurricular = async (file: ArrayBuffer): Promise<string | null> => {
    try {
        console.log('Classifying malla...');
        const endpoint = process.env.FORM_CUSTOM_CLASSIFICATION_ENDPOINT;
        const apiKey = process.env.FORM_CUSTOM_CLASSIFICATION_API_KEY;

        if (!endpoint || !apiKey) {
            throw new Error('Form Recognizer credentials not configured');
        }

        const credential = new AzureKeyCredential(apiKey);
        const client = new DocumentAnalysisClient(endpoint, credential);

        console.log('Beginning document classification...');

        const poller = await client.beginClassifyDocument('malla-curricular-classifier-2', file);

        console.log('Waiting for classification to complete...');
        const result = await poller.pollUntilDone();

        if (!result.documents || result.documents.length === 0) {
            return null;
        }

        console.log('Classification completed successfully', result.documents[0].docType);

        const docType = result.documents[0].docType;

        // Validar explícitamente el tipo de documento
        const validTypes = ['malla-curricular', 'no-malla'];

        if (!validTypes.includes(docType)) {
            return null;
        }

        return docType;
    } catch (err) {
        console.error('Error clasificando los documentos dentro de la funcion classifyMallaCurricular:', err);
        throw err;
    }
}

const classifyDocument = async (file: ArrayBuffer): Promise<string | null> => {
    try {

        console.log('Classifying document...');
        const endpoint = process.env.FORM_CUSTOM_CLASSIFICATION_ENDPOINT;
        const apiKey = process.env.FORM_CUSTOM_CLASSIFICATION_API_KEY;

        if (!endpoint || !apiKey) {
            throw new Error('Form Recognizer credentials not configured');
        }

        const credential = new AzureKeyCredential(apiKey);
        const client = new DocumentAnalysisClient(endpoint, credential);

        console.log('Beginning document classification...');
        const poller = await client.beginClassifyDocument('clasificador-modelo-kardex', file);

        console.log('Waiting for classification to complete...');
        const result = await poller.pollUntilDone();

        if (!result.documents || result.documents.length === 0) {
            return null;
        }

        console.log('Classification completed successfully', result.documents[0].docType);

        const docType = result.documents[0].docType;

        // Validar explícitamente el tipo de documento
        const validTypes = ['kardex-computacion', 'kardex-civil'];
        if (!validTypes.includes(docType)) {
            return null;
        }

        return docType;

    } catch (err) {
        console.error('Error clasificando los documentos dentro de la funcion classifyDocument:', err);
        throw err;
    }
};

const uploadToBlobStorage = async (pdfData: ArrayBuffer): Promise<string> => {
    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobName = `${uuidv4()}.pdf`;
        const blockBlobClient = containerClient.getBlockBlobClient("formato_civil_2/" + blobName);

        const blobResponse = await blockBlobClient.uploadData(pdfData, {
            blobHTTPHeaders: { blobContentType: 'application/pdf' }
        });

        if (!blobResponse) {
            throw new Error('Error uploading blob');
        }

        console.log('Blob subido con éxito');

        return blobName as string;
    } catch (err) {
        console.error('Error uploading blob:', err);
        throw new Error('Error uploading blob');
    }

}

const uploadJsonToBlobStorage = async (jsonData: any, fileName: string): Promise<string> => {
    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobName = fileName;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const blobResponse = await blockBlobClient.upload(JSON.stringify(jsonData), JSON.stringify(jsonData).length);

        if (!blobResponse) {
            throw new Error('Error uploading blob');
        }

        console.log('Blob subido con éxito');

        return blobName as string;
    } catch (err) {
        console.error('Error uploading blob:', err);
        throw new Error('Error uploading blob');
    }

}

const deleteBlob = async (ref: string): Promise<void> => {
    try {

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Create blob client from container client
        const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(ref);

        // include: Delete the base blob and all of its snapshots
        // only: Delete only the blob's snapshots and not the blob itself
        const options: BlobDeleteOptions = {
            deleteSnapshots: 'include'
        };

        const blobDeleteResponse: BlobDeleteResponse = await blockBlobClient.delete(options);

        if (!blobDeleteResponse) {
            throw new Error('Error deleting blob');
        }

        console.log('Blob eliminado con éxito', ref);
    } catch (err) {
        console.error('Error deleting blob:', err);
        throw new Error('Error deleting blob');
    }
}