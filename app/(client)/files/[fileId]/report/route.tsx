import React from 'react';
import { Page, Text, View, Document, StyleSheet, renderToStream, Image, Font } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Create styles
const styles = StyleSheet.create({
    body: {
        paddingTop: 30,
        paddingBottom: 60,
        paddingHorizontal: 25,
        fontSize: 14,
    },
    image: {
        width: 100,
        height: 95,
        alignSelf: 'flex-start',
    },
    containerHeader: {
        marginTop: 5,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    colHeader: {
        alignItems: 'center',
    },
    anotherColHeader: {
        alignItems: 'center',
        width: '33%',
    },
    title: {
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 5,
        fontFamily: 'Helvetica-Bold',
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 15,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 5
    },
    caption: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 5,
        padding: 5,
        borderTop: '1px solid #000',
        borderBottom: '1px solid #000',
    },
    data: {
        textAlign: 'left',
        marginBottom: 5,
        marginTop: 5,
        lineHeight: 1.2,
        fontSize: 13,
    },
    key: {
        flexDirection: 'row',
    },
    table: {
        width: '100%',
        fontSize: 13,
    },
    row: {
        display: 'flex',
        flexDirection: 'row',
        borderTop: '1px solid #EEE',
        paddingTop: 8,
        paddingBottom: 8,
    },
    header: {
        borderTop: 'none',
    },
    notes: {
        marginTop: 10,
        fontSize: 10,
        lineHeight: 1.3,
    },
    bold: {
        fontFamily: 'Helvetica-Bold',
    },
    // So Declarative and unDRY 👌
    col1: {
        width: '27%',
        fontWeight: 'bold',
    },
    col2: {
        width: '20%',
        fontWeight: 'bold',
    },
    col3: {
        width: '20%',
        fontWeight: 'bold',
    },
    col4: {
        width: '25%',
        fontWeight: 'bold',
    },
    col5: {
        width: '30%',
        fontWeight: 'bold',
    },
});

interface ReportType {
    Alumno: string | null;
    Carrera: string | null;
    NoIdentificacion: string | null;
    DetalleMaterias: any;
    NotaGraduacionSeminario: number | null;
}

Font.register({
    family: 'Open Sans',
    fonts: [
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 600 }
    ]
})

// Create Document Component
const MyDocument = ({
    Alumno,
    Carrera,
    NoIdentificacion,
    DetalleMaterias,
    NotaGraduacionSeminario

}: ReportType) => (
    <Document>
        <Page size="A4" style={styles.body}>
            <View>
                <View style={styles.containerHeader}>
                    <View style={styles.colHeader}>
                        <Image
                            src={"img/logo_ucsg.png"}
                            style={styles.image}
                        />
                    </View>
                    <View style={styles.colHeader}>
                        <Text style={styles.title}>UNIVERSIDAD CATÓLICA DE SANTIAGO DE GUAYAQUIL</Text>
                        <Text style={styles.subtitle}>FACULTAD DE INGENIERIA</Text>
                        <Text style={styles.subtitle}>CARRERA DE {Carrera?.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={styles.caption}>CERTIFICADO DE MATERIAS APROBADAS</Text>
                <View style={styles.data}>

                    <View style={styles.key}>
                        <Text style={styles.bold}>NIVEL: </Text>
                        <Text>GRADO</Text>
                    </View>

                    <View style={styles.key}>
                        <Text style={styles.bold}>ALUMNO: </Text>
                        <Text>{Alumno}</Text>
                    </View>

                    <View style={styles.key}>
                        <Text style={styles.bold}># DE IDENTIFICACIÓN: </Text>
                        <Text>{NoIdentificacion}</Text>
                    </View>
                </View>
                <View style={styles.table}>
                    <View style={[styles.row, styles.bold, styles.header]}>
                        <Text style={styles.col1}>CICLO</Text>
                        <Text style={styles.col2}>MATERIA</Text>
                        <Text style={styles.col3}>PERIODO</Text>
                        <Text style={styles.col4}>NOTA</Text>
                        <Text style={styles.col5}># MATRÍCULA</Text>
                    </View>
                    {
                        DetalleMaterias.map((materia: any, index: number) => (
                            <View style={styles.row} key={index} wrap={false}>
                                <Text style={styles.col1}>{materia.Ciclo}</Text>
                                <Text style={styles.col2}>{materia.Materia}</Text>
                                <Text style={styles.col3}>{materia.Periodo}</Text>
                                <Text style={styles.col4}>{materia.Nota}</Text>
                                <Text style={styles.col5}>{materia.Matricula}</Text>
                            </View>
                        ))
                    }
                </View>
                <View
                    style={styles.notes}
                >
                    <Text>CERTIFICAMOS QUE LAS MATERIAS Y NOTAS CORRESPONDEN A LOS REGISTROS ACADÉMICOS A NUESTRO CARGO DE ACUERDO AL
                        REGLAMENTO ACADÉMICO VIGENTE DE LA UNIVERSIDAD.</Text>
                    <View style={styles.key}>
                        <Text style={styles.bold}>FECHA DE EMISIÓN DEL CERTIFICADO: </Text>
                        <Text>{new Date().toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.key}>
                        <Text style={styles.bold}>PROMEDIO DE SEMINARIO DE GRADUACION: </Text>
                        <Text>{NotaGraduacionSeminario}</Text>
                    </View>
                    <View style={styles.containerHeader}>
                        <View style={styles.anotherColHeader}>
                            <Text>
                                Dirección: Av. Carlos Julio Arosemena Km. 1 1/2
                                Apartado Postal: 09014671
                                Teléfonos: 2206952 Ext. 2657
                            </Text>
                        </View>
                        <View style={styles.anotherColHeader}>
                            <Text>
                                Guayaquil - Ecuador
                            </Text>
                        </View>
                        <View style={styles.anotherColHeader}>
                            <Text>
                                Website: www.ucsg.edu.ec
                                Email: webmaster@cu.ucsg.edu.ec
                            </Text>
                        </View>
                    </View>
                </View>


            </View>
        </Page>
    </Document>
);



export async function GET(request: Request, { params }: { params: { fileId: string } }) {

    const fileId = Number(params.fileId);

    const file = await prisma.documento.findFirst({
        where: {
            Id: fileId,
            Estado: 1
        }
    });

    if (!file) {
        throw new Error('Documento no encontrado');
    }

    const kardex = await prisma.tipoDocumentoKardex.findFirst({
        where: {
            IdDocumento: file.Id,
            Estado: 1
        }
    });

    if (!kardex) {
        throw new Error('Documento kardex no encontrado');
    }

    const kardexDetalle = await prisma.documentoDetalleKardex.findMany({
        where: {
            IdDocumentoKardex: kardex?.Id,
            Estado: 1
        }
    });

    if (!kardexDetalle) {
        throw new Error('Detalles de documento kardex no encontrados');
    }

    const data = {
        Alumno: kardex?.Alumno,
        Carrera: kardex?.Carrera,
        NoIdentificacion: kardex?.NoIdentificacion,
        DetalleMaterias: kardexDetalle,
        NotaGraduacionSeminario: Number(kardex?.NotaGraduacionSeminario)
    }

    const stream = await renderToStream(<MyDocument {...data} />);

    return new NextResponse(stream as unknown as ReadableStream);

}