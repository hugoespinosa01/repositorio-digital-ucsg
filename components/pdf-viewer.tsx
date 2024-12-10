'use client';
import React from 'react'
import { DocumentViewer } from 'react-documents';

function PDFViewerComponent({ pdfUrl }: { pdfUrl: string }) { 

  return (
    <div>
      <DocumentViewer 
        queryParams="hl=Nl"
        url={pdfUrl}
        viewer='pdf'
        style={{ width: '100%', height: '95vh' }}
      ></DocumentViewer>
    </div>
  )
}

export default PDFViewerComponent;