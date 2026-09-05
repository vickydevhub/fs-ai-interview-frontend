import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          AI Interview Kit
        </h1>

        <p className="mt-4 text-lg text-gray-600">
          Generate structured interview preparation kits from a job
          description.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white"
          >
            Sign in
          </Link>

          <Link
            href="/register"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}