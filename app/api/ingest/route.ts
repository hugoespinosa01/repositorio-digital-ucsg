import { handleBootrstrapping } from "@/lib/pinecone";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { targetIndex } = await req.json();

    await handleBootrstrapping(targetIndex);

    return NextResponse.json({
        message: "Proceso de bootrstrapping exitoso"
    }, { status: 200 });
}