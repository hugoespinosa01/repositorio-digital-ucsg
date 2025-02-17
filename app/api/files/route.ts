import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { prisma } from '@/lib/prisma';
import { Documento } from '@/types/file';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import { ExtractedData } from '@/types/extractedData';
import { loadToPinecone } from '@/lib/pinecone';
import { checkCarrera } from '@/utils/checkCarrera';
import { Materia } from '@/types/materia';
import { KardexDetalle } from '@/types/kardexDetalle';
import { OpenAIApi, Configuration } from 'openai-edge'

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

dotenv.config();
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || '';

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

interface ColumnMapping {
    materiaIndex?: number;
    matriculasIndexes?: number[];
    cicloRow?: number;
    periodoRow?: number;
    calificacionIndexes?: number[];
    periodoColumnIndex?: number;
    supletorioColumnIndex?: number;
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

export async function POST(request: NextRequest) {
    try {

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Procesar el PDF
        const pdfData = await file.arrayBuffer();

        //Subo al blob storage
        const blobName = await uploadToBlobStorage(pdfData);

        const classifiedDoc = await classifyDocument(pdfData);

        if (!classifiedDoc) {
            throw new Error('Error classifying document');
        }

        let extractedData = null;

        // Clasifica los documentos según la carrera
        if (classifiedDoc == 'kardex-computacion') {
            extractedData = await extractData(pdfData, 'computacion-1-model') as unknown as ExtractedData;
        } else if (classifiedDoc == 'kardex-civil') {
            // Extraigo los datos del documento (usar modelo modelo_computacion_v1)
            extractedData = await extractData(pdfData, 'modelo_civil_v11') as unknown as ExtractedData;
        }

        let extractedDetails = await extractDetailData(pdfData, 'prebuilt-document');

        if (!extractedDetails) {
            throw new Error('Error extracting data');
        }

        // let processedData = await processDataWithOpenAI(extractedDetails);

        const parsedDetails = parseData(extractedDetails);

        if (!extractedData) {
            throw new Error('Error extracting data');
        }

        const { fields } = extractedData;

        // Busco el ID de la carrera
        const carreraArray = await checkCarrera(fields.Carrera.value);

        if (carreraArray.length === 0) {
            throw new Error('El documento no es válido o no se pudo extraer la carrera');
        }

        //Extraigo datos del documento (producto de Azure AI Intelligence)
        const datosExtraidos = {
            alumno: formatData(fields.Alumno.value),
            noIdentificacion: fields.NoIdentificacion.value.replace(/[^0-9]/g, '') ?? '',
            carrera: carreraArray[0].nombre ?? '',
            materiasAprobadas: [] as Materia[]
        }

        // Extraigo las materias aprobadas y las guardo en un array

        //await populateDetalleMaterias(datosExtraidos, fields);

        //Busco la carpeta root
        const carpetaRoot = await prisma.carpeta.findFirst({
            where: {
                IdCarpetaPadre: null,
                Estado: 1
            }
        });

        // Busco el Id de la carpeta de la carrera correspondiente
        const carpetaObjetivo = await prisma.carpeta.findFirst({
            where: {
                IdCarrera: {
                    in: carreraArray.map(item => item.id)
                },
                Estado: 1,
                IdCarpetaPadre: carpetaRoot?.Id
            }
        });

        if (!carpetaObjetivo) {
            await prisma.carpeta.create({
                data: {
                    IdCarrera: carreraArray[0].id,
                    IdCarpetaPadre: carpetaRoot?.Id,
                    Nombre: datosExtraidos.carrera,
                    Estado: 1
                }
            });
        }

        const nombreArchivo = datosExtraidos.alumno + ' - ' + datosExtraidos.noIdentificacion
        const ruta = `/${carpetaRoot?.Nombre}/${carpetaObjetivo?.Nombre}/${nombreArchivo}`;
        const idCarpeta = carpetaObjetivo?.Id;
        const extension = file.name.substring(file.name.lastIndexOf('.') + 1);

        // Creo el documento (archivo)
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
                RefArchivo: blobName
            }
        });

        if (!newDocumento) {
            return NextResponse.json({ error: 'Error creando documento' }, { status: 500 });
        }

        // Creo el tipo de documento kardex
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

        // Creo los detalles del kardex
        for (let materia of parsedDetails) {
            await prisma.documentoDetalleKardex.create({
                data: {
                    Ciclo: materia.Ciclo,
                    Materia: materia.Materia,
                    Periodo: materia.Periodo,
                    Calificacion: Number(materia.Calificacion) || null,
                    NoMatricula: Number(materia.NoMatricula) || null,
                    Estado: 1,
                    IdDocumentoKardex: tipoDocKardex.Id
                }
            })
        }

        // Subo a la base de conocimientos
        await loadToPinecone(file.name, newDocumento as Documento, datosExtraidos);

        const result = {
            message: 'Documento creado',
            status: 200,
            data: newDocumento,
        }
        return NextResponse.json(result);

    } catch (err: any) {
        console.error('Error creating document:', err);
        const errResponse = {
            error: 'Error creating document',
            status: 500,
            message: err.message,
        }
        return NextResponse.json(errResponse, { status: 500 });
    }
}

