"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function EditComicPage(props: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const [comicId, setComicId] = useState<string | null>(null);
  const [comic, setComic] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [series, setSeries] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [price, setPrice] = useState("");
  const [previewPages, setPreviewPages] = useState("3");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pageFiles, setPageFiles] = useState<FileList | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    props.params.then((p) => setComicId(p.id));
  }, [props.params]);

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !user?.isAdmin)) {
      router.push("/");
      return;
    }
    if (status !== "authenticated" || !comicId) return;

    fetch(`/api/admin/comics/${comicId}`)
      .then((res) => res.json())
      .then((data) => {
        setComic(data);
        setTitle(data.title);
        setDescription(data.description);
        setSeries(data.series || "");
        setIssueNumber(data.issueNumber?.toString() || "");
        setPrice(data.price.toString());
        setPreviewPages(data.previewPages?.toString() || "3");
      });
  }, [status, comicId, router, user]);

  if (status === "loading" || !comic) {
    return <div className="text-center py-20 font-mono text-gray-500">Loading...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("series", series);
      formData.append("issueNumber", issueNumber);
      formData.append("price", price);
      formData.append("previewPages", previewPages);
      if (coverFile) formData.append("cover", coverFile);
      if (pdfFile) formData.append("pdf", pdfFile);
      if (pageFiles && !pdfFile) {
        for (let i = 0; i < pageFiles.length; i++) {
          formData.append("pages", pageFiles[i]);
        }
      }

      const res = await fetch(`/api/admin/comics/${comicId}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update comic");
      }
    } catch {
      alert("Failed to update comic");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 font-mono mb-6">Edit Comic</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl space-y-5">
        <div>
          <label className="block text-xs font-mono font-medium text-gray-700 uppercase tracking-wide mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-gray-700 uppercase tracking-wide mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-medium text-gray-700 uppercase tracking-wide mb-1">Series</label>
            <input
              type="text"
              value={series}
              onChange={(e) => setSeries(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-medium text-gray-700 uppercase tracking-wide mb-1">Issue #</label>
            <input
              type="number"
              value={issueNumber}
              onChange={(e) => setIssueNumber(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-medium text-gray-700 uppercase tracking-wide mb-1">Price (₹) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-medium text-gray-700 uppercase tracking-wide mb-1">Preview Pages</label>
            <input
              type="number"
              value={previewPages}
              onChange={(e) => setPreviewPages(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-gray-700 uppercase tracking-wide mb-1">
            Cover Image {comic.coverImage ? "(current uploaded)" : ""}
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            className="w-full text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-gray-700 uppercase tracking-wide mb-1">
            PDF File {comic.pdfFile ? "(current PDF uploaded)" : ""}
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              setPdfFile(e.target.files?.[0] || null);
              setPageFiles(null);
            }}
            className="w-full text-sm font-mono"
          />
          {comic.pdfFile && (
            <p className="text-xs text-blue-600 mt-1 font-mono">Comic currently uses PDF. Uploading a new PDF will replace it.</p>
          )}
          {pdfFile && (
            <p className="text-xs text-green-600 mt-1 font-mono">New PDF selected: {pdfFile.name}</p>
          )}
        </div>

        {!pdfFile && !comic.pdfFile && (
          <div>
            <label className="block text-xs font-mono font-medium text-gray-700 uppercase tracking-wide mb-1">
              Pages {comic.pages?.length ? `(current: ${comic.pages.length} pages)` : ""}
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setPageFiles(e.target.files)}
              className="w-full text-sm font-mono"
            />
            {pageFiles && (
              <p className="text-xs text-gray-500 mt-1 font-mono">{pageFiles.length} file(s) selected</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white font-medium py-2.5 rounded text-sm hover:bg-blue-700 transition disabled:opacity-50 font-mono"
        >
          {submitting ? "Updating..." : "Update Comic"}
        </button>
      </form>
    </div>
  );
}
