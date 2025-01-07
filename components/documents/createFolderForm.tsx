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
import { Loader2 } from "lucide-react";
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
  parentId?: string | null | undefined;
  currentPage: number;
}

export default function CreateFolderForm({ editMode, setOpenModal, folder, parentId, currentPage }: CreateFolderFormProps) {

  const { createFolder, isSubmitting, updateFolder } = useContext(FolderContext);

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
      updateFolder(folder.Id, values.nombre, setOpenModal, Number(parentId), currentPage);
      return;
    } else {
      createFolder(values.nombre, setOpenModal, Number(parentId), currentPage);
    }

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
              <Button disabled type="button" className="w-full sm:w-auto min-w-[120px]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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