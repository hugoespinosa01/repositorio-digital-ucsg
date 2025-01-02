'use client';

import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { useEffect, useContext } from "react";
import { AuthContext } from "@/context/auth-context";
import { useRouter } from "next/navigation";

export default function DemoLayout({ children}: {
  children: React.ReactNode;
}) {

  // const { keycloak, setToken } = useContext(AuthContext);
  // const router = useRouter();

  // useEffect(() => {

  //   async function checkIfAuthenticated() {
  //     if (!keycloak?.authenticated) {
  //       const loginUrl = await keycloak?.createLoginUrl();
  //       console.log('login', loginUrl);
  //       if (loginUrl) {
  //         router.push(loginUrl);
  //       }
  //     }
  //   }

  //   async function checkExpiredToken() {
  //     if (keycloak?.isTokenExpired(30)) {
  //       await keycloak?.updateToken(60);
  //       if (keycloak?.token) {
  //         setToken(keycloak?.token);
  //       }
  //     }
  //   }

  //   checkIfAuthenticated();
  //   checkExpiredToken();

  // }, [keycloak]);



  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}