// const processDataWithOpenAI = async (rawData: any) => {
//     // Configuración de lotes
//     const BATCH_SIZE = 4000; // Ajusta según necesidad
//     const MAX_RETRIES = 3;
//     const DELAY_BETWEEN_BATCHES = 1000; // 1 segundo

//     const splitIntoChunks = (data: any) => {
//         if (!Array.isArray(data.tables)) return [data];

//         const chunks = [];
//         let currentChunk: any = { tables: [] };
//         let currentSize = 0;

//         for (const table of data.tables) {
//             const tableSize = JSON.stringify(table).length;
//             if (currentSize + tableSize > BATCH_SIZE) {
//                 chunks.push(currentChunk);
//                 currentChunk = { tables: [] };
//                 currentSize = 0;
//             }
//             currentChunk.tables.push(table);
//             currentSize += tableSize;
//         }

//         if (currentChunk.tables.length > 0) {
//             chunks.push(currentChunk);
//         }

//         return chunks;
//     };

//     const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
//     const processChunk = async (chunk: any, retryCount = 0): Promise<any[]> => {
//         const prompt = `Genera ÚNICAMENTE un array JSON que siga este esquema. NO incluyas explicaciones ni texto adicional.
//     REGLAS:
//     - CICLOS: "PRIMER CURSO", "SEGUNDO CURSO", "TERCER CURSO", etc.
//     - PERIODO: Años que empiecen con "19"
//     - MATRÍCULA: Solo valores 1, 2, 3
//     - CALIFICACIÓN: Número sobre 10 con punto decimal
//     - Eliminar tildes
//     - IdDocumentoKardex siempre 0
//     - Estado siempre 1

//     ESQUEMA:
//     [{
//       "Id": number,
//       "Ciclo": string,
//       "Materia": string,
//       "Periodo": string,
//       "Calificacion": number,
//       "NoMatricula": number,
//       "IdDocumentoKardex": 0,
//       "Estado": 1
//     }]

//     DATOS:
//     ${JSON.stringify(chunk)}

//     RESPONDE SOLO CON EL JSON.`;

//         try {
//             const response = await openai.createChatCompletion({
//                 model: "gpt-4",
//                 messages: [
//                     {
//                         role: "system",
//                         content: "Eres un analizador de datos que SOLO responde con JSON válido, sin explicaciones. Procesas todos los datos proporcionados sin excepción."
//                     },
//                     {
//                         role: "user",
//                         content: prompt
//                     }
//                 ],
//                 max_tokens: 4000,
//                 temperature: 0,
//             });

//             const responseData = await response.json();
//             const content = responseData.choices[0].message?.content || '[]';

//             // Extraer y validar JSON
//             let parsedData;
//             try {
//                 // Intentar encontrar y parsear el JSON
//                 const jsonMatch = content.match(/$[\s\S]*$/);
//                 if (!jsonMatch) throw new Error('No JSON found');
//                 parsedData = JSON.parse(jsonMatch[0]);
//             } catch (parseError) {
//                 if (parseError instanceof Error) {
//                     throw new Error(`JSON parsing failed: ${parseError.message}`);
//                 } else {
//                     throw new Error('JSON parsing failed');
//                 }
//             }

//             return Array.isArray(parsedData) ? parsedData : [];

//         } catch (error) {
//             if (retryCount < MAX_RETRIES) {
//                 await delay(DELAY_BETWEEN_BATCHES * (retryCount + 1));
//                 return processChunk(chunk, retryCount + 1);
//             }
//             throw error;
//         }}

