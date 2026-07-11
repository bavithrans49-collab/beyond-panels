"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface PdfViewerProps {
  comicId: string;
  title: string;
  isPreview?: boolean;
  previewPages?: number;
  onFinish?: () => void;
}

export function PdfViewer({ comicId, title, isPreview, previewPages, onFinish }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        setLoading(true);
        const previewParam = isPreview ? "?preview=true" : "";
        const url = `/api/comic-pdf/${comicId}${previewParam}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          console.error(`PDF fetch failed: ${res.status} ${errText}`);
          setError(`Failed to load PDF (${res.status})`);
          setLoading(false);
          return;
        }

        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const arrayBuffer = await res.arrayBuffer();
        const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;

        pdfDocRef.current = pdfDoc;
        const maxPages = isPreview && previewPages ? Math.min(previewPages, pdfDoc.numPages) : pdfDoc.numPages;
        setTotalPages(pdfDoc.numPages);
        setNumPages(maxPages);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          console.error("PDF load error:", e);
          setError("Failed to load PDF");
        }
        setLoading(false);
      }
    }

    loadPdf();
    return () => { cancelled = true; };
  }, [comicId, isPreview, previewPages]);

  const renderPage = useCallback(async (pdfDoc: any, pageNum: number) => {
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch {}
    }

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderTask = page.render({ canvasContext: ctx, viewport });
    renderTaskRef.current = renderTask;
    await renderTask.promise;
  }, []);

  useEffect(() => {
    if (pdfDocRef.current) {
      renderPage(pdfDocRef.current, currentPage);
    }
  }, [currentPage, loading, renderPage]);

  const goToPage = (page: number) => {
    const next = Math.min(Math.max(page, 1), numPages);
    setCurrentPage(next);
    if (next === numPages && numPages > 0 && !isPreview && onFinish) {
      onFinish();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === " ") {
      goToPage(currentPage + 1);
    } else if (e.key === "ArrowLeft") {
      goToPage(currentPage - 1);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white font-heading text-2xl">{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white font-heading text-2xl">Loading PDF...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col" tabIndex={0} onKeyDown={handleKeyDown}>
      {isPreview && (
        <div className="bg-yellow-500 text-ink-black text-center py-2 font-bold text-sm">
          PREVIEW — Showing first {numPages} of {totalPages} pages. Purchase to read the full comic.
        </div>
      )}
      <div className="bg-heroic-blue text-white px-4 py-3 flex items-center justify-center">
        <h1 className="font-heading font-bold truncate">{title}</h1>
        <span className="ml-4 text-sm">Page {currentPage} / {numPages}</span>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        <button
          onClick={() => goToPage(currentPage - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-10 rounded hover:bg-black/70 text-2xl z-10"
          disabled={currentPage === 1}
        >
          ‹
        </button>

        <div className="max-w-4xl w-full px-4 py-4 flex justify-center">
          <canvas ref={canvasRef} className="max-w-full max-h-[85vh] object-contain" />
        </div>

        {currentPage === numPages && numPages > 0 && !isPreview ? (
          <button
            onClick={() => onFinish?.()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-golden-yellow text-ink-black px-4 py-10 rounded hover:bg-yellow-400 transition text-lg font-bold z-10"
          >
            RATE ★
          </button>
        ) : (
          <button
            onClick={() => goToPage(currentPage + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-10 rounded hover:bg-black/70 text-2xl z-10"
            disabled={currentPage === numPages}
          >
            ›
          </button>
        )}
      </div>

      <div className="bg-heroic-blue/80 px-4 py-2 flex justify-center gap-2">
        {Array.from({ length: numPages }, (_, i) => (
          <button
            key={i}
            onClick={() => goToPage(i + 1)}
            className={`w-3 h-3 rounded-full ${
              i + 1 === currentPage ? "bg-golden-yellow" : "bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
