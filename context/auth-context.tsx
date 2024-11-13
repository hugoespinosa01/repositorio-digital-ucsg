'use client';

import { createContext } from 'react';
import { useState, useEffect } from 'react';
import Keycloak from 'keycloak-js'

export const AuthContext = createContext<{
    keycloak: Keycloak | null;
    handleLogout: () => void;
    token: string | null;
}>({
    keycloak: null,
    handleLogout: () => { },
    token: null
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const initKeycloak = async () => {
            const keycloakInstance = new Keycloak(keycloakOptions);
            try {
                await keycloakInstance.init({ onLoad: 'login-required' });
                setKeycloak(keycloakInstance);
                
                if (keycloakInstance.token) {
                    setToken(keycloakInstance.token);
                }
            } catch (error) {
                console.error(error)
            }
        }
        initKeycloak();
    }, [])

    const handleLogout = () => {
        if (keycloak) {
            keycloak.logout();
        }
    }

    const keycloakOptions = {
        url: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? '',
        realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? '',
        clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? '',
    }

    return (
        <AuthContext.Provider value={{
            keycloak,
            handleLogout,
            token
        }}>
            {children}
        </AuthContext.Provider>
    )
}