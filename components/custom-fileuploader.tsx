'use client';
import { File, Inbox, Loader2, LoaderCircle, Trash2Icon } from 'lucide-react';
import React, { Fragment } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from './ui/button';

interface FileUploadProps {
    file: File | null;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    isSubmitting: boolean;
}

const FileUpload = ({ file, setFile, isSubmitting }: FileUploadProps) => {

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "application/pdf": [".pdf"] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            setFile(file);
        }
    });

    return (
        <div className='p-2 bg-white rounded-xl'>
            <div {...getRootProps()} className='border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col'>
                <input {...getInputProps()} />

                {
                    file ? (

                        <p className="mt-2 flex align-middle items-center justify-center space-x-2">
                            <File className='w-10 h-10 text-rose-900' />
                            <br />
                            <strong className='text-slate-500'>{file.name}</strong>
                        </p>

                    ) : isSubmitting ?
                        (
                            <>
                                <LoaderCircle className='h-10 w-10 text-red-600 animate-spin' />
                                <p>
                                    Cargando y extrayendo texto...
                                </p>
                            </>
                        )
                        :
                        isDragActive ?
                            <p className='mt-2 text-sm text-slate-500'>Suelta el archivo aquí...</p>
                            :
                            (
                                <>
                                    <Inbox className='w-10 h-10 text-slate-500' />
                                    <p className='mt-2 text-sm text-slate-400'>Arrastra y suelta un archivo PDF aquí, o haz clic para seleccionar</p>
                                </>
                            )
                }




            </div>

            {file &&
                <div className="space-x-2 mt-2 flex items-center">
                    <p className='text-slate-500'>Archivo seleccionado: <strong>{file.name}</strong></p>
                    <Button
                        type='button'
                        color='red'
                        variant='ghost'
                        onClick={() => setFile(null)}
                    >
                        <Trash2Icon className='w-4 h-4' />
                    </Button>
                </div>}
        </div>
    )
}

export default FileUpload