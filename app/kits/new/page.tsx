"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function NewKitPage() {
  const router = useRouter();

  const [jd, setJd] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [days, setDays] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!jd.trim()) {
      setError("Job description is required.");
      return;
    }

    if (!companyUrl.trim()) {
      setError("Company URL is required.");
      return;
    }

    if (days < 1) {
      setError("Preparation days must be at least 1.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/kits", {
        jd: jd.trim(),
        company_url: companyUrl.trim(),
        days,
      });

      const kitId =
      response.data?.id ??
      response.data?.kit?._id ??
      response.data?.kit?.id ??
      response.data?.data?._id ??
      response.data?.data?.id;
  
    if (!kitId) {
      console.error("Create kit response:", response.data);
      throw new Error("Kit ID was not returned by the backend.");
    }

      if (!kitId) {
        throw new Error("Kit ID was not returned by the backend.");
      }

      router.push(`/kits/${kitId}`);
    } catch (error: any) {
      setError(
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to create interview kit."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-100">
        <Navbar />

        <section className="mx-auto max-w-3xl px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Interview Kit
          </h1>

          <p className="mt-2 text-gray-600">
            Enter the job description and company website to generate your
            interview preparation kit.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6 rounded-lg bg-white p-6 shadow"
          >
            <div>
              <label
                htmlFor="jd"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Job Description
              </label>

              <textarea
                id="jd"
                value={jd}
                onChange={(event) => setJd(event.target.value)}
                required
                rows={16}
                className="w-full rounded-md border border-gray-300 p-3 text-sm outline-none focus:border-blue-500"
                placeholder="Paste the complete job description..."
              />
            </div>

            <div>
              <label
                htmlFor="companyUrl"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Company URL
              </label>

              <input
                id="companyUrl"
                type="url"
                value={companyUrl}
                onChange={(event) => setCompanyUrl(event.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="https://company.com"
              />
            </div>

            <div>
              <label
                htmlFor="days"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Preparation Days
              </label>

              <input
                id="days"
                type="number"
                min={1}
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Generating Kit..." : "Generate Kit"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                disabled={loading}
                className="rounded-md border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </main>
    </ProtectedRoute>
  );
}