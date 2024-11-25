export interface ExtractedData {
    Alumno: { value: string };
    Carrera: { value: string };
    NoIdentificacion: { value: string };
    "detalle-materias": {
        values: Array<{
            properties: {
                Nivel?: { value: string };
                Materia?: { value: string };
                periodo?: { value: string };
                Calificacion?: { value: string };
                noMatricula?: { value: string };
            };
        }>;
    };
}
