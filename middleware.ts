import { NextRequest, NextResponse } from "next/server";
import * as jose from 'jose'

export default async function middleware(request: NextRequest) {

    const headersList = request.headers;
    const bearerHeader = headersList.get("authorization");
    const token = bearerHeader && bearerHeader.split(" ")[1];

    if (!token) {
        return NextResponse.json({ "message": "Falta token de acceso, no autorizado" }, { "status": 401 });
    }

    try {
        //Validación de token
        const publicKey = `-----BEGIN PUBLIC KEY-----\n${process.env.NEXT_PUBLIC_KEY}\n-----END PUBLIC KEY-----`;
        const publicKeyForValidation = await jose.importSPKI(publicKey, "RS256");
        const { payload } = await jose.jwtVerify(token, publicKeyForValidation);
        console.log('decodedToken', payload);

        return NextResponse.next();

    } catch (error) {
        console.error('Error al validar token, no autorizado:', error);
        return NextResponse.json({
            message: "Error al validar token, no autorizado",
        }, { "status": 403 });
    }

}

export const config = {
    matcher: '/api/:path*', // Aplica el middleware solo a las rutas de la API
};