'use client';

import { createContext } from 'react';
import { useState, useEffect } from 'react';
import Keycloak from 'keycloak-js'

export const AuthContext = createContext<{
    keycloak: Keycloak | null;
    handleLogout: () => void;
}>({
    keycloak: null,
    handleLogout: () => { }
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [keycloak, setKeycloak] = useState<Keycloak | null>(null);

    useEffect(() => {
        const initKeycloak = async () => {
            const keycloakInstance = new Keycloak(keycloakOptions);
            try {
                await keycloakInstance.init({ onLoad: 'login-required' });
                setKeycloak(keycloakInstance);
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
            handleLogout
        }}>
            {children}
        </AuthContext.Provider>
    )
}