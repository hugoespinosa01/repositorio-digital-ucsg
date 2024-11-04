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
import { ReloadIcon } from "@radix-ui/react-icons";


const formSchema = z.object({
    carpeta_destino: z.number()
});

export default function MoveFolderForm({ idFolder, setOpenModal }: { idFolder: number, setOpenModal: (open: boolean) => void }) {

    const { folders, moveFolder, pageSize, isSubmitting } = useContext(FolderContext);

    const foldersForMove = folders.filter(folder => folder.Id != idFolder);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            carpeta_destino: 0
        }
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        moveFolder(idFolder, values.carpeta_destino, setOpenModal, pageSize);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-2">
                <FormField
                    control={form.control}
                    name="carpeta_destino"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Carpeta</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <div className="flex justify-center text-center">
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-[200px] justify-between",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value
                                                    ? foldersForMove.find(
                                                        (folder) => folder.Id === field.value
                                                    )?.Nombre
                                                    : "Selecciona una carpeta"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </div>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Buscar carpeta..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontraron carpetas.</CommandEmpty>
                                            <CommandGroup>
                                                {foldersForMove.map((folder) => (
                                                    <CommandItem
                                                        value={folder.Nombre}
                                                        key={folder.Id}
                                                        onSelect={() => {
                                                            form.setValue("carpeta_destino", folder.Id);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                folder.Id === field.value
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {folder.Nombre}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormDescription></FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-center sm:justify-end">
                    {
                        isSubmitting ?
                            <Button disabled className="w-full sm:w-auto min-w-[120px]" type="submit">
                                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                                Cargando...
                            </Button> :
                            <Button className="w-full sm:w-auto min-w-[120px]" type="submit">Aceptar</Button>
                    }
                </div>
            </form>
        </Form>
    )
}