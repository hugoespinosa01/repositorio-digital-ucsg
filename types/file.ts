export interface Documento {
    Id: number;
    IdCarpeta: number | null;
    NombreArchivo: string;
    Ruta: string | null;
    RefArchivo: string;
    FechaCarga: Date;
    Tamano: number | null;
    Extension: string | null;
    Estado: number | null;
    Tipo: string | null;
}

