import { encrypt } from '@/utils/encrypt-decrypt-auth';
import { jwtDecode } from 'jwt-decode';
import type { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';

async function refreshAccessToken(token: JWT) {

    const resp = await fetch(
        `${process.env.KEYCLOAK_URL}realms/ucsg/protocol/openid-connect/token`,
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.KEYCLOAK_BACKEND_CLIENT_ID || '',
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET || '',
                grant_type: 'refresh_token',
                refresh_token: token.refresh_token,
            }),
            method: 'POST',
        },
    );
    const refreshToken = await resp.json();
    if (!resp.ok) throw refreshToken;

    return {
        ...token,
        access_token: refreshToken.access_token,
        decoded: jwtDecode(refreshToken.access_token),
        id_token: refreshToken.id_token,
        expires_at: Math.floor(Date.now() / 1000) + refreshToken.expires_in,
        refresh_token: refreshToken.refresh_token,
    } as JWT;
}

const auth: NextAuthOptions = {
    providers: [
        KeycloakProvider({
            clientId: process.env.KEYCLOAK_BACKEND_CLIENT_ID || '',
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
            issuer: process.env.KEYCLOAK_ISSUER || '',
            client: {
                token_endpoint_auth_method: 'client_secret_post'
            }
        }),
    ],
    cookies: {
        pkceCodeVerifier: {
            name: "next-auth.pkce.code_verifier",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production"
            }
        }
    },
    callbacks: {
        async jwt({ token, account }) {
            const nowTimeStamp = Math.floor(Date.now() / 1000);


            if (account) {
                // Disponible solo la primera vez el callback es llamado en una nueva sesión
                token.decoded = jwtDecode(account.access_token ?? '');
                token.access_token = account.access_token ?? '';
                token.id_token = account.id_token ?? '';
                token.expires_at = account.expires_at ?? 0;
                token.refresh_token = account.refresh_token ?? '';
                return token;
            } else if (nowTimeStamp < token.expires_at) {
                // Si el token no ha expirado, devolverlo
                return token;
            } else {
                // Si el token ha expirado, intentar refrescarlo
                try {
                    console.log('Refreshing access token');
                    const refreshedToken = await refreshAccessToken(token);
                    console.log('Access token refreshed');
                    return refreshedToken;
                } catch (error) {
                    console.error('Error refreshing access token', error);
                    return { ...token, error: 'RefreshAccessTokenError' };
                }
            }
        },
        async session({ session, token }) {
            session.access_token = encrypt(token.access_token);
            session.id_token = encrypt(token.id_token);
            session.error = token.error;
            session.user.id = token.sub;
            session.user.name = token.name;
            session.user.email = token.email;
            //Guardo también la carrera
            session.user.carrera = token.decoded.carrera;
            session.user.cedula = token.decoded.cedula;
            return session;
        },
    },
    pages: {
        error: '/unAuthorized',
    }
};

export default auth;