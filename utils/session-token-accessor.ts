import { decrypt } from '@/utils/encrypt-decrypt-auth';
import { getServerSession } from 'next-auth';

import auth from '@/lib/auth';

export async function getAccessToken() {
    const session = await getServerSession(auth);
    if (session) {
        const accessTokenDecrypted = decrypt(session.access_token);
        return accessTokenDecrypted;
    }
    return null;
}

export async function getIdToken() {
    const session = await getServerSession(auth);
    if (session) {
        const idTokenDecrypted = decrypt(session.id_token);
        return idTokenDecrypted;
    }
    return null;
}