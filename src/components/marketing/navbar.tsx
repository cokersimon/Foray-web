"use client";

import Link from "next/link";
import { useWaitlist } from "./waitlist-provider";

export function Navbar() {
  const { open } = useWaitlist();

  return (
    <nav className="relative z-50 flex items-center justify-between pl-6 pr-6 pt-6 pb-2 md:min-h-[4.5rem] md:justify-end md:px-10 md:py-6">
      <Link
        href="/"
        className="shrink-0 text-2xl font-extrabold leading-none tracking-tighter text-foreground transition-opacity hover:opacity-80 md:absolute md:left-10 md:top-1/2 md:z-10 md:-translate-y-1/2"
      >
        Zentra
      </Link>

      {/* Join Waitlist only: right side; vertically centred with Zentra. Desktop: frosted pill on the right. */}
      <div className="shrink-0 rounded-none border-none bg-transparent p-0 shadow-none backdrop-blur-none md:rounded-full md:border md:border-black/[0.08] md:bg-white/70 md:p-1 md:shadow-[0_4px_24px_rgba(0,0,0,0.06)] md:backdrop-blur-[20px]">
        <button
          type="button"
          onClick={open}
          className="cursor-pointer border-0 bg-transparent p-0 text-base font-medium leading-none text-neutral-500 shadow-none transition-colors md:rounded-full md:bg-foreground md:px-5 md:py-3 md:font-semibold md:leading-normal md:text-background md:shadow-none md:hover:bg-foreground/90"
        >
          Join Waitlist
        </button>
      </div>
    </nav>
  );
}
