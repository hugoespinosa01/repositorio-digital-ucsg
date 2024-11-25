'use client';
import { Inbox, Loader2 } from 'lucide-react';
import React from 'react'
import { useDropzone } from 'react-dropzone'

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
                    // Loading state
                    isSubmitting ?
                        (
                            <>
                                <Loader2 className='h-10 w-10 text-blue-500 '></Loader2>
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
            {file && <p>Archivo seleccionado: {file.name}</p>}
        </div>
    )
}

export default FileUpload