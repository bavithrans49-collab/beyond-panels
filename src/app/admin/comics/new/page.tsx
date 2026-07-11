"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function NewComicPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
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
  const [statusMsg, setStatusMsg] = useState("");

  if (status === "unauthenticated" || (status === "authenticated" && !user?.isAdmin)) {
    router.push("/");
    return null;
  }

  async function uploadFile(supabaseUrl: string, key: string, serviceRoleKey: string, bucket: string, file: File) {
    const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${key}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: file,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload failed (${res.status}): ${text}`);
    }
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${key}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return;
    setSubmitting(true);
    setStatusMsg("Fetching upload config...");

    try {
      const configRes = await fetch("/api/admin/comics/upload-config");
      if (!configRes.ok) throw new Error("Failed to get upload config");
      const { supabaseUrl, serviceRoleKey, bucket } = await configRes.json();

      const comicId = crypto.randomUUID();
      const uploadHeaders: Record<string, string> = {};

      if (coverFile) {
        setStatusMsg("Uploading cover image...");
        const ext = coverFile.name.split(".").pop() || "jpg";
        await uploadFile(supabaseUrl, `${comicId}/cover.${ext}`, serviceRoleKey, bucket, coverFile);
        uploadHeaders.coverImage = `${supabaseUrl}/storage/v1/object/public/${bucket}/${comicId}/cover.${ext}`;
      }

      let pdfUrl = null;
      if (pdfFile && pdfFile.size > 0) {
        setStatusMsg(`Uploading PDF (${(pdfFile.size / 1024 / 1024).toFixed(1)}MB)...`);
        pdfUrl = await uploadFile(supabaseUrl, `${comicId}/comic.pdf`, serviceRoleKey, bucket, pdfFile);
      }

      const pageUrls: { pageNumber: number; imageUrl: string }[] = [];
      if (pageFiles && !pdfFile) {
        for (let i = 0; i < pageFiles.length; i++) {
          const file = pageFiles[i];
          const ext = file.name.split(".").pop() || "jpg";
          setStatusMsg(`Uploading page ${i + 1}/${pageFiles.length}...`);
          const url = await uploadFile(supabaseUrl, `${comicId}/pages/page-${String(i + 1).padStart(3, "0")}.${ext}`, serviceRoleKey, bucket, file);
          pageUrls.push({ pageNumber: i + 1, imageUrl: url });
        }
      }

      setStatusMsg("Saving comic...");

      const res = await fetch("/api/admin/comics/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comicId,
          title,
          description,
          series,
          issueNumber,
          price,
          previewPages,
          coverImage: uploadHeaders.coverImage || "",
          pdfFile: pdfUrl,
          pages: pageUrls,
        }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create comic");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create comic");
    } finally {
      setSubmitting(false);
      setStatusMsg("");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 font-mono mb-6">New Comic</h1>

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
              placeholder="e.g. Beyond Panels"
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
          <label className="block text-xs font-mono font-medium text-gray-700 uppercase tracking-wide mb-1">Cover Image</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            className="w-full text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-gray-700 uppercase tracking-wide mb-1">
            PDF File (replaces individual page upload)
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
          {pdfFile && (
            <p className="text-xs text-green-600 mt-1 font-mono">PDF selected: {pdfFile.name}</p>
          )}
        </div>

        {!pdfFile && (
          <div>
            <label className="block text-xs font-mono font-medium text-gray-700 uppercase tracking-wide mb-1">
              Pages (images, ordered by filename)
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
          {submitting ? (statusMsg || "Uploading...") : "Create Comic"}
        </button>
      </form>
    </div>
  );
}
