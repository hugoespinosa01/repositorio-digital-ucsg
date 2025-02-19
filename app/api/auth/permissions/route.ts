import { getAccessToken } from "@/utils/session-token-accessor";
import { getServerSession } from "next-auth";
import auth from "@/lib/auth";
import { redis } from "@/lib/redis";
export const dynamic = 'force-dynamic';

export async function GET() {
    try {

        const cachedPermissions = await redis.get('permissions');

        if (cachedPermissions) {
            return new Response(JSON.stringify({
                message: 'Permisos obtenidos correctamente con cache',
                data: JSON.parse(cachedPermissions)
            }), {
                headers: {
                    'Content-Type': 'application/json',
                },
                status: 200,
            });
        }

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
        const res = await fetch(`${process.env.KEYCLOAK_URL}realms/ucsg/protocol/openid-connect/token`, {
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
        const rolesResponse = await fetch(`${process.env.KEYCLOAK_URL}realms/ucsg/protocol/openid-connect/token/introspect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'token': rptToken,
                'username': session.user.email || '',
                'client_id': process.env.KEYCLOAK_BACKEND_CLIENT_ID || 'repositorio-digital-backend',
                'client_secret': process.env.KEYCLOAK_CLIENT_SECRET || '',
                //Si por si solo no puede obtener el RPT, le paso este parámetro
                'token_type_hint': 'requesting_party_token',
            }),
        });

        const permissions = await rolesResponse.json();

        if (!permissions) {
            throw new Error(`Error al obtener los permisos: ${permissions}`);
        }

        let permisos = permissions.authorization || permissions.permissions;

        // Dependiendo de como sea la respuesta, se guarda en cache el claim authorization o permissions
        if (permissions.authorization) {
            await redis.set('permissions', JSON.stringify(permissions.authorization));
        } 

        if (permissions.permissions) {
            await redis.set('permissions', JSON.stringify(permissions.permissions));
        }

        return new Response(JSON.stringify({
            message: 'Permisos obtenidos correctamente',
            data: permisos
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