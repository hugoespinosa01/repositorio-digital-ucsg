import { getIdToken } from '@/utils/session-token-accessor';
import { getServerSession } from 'next-auth';
import auth from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(auth);

    if (session) {

        const idToken = await getIdToken();

        // this will log out the user on Keycloak side
        var url =`${process.env.NEXT_PUBLIC_KEYCLOAK_URL}realms/ucsg/protocol/openid-connect/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL || '')}`;

        try {
            await fetch(url, { method: 'GET' });
        } catch (err) {
            console.error(err);
            return new Response("Error", { status: 500 });
        }
    }
    return new Response("Logged out", { status: 200 });
}