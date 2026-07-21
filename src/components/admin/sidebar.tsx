"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChefHat,
  LogOut,
  Wand2,
  Flag,
  CreditCard,
  AlertTriangle,
  BarChart3,
  ShoppingBasket,
  FlaskConical,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useSupabaseSession } from "@/components/providers";
import { Wordmark } from "@/components/brand/wordmark";
import { cn } from "@/lib/cn";

const navItems = [
  { label: "Recipes", href: "/admin/recipes", icon: ChefHat, exactMatch: true },
  {
    label: "AI ingest",
    href: "/admin/recipes/ingest",
    icon: Wand2,
    exactMatch: false,
  },
  { label: "Catalogue", href: "/admin/catalog", icon: ShoppingBasket },
  { label: "Checkout", href: "/admin/checkout", icon: CreditCard },
  { label: "Reports", href: "/admin/reports", icon: Flag },
  { label: "Testing", href: "/admin/testing", icon: FlaskConical },
  { label: "Errors", href: "/admin/errors", icon: AlertTriangle },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useSupabaseSession();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="flex h-16 items-center px-6">
        <Link href="/admin/recipes" className="text-lg">
          <Wordmark />
        </Link>
        <span className="ml-2 rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            "exactMatch" in item && item.exactMatch
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-neutral-500" title={session?.user.email}>
            {session?.user.email ?? ""}
          </span>
          <button
            type="button"
            onClick={() => {
              void supabaseBrowser()
                .auth.signOut()
                .then(() => {
                  router.push("/sign-in");
                  router.refresh();
                });
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
