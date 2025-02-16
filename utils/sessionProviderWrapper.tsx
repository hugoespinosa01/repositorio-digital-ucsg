'use client';
import React from "react";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

const SessionProviderWrapper = ({ children }: { children: ReactNode }) => {
    return (
        <SessionProvider refetchOnWindowFocus={false}>
            {children}
        </SessionProvider>
    );
}

export default SessionProviderWrapper;