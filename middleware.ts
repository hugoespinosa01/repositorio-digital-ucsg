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
        const username = payload?.preferred_username as string;
      
        // const body = new URLSearchParams();
        // // body.append('token', token);
        // body.append('client_id', process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || '');
        // body.append('client_secret', process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET || '');
        // // body.append('username', username);
        // body.append('grant_type', 'urn:ietf:params:oauth:grant-type:token-exchange');
        // body.append('audience', process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || '');

        // const getRpt = await fetch(`${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/token/introspect`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/x-www-form-urlencoded',
        //         'Authorization': `Bearer ${token}`
        //     },
        //     body: body.toString(),
        // });

        // const rpt = await getRpt.json();

        // console.log('RPT:', rpt);
        
        
        // const response = await fetch(`${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/token/introspect`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/x-www-form-urlencoded',
        //         'Authorization': `Bearer ${token}`
        //     },
        //     body: body.toString()
        // });

        // const data = await response.json();

        // console.log('Data:', data);
        
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