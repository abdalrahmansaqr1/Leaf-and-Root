import React, { useState } from "react";

export const MarketplacePage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const categories = ["All", "Planters", "Soil & substrates", "Watering", "Smart care"];

  return (
    <main id="main-content" className="section-space">
      <div className="container-shell">
        {/* Keep the marketplace category navigation; the catalog is intentionally hidden. */}
        <nav aria-label="Marketplace categories" className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-3 rounded-xl text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-forest-950 text-white"
                  : "bg-sand text-forest-900 hover:bg-forest-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
};
