import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <h2 className="text-4xl font-bold mb-4">404 - Not Found</h2>
      <p className="text-zinc-400 mb-8">Could not find the requested resource</p>
      <Link
        href="/"
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-semibold"
      >
        Return Home
      </Link>
    </div>
  );
}
