"use client";

import { useCartStore } from "@/store/useCartStore";
import { useMounted } from "@/lib/useMounted";
import { createPendingOrderAction } from "@/app/actions/checkout";
import { useState, useTransition, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  ArrowRight,
  AlertCircle,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import {
  INDIAN_CITIES_BY_STATE,
  POPULAR_INDIAN_CITIES,
} from "@/lib/india-locations";

export default function CheckoutPage() {
  const router = useRouter();
  const mounted = useMounted();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customCity, setCustomCity] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
  });

  const subtotal = getTotalPrice();
  const formattedSubtotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(subtotal);

  const availableCities = formData.state && INDIAN_CITIES_BY_STATE[formData.state]
    ? INDIAN_CITIES_BY_STATE[formData.state]
    : POPULAR_INDIAN_CITIES;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "state") {
      setFormData((prev) => ({
        ...prev,
        state: value,
        // Reset city if not valid for selected state
        city: "",
      }));
      setCustomCity("");
      return;
    }

    if (name === "city") {
      if (value !== "Other") {
        setCustomCity("");
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Get or initialize persistent session ID for locks
    let sessionId = "";
    if (typeof window !== "undefined") {
      sessionId = localStorage.getItem("amvi_collector_session") || "";
      if (!sessionId) {
        sessionId = `sess_${crypto.randomUUID()}`;
        localStorage.setItem("amvi_collector_session", sessionId);
      }
    }

    startTransition(async () => {
      const result = await createPendingOrderAction({
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        shippingAddress: {
          address_line1: formData.address_line1,
          address_line2: formData.address_line2 || undefined,
          city:
            formData.city === "Other" && customCity.trim()
              ? customCity.trim()
              : formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country,
        },

        items,
        sessionId,
      });

      if (!result.success || !result.orderId) {
        setErrorMessage(
          result.message || "Failed to reserve order. Please try again."
        );
        return;
      }

      // Clear cart once order reservation is safely in database
      clearCart();
      router.push(`/checkout/${result.orderId}`);
    });
  };

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-4">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="font-serif text-2xl font-medium text-zinc-950">
          Your Collection Bag is Empty
        </h1>
        <p className="mt-2 text-xs text-zinc-500 max-w-sm mx-auto">
          Please select an original artwork from our gallery before proceeding to acquisition checkout.
        </p>
        <Link
          href="/artworks"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-amber-900 transition-colors"
        >
          <span>Explore Gallery</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="border-b border-zinc-200 pb-6 mb-10">
        <h1 className="font-serif text-3xl font-medium text-zinc-950">
          Acquisition & Delivery Verification
        </h1>
        <p className="mt-1 text-xs text-zinc-500 uppercase tracking-widest">
          Insured Direct-From-Atelier White-Glove Dispatch
        </p>
      </div>

      {errorMessage && (
        <div className="mb-8 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
          {/* Collector Details */}
          <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
            <h2 className="font-serif text-lg font-medium text-zinc-950">
              1. Collector Information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-700 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Anandita Singhania"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 uppercase tracking-wider">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="anandita@example.com"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 uppercase tracking-wider">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98201 00000"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
            <h2 className="font-serif text-lg font-medium text-zinc-950">
              2. Archival Delivery Destination
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-700 uppercase tracking-wider">
                  Street Address / Suite / Residence *
                </label>
                <input
                  type="text"
                  name="address_line1"
                  required
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  placeholder="Flat 14B, Altamount Heights, Altamount Road"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-700 uppercase tracking-wider">
                  Apartment, Building, Landmark (Optional)
                </label>
                <input
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleInputChange}
                  placeholder="Near Kemps Corner"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 uppercase tracking-wider">
                  State / Province *
                </label>
                <select
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none transition-colors"
                >
                  <option value="" disabled>
                    Select state or union territory
                  </option>
                  <optgroup label="States">
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                    <option value="Assam">Assam</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Goa">Goa</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Manipur">Manipur</option>
                    <option value="Meghalaya">Meghalaya</option>
                    <option value="Mizoram">Mizoram</option>
                    <option value="Nagaland">Nagaland</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Sikkim">Sikkim</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tripura">Tripura</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="West Bengal">West Bengal</option>
                  </optgroup>
                  <optgroup label="Union Territories">
                    <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                    <option value="Delhi (NCT)">Delhi (NCT)</option>
                    <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Lakshadweep">Lakshadweep</option>
                    <option value="Puducherry">Puducherry</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 uppercase tracking-wider">
                  City *
                </label>
                <select
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none transition-colors"
                >
                  <option value="" disabled>
                    {formData.state ? `Select city in ${formData.state}` : "Select city"}
                  </option>
                  {availableCities.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>

                {formData.city === "Other" && (
                  <input
                    type="text"
                    required
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Enter your town or city name"
                    className="mt-2 block w-full rounded-md border border-zinc-300 px-3.5 py-1.5 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none"
                  />
                )}
              </div>



              <div>
                <label className="block text-xs font-medium text-zinc-700 uppercase tracking-wider">
                  PIN / Postal Code *
                </label>
                <input
                  type="text"
                  name="postal_code"
                  required
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  placeholder="400026"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 uppercase tracking-wider">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  disabled
                  value={formData.country}
                  className="mt-1 block w-full rounded-md border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 py-4 text-xs font-semibold uppercase tracking-widest text-white shadow-md transition-all hover:bg-amber-900 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Securing 10-Minute Lock...</span>
              </>
            ) : (
              <>
                <span>Lock Artworks & Proceed to Payment</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Order Review Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-5">
            <h2 className="font-serif text-lg font-medium text-zinc-950 border-b border-zinc-100 pb-3">
              Acquisition Summary ({items.length} Piece{items.length > 1 ? "s" : ""})
            </h2>

            <div className="divide-y divide-zinc-100 space-y-4">
              {items.map((item) => {
                const itemPrice = new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(Number(item.price));

                return (
                  <div key={item.id} className="flex gap-4 pt-4 first:pt-0">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xs bg-zinc-100">
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-sm font-medium text-zinc-900 line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-500">{item.artist_name}</p>
                      <p className="text-[11px] text-zinc-400">{item.dimensions}</p>
                      <p className="mt-1 font-serif text-xs font-semibold text-zinc-900">
                        {itemPrice}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-zinc-200 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Original Art Subtotal</span>
                <span className="font-medium text-zinc-900">{formattedSubtotal}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Insured White-Glove Crate Delivery</span>
                <span className="text-emerald-700 font-medium">Complimentary</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200/80 pt-2 text-sm font-serif font-semibold text-zinc-950">
                <span>Total Amount Due</span>
                <span>{formattedSubtotal}</span>
              </div>
            </div>

            <div className="rounded-md bg-stone-50 p-3 space-y-2 text-[11px] text-zinc-600 border border-stone-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-800 shrink-0" />
                <span className="font-medium">Direct Consignment & COA Provided</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-zinc-600 shrink-0" />
                <span>Custom climate-resilient wooden archival casing.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
