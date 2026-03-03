"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="max-w-md w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Something went wrong!</h2>
          <p className="text-zinc-400 text-sm">
            We encountered an unexpected error. Please try again later.
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-xs text-red-400 font-mono bg-black/50 p-2 rounded mt-2">
              {error.message}
            </p>
          )}
        </div>

        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
