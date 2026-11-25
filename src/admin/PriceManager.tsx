import { Fragment, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, RotateCcw, Save, Search, X } from 'lucide-react';
import { formatINR, formatTimestamp } from '../lib/defaults';
import { parseFirestoreErrorMessage } from '../lib/firebase';
import { batchUpdatePrices } from '../lib/salonApi';
import { BLUEPRINT_LIMITS, type SalonCategory, type SalonService } from '../types/salon';

interface PriceManagerProps {
  categories: SalonCategory[];
  services: SalonService[];
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

interface DraftPriceRow {
  price: string;
  offerPrice: string;
  discountPercent: string;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildHighlightRegex(tokens: string[]): RegExp | null {
  if (tokens.length === 0) return null;
  const unique = Array.from(new Set(tokens)).sort((a, b) => b.length - a.length);
  const pattern = unique.map(escapeRegExp).join('|');
  return pattern ? new RegExp(`(${pattern})`, 'gi') : null;
}

function HighlightText({
  text,
  regex,
}: {
  text: string;
  regex: RegExp | null;
}) {
  if (!text) return null;
  if (!regex) return <>{text}</>;

  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, idx) =>
        idx % 2 === 1 ? (
          <mark
            key={idx}
            className="bg-t-accent/30 text-t-text rounded px-0.5 font-semibold"
          >
            {part}
          </mark>
        ) : (
          <Fragment key={idx}>{part}</Fragment>
        )
      )}
    </>
  );
}

