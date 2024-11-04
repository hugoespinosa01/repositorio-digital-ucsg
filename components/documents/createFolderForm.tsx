'use client';

import {
  useContext,
  useEffect,
} from "react"

import {
  useForm,
} from "react-hook-form"
import {
  zodResolver
} from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Button
} from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Input
} from "@/components/ui/input"
import { ReloadIcon } from "@radix-ui/react-icons";
import { FolderContext } from "@/context/folder-context";
import { Folder } from "@/types/folder";

const formSchema = z.object({
  nombre: z.string({
    message: "El nombre es requerido"
  }).min(3, {
    message: "El nombre debe tener al menos 3 caracteres"
  }).max(20, {
    message: "El nombre no debe tener más de 20 caracteres"
  })
});

interface CreateFolderFormProps {
  editMode: boolean;
  setOpenModal: (open: boolean) => void;
  folder?: Folder | null;
}

export default function CreateFolderForm({editMode, setOpenModal, folder  }: CreateFolderFormProps) {

  const { createFolder, isSubmitting, updateFolder} = useContext(FolderContext);
 
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: ""
    }
  });

  useEffect(() => {
    if (editMode && folder) {
      form.setValue('nombre', folder.Nombre);
    }
  }, [editMode, folder]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    
    if (editMode && folder) {
      updateFolder(folder.Id, values.nombre, setOpenModal);
      return;
    }
    
    createFolder(values.nombre, setOpenModal);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-3 px-4">

        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  placeholder=""

                  type="text"
                  {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-center sm:justify-end">
          {
            isSubmitting ? (
              <Button disabled className="w-full sm:w-auto min-w-[120px]">
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </Button>
            ) : 
            <Button type="submit" className="w-full sm:w-auto min-w-[120px]">
              {
                editMode ? 'Actualizar' : 'Crear'
              }
            </Button>
          }

        </div>
      </form>
    </Form>
  )
}