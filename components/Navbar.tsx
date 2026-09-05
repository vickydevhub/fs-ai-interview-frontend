"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function Navbar() {
  const router = useRouter();

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      router.push("/login");
    }
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/dashboard"
          className="text-xl font-bold text-gray-900"
        >
          AI Interview Kit
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-gray-700 hover:text-blue-600"
          >
            Dashboard
          </Link>

          <Link
            href="/kits/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            New Kit
          </Link>

          <button
            onClick={logout}
            className="text-sm text-gray-700 hover:text-red-600"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}