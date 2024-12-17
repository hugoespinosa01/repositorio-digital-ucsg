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
import { AuthContext } from "@/context/auth-context"
import SelectDemo from "../custom-select"


const formSchema = z.object({
    carpeta_destino: z.number()
});

export default function MoveFolderForm({ idFolder, idFile, setOpenModal }: { idFolder?: number, idFile?: number, setOpenModal: (open: boolean) => void }) {

    const { folders, moveFolder, pageSize, isSubmitting } = useContext(FolderContext);
    const { keycloak } = useContext(AuthContext)

    const foldersForMove = folders.filter(folder => folder.Id != idFolder);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            carpeta_destino: 0
        }
    })

    const moveFile = (idFile: number, destino: number, setOpenModal: (open: boolean) => void, pageSize: number, token: string) => {

    }

    function onSubmit(values: z.infer<typeof formSchema>) {

        if (keycloak?.token) {
            if (idFile) {
                moveFile(idFile, values.carpeta_destino, setOpenModal, pageSize, keycloak.token);
            } else {
                moveFolder(idFolder, values.carpeta_destino, setOpenModal, pageSize, keycloak.token);
            }
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-2">
                <FormField
                    control={form.control}
                    name="carpeta_destino"
                    render={({ field }) => (
                        <SelectDemo/>
                    )}
                />
                <div className="flex justify-center sm:justify-end">
                    {
                        isSubmitting ?
                            <Button disabled className="w-full sm:w-auto min-w-[120px]" type="submit">
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