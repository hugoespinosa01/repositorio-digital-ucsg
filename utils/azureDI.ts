export const normalizeCoordinates = (polygon: number[], pageWidth: number, pageHeight: number): number[] => {
    return polygon.map((coord, index) => {
        return index % 2 === 0 ? coord / pageWidth : coord / pageHeight;
    });
};