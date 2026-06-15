"use client";

import Link from "next/link";
import { ArrowRight, Settings, Sparkles } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8 lg:p-12">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
        Settings
      </h1>
      <p className="mt-2 text-neutral-500">
        Admin configuration and preferences.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/recipes/ingest"
          className="group flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <Sparkles className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Chef
            </p>
            <h3 className="mt-1 font-semibold text-neutral-900">
              Ingestion defaults
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Edit the default parsing and image-style prompts used by the AI
              chef (saved per workspace on the ingest page).
            </p>
          </div>
          <div className="mt-auto flex items-center gap-1 text-sm text-neutral-400 transition-colors group-hover:text-neutral-900">
            Open <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
            <Settings className="h-6 w-6 text-neutral-400" />
          </div>
          <p className="mt-3 text-sm text-neutral-500">
            More settings coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
