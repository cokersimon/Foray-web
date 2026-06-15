"use client";

import { motion } from "framer-motion";
import {
  Utensils,
  Activity,
  Dumbbell,
  ShieldCheck,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface BentoCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

const cards: BentoCard[] = [
  {
    icon: <Utensils className="h-5 w-5 text-emerald-600" />,
    title: "Smart Meal Planning",
    description:
      "[AI builds weekly meal plans from your preferences, macros, and pantry inventory.]",
    className: "lg:col-span-2",
  },
  {
    icon: <Activity className="h-5 w-5 text-violet-600" />,
    title: "Recovery Tracking",
    description:
      "[Monitor sleep, HRV, and readiness scores to optimise training load.]",
  },
  {
    icon: <Dumbbell className="h-5 w-5 text-sky-600" />,
    title: "Adaptive Workouts",
    description:
      "[Training programmes that adjust intensity based on recovery and goals.]",
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-amber-600" />,
    title: "Progress Analytics",
    description:
      "[Visualise trends in body composition, strength, and nutrition adherence.]",
    className: "lg:col-span-2",
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-rose-600" />,
    title: "Allergy-Safe Recipes",
    description:
      "[Every recipe is auto-tagged with allergen flags and dietary labels.]",
  },
  {
    icon: <Sparkles className="h-5 w-5 text-cyan-600" />,
    title: "AI Cooking Guide",
    description:
      "[Step-by-step cooking guidance with smart timers and substitution suggestions.]",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function BentoGrid() {
  return (
    <section id="how-it-works" className="px-6 py-32 lg:py-40">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-5xl">
            [Section Headline]
          </h2>
          <p className="mt-4 text-lg text-neutral-500">
            [Supporting copy for the feature grid.]
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {cards.map((card) => (
            <motion.div
              key={card.title}
              variants={cardVariants}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md",
                card.className,
              )}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                {card.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-500">
                {card.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
