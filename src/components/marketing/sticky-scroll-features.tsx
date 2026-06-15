"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Apple, Moon, Brain } from "lucide-react";
import { cn } from "@/lib/cn";

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  screen: React.ReactNode;
}

const features: Feature[] = [
  {
    id: "nutrition",
    icon: <Apple className="h-5 w-5" />,
    title: "Nutrition",
    description:
      "[Describe how Zentra tracks nutrition, adapts meal plans, and provides AI-powered dietary guidance tailored to individual goals.]",
    screen: <NutritionScreen />,
  },
  {
    id: "recovery",
    icon: <Moon className="h-5 w-5" />,
    title: "Recovery",
    description:
      "[Describe how Zentra monitors recovery signals — sleep, HRV, soreness — and adjusts training load dynamically.]",
    screen: <RecoveryScreen />,
  },
  {
    id: "ai-planning",
    icon: <Brain className="h-5 w-5" />,
    title: "AI Planning",
    description:
      "[Describe how the AI engine orchestrates nutrition, training, and recovery into one adaptive plan that evolves daily.]",
    screen: <AIPlanningScreen />,
  },
];

function NutritionScreen() {
  return (
    <div className="flex h-full flex-col bg-[#0c0c0c] p-6 text-white">
      <div className="mb-4 text-xs font-medium uppercase tracking-widest text-emerald-400">
        Today&apos;s Nutrition
      </div>
      <div className="mb-6 text-2xl font-bold">1,847 kcal</div>
      <div className="flex gap-3">
        {[
          { label: "Protein", value: "142g", color: "bg-emerald-500" },
          { label: "Carbs", value: "198g", color: "bg-blue-500" },
          { label: "Fat", value: "64g", color: "bg-amber-500" },
        ].map((macro) => (
          <div key={macro.label} className="flex-1 rounded-2xl bg-white/5 p-3">
            <div className={cn("mb-2 h-1.5 w-8 rounded-full", macro.color)} />
            <div className="text-sm font-semibold">{macro.value}</div>
            <div className="text-xs text-neutral-500">{macro.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {["Breakfast", "Lunch", "Dinner"].map((meal) => (
          <div
            key={meal}
            className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
          >
            <span className="text-sm">{meal}</span>
            <span className="text-xs text-neutral-500">[kcal]</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecoveryScreen() {
  return (
    <div className="flex h-full flex-col bg-[#0c0c0c] p-6 text-white">
      <div className="mb-4 text-xs font-medium uppercase tracking-widest text-violet-400">
        Recovery Score
      </div>
      <div className="mb-2 text-5xl font-bold">87</div>
      <div className="mb-6 text-sm text-neutral-500">Excellent</div>
      <div className="space-y-4">
        {[
          { label: "Sleep", value: "7h 42m", pct: 85 },
          { label: "HRV", value: "62 ms", pct: 78 },
          { label: "Soreness", value: "Low", pct: 92 },
        ].map((metric) => (
          <div key={metric.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{metric.label}</span>
              <span className="text-neutral-500">{metric.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{ width: `${metric.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIPlanningScreen() {
  return (
    <div className="flex h-full flex-col bg-[#0c0c0c] p-6 text-white">
      <div className="mb-4 text-xs font-medium uppercase tracking-widest text-sky-400">
        Today&apos;s Plan
      </div>
      <div className="space-y-3">
        {[
          { time: "7:00 AM", task: "Fasted cardio — 30 min walk", done: true },
          { time: "8:30 AM", task: "Breakfast — Protein oats", done: true },
          { time: "12:00 PM", task: "Lunch — Chicken & rice bowl", done: false },
          { time: "4:00 PM", task: "Upper body session", done: false },
          { time: "7:00 PM", task: "Dinner — Salmon & greens", done: false },
          { time: "10:00 PM", task: "Wind-down routine", done: false },
        ].map((item) => (
          <div
            key={item.time}
            className={cn(
              "flex items-start gap-3 rounded-2xl px-4 py-3",
              item.done ? "bg-white/5 opacity-50" : "bg-white/5",
            )}
          >
            <div
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2",
                item.done
                  ? "border-sky-500 bg-sky-500"
                  : "border-white/20",
              )}
            />
            <div>
              <div className="text-xs text-neutral-500">{item.time}</div>
              <div className="text-sm">{item.task}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[280px] lg:w-[300px]">
      <div className="overflow-hidden rounded-[3rem] border-[3px] border-neutral-300 bg-black shadow-xl shadow-black/10">
        {/* Dynamic Island */}
        <div className="relative flex justify-center pt-3 pb-2 bg-black">
          <div className="h-[28px] w-[100px] rounded-full bg-black border border-neutral-800" />
        </div>
        {/* Screen area */}
        <div className="aspect-[9/17.5] overflow-hidden">
          {children}
        </div>
        {/* Home indicator */}
        <div className="flex justify-center bg-black pb-3 pt-2">
          <div className="h-[5px] w-[120px] rounded-full bg-neutral-700" />
        </div>
      </div>
    </div>
  );
}

export function StickyScrollFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const index = Math.min(
      features.length - 1,
      Math.floor(value * features.length),
    );
    setActiveIndex(index);
  });

  return (
    <section id="features" ref={containerRef} className="relative">
      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
        {/* Left column — scrolling text blocks */}
        <div className="px-6 lg:px-12">
          {features.map((feature, i) => (
            <div
              key={feature.id}
              className="flex min-h-screen flex-col justify-center py-24"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className={cn(
                    "mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                    i === activeIndex
                      ? "border-neutral-400 text-neutral-900"
                      : "border-neutral-200 text-neutral-400",
                  )}
                >
                  {feature.icon}
                  {feature.title}
                </div>
                <h3 className="mb-4 text-3xl font-bold tracking-tight text-neutral-900 lg:text-4xl">
                  {feature.title}
                </h3>
                <p className="max-w-md text-lg leading-relaxed text-neutral-500">
                  {feature.description}
                </p>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Right column — sticky iPhone mockup */}
        <div className="hidden lg:flex lg:items-center">
          <div className="sticky top-1/2 w-full -translate-y-1/2 py-24">
            <IPhoneFrame>
              <AnimatePresence mode="wait">
                <motion.div
                  key={features[activeIndex].id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {features[activeIndex].screen}
                </motion.div>
              </AnimatePresence>
            </IPhoneFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
