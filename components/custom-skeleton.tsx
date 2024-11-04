import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomSkeleton() {
    return (
        <Card>
            <CardHeader className='gap-y-1 lg:flex-row lg:items-center lg:justify-between'>
                <Skeleton className='p-4 rounded-lg shrink-0' />
                <Skeleton className='h-6 flex-grow ml-5' />
            </CardHeader>
            <CardContent>
                <Skeleton className='h-6 w-1/2' />
            </CardContent>
        </Card>
    )
}
