"use client";

import { useState, useEffect, useTransition, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  QrCode,
  Building2,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { submitPaymentProofAction, cancelOrderAction } from "@/app/actions/checkout";
import { useCartStore } from "@/store/useCartStore";
import { GALLERY_UPI_CONFIG } from "@/lib/upi";
import type { Order, Artwork } from "@/types/database.types";

interface PaymentGatewayViewProps {
  order: Order;
  items: Artwork[];
  upiUrl: string;
  qrSvgDataUrl: string;
  initialRemainingSeconds?: number;
}

export function PaymentGatewayView({
  order,
  items,
  upiUrl,
  qrSvgDataUrl,
  initialRemainingSeconds = 600,
}: PaymentGatewayViewProps) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(initialRemainingSeconds);
  const [paymentMode, setPaymentMode] = useState<"upi" | "bank">("upi");
  const [utr, setUtr] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(order.status === "cancelled");

  // 10-Minute Lock Countdown Timer
  useEffect(() => {
    if (secondsLeft <= 0 || isCancelled) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, isCancelled]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isExpired = secondsLeft === 0;

  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(order.total_amount));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setReceiptFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmitProof = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!utr || utr.trim().length < 6) {
      setErrorMessage("Please enter a valid 12-digit UPI UTR or bank reference number.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("orderId", order.id);
      formData.append("transactionRef", utr.trim());
      if (receiptFile) {
        formData.append("receiptImage", receiptFile);
      }

      const result = await submitPaymentProofAction(formData);

      if (!result.success) {
        setErrorMessage(result.message || "Failed to submit verification proof.");
        return;
      }

      // Ensure bag is empty and order is recorded for collector order history
      try {
        useCartStore.getState().clearCart();
        const existing = JSON.parse(localStorage.getItem("amvi_collector_orders") || "[]");
        if (!existing.includes(order.id)) {
          localStorage.setItem("amvi_collector_orders", JSON.stringify([order.id, ...existing]));
        }
      } catch {
        // ignore
      }

      router.push(`/orders/${order.id}`);
    });
  };

  const handleReleaseReservation = async () => {
    const sessionId = localStorage.getItem("amvi_collector_session") || "";
    await cancelOrderAction(order.id, sessionId);
    setIsCancelled(true);
  };

  return (
    <div className="space-y-10">
      {/* 10-Minute Reservation Timer Banner */}
      <div
        className={`flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl p-5 border transition-all ${
          isExpired || isCancelled
            ? "border-red-200 bg-red-50 text-red-900"
            : secondsLeft < 180
            ? "border-amber-300 bg-amber-50 text-amber-950 animate-pulse"
            : "border-zinc-200 bg-stone-50 text-zinc-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <Clock
            className={`h-5 w-5 ${
              isExpired || isCancelled
                ? "text-red-600"
                : secondsLeft < 180
                ? "text-amber-600"
                : "text-zinc-700"
            }`}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider">
              {isCancelled
                ? "Reservation Cancelled"
                : isExpired
                ? "Reservation Window Expired"
                : "1-of-1 Artwork Lock Reserved"}
            </p>
            <p className="text-xs text-zinc-600">
              {isExpired || isCancelled
                ? "The lock has been released back to the catalog."
                : "Your selected piece is held exclusively in your session."}
            </p>
          </div>
        </div>

        {!isExpired && !isCancelled ? (
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold tracking-widest text-zinc-950">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <button
              onClick={handleReleaseReservation}
              type="button"
              className="text-[11px] underline text-zinc-500 hover:text-zinc-800"
            >
              Release Lock
            </button>
          </div>
        ) : (
          <Link
            href="/artworks"
            className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white hover:bg-amber-900 transition-colors"
          >
            Re-explore Catalog
          </Link>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Payment Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Dynamic QR & Transfer Details */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-6">
            {/* Amount Banner */}
            <div className="border-b border-zinc-100 pb-5">
              <span className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                Acquisition Payable
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-serif text-3xl font-semibold text-zinc-950">
                  {formattedAmount}
                </span>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Zero Processing Fees
                </span>
              </div>
            </div>

            {/* Mode Toggle Tabs */}
            <div className="flex rounded-lg bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => setPaymentMode("upi")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                  paymentMode === "upi"
                    ? "bg-white text-zinc-950 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span>Scan UPI QR</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode("bank")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                  paymentMode === "bank"
                    ? "bg-white text-zinc-950 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>Bank Transfer</span>
              </button>
            </div>

            {paymentMode === "upi" ? (
              /* Dynamic UPI QR */
              <div className="flex flex-col items-center text-center space-y-4 py-2">
                <div className="relative h-64 w-64 rounded-xl border border-zinc-200 bg-white p-3 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrSvgDataUrl}
                    alt="UPI Payment QR Code"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-800">
                    Scan with BHIM, Google Pay, PhonePe, Paytm, or CRED
                  </p>
                  <p className="font-mono text-xs text-zinc-500">
                    UPI ID: <span className="font-bold text-zinc-900">{GALLERY_UPI_CONFIG.upiId}</span>
                  </p>
                </div>

                <a
                  href={upiUrl}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-zinc-800 transition-colors"
                >
                  <span>Open UPI Application</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ) : (
              /* Direct NEFT/IMPS Bank Coordinates */
              <div className="space-y-4 py-2">
                <p className="text-xs text-zinc-500">
                  Please initiate an RTGS / NEFT / IMPS transfer from your banking portal with the credentials below:
                </p>
                <dl className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 text-xs space-y-2">
                  <div className="flex justify-between pt-2 first:pt-0">
                    <dt className="text-zinc-500">Account Name</dt>
                    <dd className="font-medium text-zinc-900">
                      {GALLERY_UPI_CONFIG.bankDetails.accountHolder}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-2">
                    <dt className="text-zinc-500">Account Number</dt>
                    <dd className="font-mono font-bold text-zinc-900">
                      {GALLERY_UPI_CONFIG.bankDetails.accountNumber}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-2">
                    <dt className="text-zinc-500">IFSC Code</dt>
                    <dd className="font-mono font-bold text-zinc-900">
                      {GALLERY_UPI_CONFIG.bankDetails.ifscCode}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-2">
                    <dt className="text-zinc-500">Bank & Branch</dt>
                    <dd className="font-medium text-zinc-900 text-right">
                      {GALLERY_UPI_CONFIG.bankDetails.bankName}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-2">
                    <dt className="text-zinc-500">Account Type</dt>
                    <dd className="font-medium text-zinc-900">
                      {GALLERY_UPI_CONFIG.bankDetails.accountType}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Right: Proof Submission Form & Item Summary */}
        <div className="lg:col-span-6 space-y-6">
          {/* Proof Submission */}
          <form
            onSubmit={handleSubmitProof}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-6"
          >
            <div className="border-b border-zinc-100 pb-4">
              <h2 className="font-serif text-lg font-medium text-zinc-950">
                Confirm Transaction Proof
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Enter your transaction reference number and optionally upload the transfer receipt for expedited white-glove dispatch.
              </p>
            </div>

            {/* UTR Reference Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                UPI UTR / Bank Reference Number *
              </label>
              <input
                type="text"
                required
                disabled={isExpired || isCancelled}
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="e.g. 412389102938 or CMS29381029"
                className="mt-1.5 block w-full rounded-md border border-zinc-300 px-3.5 py-2.5 font-mono text-sm text-zinc-900 uppercase focus:border-zinc-950 focus:outline-none disabled:bg-zinc-100"
              />
              <span className="mt-1 block text-[11px] text-zinc-400">
                Usually a 12-digit number found on your UPI app or banking receipt.
              </span>
            </div>

            {/* Screenshot Upload */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Receipt Screenshot / PDF (Optional)
              </label>
              <div className="mt-1.5 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 p-6 text-center hover:border-zinc-400 transition-colors">
                <UploadCloud className="h-8 w-8 text-zinc-400 mb-2" />
                <label className="cursor-pointer text-xs font-semibold text-zinc-900 underline">
                  <span>Upload screenshot file</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="sr-only"
                    disabled={isExpired || isCancelled}
                  />
                </label>
                <p className="mt-1 text-[11px] text-zinc-400">
                  PNG, JPG, WebP, or PDF up to 5MB
                </p>

                {receiptFile && (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    Selected: {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {previewUrl && (
                <div className="mt-3 relative h-28 w-28 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Receipt Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending || isExpired || isCancelled}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 py-4 text-xs font-semibold uppercase tracking-widest text-white shadow-md transition-all hover:bg-amber-900 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Verification...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Submit Proof of Payment</span>
                </>
              )}
            </button>
          </form>

          {/* Reserved Artwork Preview */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="font-serif text-sm font-medium text-zinc-950 border-b border-zinc-100 pb-2">
              Reserved Artwork Pieces
            </h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-xs bg-zinc-100">
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-medium text-zinc-900 line-clamp-1">{item.title}</p>
                    <p className="text-zinc-500">{item.artist_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
