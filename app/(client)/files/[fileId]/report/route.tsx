import React from 'react';
import { Page, Text, View, Document, StyleSheet, renderToStream } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'row',
        backgroundColor: '#E4E4E4'
    },
    table: {
        width: '100%',
    },
    section: {
        margin: 10,
        padding: 10,
        textAlign: 'center'
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
    bold: {
        fontWeight: 'bold',
    },
    // So Declarative and unDRY 👌
    col1: {
        width: '27%',
    },
    col2: {
        width: '20%',
    },
    col3: {
        width: '20%',
    },
    col4: {
        width: '25%',
    },
    col5: {
        width: '30%',
    },
});

// Create Document Component
const MyDocument = () => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.section}>
                <Text>UNIVERSIDAD CATÓLICA DE SANTIAGO DE GUAYAQUIL</Text>
                <Text>FACULTAD DE INGENIERIA</Text>
                <Text>CARRERA DE INGENIERIA EN SISTEMAS COMPUTACIONALES</Text>
                <Text>CERTIFICADO DE MATERIAS APROBADAS</Text>
                <Text>NIVEL: GRADO</Text>
                <Text>ALUMNO: AREVALO LEON CHRISTIAN OMA</Text>
                <Text># DE IDENTIFICACIÓN: 0915385454</Text>
                <View style={styles.table}>
                    <View style={[styles.row, styles.bold, styles.header]}>
                        <Text style={styles.col1}>CICLO</Text>
                        <Text style={styles.col2}>MATERIA</Text>
                        <Text style={styles.col3}>PERIODO</Text>
                        <Text style={styles.col4}>NOTA</Text>
                        <Text style={styles.col5}># MATRÍCULA</Text>
                    </View>
                </View>
            </View>
        </Page>
    </Document>
);


export async function GET(request: Request, { params }: { params: { fileId: string } }) {

    const stream = await renderToStream(<MyDocument />);

    return new NextResponse(stream as unknown as ReadableStream);
}