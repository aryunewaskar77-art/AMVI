"use client";

import { useState, useTransition, FormEvent } from "react";
import { X, UploadCloud, Loader2, Sparkles } from "lucide-react";
import { createArtworkAction } from "@/app/actions/admin";

interface AddArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArtworkCreated?: () => void;
}

export function AddArtworkModal({
  isOpen,
  onClose,
  onArtworkCreated,
}: AddArtworkModalProps) {
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [medium, setMedium] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!imageFile) {
      setErrorMessage("Please select an artwork photograph to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("artist_name", artistName);
    formData.append("medium", medium);
    formData.append("dimensions", dimensions);
    formData.append("price", price);
    formData.append("quantity", quantity);
    formData.append("description", description);
    formData.append("image", imageFile);


    startTransition(async () => {
      try {
        const res = await createArtworkAction(formData);

        if (!res.success) {
          setErrorMessage(res.message || "Failed to create artwork.");
          return;
        }

        // Reset Form
        setTitle("");
        setArtistName("");
        setMedium("");
        setDimensions("");
        setPrice("");
        setQuantity("1");
        setDescription("");
        setImageFile(null);
        setPreviewUrl(null);


        onArtworkCreated?.();
        onClose();
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while publishing the artwork."
        );
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <h2 className="font-serif text-xl font-medium text-zinc-950">
                Catalog New Masterpiece
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Upload high-resolution photography and register physical provenance details.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
              High-Resolution Artwork Image *
            </label>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 p-6 text-center hover:border-zinc-400 transition-colors">
              <UploadCloud className="h-8 w-8 text-zinc-400 mb-1" />
              <label className="cursor-pointer text-xs font-semibold text-zinc-900 underline">
                <span>Select master photograph</span>
                <input
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <p className="mt-1 text-[11px] text-zinc-400">
                JPEG, PNG, or WebP up to 10MB
              </p>
              {imageFile && (
                <p className="mt-2 text-xs font-medium text-emerald-700">
                  {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {previewUrl && (
              <div className="mt-3 relative h-32 w-28 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Artwork Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Artwork Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Celestial Ganesha"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Artist Name *
              </label>
              <input
                type="text"
                required
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="e.g. R. Ramanathan"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Medium / Lineage *
              </label>
              <input
                type="text"
                required
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="e.g. 22K Gold Foil on Teakwood"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Dimensions *
              </label>
              <input
                type="text"
                required
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g. 24 x 18 inches"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Acquisition Price (₹ INR) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 64000"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Edition / Inventory Stock Units *
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 1 (Unique) or 5"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none"
              />
            </div>


            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Curatorial Commentary / Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide artistic lineage, historical technique, pigments, and archival details..."
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-300 px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-700 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-amber-900 transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing & Warming Cache...</span>
                </>
              ) : (
                <span>Publish to Public Gallery</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
