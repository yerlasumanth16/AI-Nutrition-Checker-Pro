"use client";

import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-950 text-white`}>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Critical Error</h2>
            <p className="text-zinc-400">Something went wrong globally.</p>
            <button
              onClick={() => reset()}
              className="bg-white text-black px-6 py-2 rounded-full font-semibold"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