//         // Procesar todos los datos
//         const chunks = splitIntoChunks(rawData);
//         let allResults: any[] = [];
//         let currentId = 1;

//         for (const chunk of chunks) {
//             const chunkResults = await processChunk(chunk);

//             // Procesar y validar los resultados del chunk
//             const processedResults = chunkResults.map((item: any) => ({
//                 Id: currentId++,
//                 Ciclo: item.Ciclo?.toUpperCase() || 'N/A',
//                 Materia: item.Materia?.normalize('NFD')
//                     .replace(/[\u0300-\u036f]/g, '')
//                     .toUpperCase(),
//                 Periodo: item.Periodo || 'N/A',
//                 Calificacion: parseFloat(item.Calificacion) || 0,
//                 NoMatricula: [1, 2, 3].includes(item.NoMatricula) ? item.NoMatricula : 1,
//                 IdDocumentoKardex: 0,
//                 Estado: 1
//             }));

//             allResults = [...allResults, ...processedResults];

//             // Esperar entre chunks para evitar límites de rate
//             if (chunks.length > 1) await delay(DELAY_BETWEEN_BATCHES);
//         }

//         return allResults;

//         // Extraer solo el JSON de la respuesta
//         // const jsonMatch = content.match(/$[\s\S]*$/);
//         // if (!jsonMatch) {
//         //     throw new Error('No se encontró un JSON válido en la respuesta');
//         // }

//         // // Parsear el JSON extraído
//         // //const parsedData = JSON.parse(jsonMatch[0]);

//         // // Validar la estructura del JSON
//         // if (!Array.isArray(parsedData)) {
//         //     throw new Error('La respuesta no es un array JSON válido');
//         // }
//         // return parsedData; // Parsear el resultado como JSON

// };

const parseData = (tables: any) => {
    const rows: KardexDetalle[] = [];
    let cicloGlobal = ""; // Este valor será propagado entre tablas
    let ultimoPeriodo = ""; // Para almacenar el último periodo encontrado y propagarlo


    // Iterar a través de todas las tablas en el OCR
    tables.forEach((table: any) => {

        const mapping = findTableStructure(table.cells);
        if (!mapping) return; // Si no encontramos la estructura esperada, saltamos esta tabla

        //Tratamiento para el ciclo
        // const cicloInicial = extractNivelOCiclo(table) || cicloGlobal; // Si la tabla tiene un nivel, lo usamos; si no, mantenemos el anterior
        let cicloPropagado = cicloGlobal;

        const rowMap: { [key: number]: { [key: number]: string } } = {}; // Mapa de filas y columnas
        // Organizar las celdas por fila y columna para cada tabla
        table.cells.forEach((cell: any) => {
            const { rowIndex, columnIndex, content } = cell;
            if (!rowMap[rowIndex]) {
                rowMap[rowIndex] = {};
            }
            // Asignar el contenido de cada celda a su posición (columna)
            rowMap[rowIndex][columnIndex] = content;
        });

        // Procesar cada fila, excepto la de encabezados
        Object.keys(rowMap)
            .filter(key => parseInt(key, 10) > 0) // Excluir encabezados
            .forEach((key) => {
                const rowIndex = parseInt(key, 10);
                const row = rowMap[rowIndex];

                // Si encontramos un nuevo nivel/ciclo, lo actualizamos
                const newNivel = extractNivelOCicloFromRow(row);
                if (newNivel) {
                    cicloPropagado = newNivel;
                }

                // Extraemos datos importantes
                const materia = row[mapping.materiaIndex!]?.trim() || "";
                if (!materia || materia === "ASIGNATURAS") return; // Saltamos filas vacías o encabezados

                // Buscar el periodo
                const periodo = mapping.periodoColumnIndex !== undefined ?
                    row[mapping.periodoColumnIndex]?.trim() || "" :
                    extractPeriodoFromRow(row); // Tu lógica previa para el caso normal
                if (periodo) ultimoPeriodo = periodo; // Actualizamos el último periodo encontrado


                // Determinamos qué matrícula está marcada
                const noMatricula = determineMatricula(row, mapping.matriculasIndexes!);

                // Detectar la columna de calificación con palabras clave "PROMED" o "FINAL"
                const calificacion = findCalificacionFromRow(row, mapping.calificacionIndexes!);

                // Agregamos solo si la materia y la matrícula son válidas
                if (materia && noMatricula) {
                    const kardexDetalle: KardexDetalle = {
                        Id: rowIndex + 1,
                        Ciclo: cicloPropagado || "", // Usamos el ciclo propagado o un valor predeterminado
                        Materia: materia,
                        Periodo: periodo || "", // Si aplica, extraer período
                        Calificacion: Number(calificacion),
                        NoMatricula: noMatricula,
                        IdDocumentoKardex: 0, // Cambiar después al momento de guardar en base de datos
                        Estado: 1 //Predeterminado
                    };
                    rows.push(kardexDetalle);
                }
            });

        // Actualizar el ciclo global al final de esta tabla
        cicloGlobal = cicloPropagado;

    });

    return rows;

}

