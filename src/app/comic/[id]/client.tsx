"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";

interface ComicPage {
  id: string;
  pageNumber: number;
  imageUrl: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string | Date;
  user: { name: string };
}

interface Comic {
  id: string;
  title: string;
  description: string;
  series: string | null;
  issueNumber: number | null;
  price: number;
  coverImage: string;
  pdfFile: string | null;
  previewPages: number;
  pages: ComicPage[];
  reviews: Review[];
}

export function ComicDetailClient({
  comic,
  previewPages,
  isOwned,
}: {
  comic: Comic;
  previewPages: ComicPage[];
  isOwned: boolean;
}) {
  const { data: session } = useSession();
  const { addItem } = useCart();
  const router = useRouter();
  const user = session?.user as any;
  const [added, setAdded] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");

  const [buyStep, setBuyStep] = useState<"hidden" | "name" | "razorpay" | "qr" | "done">("hidden");
  const [buyerName, setBuyerName] = useState("");
  const [buyError, setBuyError] = useState("");
  const [buySubmitting, setBuySubmitting] = useState(false);
  const [purchaseIds, setPurchaseIds] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [razorpayFailed, setRazorpayFailed] = useState(false);

  const handleAddToCart = async () => {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    await addItem({
      id: "",
      comicId: comic.id,
      title: comic.title,
      coverImage: comic.coverImage,
      price: comic.price,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    setBuyStep("name");
    setBuyError("");
  };

  const handleBuyNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim()) return;
    setBuySubmitting(true);
    setBuyError("");

    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comicIds: [comic.id],
          buyerName: buyerName.trim(),
          total: comic.price,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setBuyError(data.error || "Something went wrong");
        setBuySubmitting(false);
        return;
      }

      const data = await res.json();
      const ids = (data.purchases || []).map((p: any) => p.id);
      setPurchaseIds(ids);

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: comic.price }),
      });

      if (!orderRes.ok) {
        setBuyStep("qr");
        setBuySubmitting(false);
        return;
      }

      const order = await orderRes.json();
      setBuyStep("razorpay");
      setBuySubmitting(false);

      await loadRazorpayScript();
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Beyond Panels",
        description: comic.title,
        order_id: order.orderId,
        prefill: { name: buyerName },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              purchaseIds: ids,
            }),
          });
          if (verifyRes.ok) {
            setBuyStep("done");
          } else {
            setBuyError("Payment verification failed. Contact support.");
            setBuyStep("name");
          }
        },
        modal: {
          ondismiss: () => {
            setBuyStep("name");
            setBuyError("Payment cancelled. Try again.");
          },
        },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      setBuyError("Something went wrong");
      setBuySubmitting(false);
    }
  };

  function loadRazorpayScript() {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).Razorpay) { resolve(); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });
  }

  const handleConfirmPayment = async () => {
    setConfirming(true);
    try {
      await Promise.all(
        purchaseIds.map((id) =>
          fetch("/api/purchase", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          })
        )
      );
      setBuyStep("done");
    } catch {
      setBuyStep("done");
    }
  };

  const handlePreview = () => {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    router.push(`/reader/${comic.id}?preview=true`);
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comicId: comic.id, rating, comment }),
    });
    if (res.ok) {
      setReviewMsg("Review submitted!");
      setComment("");
      router.refresh();
    } else {
      const data = await res.json();
      setReviewMsg(data.error || "Failed to submit review");
    }
    setTimeout(() => setReviewMsg(""), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="comic-panel bg-white overflow-hidden">
          <div className="aspect-[3/4] bg-heroic-blue/10 flex items-center justify-center">
            {comic.coverImage ? (
              <img
                src={comic.coverImage}
                alt={comic.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-heading text-8xl text-heroic-blue/20 font-bold">
                {comic.title[0]}
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="comic-badge inline-block px-4 py-1 mb-4 font-bold text-sm">
            {comic.series || "ONE-SHOT"} {comic.issueNumber ? `#${comic.issueNumber}` : ""}
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-heroic-blue mb-4">
            {comic.title}
          </h1>
          <p className="font-heading text-lg text-gray-600 mb-6 italic">
            {comic.description}
          </p>

          <div className="flex items-center gap-4 mb-6">
            <span className="font-heading text-4xl font-bold text-comic-red">₹{comic.price}</span>
            <span className="text-sm text-gray-500">{comic.pdfFile ? "PDF file" : `${comic.pages.length} pages`}</span>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              className="bg-comic-red text-white font-bold px-6 py-3 rounded text-base comic-panel hover:bg-red-700 transition"
            >
              {added ? "✓ ADDED TO CART" : "🛒 ADD TO CART"}
            </button>

            {isOwned ? (
              <button
                onClick={() => router.push("/library")}
                className="bg-gray-600 text-white font-bold px-6 py-3 rounded text-base comic-panel cursor-pointer hover:bg-gray-700 transition"
              >
                ✓ IN YOUR LIBRARY
              </button>
            ) : (
              <button
                onClick={handleBuyNow}
                className="bg-green-700 text-white font-bold px-6 py-3 rounded text-base comic-panel hover:bg-green-800 transition"
              >
                ⚡ BUY NOW
              </button>
            )}

            <button
              onClick={handlePreview}
              className="bg-heroic-blue text-white font-bold px-6 py-3 rounded text-base comic-panel hover:bg-blue-800 transition"
            >
              👁 PREVIEW
            </button>
          </div>

          {(comic.pdfFile && previewPages.length === 0) && (
            <div className="mt-8">
              <h3 className="font-heading text-xl font-bold mb-3">Preview</h3>
              <p className="text-gray-500 text-sm">First {comic.previewPages} pages available in preview mode.</p>
            </div>
          )}
          {previewPages.length > 0 && (
            <div className="mt-8">
              <h3 className="font-heading text-xl font-bold mb-3">Preview</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {previewPages.map((page) => (
                  <div
                    key={page.id}
                    className="flex-shrink-0 w-24 h-36 bg-gray-200 border-2 border-ink-black rounded overflow-hidden"
                  >
                    {page.imageUrl ? (
                      <img
                        src={page.imageUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        p.{page.pageNumber}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buy Now Modal */}
      {buyStep !== "hidden" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="comic-panel bg-white p-8 w-full max-w-md relative">
            <button
              onClick={() => setBuyStep("hidden")}
              className="absolute top-2 right-3 text-2xl text-gray-400 hover:text-gray-700"
            >
              ×
            </button>

            {buyStep === "name" && (
              <>
                <h2 className="font-heading text-2xl font-bold text-heroic-blue text-center mb-2">
                  BUY NOW
                </h2>
                <p className="text-center text-lg font-bold text-comic-red mb-4">
                  ₹{comic.price} — {comic.title}
                </p>

                {buyError && (
                  <div className="bg-comic-red/10 border border-comic-red text-comic-red p-3 rounded mb-4 text-sm">
                    {buyError}
                  </div>
                )}

                <form onSubmit={handleBuyNameSubmit}>
                  <div className="speech-bubble p-4 mb-4 text-center">
                    <p className="font-heading text-lg text-heroic-blue">
                      Enter your name so the seller knows who bought this comic!
                    </p>
                  </div>
                  <div className="mb-4">
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
                    disabled={buySubmitting}
                    className="w-full bg-green-700 text-white font-bold py-3 rounded text-lg hover:bg-green-800 transition disabled:opacity-50"
                  >
                    {buySubmitting ? "PLEASE WAIT..." : "CONFIRM & SHOW QR →"}
                  </button>
                </form>
              </>
            )}

            {buyStep === "razorpay" && (
              <div className="text-center py-10">
                <div className="font-heading text-xl text-heroic-blue mb-4">
                  Opening payment gateway...
                </div>
                <div className="animate-pulse text-4xl">⏳</div>
              </div>
            )}

            {buyStep === "qr" && (
              <>
                <h2 className="font-heading text-2xl font-bold text-heroic-blue text-center mb-4">
                  SCAN TO PAY
                </h2>

                <div className="bg-white border-4 border-ink-black p-4 mb-4 inline-block w-full">
                  <div className="flex flex-col items-center">
                    <div className="font-heading text-lg font-bold text-heroic-blue mb-2">PHONEPE QR</div>
                    <div className="w-48 h-48 border-2 border-gray-300 flex items-center justify-center bg-white">
                      <img
                        src="/qr/phonepe.png"
                        alt="PhonePe QR"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-gray-400 text-xs p-4 text-center">Place your QR at<br><strong>public/qr/phonepe.png</strong></div>';
                        }}
                      />
                    </div>
                  </div>
                </div>

                <p className="font-heading text-lg text-center mb-2">
                  Amount: <span className="text-comic-red font-bold">₹{comic.price}</span>
                </p>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Buyer: <span className="font-bold">{buyerName}</span>
                </p>

                <p className="text-sm text-gray-600 text-center mb-4">
                  Scan with PhonePe app to pay. After payment, the seller will confirm
                  and the comic will appear in your Library.
                </p>

                <button
                  onClick={handleConfirmPayment}
                  disabled={confirming}
                  className="w-full bg-heroic-blue text-white font-bold py-3 rounded text-lg hover:bg-blue-800 transition disabled:opacity-50"
                >
                  {confirming ? "CONFIRMING..." : "I'VE PAID — DONE"}
                </button>
              </>
            )}

            {buyStep === "done" && (
              <div className="text-center">
                <div className="font-heading text-6xl mb-4">✓</div>
                <h2 className="font-heading text-2xl font-bold text-heroic-blue mb-2">
                  ORDER PLACED!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your comic is now in your Library. Start reading now!
                </p>
                <button
                  onClick={() => {
                    setBuyStep("hidden");
                    router.push("/library");
                  }}
                  className="bg-comic-red text-white font-bold px-8 py-3 rounded hover:bg-red-700 transition"
                >
                  READ IN LIBRARY
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t-4 border-ink-black pt-8">
        <h2 className="font-heading text-2xl font-bold mb-6">REVIEWS</h2>

        {session && (
          <form onSubmit={handleReview} className="comic-panel bg-white p-6 mb-8 max-w-lg">
            <h3 className="font-heading text-lg font-bold mb-4">Write a Review</h3>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-1">Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="border-2 border-ink-black rounded p-2"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {"⭐".repeat(n)}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-1">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border-2 border-ink-black rounded p-2"
                rows={3}
                required
              />
            </div>
            <button
              type="submit"
              className="bg-heroic-blue text-white font-bold px-6 py-2 rounded hover:bg-blue-800 transition"
            >
              SUBMIT REVIEW
            </button>
            {reviewMsg && (
              <p className="mt-2 text-sm text-green-700">{reviewMsg}</p>
            )}
          </form>
        )}

        {comic.reviews.length === 0 ? (
          <p className="text-gray-500 font-heading">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {comic.reviews.map((review) => (
              <div key={review.id} className="comic-panel bg-white p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">{review.user.name}</span>
                  <span>{("⭐").repeat(review.rating)}</span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
