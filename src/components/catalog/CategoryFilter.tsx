"use client";

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryFilter({
  categories,
  activeCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-4">
      {categories.map((category) => {
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            type="button"
            className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-[#d97757] to-[#e8a86a] text-white shadow-xs"
                : "border border-stone-200/90 bg-white text-stone-600 hover:border-[#78a98f] hover:text-[#569172]"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
