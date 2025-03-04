'use client';
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GetBackButton from '../getback-button';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function InfoPage() {


    return (
        <div>
            <Card className='p-5 mt-5'>
                <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>
                    <CardTitle>
                        <p className="text-2xl font-bold mb-4">Información del sistema</p>
                        <GetBackButton />
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="container mx-auto px-4 space-y-1">
                        <p>Este producto ha sido diseñado y desarrollado por Hugo Espinosa Martínez y Denisse Ibarra Bermello para la
                            Facultad de Ingeniería de la Universidad Católica de Santiago de Guayaquil. Todos los derechos reservados.
                        </p>
                        <p className='mt-2'><strong>Manuales y guías de usuario:</strong></p>
                        <ul className='space-y-2'>
                            <li>
                                <Link
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="https://www.ucsg.edu.ec/ingenieria/"
                                    className="text-primary underline underline-offset-4"
                                >Manual de usuario
                                    <ArrowUpRight className="h-4 w-4 inline-block" />
                                </Link>
                            </li>
                            <li>
                                <Link
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="https://cuucsgedu-my.sharepoint.com/:b:/g/personal/hugo_espinosa01_cu_ucsg_edu_ec/EUM3V6oW2k5AgJ8n8nESsTEBvj4WMxJCESfuN240ewmbag?e=pu6XHR"
                                    className="text-primary underline underline-offset-4"
                                >Manual técnico de Keycloak
                                    <ArrowUpRight className="h-4 w-4 inline-block" />
                                </Link>
                            </li>
                            <li>
                                <Link
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="https://learn.microsoft.com/en-us/azure/?product=popular"
                                    className="text-primary underline underline-offset-4"
                                >Documentación de Microsoft Azure
                                    <ArrowUpRight className="h-4 w-4 inline-block" />
                                </Link>
                            </li>

                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
