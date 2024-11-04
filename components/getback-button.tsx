import React from 'react'
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function GetBackButton() {

    const router = useRouter();

    const handleBackButton = () => {
        router.back();
    }

    return (
        <div className='flex justify-start'>
            <Button onClick={handleBackButton} variant={'link'}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
            </Button>
        </div>
    )
}
