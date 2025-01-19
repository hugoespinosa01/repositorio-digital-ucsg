import React, { Fragment } from 'react'
import { Skeleton } from '../ui/skeleton';

export default function LoadingFilePage() {


    return (
        <div className='grid grid-cols-2 md:grid-cols-2 gap-6'>
            <Fragment>
                <div className="container mx-auto p-4 sm:block">
                    <Skeleton className='p-12 w-full' />
                </div>

                <div className='sm:block'>
                <Skeleton className='h-6 w-full mb-4 mt-4' />
                <Skeleton className='h-6 w-full' />
                </div>
            </Fragment>
        </div>

    )
}
