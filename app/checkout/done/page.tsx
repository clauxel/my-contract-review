import type { Metadata } from "next";
import CheckoutDoneBridge from "@/components/CheckoutDoneBridge";
export const metadata: Metadata = { title: "Checkout Complete", description: "Your Contract Review Online checkout is complete.", robots: { index: false, follow: false } };
export default function CheckoutDonePage() { return <main className="grid min-h-screen place-items-center px-6 text-center"><CheckoutDoneBridge /><section><p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-100">Payment received</p><h1 className="mb-3 text-3xl font-bold text-white">Returning to Contract Review Online</h1><p className="max-w-md text-stone-400">Checkout is complete. The original page will return to the homepage automatically.</p></section></main>; }
