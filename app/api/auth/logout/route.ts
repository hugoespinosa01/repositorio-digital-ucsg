import { getIdToken } from '@/utils/session-token-accessor';
import { getServerSession } from 'next-auth';
import auth from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(auth);

    if (session) {
        const idToken = await getIdToken();

        // this will log out the user on Keycloak side
        var url =`${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/protocol/openid-connect/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_KEYCLOAK_URL || '')}`;

        try {
            await fetch(url, { method: 'GET' });
        } catch (err) {
            console.error(err);
            return new Response();
        }
    }
    return new Response();
}