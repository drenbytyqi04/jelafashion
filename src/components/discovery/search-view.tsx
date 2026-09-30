"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { CatalogProduct } from "@/lib/catalog/types";
import { searchProducts } from "@/lib/catalog/search";
import { ProductCard } from "@/components/product/product-card";

export function SearchView({ index, initialQuery }: { index: { product: CatalogProduct; text: string }[]; initialQuery: string }) {
  const t = useTranslations("pages.search");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchProducts(index, query), [index, query]);

  // Keep the URL shareable without adding a history entry per keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => {
      router.replace({ pathname: pathname as "/search", query: query.trim() ? { q: query.trim() } : {} }, { scroll: false });
    }, 350);
    return () => window.clearTimeout(id);
  }, [query, pathname, router]);

  return (
    <section className="container-page pb-24 pt-[calc(var(--header-h)+40px)] lg:pb-32 lg:pt-[calc(var(--header-h)+64px)]">
      <h1 className="sr-only">{t("title")}</h1>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="border-b border-ink">
        <label htmlFor="search-input" className="label text-stone">
          {t("label")}
        </label>
        <div className="flex items-center gap-3 pb-3 pt-4">
          <Search aria-hidden size={24} strokeWidth={1.25} className="shrink-0" />
          <input
            ref={inputRef}
            id="search-input"
            type="search"
            autoFocus
            autoComplete="off"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("placeholder")}
            className="min-w-0 flex-1 bg-transparent font-serif text-h3 placeholder:text-stone/60 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label={tc("close")}
              className="flex size-11 shrink-0 items-center justify-center"
            >
              <X aria-hidden size={20} strokeWidth={1.25} />
            </button>
          )}
        </div>
      </form>

      <p role="status" aria-live="polite" className="nums mt-4 text-small text-stone">
        {query.trim() ? t("results", { count: results.length }) : ""}
      </p>

      {!query.trim() ? (
        <div className="mt-10">
          <h2 className="label text-stone">{t("suggestions")}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {(t.raw("suggestionList") as string[]).map((s) => (
              <li key={s}>
                <button type="button" onClick={() => setQuery(s)} className="min-h-11 border border-field px-4 text-small hover:border-ink">
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : results.length === 0 ? (
        <div className="max-w-xl py-12">
          <p className="font-serif text-h3">{t("empty", { query: query.trim() })}</p>
          <p className="mt-3 text-body text-stone">{t("emptyText")}</p>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
          {results.map((p, i) => (
            <li key={p.id}>
              <ProductCard product={p} sizes="(min-width: 1024px) 25vw, 50vw" priority={i < 2} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
