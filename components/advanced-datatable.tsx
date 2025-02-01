import React, { useState, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,

} from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Plus,
    Pencil,
    Check,
    X,
    Trash2,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';

import { KardexDetalle } from '@/types/kardexDetalle';
import { useToast } from './ui/use-toast';
import { useEffect } from 'react';

interface MateriasDataTableProps {
    initialData: KardexDetalle[];
}

export const MateriasDataTable = ({ initialData }: MateriasDataTableProps) => {
    const [data, setData] = useState<KardexDetalle[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: keyof KardexDetalle; direction: 'asc' | 'desc' | null }>({
        key: 'Ciclo',
        direction: null,
    });
    const [filterMateria, setFilterMateria] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingRow, setEditingRow] = useState<number | null>(null);
    const [editedData, setEditedData] = useState<KardexDetalle | null>(null);
    const [loading, setLoading] = useState(true);
    const rowsPerPage = 5;
    const { toast } = useToast();

    useEffect(() => {
        fetchAndSetData(); // Carga los datos al montar el componente
    }, []);

    //APIs
    const getNotas = async () => {
        try {
            const response = await fetch('/api/materias');
            if (!response.ok) {
                throw new Error('Error obteniendo las notas');
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    };

    const addNota = async (nota: KardexDetalle) => {
        try {
            const response = await fetch('/api/materias', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(nota)
            });
            if (!response.ok) {
                throw new Error('Error al agregar la nota');
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    };

    const updateNota = async (id: number, updatedNota: KardexDetalle) => {
        try {
            const response = await fetch(`/api/materias/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedNota)
            });
            if (!response.ok) {
                throw new Error('Error actualizando la nota');
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    };

    const deleteNota = async (id: number) => {
        try {
            const response = await fetch(`/api/materias/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Error eliminando la nota');
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    };

    const handleAddNota = async (newNota: KardexDetalle) => {
        try {
            await addNota(newNota);
            toast({ title: 'Nota agregada', description: 'La nota fue creada correctamente' });
            // Actualizar la tabla después de agregar
            fetchAndSetData();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message });
        }
    };

    const handleUpdateNota = async (id: number, editedNota: KardexDetalle) => {
        try {
            await updateNota(id, editedNota);
            toast({ title: 'Nota actualizada', description: 'Los cambios fueron guardados' });
            // Actualizar la tabla después de editar
            fetchAndSetData();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message });
        }
    };

    const handleDeleteNota = async (id: number) => {
        try {
            await deleteNota(id);
            toast({ title: 'Nota eliminada', description: 'La nota fue eliminada correctamente' });
            // Actualizar la tabla después de eliminar
            fetchAndSetData();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message });
        }
    };

    const fetchAndSetData = async () => {
        setLoading(true);
        try {
            const notas = await getNotas(); // Llama la función que pide las notas al servidor
            setData(notas);
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudieron cargar las notas' });
        } finally {
            setLoading(false);
        }
    };


    // Sort data
    const sortData = useCallback((data: KardexDetalle[]) => {
        if (!sortConfig.direction) return data;
        return [...data].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [sortConfig]);

    // Filter data
    const filterData = useCallback((data: KardexDetalle[]) => {
        return data.filter(item =>
            item.Materia.toLowerCase().includes(filterMateria.toLowerCase())
        );
    }, [filterMateria]);

    // Group data by Ciclo
    const groupData = useCallback((data: KardexDetalle[]) => {
        const groups: { [key: string]: KardexDetalle[] } = {};
        data.forEach(item => {
            if (!groups[item.Ciclo]) groups[item.Ciclo] = [];
            groups[item.Ciclo].push(item);
        });
        return groups;
    }, []);

    // Process data with all transformations
    const processData = useCallback(() => {
        let processed = [...data];
        processed = sortData(processed);
        processed = filterData(processed);
        return processed;
    }, [data, sortData, filterData]);

    // Handle column sort
    const handleSort = (key: keyof KardexDetalle) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };



    // Handle row edit
    const startEditing = (row: KardexDetalle) => {
        setEditingRow(row.Id);
        setEditedData({ ...row });
    };

    const cancelEditing = () => {
        setEditingRow(null);
        setEditedData(null);
    };

    // Modifica la función saveEditing
    const saveEditing = async () => {
        if (editedData) {
            try {
                await handleUpdateNota(editedData.Id, editedData);
                // Restaurar valores iniciales
                setEditingRow(null);
                setEditedData(null);
            } catch (error: any) {
                console.error(error.message);
            }
        }
    };

    // 1. Primero, define el tipo de la función addNewRow
    const addNewRow = async (newRow: KardexDetalle) => {
        try {
            await handleAddNota(newRow);
            setCurrentPage(1);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo agregar la nueva nota",
                variant: "destructive",
            });
        }
    };

    // 2. Crea una función separada para manejar el click del botón
    const handleAddClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        // Aquí creas el nuevo objeto KardexDetalle con los datos necesarios
        const newRow: KardexDetalle = {
            Id: 0, // O genera un ID temporal
            Ciclo: "", // O el valor que corresponda
            Materia: "",
            Periodo: "",
            Calificacion: 0,
            NoMatricula: 0,
            IdDocumentoKardex: 0,
            Estado: 1,
        };

        await addNewRow(newRow);
    };



    // Conectar deleteRow con la API
    const deleteRow = async (id: number) => {
        try {
            await handleDeleteNota(id); // Elimina la nota con el ID
        } catch (error: any) {
            console.error(error.message);
        }
    };

    // Get paginated data
    const getPaginatedData = useCallback((processedData: KardexDetalle[]) => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return processedData.slice(startIndex, startIndex + rowsPerPage);
    }, [currentPage]);





    const processedData = processData();
    const paginatedData = getPaginatedData(processedData);
    const totalGroups = Object.keys(processedData).length;
    const totalPages = Math.ceil(totalGroups / rowsPerPage);

    // Función para generar el rango de páginas a mostrar
    const getPageRange = useCallback(() => {
        const range: number[] = [];
        const maxVisible = 5; // Máximo número de páginas visibles
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        // Ajustar el inicio si estamos cerca del final
        if (end === totalPages) {
            start = Math.max(1, end - maxVisible + 1);
        }
        // Ajustar el final si estamos cerca del inicio
        if (start === 1) {
            end = Math.min(totalPages, start + maxVisible - 1);
        }

        for (let i = start; i <= end; i++) {
            range.push(i);
        }
        return range;
    }, [currentPage, totalPages]);

    return (
        <div className="p-4 space-y-4 bg-background rounded-lg shadow-md">
            {/* Table Header with Filter */}
            <div className="flex justify-between items-center">
                <Input
                    placeholder="Filtrar por Materia..."
                    className="max-w-sm h-9"
                    value={filterMateria}
                    size={10}
                    onChange={(e) => setFilterMateria(e.target.value)}
                />
                <Button onClick={handleAddClick} size={'sm'} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Materia
                </Button>
            </div>

            {/* Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead onClick={() => handleSort('Ciclo')} className="cursor-pointer">
                            Nivel {sortConfig.key === 'Ciclo' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />)}
                        </TableHead>
                        <TableHead onClick={() => handleSort('Periodo')} className="cursor-pointer">
                            Periodo {sortConfig.key === 'Periodo' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />)}
                        </TableHead>
                        <TableHead onClick={() => handleSort('Materia')} className="cursor-pointer">
                            Materia {sortConfig.key === 'Materia' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />)}
                        </TableHead>
                        <TableHead onClick={() => handleSort('NoMatricula')} className="cursor-pointer">
                            Matrícula {sortConfig.key === 'NoMatricula' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />)}
                        </TableHead>
                        <TableHead onClick={() => handleSort('Calificacion')} className="cursor-pointer">
                            Calificación {sortConfig.key === 'Calificacion' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />)}
                        </TableHead>
                        <TableHead>Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedData.map(row => (
                        <TableRow key={row.Id}>
                            {editingRow === row.Id ? (
                                <>
                                    <TableCell>
                                        <Input
                                            value={editedData?.Ciclo || ''}
                                            onChange={(e) => setEditedData(prev => prev ? { ...prev, Ciclo: e.target.value } : null)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={editedData?.Periodo || ''}
                                            onChange={(e) => setEditedData(prev => prev ? { ...prev, Periodo: e.target.value } : null)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={editedData?.Materia || ''}
                                            onChange={(e) => setEditedData(prev => prev ? { ...prev, Materia: e.target.value } : null)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={editedData?.NoMatricula || 0}
                                            onChange={(e) => setEditedData(prev => prev ? { ...prev, NoMatricula: Number(e.target.value) } : null)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={editedData?.Calificacion || 0}
                                            onChange={(e) => setEditedData(prev => prev ? { ...prev, Calificacion: Number(e.target.value) } : null)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={saveEditing}
                                            >
                                                <Check className="h-4 w-4 text-green-500" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={cancelEditing}
                                            >
                                                <X className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </>
                            ) : (
                                <>
                                    <TableCell>{row.Ciclo}</TableCell>
                                    <TableCell>{row.Periodo}</TableCell>
                                    <TableCell>{row.Materia}</TableCell>
                                    <TableCell>{row.NoMatricula}</TableCell>
                                    <TableCell>{row.Calificacion}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => startEditing(row)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => deleteRow(row.Id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="flex justify-center items-center gap-2">
                <Button
                    variant="outline"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageRange().map(page => (
                    <Button
                        key={page}
                        variant={currentPage === page ? "secondary" : "outline"}
                        onClick={() => setCurrentPage(page)}
                    >
                        {page}
                    </Button>
                ))}

                <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default MateriasDataTable;
