import Image from "next/image";
import { ForayIcon } from "@/components/brand/foray-icon";
import { cn } from "@/lib/cn";

export type ProductScreen = "recipes" | "swipe" | "groceries" | "cook";

const groceryGroups = [
  { aisle: "Fruit & veg", items: ["Lemons", "Basil", "Tomatoes"] },
  { aisle: "Cupboard", items: ["Tagliatelle", "Olive oil"] },
];

function RecipesScreen() {
  return (
    <div className="flex h-full flex-col bg-[#f5f5f2] text-[#161616]">
      <div className="flex items-center justify-between px-4 pb-3 pt-5">
        <div>
          <p className="text-[9px] font-semibold text-neutral-500">Your recipes</p>
          <p className="mt-0.5 text-lg font-bold tracking-tight">What sounds good?</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white">
          <ForayIcon name="menu" size={14} />
        </div>
      </div>
      <div className="scrollbar-hide flex gap-2 overflow-hidden px-4 pb-3">
        {["Under 30 min", "One pot", "Vegetarian"].map((filter, index) => (
          <span
            key={filter}
            className={cn(
              "whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-semibold",
              index === 0 ? "border-black bg-black text-white" : "border-black/10 bg-white",
            )}
          >
            {filter}
          </span>
        ))}
      </div>
      <div className="mx-4 overflow-hidden rounded-[20px] bg-white shadow-sm">
        <div className="relative h-36 overflow-hidden bg-section-grey">
          <Image
            src="/brand/foray-kitchen-objects.png"
            alt=""
            aria-hidden="true"
            fill
            sizes="250px"
            className="object-cover object-[56%_45%] scale-[1.35]"
          />
        </div>
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold leading-tight">Lemony tomato pasta</p>
              <p className="mt-1 text-[9px] text-neutral-500">25 min · easy · serves 2</p>
            </div>
            <ForayIcon name="heart" size={16} filled className="shrink-0" />
          </div>
          <div className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-black py-2.5 text-[10px] font-semibold text-white">
            Add to groceries <ForayIcon name="arrowRight" size={12} />
          </div>
        </div>
      </div>
      <div className="mt-auto grid grid-cols-3 border-t border-black/5 bg-white px-4 py-3 text-center text-[8px] font-semibold text-neutral-400">
        <span className="text-black">Recipes</span>
        <span>Groceries</span>
        <span>Cook</span>
      </div>
    </div>
  );
}

function SwipeScreen() {
  return (
    <div className="flex h-full flex-col bg-[#f5f5f2] px-4 pb-5 pt-5 text-[#161616]">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-[9px] font-semibold text-neutral-500">Swipe</p>
          <p className="text-lg font-bold tracking-tight">Fancy this?</p>
        </div>
        <p className="text-[9px] text-neutral-500">3 of 12</p>
      </div>
      <div className="relative flex-1">
        <div className="absolute inset-x-3 bottom-3 top-3 rotate-3 rounded-[24px] border border-black/5 bg-white/70" />
        <div className="absolute inset-x-2 bottom-4 top-2 -rotate-2 rounded-[24px] border border-black/5 bg-white/80" />
        <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_15px_35px_rgba(0,0,0,0.12)]">
          <div className="relative min-h-0 flex-1 overflow-hidden bg-section-grey">
            <Image
              src="/brand/foray-kitchen-objects.png"
              alt=""
              aria-hidden="true"
              fill
              sizes="250px"
              className="object-cover object-[18%_38%] scale-[1.55]"
            />
          </div>
          <div className="p-4">
            <p className="text-base font-bold">Tomato basil pasta</p>
            <div className="mt-1 flex items-center gap-2 text-[9px] text-neutral-500">
              <span className="flex items-center gap-1">
                <ForayIcon name="clock" size={12} /> 25 min
              </span>
              <span>Vegetarian</span>
            </div>
            <div className="mt-3 flex gap-2">
              <div className="flex-1 rounded-xl border border-black/10 py-2 text-center text-[10px] font-semibold">
                Not today
              </div>
              <div className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-black py-2 text-[10px] font-semibold text-white">
                <ForayIcon name="heart" size={12} filled /> Fork it
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroceriesScreen() {
  return (
    <div className="flex h-full flex-col bg-[#f5f5f2] text-[#161616]">
      <div className="px-4 pb-3 pt-5">
        <p className="text-[9px] font-semibold text-neutral-500">Current shop</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-lg font-bold tracking-tight">Groceries</p>
          <span className="rounded-full bg-black/5 px-2 py-1 text-[8px] font-bold text-neutral-600">
            12 items
          </span>
        </div>
      </div>
      <div className="mx-4 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
        <div className="mb-2 rounded-xl bg-section-grey px-2.5 py-2 text-[9px] font-semibold text-neutral-600">
          Duplicates combined automatically
        </div>
        {groceryGroups.map((group) => (
          <div key={group.aisle} className="mt-3">
            <p className="mb-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              {group.aisle}
            </p>
            {group.items.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 border-t border-black/5 py-2 text-[10px] font-medium first:border-0"
              >
                <span className="h-4 w-4 rounded-full border border-black/15 bg-white" />
                {item}
                {item === "Tomatoes" && (
                  <span className="ml-auto text-[8px] text-neutral-400">2 recipes</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-auto px-4 pb-5">
        <div className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-black py-3 text-[10px] font-semibold text-white">
          <ForayIcon name="cart" size={14} /> Shop this list
        </div>
        <p className="mt-2 text-center text-[8px] text-neutral-400">
          Online checkout or take it in-store
        </p>
      </div>
    </div>
  );
}

function CookScreen() {
  return (
    <div className="flex h-full flex-col bg-[#f5f5f2] px-4 pb-5 pt-5 text-[#161616]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] font-semibold text-neutral-500">Cook mode</p>
          <p className="mt-1 text-lg font-bold tracking-tight">Tomato basil pasta</p>
        </div>
        <span className="rounded-full border border-black/10 px-2 py-1 text-[8px] text-neutral-500">
          2 of 5
        </span>
      </div>
      <div className="my-auto">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
          <span className="text-sm font-bold">2</span>
        </div>
        <p className="mt-5 text-xl font-semibold leading-snug">
          Add the tomatoes and let them soften.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">
          Stir occasionally until glossy and beginning to break down.
        </p>
        <div className="mt-5 flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-[10px] font-semibold">
          <ForayIcon name="clock" size={14} /> Set 8 minute timer
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 rounded-xl border border-black/10 py-2.5 text-center text-[10px] font-semibold text-neutral-500">
          Back
        </div>
        <div className="flex flex-[1.6] items-center justify-center gap-1 rounded-xl bg-black py-2.5 text-[10px] font-semibold text-white">
          Next step <ForayIcon name="check" size={12} />
        </div>
      </div>
    </div>
  );
}

const screens: Record<ProductScreen, React.ReactNode> = {
  recipes: <RecipesScreen />,
  swipe: <SwipeScreen />,
  groceries: <GroceriesScreen />,
  cook: <CookScreen />,
};

export function ProductPhone({
  screen,
  className,
}: {
  screen: ProductScreen;
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto w-[250px]", className)}>
      <div className="relative overflow-hidden rounded-[42px] border-[5px] border-[#1c1c1e] bg-black p-[5px] shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
        <div className="absolute left-1/2 top-[10px] z-30 h-[20px] w-[74px] -translate-x-1/2 rounded-full bg-black" />
        <div className="aspect-[9/19] overflow-hidden rounded-[32px] bg-[#f5f5f2]">
          {screens[screen]}
        </div>
      </div>
    </div>
  );
}
