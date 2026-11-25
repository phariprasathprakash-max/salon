import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Loader2,
  Printer,
  QrCode,
  RotateCcw,
  Save,
  ShieldCheck,
} from 'lucide-react';
import {
  buildPublicOnlyWebsiteUrl,
  isPrivateDevOrLocalUrl,
  PUBLIC_SHARED_APP_ORIGIN,
} from '../lib/defaults';
import { parseFirestoreErrorMessage } from '../lib/firebase';
import { saveSalonSettings } from '../lib/salonApi';
import type { SalonSettings } from '../types/salon';

interface QrCodeManagerProps {
  settings: SalonSettings;
  onNotify: (type: 'success' | 'error', msg: string) => void;
  onPreviewPublicQr?: () => void;
}

export function QrCodeManager({
  settings,
  onNotify,
  onPreviewPublicQr,
}: QrCodeManagerProps) {
  const [customUrl, setCustomUrl] = useState(() =>
    buildPublicOnlyWebsiteUrl(settings.publicCustomerUrl)
  );
  const [copied, setCopied] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomUrl(buildPublicOnlyWebsiteUrl(settings.publicCustomerUrl));
  }, [settings.publicCustomerUrl]);

  // Always converts private ais-dev/localhost URLs to the public Shared App URL,
  // strips /admin, and enforces ?public=1 so scanning works on ANY customer phone.
  const publicWebsiteQrUrl = buildPublicOnlyWebsiteUrl(
    customUrl.trim() || settings.publicCustomerUrl
  );
  const inputWasRewritten =
    Boolean(customUrl.trim()) && isPrivateDevOrLocalUrl(customUrl.trim());

  const handleSavePublicUrl = async () => {
    setSavingUrl(true);
    try {
      const normalized = buildPublicOnlyWebsiteUrl(customUrl);
      await saveSalonSettings({
        ...settings,
        publicCustomerUrl: normalized,
      });
      setCustomUrl(normalized);
      onNotify('success', 'Saved scannable Public Website QR URL to live settings.');
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setSavingUrl(false);
    }
  };

  const handleResetToLiveSharedUrl = () => {
    const official = buildPublicOnlyWebsiteUrl(PUBLIC_SHARED_APP_ORIGIN);
    setCustomUrl(official);
    onNotify('success', 'Reset to the live public Shared App URL.');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicWebsiteQrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      onNotify('success', 'Public-only website link copied to clipboard.');
    } catch {
      onNotify('error', 'Failed to copy URL.');
    }
  };

  const handleDownloadQrOnly = () => {
    const qrCanvas = canvasWrapRef.current?.querySelector('canvas');
    if (!qrCanvas) {
      onNotify('error', 'QR canvas not ready yet.');
      return;
    }

    const padded = document.createElement('canvas');
    padded.width = 680;
    padded.height = 680;
    const ctx = padded.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, padded.width, padded.height);
    ctx.drawImage(qrCanvas, 40, 40, 600, 600);

    const link = document.createElement('a');
    link.download = 'inscape-public-website-qr.png';
    link.href = padded.toDataURL('image/png');
    link.click();
    onNotify('success', 'Downloaded scannable Public Website QR PNG.');
  };

  const handleDownloadStandee = () => {
    const qrCanvas = canvasWrapRef.current?.querySelector('canvas');
    if (!qrCanvas) {
      onNotify('error', 'QR canvas not ready yet.');
      return;
    }

    const poster = document.createElement('canvas');
    poster.width = 900;
    poster.height = 1280;
    const ctx = poster.getContext('2d');
    if (!ctx) return;

    // Printable luxury obsidian & 24K gold standee card
    ctx.fillStyle = '#090807';
    ctx.fillRect(0, 0, poster.width, poster.height);

    ctx.strokeStyle = '#E5BE5C';
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, poster.width - 72, poster.height - 72);

    ctx.fillStyle = '#E5BE5C';
    ctx.font = 'bold 52px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(settings.salonName || 'INSCAPE your dream salon', poster.width / 2, 158);

    ctx.fillStyle = '#DCD4C8';
    ctx.font = '23px sans-serif';
    ctx.fillText('WOMEN & MEN LIVE RATE CARD · ALL PRICES INCL. OF GST', poster.width / 2, 214);

    // High-contrast white quiet zone around QR code for instant camera scanning
    const qrBoxSize = 540;
    const qrX = (poster.width - qrBoxSize) / 2;
    const qrY = 268;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(qrX, qrY, qrBoxSize, qrBoxSize);
    ctx.drawImage(qrCanvas, qrX + 20, qrY + 20, qrBoxSize - 40, qrBoxSize - 40);

    ctx.fillStyle = '#FBF8F3';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('Scan to Open Full Salon Website', poster.width / 2, 892);

    ctx.fillStyle = '#E5BE5C';
    ctx.font = '21px sans-serif';
    ctx.fillText('Hair · Colour · Spa · Facials · Nails · Make-Up · Offers', poster.width / 2, 938);

    ctx.fillStyle = '#B6ACA0';
    ctx.font = '21px sans-serif';
    ctx.fillText(
      (settings.address || '36, Rue, R. Manakkula Vinayagar St, White Town, Puducherry').slice(0, 68),
      poster.width / 2,
      998
    );
    ctx.fillText(
      `${settings.phone || '+91 88830 35558'}  ·  ${settings.openingHours || '10:00 AM – 9:00 PM'}`,
      poster.width / 2,
      1040
    );

    ctx.fillStyle = '#E5BE5C';
    ctx.font = '15px monospace';
    ctx.fillText(publicWebsiteQrUrl, poster.width / 2, 1178);

    const link = document.createElement('a');
    link.download = 'inscape-public-website-qr-standee.png';
    link.href = poster.toDataURL('image/png');
    link.click();
    onNotify('success', 'Downloaded printable Public Website QR standee PNG.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-t-text">
            Full Public Website QR Code
          </h2>
          <p className="text-xs sm:text-sm text-t-text-muted mt-1">
            One scannable QR code pointing directly to your public Shared App URL — locked to the
            customer view with zero Admin Portal access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href={publicWebsiteQrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-xs font-semibold whitespace-nowrap shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            Open Scanned Link
          </a>
          {onPreviewPublicQr && (
            <button
              type="button"
              onClick={onPreviewPublicQr}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-t-accent" />
              In-App QR Preview
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 p-6 rounded-theme bg-t-surface border border-t-border space-y-6">
          <div className="p-4 rounded-control bg-t-canvas border border-t-accent/35 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-t-accent shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-t-text">
                Public Shared URL + Customer-Only Lock (?public=1)
              </p>
              <p className="text-xs text-t-text-muted leading-relaxed">
                This QR code automatically uses your public Shared App address (never the private
                developer preview link) so every customer phone can scan and load the full salon
                rate card immediately, with Admin Portal completely hidden.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-medium text-t-text-secondary">
                Public Website Base URL (optional custom domain or live shared link)
              </label>
              <button
                type="button"
                onClick={handleResetToLiveSharedUrl}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-t-accent hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Use Live Public URL
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder={PUBLIC_SHARED_APP_ORIGIN}
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-xs sm:text-sm text-t-text"
              />
              <button
                type="button"
                disabled={savingUrl}
                onClick={handleSavePublicUrl}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                {savingUrl ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-t-accent" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-t-accent" />
                )}
                Save URL
              </button>
            </div>
            {inputWasRewritten && (
              <p className="text-[11px] text-t-warn-text">
                Detected a private preview/local address — automatically upgraded to your public
                Shared App link below so customer phones can scan it.
              </p>
            )}
            <p className="text-[11px] font-mono-num text-t-accent break-all">
              Encoded Scannable QR URL: {publicWebsiteQrUrl}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleDownloadStandee}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Standee PNG
            </button>
            <button
              type="button"
              onClick={handleDownloadQrOnly}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text whitespace-nowrap cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-t-accent" />
              Download QR Only PNG
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-4 h-4 text-t-accent" />
              Print Card
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text whitespace-nowrap cursor-pointer"
            >
              {copied ? (
                <Check className="w-4 h-4 text-t-success-text" />
              ) : (
                <Copy className="w-4 h-4 text-t-accent" />
              )}
              Copy Public Link
            </button>
          </div>

          <div className="pt-5 border-t border-t-border space-y-3">
            <p className="text-xs font-semibold text-t-text">
              What Opens When Clients Scan This Single QR Code
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-t-text-secondary">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-t-accent shrink-0 mt-0.5" />
                <span>Clean Women &amp; Men live rate card (service name &amp; price)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-t-accent shrink-0 mt-0.5" />
                <span>Active special offers, salon insights &amp; advanced themes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-t-accent shrink-0 mt-0.5" />
                <span>Instant WhatsApp booking, phone call &amp; Google Maps directions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-t-accent shrink-0 mt-0.5" />
                <span>Admin Portal &amp; login completely excluded from public view</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-t-border text-xs text-t-text-muted space-y-1">
            <p className="font-semibold text-t-text">Reception Details Printed on Standee</p>
            <p>{settings.salonName}</p>
            <p>{settings.address}</p>
            <p className="font-mono-num">
              {settings.phone}
              {settings.secondaryPhone ? ` · ${settings.secondaryPhone}` : ''}
            </p>
          </div>
        </div>

        {/* Standee Preview */}
        <div className="lg:col-span-5 p-7 sm:p-8 rounded-theme bg-t-surface border border-t-border flex flex-col items-center text-center space-y-5">
          <div className="space-y-1">
            <p className="font-display text-2xl font-bold text-t-text">{settings.salonName}</p>
            <p className="text-xs text-t-accent font-semibold">
              Scan for Full Public Website &amp; Rate Card
            </p>
            <p className="text-[11px] text-t-text-muted">
              Public Customer View Only · Admin Excluded
            </p>
          </div>

          {/* Pure black on pure white with ISO quiet zone (includeMargin) & Level M for fast scanning */}
          <div className="p-3 rounded-theme bg-[#FFFFFF] border border-t-border shadow-md">
            <QRCodeSVG
              value={publicWebsiteQrUrl}
              size={240}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="M"
              includeMargin={true}
            />
          </div>

          {/* Off-screen canvas (never display:none) so PNG & Standee downloads always render cleanly */}
          <div
            ref={canvasWrapRef}
            className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none"
            aria-hidden="true"
          >
            <QRCodeCanvas
              value={publicWebsiteQrUrl}
              size={600}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="M"
              includeMargin={true}
            />
          </div>

          <div className="w-full pt-2 border-t border-t-border space-y-2.5">
            <a
              href={publicWebsiteQrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 font-mono-num text-xs text-t-text-muted hover:text-t-accent break-all"
            >
              <span>{publicWebsiteQrUrl}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
            <p className="text-[11px] text-t-text-subtle">
              Point any phone camera at this QR code to open your public salon website directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
