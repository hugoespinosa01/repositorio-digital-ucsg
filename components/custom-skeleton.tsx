import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomSkeleton() {
    return (
        <Card>
            <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>
                <Skeleton className='h-6 flex-grow' />
            </CardHeader>
            <CardContent>
                <Skeleton className='h-4 flex-grow mt-4' />
                <Skeleton className='h-4 flex-grow mt-4' />
                <Skeleton className='h-4 w-1/2 mt-4' />
            </CardContent>
        </Card>
    )
}
