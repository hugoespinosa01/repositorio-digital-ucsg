import { Point2D } from "@azure/ai-form-recognizer";

export const normalizeCoordinates = (polygon: Point2D[] | undefined, pageWidth: number, pageHeight: number): number[] => {

    if (!polygon) {
        return [];
    }

    // Convertir el array de Point2D a un array plano de números normalizados
    return polygon.flatMap(point => [
        point.x / pageWidth,    // Normalizar X
        point.y / pageHeight    // Normalizar Y
    ]);
};