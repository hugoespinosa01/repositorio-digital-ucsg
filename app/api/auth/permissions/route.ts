import { getAccessToken } from "@/utils/session-token-accessor";
import { getServerSession } from "next-auth";
import auth from "@/lib/auth";

export async function GET() {
    try {
        const accessToken = await getAccessToken();
        const session = await getServerSession(auth);

        if (!session) {
            return new Response(JSON.stringify({ error: 'No autorizado' }), {
                status: 401,
            });
        }

        //Primero obtengo el token RPT
        // Si el usuario autenticado se le ha negado todos los recursos
        // entonces el token RPT no se generará y generará ERROR en esta API
        const res = await fetch(`${process.env.NEXT_PUBLIC_KEYCLOAK_URL}realms/ucsg/protocol/openid-connect/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: new URLSearchParams({
                'client_id': process.env.KEYCLOAK_BACKEND_CLIENT_ID || 'repositorio-digital-backend',
                'client_secret': process.env.KEYCLOAK_CLIENT_SECRET || '',
                'grant_type': 'urn:ietf:params:oauth:grant-type:uma-ticket',
                'audience': process.env.KEYCLOAK_BACKEND_CLIENT_ID || 'repositorio-digital-backend',
            }),
        })

        if (!res.ok) {
            throw new Error(`Error al obtener el token: ${res.statusText}`);
        }

        const data = await res.json();

        const rptToken = data.access_token;

        // Luego obtengo los permisos y roles mediante Fine Grained Authorization
        const rolesResponse = await fetch(`${process.env.NEXT_PUBLIC_KEYCLOAK_URL}realms/ucsg/protocol/openid-connect/token/introspect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'token': rptToken,
                'username': session.user.email || '',
                'client_id': process.env.KEYCLOAK_BACKEND_CLIENT_ID || 'repositorio-digital-backend',
                'client_secret': process.env.KEYCLOAK_CLIENT_SECRET || '',
            }),
        });

        const permissions = await rolesResponse.json();
        
        return new Response(JSON.stringify({
            message: 'Permisos obtenidos correctamente',
            data: permissions.authorization
        }), {
            headers: {
                'Content-Type': 'application/json',
            },
            status: 200,
        })
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}