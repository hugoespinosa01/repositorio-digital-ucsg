import CustomSkeleton from '@/components/custom-skeleton'
import React from 'react'

export default function LoadingDocuments() {

  const array = new Array(6).fill(null);

  return (


    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {array.map((_, x) => (
        <CustomSkeleton key={x} />
      ))}
    </div>



  )
}
