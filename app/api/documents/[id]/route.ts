import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    return NextResponse.json({ message: 'Hello from the documents route' });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Error fetching documents' }, { status: 500 });
  }
}

export async function DELETE() {
    try {
        await prisma?.carpeta.delete(
          {
            where: {
              Id: 1,
            }
          }
        )
        return NextResponse.json({ message: 'Document deleted' });
    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json({ error: 'Error deleting document' }, { status: 500 });
    }
}

export async function PUT() {
    try {
        return NextResponse.json({ message: 'Document updated' });
    } catch (error) {
        console.error('Error updating document:', error);
        return NextResponse.json({ error: 'Error updating document' }, { status: 500 });
    }
}

