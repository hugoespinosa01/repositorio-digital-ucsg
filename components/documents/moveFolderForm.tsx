"use client"
import {
    useContext
} from "react"
import {
    useForm
} from "react-hook-form"
import {
    zodResolver
} from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    cn
} from "@/lib/utils"
import {
    Button
} from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Check,
    ChevronsUpDown,
} from "lucide-react"
import { FolderContext } from "@/context/folder-context"
import { Loader2 } from "lucide-react";
// import { Select } from "../custom-select"
import { useState } from "react"
import CreatableSelect from 'react-select/creatable';
import { SingleValue } from 'react-select';
import { CustomSelect } from "../custom-select"
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
    carpeta_destino: z.string()
});

export default function MoveFolderForm({ idFolder, idFile, setOpenModal, currentPage, parentId }: { idFolder?: number, idFile?: number, setOpenModal: (open: boolean) => void, currentPage: number, parentId?: number }) {

    const { moveFolder, pageSize, isSubmitting, fetchChildren, fetchFolders } = useContext(FolderContext);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            carpeta_destino: ""
        }
    })

    const moveFile = async (idFile: number, destino: number, setOpenModal: (open: boolean) => void, pageSize: number, currentPage: number, parentId: number | undefined) => {
        
        try {
            const response = await fetch(`/api/files/${idFile}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ IdCarpetaPadre: destino })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al mover la carpeta");
            }

            toast({
                title: "Carpeta movida",
                description: "La carpeta ha sido movida exitosamente",
                variant: "default",
            });

            if (parentId) {
                fetchChildren(destino.toString(), currentPage, pageSize);
            } else {
                fetchFolders(currentPage, pageSize);
            }

        } catch (err) {
            console.error(err);
            toast({
                title: "Error",
                description: "Error al mover la carpeta",
                variant: "destructive",
            });
        } finally {
            setOpenModal(false);
        }
    }

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (idFile) {
            moveFile(idFile, Number(values.carpeta_destino), setOpenModal, pageSize, currentPage, parentId);
        } else {
            moveFolder(idFolder, Number(values.carpeta_destino), setOpenModal, pageSize, currentPage, parentId);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-2">
                <FormField
                    control={form.control}
                    name="carpeta_destino"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <CustomSelect
                                    placeholder="Selecciona una carpeta"
                                    onChange={field.onChange}
                                    idFolder={idFolder}
                                    idFile={idFile}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <div className="flex justify-center sm:justify-end">
                    {
                        isSubmitting ?
                            <Button disabled className="w-full sm:w-auto min-w-[120px]" type="button">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cargando...
                            </Button> :
                            <Button className="w-full sm:w-auto min-w-[120px]" type="submit">Aceptar</Button>
                    }
                </div>
            </form>
        </Form>
    )
}