// Función para encontrar las calificaciones en una fila con base en la palabra clave "PROMED" o "FINAL"
const findCalificacionFromRow = (row: any, calificacionIndexes: number[]): number | null => {
    for (const index of calificacionIndexes) {
        const content = row[index]?.trim().toUpperCase() || "";
        return Number(content.replace(/[^\d.]/g, "")); // Limpia el texto y lo convierte a número
    }
    return null; // No se encontró calificación
};

// Función para encontrar la estructura de la tabla
const findTableStructure = (cells: any[]): ColumnMapping | null => {
    const mapping: ColumnMapping = {};

    // Buscamos los índices de columnas importantes
    cells.forEach((cell) => {
        const content = cell.content?.toString().trim().toUpperCase() || "";

        // Encontrar columna de ASIGNATURAS
        if (content.includes("ASIGNATURA") || content.includes("MATERIAS")) {
            mapping.materiaIndex = cell.columnIndex;
        }

        // Encontrar columnas de MATRÍCULA
        if (content.includes("MATRICULA") || content.includes("MTR")) {
            if (!mapping.matriculasIndexes) mapping.matriculasIndexes = [];
            mapping.matriculasIndexes.push(cell.columnIndex);
        }

        // Buscar fila que contiene el ciclo (puede estar en la columna de asignaturas)
        if (content.match(/\d{4}-[III]+|NIVEL \d{3}|PRIMER CURSO|SEGUNDO CURSO|TERCER CURSO|CUARTO CURSO|QUINTO CURSO|SEXTO CURSO|SEMESTRE/i)) {
            mapping.cicloRow = cell.rowIndex;
        }

        // Buscar fila que contiene el periodo
        if (content.match(/\d{4}/) || content.includes("AÑO") || content.includes("SEMESTRE")) {
            mapping.periodoRow = cell.rowIndex;
        }

        // Encontrar la columna de AÑO (PERIODO) para la carrera de Computación
        if (content.includes("AÑO")) {
            mapping.periodoColumnIndex = cell.columnIndex;
        }

        if (content.includes("SUPLET")) {
            mapping.supletorioColumnIndex = cell.columnIndex;
        }


        // Encontrar columnas de calificación ("PROMED", "FINAL", etc.)
        if (content.includes("PROMED") || content.includes("FINAL")) {
            if (!mapping.calificacionIndexes) mapping.calificacionIndexes = [];
            mapping.calificacionIndexes.push(cell.columnIndex);
        }
    });

    return Object.keys(mapping).length > 0 ? mapping : null;
};

// Función para determinar cuál de las tres matrículas está marcada
const determineMatricula = (row: any, matriculasIndexes: number[]): number => {
    for (let i = 0; i < matriculasIndexes.length; i++) {
        const content = row[matriculasIndexes[i]]?.toString().trim().toUpperCase() || "";
        if (content === "+" || content === "A") {
            return i + 1; // Retorna 1, 2 o 3 según la matrícula marcada
        }
    }
    return 0; // Si no encuentra ninguna marca
};


