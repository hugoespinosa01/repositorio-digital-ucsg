import React from 'react';
import { Page, Text, View, Document, StyleSheet, renderToStream, Image, Font } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logoUcsg from '@/img/logo_ucsg.png';

// Create styles
const styles = StyleSheet.create({
    body: {
        paddingBottom: 235,
        paddingHorizontal: 40,
        fontSize: 9,
    },
    image: {
        width: 95,
        height: 55,
    },
    signature: {
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Helvetica-Bold',
    },
    containerHeader: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    containerHeaderSignature: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginTop: 60,
        // position: 'absolute',
        // bottom: 120,
        // left: 30,
        // right: 30,
    },
    containerHeaderFooter: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        // position: 'absolute',
        // bottom: 20,
        // left: 30,
        // right: 30,
        borderTop: '1px solid #000',
        fontSize: 7,
    },
    colHeader: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    colHeaderImage: {
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        marginBottom: 7,
    },
    anotherColHeader: {
        alignItems: 'center',
        width: '45%',
    },
    anotherColHeaderLeft: {
        alignItems: 'flex-start',
        width: '45%',
    },
    title: {
        textAlign: 'center',
        fontSize: 12,
        marginBottom: 5,
        fontFamily: 'Helvetica-Bold',
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 5
    },
    degreeTitle: {
        textAlign: 'center',
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 5,
    },
    caption: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 10,
        textAlign: 'center',
        padding: 7,
        borderTop: '0.07rem solid #000',
        borderBottom: '0.07rem solid #000',
    },
    data: {
        textAlign: 'left',
        marginBottom: 5,
        marginTop: 5,
        lineHeight: 1.2,
        fontSize: 9,
    },
    key: {
        flexDirection: 'row',
        marginBottom: 5,
        marginTop: 5,
    },
    keyFixed: {
        flexDirection: 'row',
        marginTop: 5,
        // position: 'absolute',
        // bottom: 185,
        // left: 30,
        // right: 30,
        // marginBottom: 5,
        // marginTop: 5,
    },
    textFooter: {
        flexDirection: 'column',
        // position: 'absolute',
        // bottom: 200,
        // left: 30,
        // right: 30,
        textAlign: 'left',
    },
    table: {
        width: '100%',
        fontSize: 9,
    },
    row: {
        display: 'flex',
        flexDirection: 'row',
        paddingTop: 5,
        paddingBottom: 5,
        textTransform: 'uppercase',
        fontSize: 7
    },
    header: {
        borderTop: '0.07rem solid #000',
        borderBottom: '0.07rem solid #000',
    },
    notes: {
        marginTop: 20,
        fontSize: 8,
        lineHeight: 1.3,
    },
    bold: {
        fontFamily: 'Helvetica-Bold',
    },
    // So Declarative and unDRY 👌
    col1: {
        width: '20%',
        fontFamily: 'Helvetica-Bold',
    },
    col2: {
        width: '40%',
    },
    col3: {
        width: '15%',
    },
    col4: {
        width: '10%',
        textAlign: 'right',
    },
    col5: {
        width: '30%',
        textAlign: 'right',
    },
    pageNumber: {
        marginTop: 5,
        // position: 'absolute',
        // fontSize: 9,
        // bottom: 15,
        // left: 20,
        // right: 20,
        textAlign: 'center',
        color: 'grey',
    },
    footer: {
        position: 'absolute',
        bottom: 15,
        left: 30,
        right: 30,
        fontSize: 9,
    },
    line: {
        height: '0.07rem',
        backgroundColor: '#000',
        width: '150%',
        marginBottom: 4,
    }
});

