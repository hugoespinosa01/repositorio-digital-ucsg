import React from 'react'
import { AspectRatio } from './ui/aspect-ratio';

type Props = {
    pdfUrl: string;
}

function PDFViewer(pdfUrl: Props) {
  return (
    <AspectRatio
        ratio={3/4}
        className='bg-muted'
    >
        <iframe
            src={`https://docs.google.com/gview?url=${pdfUrl}&embedded=true`}
            className='w-full h-full'
        >

        </iframe>
    </AspectRatio>
  )
}

export default PDFViewer;