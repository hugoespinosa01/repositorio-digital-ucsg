import { getAccessToken } from "@/utils/session-token-accessor";

export async function POST() {
    try {
        const accessToken = await getAccessToken();

        // Primero obtengo el token RPT
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
            throw new Error(`Error al obtener el archivo: ${res.statusText}`);
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
                'username': 'hespinosa',
                'client_id': process.env.KEYCLOAK_BACKEND_CLIENT_ID || 'repositorio-digital-backend',
                'client_secret': process.env.KEYCLOAK_CLIENT_SECRET || '',
            }),
        });

        const permissions = await rolesResponse.json();

        console.log(permissions.authorization);
        
        return new Response(JSON.stringify({
            message: 'Roles obtenidos correctamente',
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