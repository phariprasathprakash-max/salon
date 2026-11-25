import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Check,
  Copy,
  Database,
  Download,
  ExternalLink,
  Globe,
  IndianRupee,
  Link2,
  Loader2,
  QrCode,
  Scissors,
  Shield,
  Tag,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  buildAdminWebsiteUrl,
  buildPublicOnlyWebsiteUrl,
  formatINR,
  formatTimestamp,
  getOfferStatusLabel,
} from '../lib/defaults';
import { parseFirestoreErrorMessage } from '../lib/firebase';
import { generateDashboardSummaryPdf } from '../lib/reportPdf';
import { seedInitialSalonData } from '../lib/salonApi';
import type {
  ActivityLogEntry,
  SalonCategory,
  SalonOffer,
  SalonService,
} from '../types/salon';

interface AdminDashboardViewProps {
  salonName?: string;
  publicCustomerUrl?: string;
  categories: SalonCategory[];
  services: SalonService[];
  offers: SalonOffer[];
  logs: ActivityLogEntry[];
  onNavigate: (tab: string) => void;
  onPreviewCustomer?: () => void;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

interface WeeklyProjectionPoint {
  day: string;
  earnings: number;
  bookings: number;
  trendNote: string;
}

const WEEKLY_TREND_CURVE: { day: string; factor: number; trendNote: string }[] = [
  { day: 'Mon', factor: 0.62, trendNote: 'Quiet weekday' },
  { day: 'Tue', factor: 0.85, trendNote: 'Midweek steady' },
  { day: 'Wed', factor: 0.95, trendNote: 'Midweek uplift' },
  { day: 'Thu', factor: 1.08, trendNote: 'Pre-weekend' },
  { day: 'Fri', factor: 1.32, trendNote: 'Weekend build' },
  { day: 'Sat', factor: 1.68, trendNote: 'Peak footfall' },
  { day: 'Sun', factor: 1.48, trendNote: 'Sunday rush' },
];

function formatCompactINR(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${Math.round(value / 1000)}k`;
  return `₹${value}`;
}

interface EarningsTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: WeeklyProjectionPoint }>;
}

function EarningsChartTooltip({ active, payload }: EarningsTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="px-3.5 py-2.5 rounded-control bg-t-elevated border border-t-border shadow-lg text-xs space-y-1">
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-t-text">{point.day}</span>
        <span className="text-t-text-subtle">{point.trendNote}</span>
      </div>
      <p className="font-mono-num text-sm font-bold text-t-accent">
        {formatINR(point.earnings)}
      </p>
      <p className="font-mono-num text-[11px] text-t-text-secondary">
        ~{point.bookings} projected bookings
      </p>
    </div>
  );
}

export function AdminDashboardView({
  salonName,
  publicCustomerUrl,
  categories,
  services,
  offers,
  logs,
  onNavigate,
  onPreviewCustomer,
  onNotify,
}: AdminDashboardViewProps) {
  const [seeding, setSeeding] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [copiedSite, setCopiedSite] = useState<'public' | 'admin' | null>(null);

  const livePublicUrl = useMemo(
    () => buildPublicOnlyWebsiteUrl(publicCustomerUrl),
    [publicCustomerUrl]
  );
  const liveAdminUrl = useMemo(
    () => buildAdminWebsiteUrl(publicCustomerUrl),
    [publicCustomerUrl]
  );

  const handleCopyWebsiteLink = async (kind: 'public' | 'admin', url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSite(kind);
      setTimeout(() => setCopiedSite(null), 1800);
      onNotify(
        'success',
        kind === 'public'
          ? 'Public Customer Website link copied.'
          : 'Admin Management Website link copied.'
      );
    } catch {
      onNotify('error', 'Failed to copy link.');
    }
  };

  const activeServices = useMemo(
    () => services.filter((s) => s.isActive),
    [services]
  );

  const activeServicesCount = activeServices.length;

  const currentOffersCount = useMemo(
    () => offers.filter((o) => getOfferStatusLabel(o) === 'Active').length,
    [offers]
  );

  const todayActivityCount = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    return logs.filter((entry) => {
      if (!entry.createdAt || typeof entry.createdAt.toDate !== 'function') return false;
      const dt = entry.createdAt.toDate();
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    }).length;
  }, [logs]);

  const weeklyProjection = useMemo(() => {
    if (activeServices.length === 0) {
      return {
        points: [] as WeeklyProjectionPoint[],
        weeklyTotal: 0,
        totalBookings: 0,
        weightedAvgTicket: 0,
      };
    }

    // Weight standard & featured services higher than high-ticket bridal couture packages
    let weightedSum = 0;
    let totalWeight = 0;
    for (const svc of activeServices) {
      const effectivePrice =
        svc.offerPrice !== null && svc.offerPrice !== undefined && svc.offerPrice > 0
          ? svc.offerPrice
          : svc.price;
      const tierWeight = effectivePrice > 6000 ? 0.35 : svc.isFeatured ? 1.45 : 1.0;
      weightedSum += effectivePrice * tierWeight;
      totalWeight += tierWeight;
    }

    const weightedAvgTicket = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    const baseDailyBookings = Math.max(5, Math.min(18, 4 + activeServices.length));
    const offerLift = 1 + Math.min(currentOffersCount, 3) * 0.04;
    const recentUpdatesCount = Math.min(logs.length, 10);
    const momentumLift = 1 + recentUpdatesCount * 0.005;

    const points: WeeklyProjectionPoint[] = WEEKLY_TREND_CURVE.map((slot) => {
      const bookings = Math.max(
        2,
        Math.round(baseDailyBookings * slot.factor * offerLift)
      );
      const rawEarnings = bookings * weightedAvgTicket * momentumLift;
      const earnings = Math.max(0, Math.round(rawEarnings / 50) * 50);
      return {
        day: slot.day,
        earnings,
        bookings,
        trendNote: slot.trendNote,
      };
    });

    const weeklyTotal = points.reduce((acc, p) => acc + p.earnings, 0);
    const totalBookings = points.reduce((acc, p) => acc + p.bookings, 0);

    return {
      points,
      weeklyTotal,
      totalBookings,
      weightedAvgTicket,
    };
  }, [activeServices, currentOffersCount, logs.length]);

  const featuredServices = useMemo(
    () => activeServices.filter((s) => s.isFeatured).slice(0, 5),
    [activeServices]
  );

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      await seedInitialSalonData();
      onNotify(
        'success',
        'Loaded all 17 categories and 204 official Women & Men rate card services & prices.'
      );
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setSeeding(false);
    }
  };

  const handleDownloadReport = () => {
    setDownloadingReport(true);
    try {
      const filename = generateDashboardSummaryPdf({
        salonName,
        categoriesCount: categories.length,
        activeServicesCount,
        totalServicesCount: services.length,
        currentOffersCount,
        totalOffersCount: offers.length,
        todayActivityCount,
        totalLogsCount: logs.length,
        weeklyProjection,
        featuredServices,
        recentLogs: logs.slice(0, 6),
      });
      onNotify('success', `Downloaded PDF summary report (${filename}).`);
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Unable to generate PDF report.'
      );
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-t-text">
            Salon Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-t-text-muted mt-1">
            Live overview of services, promotional offers, and daily workspace activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {services.length < 50 && (
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedDefaults}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-control bg-t-elevated border border-t-accent/60 hover:border-t-accent text-xs font-semibold text-t-text cursor-pointer whitespace-nowrap shrink-0"
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 animate-spin text-t-accent" />
              ) : (
                <Database className="w-4 h-4 text-t-accent" />
              )}
              Load Official Menu (204 Services)
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('qr')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text cursor-pointer whitespace-nowrap shrink-0"
          >
            <QrCode className="w-4 h-4 text-t-accent" />
            Full Website QR
          </button>
          <button
            type="button"
            disabled={downloadingReport}
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-control bg-t-elevated border border-t-border hover:border-t-accent disabled:opacity-60 text-xs font-semibold text-t-text cursor-pointer whitespace-nowrap shrink-0"
          >
            {downloadingReport ? (
              <Loader2 className="w-4 h-4 animate-spin text-t-accent" />
            ) : (
              <Download className="w-4 h-4 text-t-accent" />
            )}
            Download Report
          </button>
          <button
            type="button"
            onClick={() => onNavigate('prices')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            <IndianRupee className="w-4 h-4" />
            Quick Price Editor
          </button>
        </div>
      </div>

      {/* Two Interconnected Websites — Live Firestore Sync */}
      <section
        aria-label="Interconnected Websites"
        className="rounded-theme bg-t-surface border border-t-border overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-t-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-t-accent shrink-0" />
            <h2 className="text-sm font-semibold text-t-text">
              Two Interconnected Websites · Real-Time Firestore Sync
            </h2>
          </div>
          <span className="text-xs text-t-text-muted">
            Price, service, offer &amp; theme edits sync instantly between both sites
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-t-border">
          <div className="p-5 sm:p-6 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-t-accent">Website 1 · Public Facing</p>
                <h3 className="text-base font-semibold text-t-text mt-0.5">
                  Customer Salon Website (Admin Excluded)
                </h3>
              </div>
              <Globe className="w-5 h-5 text-t-accent shrink-0" />
            </div>
            <p className="font-mono-num text-xs text-t-text-muted break-all">{livePublicUrl}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {onPreviewCustomer && (
                <button
                  type="button"
                  onClick={onPreviewCustomer}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Public Website
                </button>
              )}
              <button
                type="button"
                onClick={() => handleCopyWebsiteLink('public', livePublicUrl)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text whitespace-nowrap cursor-pointer"
              >
                {copiedSite === 'public' ? (
                  <Check className="w-3.5 h-3.5 text-t-success-text" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-t-accent" />
                )}
                Copy Public URL
              </button>
              <button
                type="button"
                onClick={() => onNavigate('qr')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text whitespace-nowrap cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-t-accent" />
                Website QR
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-t-accent">Website 2 · Staff Portal</p>
                <h3 className="text-base font-semibold text-t-text mt-0.5">
                  Admin Management Website (Live Editor)
                </h3>
              </div>
              <Shield className="w-5 h-5 text-t-accent shrink-0" />
            </div>
            <p className="font-mono-num text-xs text-t-text-muted break-all">{liveAdminUrl}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyWebsiteLink('admin', liveAdminUrl)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text whitespace-nowrap cursor-pointer"
              >
                {copiedSite === 'admin' ? (
                  <Check className="w-3.5 h-3.5 text-t-success-text" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-t-accent" />
                )}
                Copy Admin URL
              </button>
              <button
                type="button"
                onClick={() => onNavigate('prices')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text whitespace-nowrap cursor-pointer"
              >
                <IndianRupee className="w-3.5 h-3.5 text-t-accent" />
                Edit Live Prices
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Overview Summary Card */}
      <section
        aria-label="Operational Overview"
        className="rounded-theme bg-t-surface border border-t-border overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-t-border flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-t-text">Operational Overview</h2>
          <span className="font-mono-num text-xs text-t-text-subtle">
            {categories.length} departments configured
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-t-border">
          <div className="p-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-t-text-muted">Active Services</p>
              <p className="font-mono-num text-3xl font-bold text-t-text mt-2">
                {activeServicesCount}
              </p>
              <p className="text-xs text-t-text-subtle mt-1.5">
                {services.length - activeServicesCount} paused · {services.length} total
              </p>
              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-t-accent hover:underline cursor-pointer"
              >
                Manage Services
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <Scissors className="w-5 h-5 text-t-accent shrink-0" />
          </div>

          <div className="p-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-t-text-muted">Current Offers</p>
              <p className="font-mono-num text-3xl font-bold text-t-text mt-2">
                {currentOffersCount}
              </p>
              <p className="text-xs text-t-text-subtle mt-1.5">
                {offers.length} total promotional campaigns
              </p>
              <button
                type="button"
                onClick={() => onNavigate('offers')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-t-accent hover:underline cursor-pointer"
              >
                Manage Offers
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <Tag className="w-5 h-5 text-t-accent shrink-0" />
          </div>

          <div className="p-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-t-text-muted">Today&apos;s Activity</p>
              <p className="font-mono-num text-3xl font-bold text-t-text mt-2">
                {todayActivityCount}
              </p>
              <p className="text-xs text-t-text-subtle mt-1.5">
                {logs.length} total recorded actions
              </p>
              <button
                type="button"
                onClick={() => onNavigate('logs')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-t-accent hover:underline cursor-pointer"
              >
                View Activity Log
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <Activity className="w-5 h-5 text-t-accent shrink-0" />
          </div>
        </div>
      </section>

      {/* Projected Weekly Earnings Chart */}
      <section
        aria-label="Projected Weekly Earnings"
        className="rounded-theme bg-t-surface border border-t-border overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-t-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <TrendingUp className="w-4 h-4 text-t-accent shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-t-text">Projected Weekly Earnings</h2>
              <p className="text-xs text-t-text-subtle mt-0.5">
                {activeServicesCount > 0
                  ? `Based on ${activeServicesCount} active services · ${formatINR(weeklyProjection.weightedAvgTicket)} weighted avg. ticket`
                  : 'Activate or add salon services to generate weekly earnings projections'}
              </p>
            </div>
          </div>

          {activeServicesCount > 0 && (
            <div className="flex items-baseline gap-4 sm:text-right shrink-0">
              <div>
                <span className="font-mono-num text-lg font-bold text-t-accent">
                  {formatINR(weeklyProjection.weeklyTotal)}
                </span>
                <span className="ml-2 font-mono-num text-xs text-t-text-muted">
                  / {weeklyProjection.totalBookings} est. bookings
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6">
          {weeklyProjection.points.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-xs text-t-text-muted">
                No active service prices available to project weekly earnings.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="px-4 py-2 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text cursor-pointer"
              >
                Configure Services
              </button>
            </div>
          ) : (
            <div className="w-full h-[210px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyProjection.points}
                  margin={{ top: 8, right: 10, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="inscapeEarningsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--t-accent)" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="var(--t-accent)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--t-border)"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--t-text-subtle)', fontSize: 11 }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCompactINR}
                    tick={{ fill: 'var(--t-text-subtle)', fontSize: 11 }}
                    width={54}
                  />
                  <Tooltip
                    content={<EarningsChartTooltip />}
                    cursor={{ stroke: 'var(--t-accent)', strokeOpacity: 0.35, strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="var(--t-accent)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#inscapeEarningsFill)"
                    activeDot={{
                      r: 4,
                      fill: 'var(--t-accent)',
                      stroke: 'var(--t-surface)',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Two-Column Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Featured Rate Card Preview */}
        <div className="rounded-theme bg-t-surface border border-t-border overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-t-border flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-t-text">Featured Service Rates</h2>
            <button
              type="button"
              onClick={() => onNavigate('prices')}
              className="text-xs font-semibold text-t-accent hover:underline cursor-pointer"
            >
              Edit Prices
            </button>
          </div>
          {featuredServices.length === 0 ? (
            <div className="p-8 text-center text-xs text-t-text-muted">
              No featured services yet. Add services or load the default catalog.
            </div>
          ) : (
            <div className="divide-y divide-t-border">
              {featuredServices.map((svc) => (
                <div
                  key={svc.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-t-text truncate">{svc.name}</p>
                    <p className="text-xs text-t-text-subtle truncate">{svc.duration}</p>
                  </div>
                  <div className="text-right font-mono-num shrink-0">
                    {svc.offerPrice !== null && svc.offerPrice !== undefined ? (
                      <div>
                        <span className="text-sm font-semibold text-t-accent">
                          {formatINR(svc.offerPrice)}
                        </span>
                        <span className="ml-2 text-xs text-t-text-subtle line-through">
                          {formatINR(svc.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-t-text">
                        {formatINR(svc.price)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Admin Activity */}
        <div className="rounded-theme bg-t-surface border border-t-border overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-t-border flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-t-text">Recent Activity</h2>
            <button
              type="button"
              onClick={() => onNavigate('qr')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-t-accent hover:underline cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              QR Standee
            </button>
          </div>
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-t-text-muted">
              Activity logs will appear here as you edit prices, categories, or offers.
            </div>
          ) : (
            <div className="divide-y divide-t-border">
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} className="px-6 py-3.5 space-y-0.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-t-accent">{log.action}</span>
                    <span className="font-mono-num text-[11px] text-t-text-subtle">
                      {formatTimestamp(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-t-text-secondary line-clamp-1">{log.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
