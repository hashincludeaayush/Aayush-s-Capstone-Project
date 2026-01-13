"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";

type SuggestionItem = {
  id: string;
  title: string;
  image: string;
  currentPrice: number;
  currency: string;
};

const ProductSearchbar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";

  const [query, setQuery] = useState(q);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const blurCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  useEffect(() => {
    if (!trimmedQuery) {
      setSuggestions([]);
      setIsSuggestOpen(false);
      setIsSuggestLoading(false);
      setHasFetched(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsSuggestLoading(true);
        const res = await fetch(
          "/api/products/suggest?q=" + encodeURIComponent(trimmedQuery),
          { signal: controller.signal }
        );

        const data = (await res.json()) as { items?: SuggestionItem[] };
        setSuggestions(Array.isArray(data.items) ? data.items : []);
        setHasFetched(true);
        setIsSuggestOpen(true);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setSuggestions([]);
        setHasFetched(true);
        setIsSuggestOpen(true);
      } finally {
        setIsSuggestLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [trimmedQuery]);

  useEffect(() => {
    return () => {
      if (blurCloseTimeoutRef.current)
        clearTimeout(blurCloseTimeoutRef.current);
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextQuery = query.trim();
    if (!nextQuery) {
      router.push("/");
      return;
    }

    router.push("/?q=" + encodeURIComponent(nextQuery));
  };

  const openSuggestions = () => {
    if (!trimmedQuery) return;
    setIsSuggestOpen(true);
  };

  const scheduleCloseSuggestions = () => {
    if (blurCloseTimeoutRef.current) clearTimeout(blurCloseTimeoutRef.current);
    blurCloseTimeoutRef.current = setTimeout(() => {
      setIsSuggestOpen(false);
    }, 120);
  };

  const selectSuggestion = (item: SuggestionItem) => {
    setIsSuggestOpen(false);
    router.push(`/products/${item.id}`);
  };

  return (
    <form
      className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3 sm:gap-4"
      onSubmit={handleSubmit}
    >
      <div className="relative w-full sm:w-auto flex-1 min-w-[240px]">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={openSuggestions}
          onBlur={scheduleCloseSuggestions}
          placeholder="Search tracked products"
          className="searchbar-input w-full"
          aria-autocomplete="list"
          aria-expanded={isSuggestOpen}
          aria-controls="product-suggestions"
        />

        {isSuggestOpen && trimmedQuery && (
          <div
            id="product-suggestions"
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-lg border border-white-100/15 bg-neutral-black/70 backdrop-blur-md shadow-xs"
          >
            {isSuggestLoading && (
              <div className="px-3 py-2 text-xs text-white-200">Loading…</div>
            )}

            {!isSuggestLoading && hasFetched && suggestions.length === 0 && (
              <div className="px-3 py-2 text-xs text-white-200">
                No matching records
              </div>
            )}

            {!isSuggestLoading && suggestions.length > 0 && (
              <div className="max-h-[320px] overflow-auto">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    className="w-full px-3 py-2 text-left hover:bg-white-100/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onMouseDown={(e) => {
                      // Prevent input blur before click handler.
                      e.preventDefault();
                    }}
                    onClick={() => selectSuggestion(item)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt=""
                        className="h-8 w-8 rounded-md object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white-100">
                          {item.title}
                        </p>
                        <p className="text-xs text-white-200">
                          {item.currency} {item.currentPrice}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Button type="submit" className="searchbar-btn">
        Search
      </Button>
    </form>
  );
};

export default ProductSearchbar;
