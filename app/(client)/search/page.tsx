'use client';
import React from 'react'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TextShimmer } from '@/components/loading-text-effect';
import { X } from 'lucide-react';
import { FileCard } from '@/components/custom-file-card';
import { ContentLayout } from "@/components/admin-panel/content-layout";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import LoadingBreadcrumb from "@/components/documents/loadingBreadcrumb";
import { useParams } from "next/navigation";
import { Folder } from "@/types/folder";
import Link from "next/link";

interface SearchProps {
    searchParams?: {
        [key: string]: string | string[] | undefined
    },
    handleFileClick: (fileId: number) => void,
    handleMoveFile: (fileId: number) => void,
    handleDeleteFile: (fileId: number) => void
}

export default function SearchResults({ searchParams, handleFileClick, handleMoveFile, handleDeleteFile }: SearchProps) {
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [results, setResults] = useState<any[]>([]);
    const [parent] = useState<Folder | null>(null);
    const [loading] = useState<boolean>(false);

    const path = parent?.Ruta ?? '/';
    const pathArray = path.split('/');

    const parentIds = parent?.IdHijos ?? '';
    const parentArray = parentIds.split(',');

    const pathArrayWithoutEmpty = pathArray.filter(item => item !== '');

    const pathsForBreadcrumb = pathArrayWithoutEmpty.map((item, index) => {
        if (item !== '') {
            return {
                name: item,
                id: parentArray[index] ? Number(parentArray[index]) : 0
            }
        }
    });

    const query = searchParams?.query;

    if (Array.isArray(query) || !query) {
        return redirect('/')
    }

    useEffect(() => {
        fetchSearchResults();
    }, [query]);

    const fetchSearchResults = async () => {
        try {

            setIsSearching(true);
            setResults([]);

            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) {
                const body = await response.json();
                console.log('Error searching:', body);
                throw new Error('Error searching');
            }

            const { results } = await response.json();
            setResults(results);

        } catch (err) {
            console.error('Error searching:', err);
        } finally {
            setIsSearching(false);
        }
    }

    return (
        <ContentLayout title="Sinergia">
            {
                loading ? (
                    <LoadingBreadcrumb />
                ) : (
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href="/">Inicio</Link>
                                </BreadcrumbLink >
                            </BreadcrumbItem >
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href={'/documents?page=1'}>Mis documentos</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {
                                parent && pathsForBreadcrumb.map((item, index) => {
                                    if (index === pathsForBreadcrumb.length - 1) {
                                        return (
                                            <>
                                                <BreadcrumbSeparator key={index + 1} />
                                                <BreadcrumbItem key={index}>
                                                    <BreadcrumbPage>
                                                        {item?.name}
                                                    </BreadcrumbPage>
                                                </BreadcrumbItem>
                                            </>
                                        )
                                    } else {
                                        return (
                                            <>
                                                <BreadcrumbSeparator key={index + 1} />
                                                <BreadcrumbItem key={index}>
                                                    <BreadcrumbLink asChild>
                                                        <Link href={`/documents/${item?.id}?page=1`}>{item?.name}</Link>
                                                    </BreadcrumbLink>
                                                </BreadcrumbItem>
                                            </>
                                        )
                                    }
                                })
                            }
                        </BreadcrumbList >
                    </Breadcrumb >)
            }

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {
                    isSearching && (
                        <div className="flex justify-center mb-8">
                            <TextShimmer
                                duration={1.2}
                                className='text-sm font-medium color:theme(colors.blue.600)] [--base-gradient-color:theme(colors.blue.200)] dark:[--base-color:theme(colors.blue.700)] dark:[--base-gradient-color:theme(colors.blue.400)]'
                            >
                                Buscando documentos...
                            </TextShimmer>
                        </div>
                    )
                }

                {
                    results.length > 0 && results.map((res, index) => (
                        <FileCard
                            key={index}
                            orderId={index}
                            onClick={handleFileClick}
                            onDelete={handleDeleteFile}
                            onMove={handleMoveFile}
                            file={res}
                            creationDate={res.FechaCarga}
                            fileName={res.NombreArchivo}
                        />
                    ))
                }
                {
                    results.length === 0 && (
                        <div className='text-center py-4 bg-white shadow-md rounded-b-md'>
                            <X className='mx-auto h-8 w-8 text-gray-400' />
                            <h3 className='mt-2 text-sm font-semibold text-gray-900'>Sin resultados</h3>
                            <p className='mt-1 text-sm mx-auto max-w-prose text-gray-500'>
                                Lo sentimos, no pudimos encontrar resultados para {' '}
                                <span className='text-red-600 font-medium'>{query}</span>.
                            </p>
                        </div>
                    )
                }
            </div>
        </ContentLayout >

    )
}