interface ReportType {
    Alumno: string | null;
    Carrera: string | null;
    NoIdentificacion: string | null;
    DetalleMaterias: any;
    NotaGraduacionSeminario: number | null;
    PromGraduacion: number | null;
    PromMateriasAprobadas: number | null;
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
    NotaGraduacionSeminario,
    PromGraduacion,
    PromMateriasAprobadas,

}: ReportType) => (
    <Document>
        <Page size="A4" style={styles.body} wrap>
            <View fixed>
                <View style={styles.containerHeader}>
                    <View style={styles.colHeaderImage}>
                        <Image
                            src={"public/logo_ucsg.png"}
                            style={styles.image}
                        />
                    </View>
                    <View style={styles.colHeader}>
                        <Text style={styles.title}>UNIVERSIDAD CATÓLICA DE SANTIAGO DE GUAYAQUIL</Text>
                        <Text style={styles.subtitle}>FACULTAD DE INGENIERIA</Text>
                        <Text style={styles.degreeTitle}>CARRERA DE {Carrera?.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={styles.caption}>CERTIFICADO DE MATERIAS APROBADAS</Text>
                <View style={styles.data} >

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
            </View>
            <View style={styles.table}>
                <View style={[styles.row, styles.bold, styles.header]} fixed>
                    <Text style={styles.col1}>CICLO</Text>
                    <Text style={styles.col2}>MATERIA</Text>
                    <Text style={styles.col3}>PERIODO</Text>
                    <Text style={styles.col4}>NOTA</Text>
                    <Text style={styles.col5}># MATRÍCULA</Text>
                </View>
                {
                    DetalleMaterias.map((materia: any, index: number) => (
                        <View style={styles.row} key={index}>
                            <Text style={styles.col1}>{materia.Ciclo}</Text>
                            <Text style={styles.col2}>{materia.Materia}</Text>
                            <Text style={styles.col3}>{materia.Periodo}</Text>
                            <Text style={styles.col4}>{Number(materia.Calificacion).toString() + " / 10.00"}</Text>
                            <Text style={styles.col5}>{materia.NoMatricula}</Text>
                        </View>)
                    )
                }
            </View>


            <View style={styles.notes}>
                <View style={styles.key}>
                    <Text style={styles.bold}>TOTAL DE MATERIAS APROBADAS: </Text>
                    <Text>{DetalleMaterias.length}</Text>
                </View>
                <View style={styles.key}>
                    <Text style={styles.bold}>PROMEDIO MATERIAS APROBADAS: </Text>
                    <Text>{PromMateriasAprobadas?.toString() + " / 10.00"}</Text>
                </View>
                <View style={styles.key}>
                    <Text style={styles.bold}>PROMEDIO DE SEMINARIO DE GRADUACIÓN: </Text>
                    <Text>{NotaGraduacionSeminario?.toString() + " / 10.00"}</Text>
                </View>
                <View style={styles.key}>
                    <Text style={styles.bold}>PROMEDIO DE GRADUACIÓN: </Text>
                    <Text>{PromGraduacion?.toString() + " / 10.00"}</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer} fixed>
                <View style={styles.textFooter} fixed>
                    <Text style={styles.bold}>
                        CERTIFICAMOS QUE LAS MATERIAS Y NOTAS CORRESPONDEN A LOS REGISTROS ACADÉMICOS A NUESTRO CARGO
                    </Text>
                    <Text style={styles.bold}>
                        DE ACUERDO AL REGLAMENTO ACADÉMICO VIGENTE DE LA UNIVERSIDAD.
                    </Text>
                </View>
                <View style={styles.keyFixed} fixed>
                    <Text style={styles.bold}>FECHA DE EMISIÓN DEL CERTIFICADO: </Text>
                    <Text style={styles.bold}>{new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }).toUpperCase()}</Text>
                </View>
                <View style={styles.containerHeaderSignature} fixed>
                    <View style={styles.signature}>
                        <View style={styles.line}></View>
                        <Text>DIRECTOR/A DE CARRERA</Text>
                    </View>

                    <View style={styles.signature}>
                        <View style={styles.line}></View>
                        <Text>COORDINADOR/A ACADÉMICO 2</Text>
                    </View>
                </View>
                <View style={styles.containerHeaderFooter} fixed>
                    <View style={styles.anotherColHeaderLeft}>
                        <Text style={styles.bold}>Dirección: Av. Carlos Julio Arosemena Km. 1 1/2</Text>
                        <Text style={styles.bold}>Apartado Postal: 09014671</Text>
                        <Text style={styles.bold}>Teléfonos: 3804600 Ext. 2657</Text>
                    </View>
                    <View style={styles.anotherColHeader}>
                        <Text style={styles.bold}>
                            Guayaquil - Ecuador
                        </Text>
                    </View>
                    <View style={styles.anotherColHeaderLeft}>
                        <Text style={styles.bold}>Website: www.ucsg.edu.ec</Text>
                        <Text style={styles.bold}>Email: webmaster@cu.ucsg.edu.ec</Text>
                    </View>
                </View>
                <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
                    `${pageNumber} / ${totalPages}`
                )} />
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
        NotaGraduacionSeminario: Number(kardex?.NotaGraduacionSeminario),
        PromGraduacion: Number(kardex?.PromGraduacion),
        PromMateriasAprobadas: Number(kardex?.PromMateriasAprobadas),
    }

    const stream = await renderToStream(<MyDocument {...data} />);

    return new NextResponse(stream as unknown as ReadableStream);

}