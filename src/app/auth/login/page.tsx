"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="comic-panel bg-white p-8 w-full max-w-md">
        <h1 className="font-heading text-3xl font-bold text-heroic-blue text-center mb-6">
          LOGIN
        </h1>

        {error && (
          <div className="bg-comic-red/10 border border-comic-red text-comic-red p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-ink-black rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-ink-black rounded p-2"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-heroic-blue text-white font-bold py-3 rounded hover:bg-blue-800 transition"
          >
            LOGIN
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-heroic-blue font-bold underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
