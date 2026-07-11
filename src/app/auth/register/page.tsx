"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code" | "details">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [completing, setCompleting] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStep("code");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send code");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (res.ok) {
        setStep("details");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid code");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setVerifying(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCompleting(true);
    try {
      const res = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      if (res.ok) {
        await signIn("credentials", { email, password, redirect: false });
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="comic-panel bg-white p-8 w-full max-w-md">
        <h1 className="font-heading text-3xl font-bold text-heroic-blue text-center mb-6">
          SIGN UP
        </h1>

        <div className="flex justify-center gap-2 mb-6">
          {["email", "code", "details"].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  ["email", "code", "details"].indexOf(step) >= i
                    ? "bg-heroic-blue text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {["email", "code", "details"].indexOf(step) > i ? "✓" : i + 1}
              </div>
              {i < 2 && <div className={`w-8 h-0.5 ${["email", "code", "details"].indexOf(step) > i ? "bg-heroic-blue" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-comic-red/10 border border-comic-red text-comic-red p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Enter your email address. A verification code will be sent to it.
            </p>
            <div>
              <label className="block text-sm font-bold mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-ink-black rounded p-2"
                placeholder="you@example.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-heroic-blue text-white font-bold py-3 rounded hover:bg-blue-800 transition disabled:opacity-50"
            >
              {sending ? "SENDING..." : "SEND VERIFICATION CODE"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              A verification code was sent to <strong>{email}</strong>
            </p>
            <div>
              <label className="block text-sm font-bold mb-1">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border-2 border-ink-black rounded p-2 text-center text-2xl tracking-widest"
                maxLength={6}
                placeholder="000000"
                required
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-heroic-blue text-white font-bold py-3 rounded hover:bg-blue-800 transition disabled:opacity-50"
            >
              {verifying ? "VERIFYING..." : "VERIFY CODE"}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-sm text-heroic-blue underline text-center"
            >
              Change email
            </button>
          </form>
        )}

        {step === "details" && (
          <form onSubmit={handleComplete} className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Email verified! Now set up your account.
            </p>
            <div>
              <label className="block text-sm font-bold mb-1">Account Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-2 border-ink-black rounded p-2"
                placeholder="Display name"
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
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={completing}
              className="w-full bg-heroic-blue text-white font-bold py-3 rounded hover:bg-blue-800 transition disabled:opacity-50"
            >
              {completing ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
            </button>
          </form>
        )}

        <p className="text-center mt-4 text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-heroic-blue font-bold underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
