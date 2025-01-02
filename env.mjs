import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
    server: {
        // This is optional because it's only used in development.
        // See https://next-auth.js.org/deployment.
        NEXTAUTH_URL: z.string().url().optional(),
        NEXTAUTH_SECRET: z.string().optional(),
        KEYCLOAK_BASE_URL: z.string().min(1),
        KEYCLOAK_CLIENT_ID: z.string().min(1),
        KEYCLOAK_CLIENT_SECRET: z.string().min(1),
        API_URL: z.string().min(1),
    },
    client: {
        NEXT_PUBLIC_APP_URL: z.string().min(1),
    },
    runtimeEnv: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        API_URL: process.env.API_URL,
        KEYCLOAK_BASE_URL: process.env.KEYCLOAK_BASE_URL,
        KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
        KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
    },
});