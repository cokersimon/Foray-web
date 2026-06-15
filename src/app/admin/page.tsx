"use client";

import Link from "next/link";
import { ChefHat, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="p-8 lg:p-12">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
        Dashboard
      </h1>
      <p className="mt-2 text-neutral-500">
        Welcome to the Zentra admin cockpit.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/recipes"
          className="group flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <ChefHat className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">Recipe Approval</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Review, edit, and approve staging recipes before they go live.
            </p>
          </div>
          <div className="mt-auto flex items-center gap-1 text-sm text-neutral-400 transition-colors group-hover:text-neutral-900">
            Open <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
