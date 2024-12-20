import { handleBootrstrapping } from "@/lib/pinecone";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { targetIndex, filename } = await req.json();
    
    try {
        await handleBootrstrapping(targetIndex, filename);

        return NextResponse.json({
            message: "Proceso de bootrstrapping exitoso"
        }, { status: 200 });
    } catch( err ) {
        return NextResponse.json({
            message: "Error en el proceso de bootrstrapping",
            error: err
        }, { status: 500 });
    }
  
}