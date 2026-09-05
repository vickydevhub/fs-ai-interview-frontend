"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { InterviewKit } from "@/types";
import Loading from "@/components/Loading";
import ErrorMessage from "@/components/ErrorMessage";

export default function DashboardPage() {
  const [kits, setKits] = useState<InterviewKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadKits() {
    try {
      const response = await api.get("/kits");

      const data = response.data;
      setKits(data.kits ?? data);
    } catch (error: any) {
      setError(
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          "Unable to load interview kits"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKits();
  }, []);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-100">
        <Navbar />

        <section className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Interview Kits
              </h1>

              <p className="mt-1 text-gray-600">
                Manage your interview preparation kits.
              </p>
            </div>

            <Link
              href="/kits/new"
              className="rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
            >
              Create Kit
            </Link>
          </div>

          {loading && (
            <div className="mt-8 rounded-lg bg-white shadow">
                <Loading message="Loading interview kits..." />
            </div>
            )}

            {error && (
            <div className="mt-8">
                <ErrorMessage message={error} />
            </div>
            )}

          {!loading && !error && kits.length === 0 && (
            <div className="mt-8 rounded-lg bg-white p-10 text-center shadow">
              <h2 className="text-xl font-semibold text-gray-900">
                No interview kits yet
              </h2>

              <p className="mt-2 text-gray-600">
                Create your first interview preparation kit.
              </p>

              <Link
                href="/kits/new"
                className="mt-5 inline-block rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white"
              >
                Create Kit
              </Link>
            </div>
          )}

          {!loading && !error && kits.length > 0 && (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {kits.map((kit) => {
                const id = kit._id ?? kit.id;

                return (
                  <div
                    key={id}
                    className="rounded-lg bg-white p-6 shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {kit.role.title || kit.source.role}
                        </h2>

                        <p className="mt-1 text-sm text-gray-600">
                          {kit.source.company}
                        </p>
                      </div>

                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                        {kit.schedule.days_available} days
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                          Questions
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {kit.questions.length}
                        </p>
                      </div>

                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                          Flashcards
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {kit.flashcards.length}
                        </p>
                      </div>
                    </div>

                    {kit.createdAt && (
                      <p className="mt-4 text-xs text-gray-500">
                        Created{" "}
                        {new Date(
                          kit.createdAt
                        ).toLocaleDateString()}
                      </p>
                    )}

                    <Link
                      href={`/kits/${id}`}
                      className="mt-5 block rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                    >
                      View Kit
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}