export function PriceManager({ categories, services, onNotify }: PriceManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [drafts, setDrafts] = useState<Record<string, DraftPriceRow>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [inlinePriceId, setInlinePriceId] = useState<string | null>(null);
  const [inlinePriceValue, setInlinePriceValue] = useState('');
  const [inlineSavingId, setInlineSavingId] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<string, DraftPriceRow> = {};
    for (const s of services) {
      const hasDiscount = s.offerPrice !== null && s.offerPrice !== undefined && s.price > 0;
      const pct = hasDiscount ? Math.round(((s.price - s.offerPrice!) / s.price) * 100) : 0;
      initial[s.id] = {
        price: String(s.price),
        offerPrice: s.offerPrice !== null && s.offerPrice !== undefined ? String(s.offerPrice) : '',
        discountPercent: pct > 0 ? String(pct) : '',
      };
    }
    setDrafts(initial);
  }, [services]);

  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [categories]);

  const indexedServices = useMemo(() => {
    return services.map((svc) => {
      const categoryName = categoryMap.get(svc.categoryId) || svc.categoryId;
      const description = svc.description || '';
      return {
        service: svc,
        categoryName,
        description,
        searchCorpus: `${svc.name} ${categoryName} ${description}`.toLowerCase(),
      };
    });
  }, [services, categoryMap]);

  const searchTokens = useMemo(() => {
    return deferredQuery
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  }, [deferredQuery]);

  const highlightRegex = useMemo(() => buildHighlightRegex(searchTokens), [searchTokens]);

  const filtered = useMemo(() => {
    return indexedServices.filter((entry) => {
      if (categoryFilter !== 'all' && entry.service.categoryId !== categoryFilter) {
        return false;
      }
      if (searchTokens.length > 0) {
        for (const token of searchTokens) {
          if (!entry.searchCorpus.includes(token)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [indexedServices, categoryFilter, searchTokens]);

  const changedIds = useMemo(() => {
    const ids: string[] = [];
    for (const svc of services) {
      const d = drafts[svc.id];
      if (!d) continue;
      const newP = Number(d.price);
      const newO = d.offerPrice.trim() ? Number(d.offerPrice) : null;
      const oldO = svc.offerPrice ?? null;
      if (newP !== svc.price || newO !== oldO) {
        ids.push(svc.id);
      }
    }
    return ids;
  }, [services, drafts]);

  const updateRowPrice = (id: string, nextPrice: string) => {
    setDrafts((prev) => {
      const row = prev[id] || { price: '0', offerPrice: '', discountPercent: '' };
      return { ...prev, [id]: { ...row, price: nextPrice } };
    });
  };

  const updateRowOfferPrice = (id: string, nextOffer: string) => {
    setDrafts((prev) => {
      const row = prev[id] || { price: '0', offerPrice: '', discountPercent: '' };
      const base = Number(row.price);
      const off = Number(nextOffer);
      const pct =
        nextOffer.trim() && base > 0 && !Number.isNaN(off) && off < base
          ? String(Math.round(((base - off) / base) * 100))
          : '';
      return { ...prev, [id]: { ...row, offerPrice: nextOffer, discountPercent: pct } };
    });
  };

  const applyDiscountPercent = (id: string, pctStr: string) => {
    setDrafts((prev) => {
      const row = prev[id] || { price: '0', offerPrice: '', discountPercent: '' };
      const base = Number(row.price);
      const pct = Number(pctStr);
      if (!pctStr.trim() || Number.isNaN(pct) || pct <= 0 || pct >= 100 || base <= 0) {
        return { ...prev, [id]: { ...row, discountPercent: pctStr, offerPrice: '' } };
      }
      const computedOffer = Math.round(base * (1 - pct / 100));
      return {
        ...prev,
        [id]: { ...row, discountPercent: pctStr, offerPrice: String(computedOffer) },
      };
    });
  };

  const handleSaveChanges = async (targetIds: string[]) => {
    const payload: {
      id: string;
      name: string;
      oldPrice: number;
      newPrice: number;
      newOfferPrice: number | null;
    }[] = [];

    for (const id of targetIds) {
      const svc = services.find((s) => s.id === id);
      const d = drafts[id];
      if (!svc || !d) continue;

      const newP = Number(d.price);
      if (Number.isNaN(newP) || newP < 0) {
        onNotify('error', `Invalid regular price for "${svc.name}".`);
        return;
      }
      const newO = d.offerPrice.trim() ? Number(d.offerPrice) : null;
      if (newO !== null && (Number.isNaN(newO) || newO < 0 || newO >= newP)) {
        onNotify('error', `Offer price for "${svc.name}" must be less than regular price.`);
        return;
      }
      payload.push({
        id: svc.id,
        name: svc.name,
        oldPrice: svc.price,
        newPrice: newP,
        newOfferPrice: newO,
      });
    }

    if (payload.length === 0) return;

    setSavingAll(true);
    try {
      await batchUpdatePrices(payload);
      onNotify(
        'success',
        `Saved ${payload.length} service price update${payload.length > 1 ? 's' : ''} to live customer menu.`
      );
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setSavingAll(false);
    }
  };

  const resetAllDrafts = () => {
    const reset: Record<string, DraftPriceRow> = {};
    for (const s of services) {
      const hasDiscount = s.offerPrice !== null && s.offerPrice !== undefined && s.price > 0;
      const pct = hasDiscount ? Math.round(((s.price - s.offerPrice!) / s.price) * 100) : 0;
      reset[s.id] = {
        price: String(s.price),
        offerPrice: s.offerPrice !== null && s.offerPrice !== undefined ? String(s.offerPrice) : '',
        discountPercent: pct > 0 ? String(pct) : '',
      };
    }
    setDrafts(reset);
  };

  const openInlinePrice = (svc: SalonService) => {
    if (inlineSavingId) return;
    setInlinePriceId(svc.id);
    setInlinePriceValue(String(svc.price));
  };

  const cancelInlinePrice = () => {
    if (inlineSavingId) return;
    setInlinePriceId(null);
    setInlinePriceValue('');
  };

  const commitInlinePrice = async (svc: SalonService) => {
    const parsed = Number(inlinePriceValue);
    if (
      !inlinePriceValue.trim() ||
      Number.isNaN(parsed) ||
      parsed < 0 ||
      parsed > BLUEPRINT_LIMITS.PRICE_MAX
    ) {
      onNotify('error', 'Please enter a valid price (₹0 – ₹10,00,000).');
      return;
    }
    if (parsed === svc.price) {
      setInlinePriceId(null);
      return;
    }
    const adjustedOffer =
      svc.offerPrice !== null && svc.offerPrice !== undefined && svc.offerPrice < parsed
        ? svc.offerPrice
        : null;

    setInlineSavingId(svc.id);
    try {
      await batchUpdatePrices([
        {
          id: svc.id,
          name: svc.name,
          oldPrice: svc.price,
          newPrice: parsed,
          newOfferPrice: adjustedOffer,
        },
      ]);
      onNotify('success', `Updated "${svc.name}" price to ${formatINR(parsed)}.`);
      setInlinePriceId(null);
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setInlineSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-t-text">Price Management</h2>
          <p className="text-xs sm:text-sm text-t-text-muted">
            Real-time search across service name, category, and description with live match highlighting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {changedIds.length > 0 && (
            <button
              type="button"
              onClick={resetAllDrafts}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-control bg-t-elevated border border-t-border text-xs font-medium text-t-text-secondary hover:text-t-text cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Discard ({changedIds.length})
            </button>
          )}
          <button
            type="button"
            disabled={changedIds.length === 0 || savingAll}
            onClick={() => handleSaveChanges(changedIds)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-control bg-t-accent hover:bg-t-accent-hover disabled:opacity-45 text-t-accent-contrast text-sm font-semibold transition-colors cursor-pointer"
          >
            {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Changes ({changedIds.length})
          </button>
        </div>
      </div>

      {/* Real-Time Search & Filter Bar */}
      <div className="p-4 rounded-theme bg-t-surface border border-t-border flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-t-text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by service, category, or description (e.g., keratin, burgundy, beard)..."
            aria-label="Real-time price manager search"
            className="w-full pl-10 pr-9 py-2 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text placeholder:text-t-text-subtle"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-t-text-subtle hover:text-t-text p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter price list by category"
          className="px-3.5 py-2 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <span className="font-mono-num text-xs text-t-text-muted whitespace-nowrap shrink-0 px-1">
          {filtered.length} / {services.length} services
        </span>
      </div>

      {/* High-Density Price Table */}
      {filtered.length === 0 ? (
        <div className="p-10 rounded-theme bg-t-surface border border-t-border text-center">
          <p className="text-sm text-t-text-muted mb-3">
            No services match &ldquo;{deferredQuery || 'selected category'}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
            }}
            className="px-4 py-2 rounded-control bg-t-accent text-t-accent-contrast text-xs font-semibold cursor-pointer"
          >
            Reset Search & Filters
          </button>
        </div>
      ) : (
        <div className="rounded-theme bg-t-surface border border-t-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-t-border bg-t-sidebar text-xs font-medium text-t-text-muted">
                  <th className="py-3.5 px-4">Service &amp; Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Current Price</th>
                  <th className="py-3.5 px-4">New Price (₹)</th>
                  <th className="py-3.5 px-4">Discount %</th>
                  <th className="py-3.5 px-4">Offer Price (₹)</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Row Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-t-border text-sm">
                {filtered.map(({ service: svc, categoryName, description }) => {
                  const d = drafts[svc.id] || {
                    price: String(svc.price),
                    offerPrice: '',
                    discountPercent: '',
                  };
                  const isDirty = changedIds.includes(svc.id);
                  const newP = Number(d.price);

                  return (
                    <tr
                      key={svc.id}
                      className={`transition-colors ${
                        isDirty ? 'bg-t-dirty-row' : 'hover:bg-t-elevated/70'
                      }`}
                    >
                      <td className="py-3 px-4 min-w-[220px] max-w-sm">
                        <p className="font-semibold text-t-text">
                          <HighlightText text={svc.name} regex={highlightRegex} />
                        </p>
                        {description && (
                          <p className="text-xs text-t-text-subtle mt-0.5 line-clamp-2">
                            <HighlightText text={description} regex={highlightRegex} />
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs text-t-accent whitespace-nowrap">
                        <HighlightText text={categoryName} regex={highlightRegex} />
                      </td>

                      <td className="relative py-3 px-4 text-right font-mono-num whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openInlinePrice(svc)}
                          title="Click to edit price inline"
                          className="inline-flex flex-col items-end rounded px-1.5 py-0.5 -mx-1.5 hover:bg-t-elevated transition-colors cursor-pointer"
                        >
                          <span
                            className={
                              isDirty
                                ? 'text-t-text-subtle line-through'
                                : 'text-t-text hover:text-t-accent'
                            }
                          >
                            {formatINR(svc.price)}
                          </span>
                          {isDirty && !Number.isNaN(newP) && (
                            <div className="text-xs text-t-accent font-semibold">
                              → {formatINR(newP)}
                            </div>
                          )}
                        </button>

                        {inlinePriceId === svc.id && (
                          <div
                            className="absolute inset-y-1 right-1 z-20 min-w-[168px] flex items-center justify-end gap-1 px-2 bg-t-sidebar/95 border border-t-accent rounded-control shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs text-t-accent font-semibold select-none">₹</span>
                            <input
                              type="number"
                              min={0}
                              max={BLUEPRINT_LIMITS.PRICE_MAX}
                              autoFocus
                              value={inlinePriceValue}
                              disabled={inlineSavingId === svc.id}
                              onChange={(e) => setInlinePriceValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  void commitInlinePrice(svc);
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  cancelInlinePrice();
                                }
                              }}
                              aria-label={`Inline price editor for ${svc.name}`}
                              className="w-20 px-2 py-1 rounded bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-right font-mono-num text-xs text-t-text"
                            />
                            <button
                              type="button"
                              disabled={inlineSavingId === svc.id}
                              onClick={() => void commitInlinePrice(svc)}
                              aria-label="Save price"
                              className="p-1 rounded bg-t-accent hover:bg-t-accent-hover disabled:opacity-50 text-t-accent-contrast cursor-pointer shrink-0"
                            >
                              {inlineSavingId === svc.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={inlineSavingId === svc.id}
                              onClick={cancelInlinePrice}
                              aria-label="Cancel price edit"
                              className="p-1 rounded bg-t-elevated hover:bg-t-surface text-t-text-muted hover:text-t-text cursor-pointer shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={0}
                          value={d.price}
                          onChange={(e) => updateRowPrice(svc.id, e.target.value)}
                          aria-label={`New price for ${svc.name}`}
                          className="w-28 px-3 py-1.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-sm text-t-text"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          placeholder="0%"
                          value={d.discountPercent}
                          onChange={(e) => applyDiscountPercent(svc.id, e.target.value)}
                          aria-label={`Discount percent for ${svc.name}`}
                          className="w-20 px-2.5 py-1.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-sm text-t-text"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={0}
                          placeholder="None"
                          value={d.offerPrice}
                          onChange={(e) => updateRowOfferPrice(svc.id, e.target.value)}
                          aria-label={`Offer price for ${svc.name}`}
                          className="w-28 px-3 py-1.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-sm text-t-accent"
                        />
                      </td>

                      <td className="py-3 px-4 font-mono-num text-xs text-t-text-subtle whitespace-nowrap">
                        {formatTimestamp(svc.updatedAt)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          disabled={!isDirty || savingAll}
                          onClick={() => handleSaveChanges([svc.id])}
                          className="px-3 py-1.5 rounded-control bg-t-accent hover:bg-t-accent-hover disabled:opacity-30 text-t-accent-contrast text-xs font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
