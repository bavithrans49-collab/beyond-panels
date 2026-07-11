"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const { items, total, clearCart, loading } = useCart();
  const router = useRouter();
  const [buyerName, setBuyerName] = useState("");
  const [step, setStep] = useState<"name" | "qr" | "done">("name");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!loading && items.length === 0 && step !== "done") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="speech-bubble inline-block px-8 py-4 text-xl font-heading">
          Nothing to checkout!
        </div>
      </div>
    );
  }

  const handleSubmitName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comicIds: items.map((i) => i.comicId),
          buyerName: buyerName.trim(),
          total,
        }),
      });

      if (res.ok) {
        setStep("qr");
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = async () => {
    await clearCart();
    setStep("done");
  };

  if (step === "name") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="comic-panel bg-white p-8 w-full max-w-md">
          <h1 className="font-heading text-3xl font-bold text-heroic-blue text-center mb-2">
            CHECKOUT
          </h1>
          <div className="text-center mb-6">
            <span className="font-heading text-2xl font-bold text-comic-red">₹{total}</span>
            <p className="text-sm text-gray-500 mt-1">{items.length} item(s)</p>
          </div>

          {error && (
            <div className="bg-comic-red/10 border border-comic-red text-comic-red p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitName}>
            <div className="speech-bubble p-4 mb-6 text-center">
              <p className="font-heading text-lg text-heroic-blue">
                Enter your name so the seller knows who bought these comics!
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold mb-1">Your Name</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full border-2 border-ink-black rounded p-3 text-lg"
                placeholder="Enter your name..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-comic-red text-white font-bold py-3 rounded text-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {submitting ? "PLEASE WAIT..." : "CONFIRM →"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="comic-panel bg-white p-8 w-full max-w-md text-center">
          <h1 className="font-heading text-3xl font-bold text-heroic-blue mb-4">
            SCAN TO PAY
          </h1>

          <div className="bg-white border-4 border-ink-black p-4 mb-4 inline-block">
            <div className="w-48 h-48 bg-white flex items-center justify-center">
              <div className="text-center">
                <div className="font-heading text-lg font-bold text-heroic-blue mb-2">PHONEPE QR</div>
                <div className="w-32 h-32 mx-auto bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect x="5" y="5" width="40" height="40" fill="#1C3D5B" rx="3" />
                    <rect x="55" y="5" width="40" height="40" fill="#1C3D5B" rx="3" />
                    <rect x="5" y="55" width="40" height="40" fill="#1C3D5B" rx="3" />
                    <rect x="30" y="30" width="15" height="15" fill="white" />
                    <rect x="55" y="30" width="15" height="15" fill="white" />
                    <rect x="30" y="55" width="15" height="15" fill="white" />
                    <rect x="55" y="55" width="15" height="15" fill="#1C3D5B" rx="2" />
                    <rect x="75" y="55" width="15" height="15" fill="#1C3D5B" rx="2" />
                    <rect x="55" y="75" width="15" height="15" fill="#1C3D5B" rx="2" />
                    <rect x="75" y="75" width="15" height="15" fill="white" rx="2" />
                  </svg>
                </div>
                <p className="text-xs text-gray-400 mt-1">[Placeholder — replace with your QR]</p>
              </div>
            </div>
          </div>

          <p className="font-heading text-lg mb-2">
            Amount: <span className="text-comic-red font-bold">₹{total}</span>
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Buyer: <span className="font-bold">{buyerName}</span>
          </p>

          <p className="text-sm text-gray-600 mb-6">
            Scan with PhonePe app to pay. After payment, the seller will confirm
            and your comics will appear in your Library.
          </p>

          <button
            onClick={handleDone}
            className="w-full bg-heroic-blue text-white font-bold py-3 rounded text-lg hover:bg-blue-800 transition"
          >
            I&apos;VE PAID — DONE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="font-heading text-6xl mb-4">✓</div>
        <h1 className="font-heading text-3xl font-bold text-heroic-blue mb-2">
          ORDER PLACED!
        </h1>
        <p className="text-gray-600 mb-6">
          Your comics will appear in your Library once the seller confirms payment.
        </p>
        <button
          onClick={() => router.push("/library")}
          className="bg-heroic-blue text-white font-bold px-8 py-3 rounded comic-panel hover:bg-blue-800 transition"
        >
          GO TO LIBRARY
        </button>
      </div>
    </div>
  );
}
