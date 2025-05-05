"use client";

import { handleGoogleSignIn } from "@/actions";

export default function GoogleSignIn() {
  return (
    <form action={handleGoogleSignIn} className="w-full md:w-auto">
      <button
        type="submit"
        className="flex items-center justify-center gap-2 w-full md:w-auto
          bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-400/80 hover:to-blue-700/80
          text-white font-medium p-3 px-6 rounded-lg text-lg transition-all duration-300 backdrop-blur-sm
          border border-blue-400/30 shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]
          hover:scale-105"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
            fill="currentColor"
          />
        </svg>
        Sign in with Google
      </button>
    </form>
  );
}
