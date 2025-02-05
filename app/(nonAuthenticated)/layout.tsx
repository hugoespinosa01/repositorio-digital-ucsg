'use client';

import { Suspense } from "react";

export default function Layout({ children }: {
    children: React.ReactNode;
}) {

    return (
        <div>
            <Suspense>
                {children}
            </Suspense>
        </div>
    );
}