import { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowUpRight,
  MapPin,
  MessageCircle,
  Phone,
  X,
} from 'lucide-react';
import { DEFAULT_SALON_SETTINGS } from '../lib/defaults';
import type { SalonSettings } from '../types/salon';

interface QuickActionsWidgetProps {
  settings: SalonSettings;
  hasBottomBanner?: boolean;
}

function sanitizeTelHref(raw?: string | null): string | null {
  const cleaned = (raw || '').trim().replace(/[^0-9+]/g, '');
  if (!cleaned) return null;
  return `tel:${cleaned}`;
}

function sanitizeWhatsAppHref(whatsapp?: string | null, fallbackPhone?: string | null): string | null {
  const digits = (whatsapp || fallbackPhone || '').replace(/[^0-9]/g, '');
  if (!digits) return null;
  // Direct blank WhatsApp chat without pre-filled message text
  return `https://wa.me/${digits}`;
}

function sanitizeHttpUrl(raw?: string | null): string | null {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

export function QuickActionsWidget({
  settings,
  hasBottomBanner = false,
}: QuickActionsWidgetProps) {
  const [open, setOpen] = useState(false);
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  const whatsappHref = sanitizeWhatsAppHref(
    settings.whatsapp || DEFAULT_SALON_SETTINGS.whatsapp,
    settings.phone || DEFAULT_SALON_SETTINGS.phone
  );

  const primaryPhoneLabel = (settings.phone || DEFAULT_SALON_SETTINGS.phone || '').trim();
  const primaryPhoneHref = sanitizeTelHref(primaryPhoneLabel);

  const secondaryPhoneLabel = (settings.secondaryPhone || '').trim();
  const secondaryPhoneHref =
    secondaryPhoneLabel && secondaryPhoneLabel !== primaryPhoneLabel
      ? sanitizeTelHref(secondaryPhoneLabel)
      : null;

  const mapsHref = sanitizeHttpUrl(settings.mapsUrl || DEFAULT_SALON_SETTINGS.mapsUrl);

  const openingHours =
    (settings.openingHours || DEFAULT_SALON_SETTINGS.openingHours || '').trim();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        desktopContainerRef.current &&
        !desktopContainerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const availableMobileCount = [whatsappHref, primaryPhoneHref, mapsHref].filter(Boolean).length;
  if (availableMobileCount === 0) {
    return null;
  }

  const mobileGridClass =
    availableMobileCount === 3
      ? 'grid-cols-3'
      : availableMobileCount === 2
        ? 'grid-cols-2'
        : 'grid-cols-1';

  return (
    <>
      {/* Desktop & Tablet: Compact Floating Button + Expandable Popover */}
      <div
        ref={desktopContainerRef}
        className={`hidden md:flex flex-col items-end gap-3 fixed right-6 z-40 ${
          hasBottomBanner ? 'bottom-20' : 'bottom-6'
        }`}
      >
        <div
          id={popoverId}
          role="region"
          aria-label="Salon quick contact actions"
          aria-hidden={!open}
          className={`w-80 rounded-theme bg-t-surface border border-t-border shadow-2xl overflow-hidden origin-bottom-right transition-[opacity,transform] duration-200 ease-out ${
            open
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
              : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
          }`}
        >
          <div className="px-4 py-3.5 border-b border-t-border bg-t-elevated/60">
            <p className="text-sm font-semibold text-t-text truncate">
              {settings.salonName || DEFAULT_SALON_SETTINGS.salonName}
            </p>
            {openingHours && (
              <p className="text-xs text-t-text-muted mt-0.5 truncate">{openingHours}</p>
            )}
          </div>

          <div className="p-2 space-y-1">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t-accent"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span className="min-w-0 text-left">
                    <span className="block text-xs font-semibold leading-tight whitespace-nowrap">
                      Book Appointment
                    </span>
                    <span className="block text-[11px] opacity-85 truncate mt-0.5">
                      Chat on WhatsApp
                    </span>
                  </span>
                </span>
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              </a>
            )}

            {primaryPhoneHref && (
              <div className="rounded-control border border-t-border bg-t-canvas/60 overflow-hidden">
                <a
                  href={primaryPhoneHref}
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 px-3.5 py-3 hover:bg-t-elevated text-t-text transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-t-accent"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Phone className="w-4 h-4 text-t-accent shrink-0" />
                    <span className="min-w-0 text-left">
                      <span className="block text-xs font-semibold leading-tight whitespace-nowrap">
                        Call Salon
                      </span>
                      <span className="block font-mono-num text-[11px] text-t-text-muted mt-0.5 truncate">
                        {primaryPhoneLabel}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-t-text-subtle shrink-0" />
                </a>

                {secondaryPhoneHref && (
                  <a
                    href={secondaryPhoneHref}
                    tabIndex={open ? 0 : -1}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 px-3.5 py-2 border-t border-t-border hover:bg-t-elevated text-[11px] text-t-text-muted hover:text-t-text transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-t-accent"
                  >
                    <span className="truncate">
                      Landline · <span className="font-mono-num">{secondaryPhoneLabel}</span>
                    </span>
                    <span className="text-t-accent font-medium whitespace-nowrap shrink-0">
                      Dial
                    </span>
                  </a>
                )}
              </div>
            )}

            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-control border border-t-border bg-t-canvas/60 hover:bg-t-elevated text-t-text transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t-accent"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <MapPin className="w-4 h-4 text-t-accent shrink-0" />
                  <span className="min-w-0 text-left">
                    <span className="block text-xs font-semibold leading-tight whitespace-nowrap">
                      Google Maps Directions
                    </span>
                    <span className="block text-[11px] text-t-text-muted mt-0.5 truncate">
                      White Town, Puducherry
                    </span>
                  </span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-t-text-subtle shrink-0" />
              </a>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls={popoverId}
          aria-label={open ? 'Close Quick Actions menu' : 'Open Quick Actions menu'}
          className="min-h-[48px] inline-flex items-center gap-2.5 px-5 py-3 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-xs font-semibold tracking-wide shadow-xl border border-t-border/20 transition-transform duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t-accent"
        >
          {open ? (
            <>
              <X className="w-4 h-4 shrink-0" />
              <span>Close</span>
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Quick Actions</span>
            </>
          )}
        </button>
      </div>

      {/* Mobile: Compact Thumb-Zone Fixed Action Bar */}
      <nav
        aria-label="Quick salon contact actions"
        className={`md:hidden fixed inset-x-0 z-40 bg-t-surface/95 backdrop-blur-md border-t border-t-border shadow-2xl px-3 py-2 ${
          hasBottomBanner ? 'bottom-16' : 'bottom-0'
        }`}
      >
        <div className={`grid ${mobileGridClass} gap-2 max-w-lg mx-auto`}>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-xs font-semibold whitespace-nowrap transition-transform duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t-accent"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Book</span>
            </a>
          )}

          {primaryPhoneHref && (
            <a
              href={primaryPhoneHref}
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-t-text text-xs font-semibold whitespace-nowrap transition-transform duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t-accent"
            >
              <Phone className="w-4 h-4 text-t-accent shrink-0" />
              <span>Call Salon</span>
            </a>
          )}

          {mapsHref && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-t-text text-xs font-semibold whitespace-nowrap transition-transform duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t-accent"
            >
              <MapPin className="w-4 h-4 text-t-accent shrink-0" />
              <span>Directions</span>
            </a>
          )}
        </div>
      </nav>
    </>
  );
}
