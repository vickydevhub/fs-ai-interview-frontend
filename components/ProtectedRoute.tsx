"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuth } from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function verify() {
      try {
        const authenticated = await checkAuth();

        if (!authenticated) {
          router.replace("/login");
          return;
        }

        setChecking(false);
      } catch {
        router.replace("/login");
      }
    }

    verify();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">
          Checking authentication...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}