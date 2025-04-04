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
    Check,
    X,
    Trash2,
    ChevronsLeft,
    ChevronsRight,
    Loader2,
    Edit,
    Expand,
} from 'lucide-react';

import { KardexDetalle } from '@/types/kardexDetalle';
import { useToast } from './ui/use-toast';
import { useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import ConfirmDeleteMateria from './modals/confime-delete-materia';
import ConfirmEditMateria from './modals/confime-edit-materia';
import { Dispatch } from 'react';


interface MateriasDataTableProps {
    fileId: string | null | undefined;
    canCreateMateria: boolean;
    canUpdateMateria: boolean;
    canDeleteMateria: boolean;
    setOpenModal?: Dispatch<React.SetStateAction<boolean>>;
    hideExpandButton?: boolean
}

// Definir el tipo
type SortConfig = {
    key: keyof KardexDetalle;
    direction: 'asc' | 'desc' | null;
};

export const MateriasDataTable = ({ fileId, canCreateMateria, canUpdateMateria, canDeleteMateria, setOpenModal, hideExpandButton }: MateriasDataTableProps) => {
    const [data, setData] = useState<KardexDetalle[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'Ciclo',
        direction: null,
    });
    const [filterMateria, setFilterMateria] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingRow, setEditingRow] = useState<number | null>(null);
    const [editedData, setEditedData] = useState<KardexDetalle | null>(null);
    const [loading, setLoading] = useState(true);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [deletedData, setDeletedData] = useState<KardexDetalle | null>(null);
    const rowsPerPage = 5;
    const { toast } = useToast();

    useEffect(() => {
        fetchAndSetData(); // Carga los datos al montar el componente
    }, [currentPage]);

    //APIs
    const getNotas = async () => {
        try {
            const response = await fetch(`/api/materias/${fileId}?page=${currentPage}&limit=${rowsPerPage}`);
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
            const response = await fetch(`/api/materias/${fileId}`, {
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
            setData(notas.data);
            setTotalPages(notas.totalPages);
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudieron cargar las notas' });
        } finally {
            setLoading(false);
        }
    };


    // Sort data
    const sortData = useCallback((data: KardexDetalle[]) => {
        if (!sortConfig.key || !sortConfig.direction) {
            return data; // Si no hay configuración de ordenación, devuelve los datos tal como están
        }

        return [...data].sort((a, b) => {
            // Si la key es isNewRow, la ignoramos en el ordenamiento
            if (sortConfig.key === 'isNewRow') {
                return 0;
            }

            // Accedemos de manera segura a la propiedad
            const aValue = a[sortConfig.key as keyof Omit<KardexDetalle, 'isNewRow'>];
            const bValue = b[sortConfig.key as keyof Omit<KardexDetalle, 'isNewRow'>];

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [sortConfig]);


    // Filter data
    const filterData = useCallback((data: KardexDetalle[]) => {
        return data.filter(item =>
            item.Materia.toLowerCase().includes(filterMateria.toLowerCase())
        );
    }, [filterMateria]);

    // Función para procesar y agrupar los datos por ciclo
    const processData = useCallback(() => {
        // Primero, filtramos por materia si hay filtro
        let processedData = data;
    
        if (filterMateria) {
            processedData = filterData(data); // Filtrar por Materia
        }
    
        // Ordenamos los datos si hay configuración de ordenamiento
        if (sortConfig.direction) {
            processedData = sortData(processedData); // Ordenar
        }
    
        // Simplemente devuelve los datos procesados (sin agrupar)
        return processedData;
    }, [data, filterMateria, sortConfig]);
    

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
        if (editedData?.isNewRow) {
            // Si es una fila nueva, eliminarla visualmente de la tabla
            setData(prev => prev.filter(row => row.Id !== editedData.Id));
        }

        // Limpiar los estados
        setEditingRow(null);
        setEditedData(null);
    };


    const saveEditing = async () => {
        if (editedData) {
            try {
                if (editedData.isNewRow) {
                    // Caso 1: Crear (POST) si la fila es nueva
                    await handleAddNota(editedData);
                    toast({
                        title: "Materia creada",
                        description: "Se agregó la nueva materia correctamente.",
                    });
                    // Actualizamos el estado de la tabla desde la API
                    await fetchAndSetData();

                    // Limpiar estado al terminar
                    setEditingRow(null);
                    setEditedData(null);
                } else {
                    // Caso 2: Actualizar (PUT) si ya existe en la base
                    setOpenEditModal(true);
                }

            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            }
        }
    };

    // Modifica addNewRow para que solo agregue la fila visual
    const addNewRow = () => {
        const newRow: KardexDetalle = {
            Id: Date.now(), // ID temporal único
            Ciclo: "",
            Materia: "",
            Periodo: "",
            Calificacion: 0,
            NoMatricula: 0,
            IdDocumentoKardex: 0,
            Estado: 1,
            isNewRow: true,
        };

        setData(prev => [newRow, ...prev]); // Añade al inicio del array
        setEditingRow(newRow.Id); // Inmediatamente ponla en modo edición
        setEditedData(newRow); // Guarda los datos en edición
        setCurrentPage(1); // Regresa a la primera página
    };

    // Modifica handleAddClick para que solo llame a addNewRow
    const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        addNewRow();
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
        return processedData;
    }, [currentPage]);

    const processedData = processData();
    const paginatedData = getPaginatedData(processedData);

    // Función para generar el rango de páginas a mostrar
    const getPageRange = useCallback(() => {
        const range: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
    
        if (end === totalPages) {
            start = Math.max(1, end - maxVisible + 1);
        }
        if (start === 1) {
            end = Math.min(totalPages, start + maxVisible - 1);
        }
    
        for (let i = start; i <= end; i++) {
            range.push(i);
        }
        return range;
    }, [currentPage, totalPages]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin w-10 h-10 text-primary" />
            </div>
        )
    }

    return (
        <div className="text-xs p-4 space-y-4 bg-background rounded-lg shadow-md">
            <span className='text-xs font-semibold text-foreground'>
                Hola
            </span>
            
            {/* Table Header with Filter */}
            <div className="flex justify-between items-center">

                {/* Input para buscar materias */}
                <Input
                    placeholder="Filtrar por Materia..."
                    className="max-w-sm h-9"
                    value={filterMateria}
                    size={10}
                    onChange={(e) => setFilterMateria(e.target.value)}
                />

                {/* Botón para crear materias */}
                {
                    canCreateMateria && (
                        <Button onClick={handleAddClick} size={'sm'} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Agregar Materia
                        </Button>
                    )
                }
                {/* Expandir tabla */}
                {
                    !hideExpandButton && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setOpenModal && setOpenModal(true)
                                        }
                                        }
                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <Expand className="w-4 h-4 text-gray-600 hover:text-rose-900" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Expandir contenido
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )
                }
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
                        <TableHead onClick={() => handleSort('Materia')} className="cursor-pointer min-w-max">
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
                                            id="no_matricula"
                                            type="number"
                                            max={3}
                                            min={0}
                                            onKeyDown={(e) => {
                                                // Prevenir el ingreso del signo menos
                                                if (e.key === '-') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            value={editedData?.NoMatricula || 0}
                                            onChange={(e) => {
                                                if (Number(e.target.value) > 3) {
                                                    e.preventDefault();
                                                    setEditedData(prev => prev ? { ...prev, NoMatricula: 3 } : null);
                                                    return;
                                                }
                                                setEditedData(prev => prev ? { ...prev, NoMatricula: Number(e.target.value) } : null)}
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            max={10}
                                            min={0}
                                            value={editedData?.Calificacion || 0}
                                            onKeyDown={(e) => {
                                                // Prevenir el ingreso del signo menos
                                                if (e.key === '-') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onChange={(e) => {
                                                if (Number(e.target.value) > 10) {
                                                    e.preventDefault();
                                                    setEditedData(prev => prev ? { ...prev, Calificacion: 10 } : null);
                                                    return;
                                                }
                                                setEditedData(prev => prev ? { ...prev, Calificacion: Number(e.target.value) } : null)}
                                            }
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
                                    <TableCell className='text-xs'>{row.Ciclo}</TableCell>
                                    <TableCell className='text-xs'>{row.Periodo}</TableCell>
                                    <TableCell className='text-xs'>{row.Materia}</TableCell>
                                    <TableCell className='text-xs'>{row.NoMatricula}</TableCell>
                                    <TableCell className='text-xs'>{row.Calificacion}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {
                                                canUpdateMateria && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        startEditing(row)
                                                                    }}
                                                                >
                                                                    <Edit className="h-4 w-4" color="#325286" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Editar materia
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )
                                            }
                                            {
                                                canDeleteMateria && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setDeletedData(row);
                                                                        setOpenDeleteModal(true);
                                                                        //deleteRow(row.Id)
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Eliminar materia
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )
                                            }

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
            <ConfirmDeleteMateria
                openModal={openDeleteModal}
                setOpenModal={setOpenDeleteModal}
                deleteRow={deleteRow}
                deletedData={deletedData}
            />
            <ConfirmEditMateria
                openModal={openEditModal}
                setOpenModal={setOpenEditModal}
                handleUpdateNota={handleUpdateNota}
                editedData={editedData}
                fetchAndSetData={fetchAndSetData}
                setEditingRow={setEditingRow}
                setEditedData={setEditedData}
            />
        </div>
    );
};

export default MateriasDataTable;
