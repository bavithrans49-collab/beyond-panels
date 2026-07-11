"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PdfViewer } from "@/components/pdf-viewer";

export default function ReaderPage(props: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [comic, setComic] = useState<{ id: string; title: string; pdfFile: string | null; preview?: boolean; previewPages?: number; pages: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paramsId, setParamsId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    props.params.then((p) => {
      if (!p.id || p.id === "undefined") {
        setError("Invalid comic ID");
        setLoading(false);
        return;
      }
      setParamsId(p.id);
    });
  }, [props.params]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status !== "authenticated" || !paramsId) return;

    const params = new URLSearchParams(window.location.search);
    const isPreview = params.get("preview") === "true";

    fetch(`/api/reader?comicId=${paramsId}&preview=${isPreview}`)
      .then((res) => {
        if (res.status === 403) {
          return res.json().then((d) => ({ error: "not_purchased", message: d.error }));
        }
        if (!res.ok) {
          return res.json().then((d) => ({ error: "fetch_error", message: d.error || res.statusText }));
        }
        return res.json();
      })
      .then((data) => {
        if (data?.error) {
          if (data.error === "not_purchased") {
            setError("You haven't purchased this comic yet.");
          } else if (data.error === "fetch_error") {
            setError(`Comic not found: ${data.message || "unknown error"}`);
          }
          setLoading(false);
          return;
        }
        if (data.pages && Array.isArray(data.pages)) {
          setComic(data);
          setCurrentPage(0);
        } else {
          setError("Invalid comic data received.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load comic. Please try again.");
        setLoading(false);
      });
  }, [status, paramsId, router]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comic) return;
    setReviewSubmitting(true);
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comicId: comic.id, rating: reviewRating, comment: reviewComment }),
    });
    setReviewSubmitting(false);
    if (res.ok) {
      setReviewMsg("Thanks for your review!");
      setTimeout(() => { setShowReview(false); setReviewMsg(""); setReviewComment(""); }, 2000);
    } else {
      const data = await res.json();
      setReviewMsg(data.error || "Failed to submit review");
      setTimeout(() => setReviewMsg(""), 3000);
    }
  };

  const handleFinishReading = () => {
    router.push("/library");
  };

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="font-heading text-2xl text-white">{error}</div>
        <button
          onClick={() => router.push("/library")}
          className="bg-heroic-blue text-white font-bold px-6 py-2 rounded hover:bg-blue-800 transition"
        >
          BACK TO LIBRARY
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="font-heading text-2xl text-white">Loading...</div>
      </div>
    );
  }

  if (!comic) return null;

  const isLastPage = currentPage === (comic.pages?.length || 0) - 1;
  const isPreview = comic.preview;

  if (comic.pdfFile) {
    return (
      <>
        <PdfViewer
          comicId={comic.id}
          title={comic.title}
          isPreview={isPreview}
          previewPages={comic.previewPages}
          onFinish={() => { if (!isPreview) setShowReview(true); }}
        />
        {showReview && reviewModal()}
      </>
    );
  }

  const pages = comic.pages || [];
  const totalPages = pages.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === " ") {
      const next = Math.min(currentPage + 1, totalPages - 1);
      setCurrentPage(next);
      if (next === totalPages - 1 && !isPreview) setShowReview(true);
    } else if (e.key === "ArrowLeft") {
      setCurrentPage((p) => Math.max(p - 1, 0));
    }
  };

  if (totalPages === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white font-heading text-2xl">No pages found for this comic.</div>
      </div>
    );
  }

  function reviewModal() {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 w-full max-w-md relative">
          <h2 className="font-heading text-2xl font-bold text-heroic-blue text-center mb-2">
            RATE THIS COMIC
          </h2>
          <p className="text-center text-gray-500 text-sm mb-6">
            What did you think of {comic?.title}?
          </p>

          {reviewMsg ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">✓</div>
              <p className="font-heading text-xl text-green-700">{reviewMsg}</p>
              <button
                onClick={handleFinishReading}
                className="mt-6 bg-heroic-blue text-white font-bold px-6 py-2 rounded hover:bg-blue-800 transition"
              >
                BACK TO LIBRARY
              </button>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit}>
              <div className="mb-4 text-center">
                <label className="block text-sm font-bold mb-2">Rating</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewRating(n)}
                      className={`text-3xl transition ${n <= reviewRating ? "" : "opacity-30"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">Review (optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded p-3 text-sm"
                  rows={3}
                  placeholder="Share your thoughts..."
                />
              </div>
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full bg-heroic-blue text-white font-bold py-3 rounded hover:bg-blue-800 transition disabled:opacity-50"
              >
                {reviewSubmitting ? "SUBMITTING..." : "SUBMIT REVIEW"}
              </button>
              <button
                type="button"
                onClick={handleFinishReading}
                className="w-full text-gray-500 text-sm py-2 mt-2 hover:text-gray-700 transition"
              >
                Skip — Back to Library
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="bg-heroic-blue text-white px-4 py-3 flex items-center justify-center">
        <h1 className="font-heading font-bold truncate">{comic.title}</h1>
        <span className="ml-4 text-sm">Page {currentPage + 1} / {totalPages}</span>
      </div>

      {isPreview && (
        <div className="bg-yellow-500 text-ink-black text-center py-2 font-bold text-sm">
          PREVIEW — Page {currentPage + 1} of {comic.previewPages}. Purchase to read the full comic.
        </div>
      )}

      <div className="flex-1 flex items-center justify-center relative">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-10 rounded hover:bg-black/70 text-2xl"
          disabled={currentPage === 0}
        >
          ‹
        </button>

        <div className="max-w-3xl w-full px-4 py-4">
          {pages[currentPage]?.imageUrl ? (
            <img
              src={pages[currentPage].imageUrl}
              alt={`Page ${currentPage + 1}`}
              className="w-full h-auto max-h-[80vh] object-contain mx-auto"
            />
          ) : (
            <div className="bg-gray-800 text-white h-[70vh] flex items-center justify-center font-heading text-4xl">
              Page {currentPage + 1}
            </div>
          )}
        </div>

        {isLastPage && !isPreview ? (
          <button
            onClick={() => setShowReview(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-golden-yellow text-ink-black px-4 py-10 rounded hover:bg-yellow-400 transition text-lg font-bold"
          >
            RATE ★
          </button>
        ) : (
          <button
            onClick={() => {
              const next = Math.min(currentPage + 1, totalPages - 1);
              setCurrentPage(next);
              if (next === totalPages - 1 && !isPreview) setShowReview(true);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-10 rounded hover:bg-black/70 text-2xl"
            disabled={currentPage === totalPages - 1}
          >
            ›
          </button>
        )}
      </div>

      <div className="bg-heroic-blue/80 px-4 py-2 flex justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`w-3 h-3 rounded-full ${
              i === currentPage ? "bg-golden-yellow" : "bg-white/30"
            }`}
          />
        ))}
      </div>

      {showReview && reviewModal()}
    </div>
  );
}