// Función para extraer el nivel o ciclo de la tabla como un todo
const extractNivelOCiclo = (table: any): string | null => {
    const posibleNivel = table.cells.find((cell: any) =>
        /NIVEL \d{3}|CURSO|PRIMER|SEGUNDO|TERCER|CUARTO|QUINTO|SEXTO|SEPTIMO/i.test(cell.content)
    );
    return posibleNivel ? posibleNivel.content.trim() : null; // Retorna el nivel (si se encuentra)
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

    // Búsqueda por palabras clave específicas
    const matchAnio = contenidoFila.match(/\b19\d{2}\b/); // Buscar números que empiecen con "19"
    if (matchAnio) return matchAnio[0]; // Si encontramos un año, lo retornamos

    // Búsqueda por palabras clave "AÑO", "FINAL", o "SEMESTRE"
    const matchPalabrasClave = contenidoFila.match(/AÑO|FINAL|SEMESTRE/);
    if (matchPalabrasClave) {
        // En caso de detectar palabras clave, tratamos de encontrar un año cercano
        const anioCercano = contenidoFila.match(/\b19\d{2}\b/);
        if (anioCercano) return anioCercano[0]; // Retornar el año relacionado
        return matchPalabrasClave[0]; // Retornamos la palabra clave en caso de no haber año
    }

    return null; // Si no se encuentra nada, retornamos null
};

const populateDetalleMaterias = async (datosExtraidos: any, fields: any) => {
    // Verifica que "detalle-materias" y sus valores existan antes de iterar
    if (fields["detalle-materias"]?.values) {
        for (const materia of fields["detalle-materias"].values) {
            // Validación y mapeo seguro
            datosExtraidos.materiasAprobadas.push({
                ciclo: materia.properties?.Nivel?.value ?? "", // Asegúrate de que "Nivel" exista
                materia: materia.properties?.Materia?.value ?? "",
                periodo: materia.properties?.periodo?.value ?? "",
                calificacion: materia.properties?.Calificacion?.value ?? "",
                noMatricula: transformData(materia.properties)
            });
        }
    }
}

const formatData = (data: string) => {
    if (data.includes("\n")) {
        return data.replace("\n", " ");
    }
    return data;
}

function transformData(data: Row): number {
    if (data?.Matr1?.value?.includes("+") || data?.Matr1?.value?.includes("A")) return 1;
    if (data?.Matr2?.value?.includes("+") || data?.Matr1?.value?.includes("A")) return 2;
    if (data?.Matr3?.value?.includes("+") || data?.Matr1?.value?.includes("A")) return 3;
    else return 0;
}


const extractData = async (file: ArrayBuffer, model: string) => {
    try {
        const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT || "<endpoint>";
        const credential = new AzureKeyCredential(process.env.FORM_RECOGNIZER_API_KEY || "<api key>");
        const client = new DocumentAnalysisClient(endpoint, credential);

        const modelId = model;

        const poller = await client.beginAnalyzeDocument(modelId, file);

        const { documents } = await poller.pollUntilDone();

        if (!documents) {
            return NextResponse.json({ error: 'Error extracting data' }, { status: 500 });
        }

        return {
            fields: documents[0].fields,
        };

    } catch (err) {
        console.error('Error extracting data:', err);
        return NextResponse.json({ error: 'Error extracting data', status: 500 });
    }
}

const extractDetailData = async (file: ArrayBuffer, model: string) => {
    try {
        const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT || "<endpoint>";
        const credential = new AzureKeyCredential(process.env.FORM_RECOGNIZER_API_KEY || "<api key>");
        const client = new DocumentAnalysisClient(endpoint, credential);

        const modelId = model;

        const poller = await client.beginAnalyzeDocument(modelId, file);

        const { tables } = await poller.pollUntilDone();

        if (!tables) {
            return NextResponse.json({ error: 'Error extracting detail data' }, { status: 500 });
        }

        return tables;
    } catch (err) {
        console.error('Error extracting data:', err);
        return NextResponse.json({ error: 'Error extracting data', status: 500 });
    }
}

const classifyDocument = async (file: ArrayBuffer) => {
    try {
        const endpoint = process.env.FORM_CUSTOM_CLASSIFICATION_ENDPOINT || "<endpoint>";
        const credential = new AzureKeyCredential(process.env.FORM_CUSTOM_CLASSIFICATION_API_KEY || "<api key>");
        const client = new DocumentAnalysisClient(endpoint, credential);

        const poller = await client.beginClassifyDocument('clasificador-modelo-kardex', file)

        const { documents } = await poller.pollUntilDone();

        if (!documents) {
            return NextResponse.json({ error: 'Error extracting data' }, { status: 500 });
        }

        return documents[0].docType;

    } catch (err) {
        console.error('Error classifying data:', err);
        return NextResponse.json({ error: 'Error classifying data', status: 500 });
    }
}


const uploadToBlobStorage = async (pdfData: ArrayBuffer): Promise<string> => {
    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobName = `${uuidv4()}.pdf`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

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