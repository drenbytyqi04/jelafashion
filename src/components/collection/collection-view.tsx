"use client";

import { Grid2x2, Square, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  activeFilterCount,
  applyFilters,
  colorFamilies,
  FILTER_KEYS,
  filtersToQuery,
  PAGE_SIZE,
  SORTS,
  type FilterKey,
  type Filters,
  type Sort,
} from "@/lib/catalog/filters";
import type { CatalogProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { ProductCard } from "@/components/product/product-card";
import { FilterGroups, type FilterOptionCounts } from "./filter-groups";

type GridMode = "standard" | "large";
const GRID_KEY = "jf-grid";

function toggle(f: Filters, key: FilterKey, value: string): Filters {
  const current = f[key] as string[];
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  return { ...f, [key]: next, page: 1 };
}

/** How many products each option would show, given the other active filters. */
function optionCounts(products: CatalogProduct[], f: Filters, keys: FilterKey[], colorValues: string[]): FilterOptionCounts {
  const out: FilterOptionCounts = {};
  const valuesFor = (key: FilterKey): string[] =>
    key === "color"
      ? colorValues
      : key === "category"
        ? ["bridal", "evening", "short"]
        : key === "length"
          ? ["mini", "knee", "floor"]
          : key === "sleeves"
            ? ["sleeveless", "short", "long"]
            : key === "price"
              ? ["under-500", "500-1000", "over-1000"]
              : ["in_stock", "made_to_order"];
  for (const key of keys) {
    const without = { ...f, [key]: [] } as Filters;
    const base = applyFilters(products, without);
    out[key] = Object.fromEntries(
      valuesFor(key).map((v) => [v, applyFilters(base, { ...without, [key]: [v] } as Filters).length]),
    );
  }
  return out;
}

export function CollectionView({
  products,
  initialFilters,
  showCategory,
}: {
  /** Every published product in this collection's scope (already category-limited). */
  products: CatalogProduct[];
  initialFilters: Filters;
  showCategory: boolean;
}) {
  const t = useTranslations("collection");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [draft, setDraft] = useState<Filters>(initialFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [grid, setGrid] = useState<GridMode>("standard");
  const [chipsExpanded, setChipsExpanded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GRID_KEY);
      // Restoring a per-viewer preference after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "large" || saved === "standard") setGrid(saved);
    } catch {}
  }, []);

  function commit(next: Filters) {
    setFilters(next);
    // Shallow URL update: shareable and back-button friendly, no server round trip.
    const url = `${window.location.pathname}${filtersToQuery(next)}`;
    window.history.replaceState(window.history.state, "", url);
  }

  function setGridMode(mode: GridMode) {
    setGrid(mode);
    try {
      localStorage.setItem(GRID_KEY, mode);
    } catch {}
  }

  const colors = useMemo(() => colorFamilies(products), [products]);
  const results = useMemo(() => applyFilters(products, filters), [products, filters]);
  const draftResults = useMemo(() => applyFilters(products, draft), [products, draft]);
  const keys = FILTER_KEYS.filter((k) => showCategory || k !== "category");
  const counts = useMemo(
    () => optionCounts(products, filters, keys, colors.map((c) => c.family)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, filters, colors, showCategory],
  );
  const draftCounts = useMemo(
    () => optionCounts(products, draft, keys, colors.map((c) => c.family)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, draft, colors, showCategory],
  );

  const shown = results.slice(0, filters.page * PAGE_SIZE);
  const activeCount = activeFilterCount(filters);
  const chips = keys.flatMap((key) =>
    (filters[key] as string[]).map((value) => ({ key, value, label: t(`${key}.${value}` as never) as string })),
  );
  const cleared: Filters = { ...filters, category: [], color: [], length: [], sleeves: [], price: [], availability: [], page: 1 };
  const sortOptions = SORTS.map((s) => ({ value: s, label: t(`sorts.${s}`) }));
  const MOBILE_CHIPS = 3;

  const cardSizes =
    grid === "standard" ? "(min-width: 1024px) 25vw, 50vw" : "(min-width: 1024px) 37vw, 100vw";

  return (
    <div className="container-page pb-24 lg:grid lg:grid-cols-12 lg:gap-6">
      {/* Mobile toolbar */}
      <div className="sticky top-(--header-offset) z-30 -mx-(--gutter) mb-4 grid grid-cols-2 border-b border-hairline bg-ivory transition-[top] duration-(--duration-ui) ease-(--ease-couture) lg:hidden">
        <button
          type="button"
          onClick={() => {
            setDraft(filters);
            setFilterOpen(true);
          }}
          className="label flex min-h-12 items-center justify-center gap-2 border-r border-hairline"
        >
          <SlidersHorizontal aria-hidden size={16} strokeWidth={1.25} />
          {t("filter")}
          {activeCount > 0 && <span className="nums">({activeCount})</span>}
        </button>
        <button type="button" onClick={() => setSortOpen(true)} className="label flex min-h-12 items-center justify-center gap-2">
          {t("sort")}
        </button>
      </div>

      {/* Desktop filters */}
      <aside className="hidden lg:col-span-3 lg:block" aria-label={t("filters")}>
        <div className="sticky top-[calc(var(--header-offset)+24px)] max-h-[calc(100dvh-var(--header-offset)-48px)] overflow-y-auto pb-8 pr-4 transition-[top] duration-(--duration-ui)" data-lenis-prevent>
          <FilterGroups
            filters={filters}
            onToggle={(k, v) => commit(toggle(filters, k, v))}
            colorOptions={colors}
            showCategory={showCategory}
            counts={counts}
            idPrefix="desk"
          />
        </div>
      </aside>

      <div className="lg:col-span-9">
        {/* Results bar */}
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* The count heads the grid, so card titles (h3) sit under an h2. */}
          <h2 className="nums font-sans text-small text-stone" aria-live="polite">
            {t("results", { count: results.length })}
          </h2>
          <div className="ml-auto flex items-center gap-4">
            <Select
              label={<span className="sr-only">{t("sortBy")}</span>}
              value={filters.sort}
              onChange={(e) => commit({ ...filters, sort: e.target.value as Sort, page: 1 })}
              options={sortOptions}
              className="hidden w-56 lg:block [&_label]:mb-0"
            />
            <div className="flex items-center" role="group" aria-label={t("view")}>
              <button
                type="button"
                aria-pressed={grid === "standard"}
                aria-label={t("gridStandard")}
                onClick={() => setGridMode("standard")}
                className={cn("flex size-11 items-center justify-center", grid === "standard" ? "text-ink" : "text-stone")}
              >
                <Grid2x2 aria-hidden size={18} strokeWidth={1.25} />
              </button>
              <button
                type="button"
                aria-pressed={grid === "large"}
                aria-label={t("gridLarge")}
                onClick={() => setGridMode("large")}
                className={cn("flex size-11 items-center justify-center", grid === "large" ? "text-ink" : "text-stone")}
              >
                <Square aria-hidden size={18} strokeWidth={1.25} />
              </button>
            </div>
          </div>
        </div>

        {/* Active filter chips: wrap, collapse to "+n more" on mobile */}
        {chips.length > 0 && (
          <ul className="mb-8 flex flex-wrap items-center gap-2">
            {chips.map((chip, i) => (
              <li key={`${chip.key}-${chip.value}`} className={cn(!chipsExpanded && i >= MOBILE_CHIPS && "hidden lg:block")}>
                <button
                  type="button"
                  onClick={() => commit(toggle(filters, chip.key, chip.value))}
                  aria-label={t("removeFilter", { label: chip.label })}
                  className="flex min-h-11 items-center gap-2 border border-field px-3 text-small hover:border-ink"
                >
                  {chip.label}
                  <X aria-hidden size={14} strokeWidth={1.25} />
                </button>
              </li>
            ))}
            {!chipsExpanded && chips.length > MOBILE_CHIPS && (
              <li className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setChipsExpanded(true)}
                  className="flex min-h-11 items-center px-3 text-small underline decoration-champagne underline-offset-4"
                >
                  {t("moreFilters", { count: chips.length - MOBILE_CHIPS })}
                </button>
              </li>
            )}
            <li>
              <button type="button" onClick={() => commit(cleared)} className="flex min-h-11 items-center px-2 text-small">
                <span className="link-underline">{t("clearAll")}</span>
              </button>
            </li>
          </ul>
        )}

        {results.length === 0 ? (
          <div className="border-t border-hairline py-16">
            <p className="font-serif text-h3">{t("empty")}</p>
            <p className="measure mt-3 text-stone">{t("emptyText")}</p>
            <Button variant="secondary" className="mt-8" onClick={() => commit(cleared)}>
              {t("emptyCta")}
            </Button>
          </div>
        ) : (
          <>
            <ul
              className={cn(
                "grid gap-x-3 gap-y-10 lg:gap-x-6 lg:gap-y-16",
                grid === "standard" ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2",
              )}
            >
              {shown.map((p, i) => (
                <li key={p.id}>
                  <ProductCard product={p} sizes={cardSizes} priority={i < 2} />
                </li>
              ))}
            </ul>
            {shown.length < results.length && (
              <div className="mt-16 flex flex-col items-center gap-4">
                <p className="nums text-small text-stone">
                  {t("showing", { shown: shown.length, total: results.length })}
                </p>
                <span aria-hidden className="block h-px w-40 bg-hairline">
                  <span
                    className="block h-full bg-champagne"
                    style={{ width: `${(shown.length / results.length) * 100}%` }}
                  />
                </span>
                <Button variant="secondary" onClick={() => commit({ ...filters, page: filters.page + 1 })}>
                  {t("loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile filter drawer: edits a draft, applied with one button */}
      <Drawer
        side="bottom"
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title={t("filters")}
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1 px-4"
              onClick={() => setDraft(cleared)}
              disabled={activeFilterCount(draft) === 0}
            >
              {t("clearAll")}
            </Button>
            <Button
              className="flex-[2] px-4"
              disabled={draftResults.length === 0}
              onClick={() => {
                commit({ ...draft, page: 1 });
                setFilterOpen(false);
              }}
            >
              {t("showResults", { count: draftResults.length })}
            </Button>
          </div>
        }
      >
        <FilterGroups
          filters={draft}
          onToggle={(k, v) => setDraft(toggle(draft, k, v))}
          colorOptions={colors}
          showCategory={showCategory}
          counts={draftCounts}
          idPrefix="mob"
        />
      </Drawer>

      <Drawer side="bottom" open={sortOpen} onOpenChange={setSortOpen} title={t("sortBy")}>
        <RadioGroup
          name="sort"
          legend={t("sortBy")}
          hideLegend
          value={filters.sort}
          onValueChange={(v) => {
            commit({ ...filters, sort: v as Sort, page: 1 });
            setSortOpen(false);
          }}
          options={sortOptions}
        />
      </Drawer>
    </div>
  );
}
