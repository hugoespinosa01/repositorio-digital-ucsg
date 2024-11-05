import React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function GetBackButton() {

    const router = useRouter();

    const handleBackButton = () => {
        router.back();
    }

    const handleForwardButton = () => {
        router.forward();
    }

    return (
        <div className='flex justify-start'>
            <Button onClick={handleBackButton} variant={'link'}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Atrás
            </Button>

            <Button onClick={handleForwardButton} variant={'link'}>
                <ArrowRight className="h-4 w-4 mr-1" />
                Adelante
            </Button>
        </div>
    )
}
