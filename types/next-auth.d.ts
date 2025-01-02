import { User } from 'next-auth';

declare module 'next-auth/jwt' {
    interface JWT {
        id_token: string;
        access_token: string;
        expires_at: number;
        refresh_token: string;
        realm: string;
        decoded: Decoded;
        error?: 'RefreshAccessTokenError';
    }
}

declare module 'next-auth' {
    interface Session {
        access_token: string;
        id_token: string;
        roles: string[];
        error?: 'RefreshAccessTokenError';
        user: User & {
            id: UserId;
            carrera: string[];
            cedula: string;
        };
    }
}

interface Decoded {
    exp: number;
    iat: number;
    auth_time: number;
    jti: string;
    iss: string;
    aud: string;
    sub: string;
    typ: string;
    azp: string;
    session_state: string;
    acr: string;
    realm_access: RealmAccess;
    resource_access: ResourceAccess;
    scope: string;
    sid: string;
    soc_tenants: string[];
    email_verified: boolean;
    soc_roles: string[];
    name: string;
    preferred_username: string;
    given_name: string;
    family_name: string;
    carrera: string[];
    cedula: string;
}

export interface RealmAccess {
    roles: string[];
}

export interface ResourceAccess {
    account: Account;
}

export interface Account {
    roles: string[];
}