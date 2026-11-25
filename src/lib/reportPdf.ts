import { jsPDF } from 'jspdf';
import { formatTimestamp } from './defaults';
import type { ActivityLogEntry, SalonService } from '../types/salon';

export interface WeeklyReportPoint {
  day: string;
  earnings: number;
  bookings: number;
  trendNote: string;
}

export interface DashboardPdfReportInput {
  salonName?: string;
  categoriesCount: number;
  activeServicesCount: number;
  totalServicesCount: number;
  currentOffersCount: number;
  totalOffersCount: number;
  todayActivityCount: number;
  totalLogsCount: number;
  weeklyProjection: {
    points: WeeklyReportPoint[];
    weeklyTotal: number;
    totalBookings: number;
    weightedAvgTicket: number;
  };
  featuredServices: SalonService[];
  recentLogs: ActivityLogEntry[];
}

function pdfSafeText(raw: string): string {
  return (raw || '')
    .replace(/₹/g, 'INR ')
    .replace(/→/g, '->')
    .replace(/·/g, '|')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, '-')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatPdfINR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `INR ${safe.toLocaleString('en-IN')}`;
}

function truncateText(text: string, maxChars: number): string {
  const clean = pdfSafeText(text);
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(0, maxChars - 3))}...`;
}

export function generateDashboardSummaryPdf(input: DashboardPdfReportInput): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10);
  const generatedLabel = now.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Header Banner
  doc.setFillColor(27, 19, 15);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.line(0, 34, pageWidth, 34);

  doc.setTextColor(250, 247, 242);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(pdfSafeText(input.salonName || 'INSCAPE your dream salon'), margin, 14);

  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Weekly Earnings & Service Activity Report', margin, 22);

  doc.setTextColor(214, 206, 199);
  doc.setFontSize(8.5);
  doc.text(`Generated: ${pdfSafeText(generatedLabel)}`, pageWidth - margin, 14, { align: 'right' });
  doc.text(`${input.categoriesCount} Departments Configured`, pageWidth - margin, 22, {
    align: 'right',
  });

  // Section 1: Operational & Service Activity Stats
  let y = 44;
  doc.setTextColor(31, 24, 19);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Service Activity & Operational Summary', margin, y);
  y += 4;

  const statBoxGap = 3.5;
  const statBoxW = (contentWidth - statBoxGap * 3) / 4;
  const statBoxH = 22;

  const statCards = [
    {
      label: 'Active Services',
      value: String(input.activeServicesCount),
      sub: `${input.totalServicesCount - input.activeServicesCount} paused / ${input.totalServicesCount} total`,
    },
    {
      label: 'Current Offers',
      value: String(input.currentOffersCount),
      sub: `${input.totalOffersCount} total campaigns`,
    },
    {
      label: "Today's Activity",
      value: String(input.todayActivityCount),
      sub: `${input.totalLogsCount} logged actions`,
    },
    {
      label: 'Weekly Projection',
      value: formatPdfINR(input.weeklyProjection.weeklyTotal),
      sub: `~${input.weeklyProjection.totalBookings} est. bookings`,
    },
  ];

  statCards.forEach((card, idx) => {
    const x = margin + idx * (statBoxW + statBoxGap);
    doc.setFillColor(250, 247, 242);
    doc.setDrawColor(226, 216, 200);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, y, statBoxW, statBoxH, 2, 2, 'FD');

    doc.setTextColor(104, 90, 78);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(card.label, x + 3.5, y + 6);

    doc.setTextColor(31, 24, 19);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text(card.value, x + 3.5, y + 13.5);

    doc.setTextColor(133, 119, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.text(truncateText(card.sub, 25), x + 3.5, y + 19);
  });

  // Section 2: Projected Weekly Earnings Vector Chart
  y += statBoxH + 10;
  doc.setTextColor(31, 24, 19);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Projected Weekly Earnings Chart (Mon - Sun)', margin, y);

  doc.setTextColor(104, 90, 78);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Weighted Avg. Ticket: ${formatPdfINR(input.weeklyProjection.weightedAvgTicket)}`,
    pageWidth - margin,
    y,
    { align: 'right' }
  );

  y += 4;
  const chartBoxH = 74;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 216, 200);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, y, contentWidth, chartBoxH, 2, 2, 'FD');

  const points = input.weeklyProjection.points;
  if (points.length === 0) {
    doc.setTextColor(104, 90, 78);
    doc.setFontSize(9);
    doc.text(
      'No active service rates configured yet. Activate services to compute projections.',
      pageWidth / 2,
      y + chartBoxH / 2,
      { align: 'center' }
    );
  } else {
    const plotLeft = margin + 20;
    const plotRight = margin + contentWidth - 8;
    const plotTop = y + 11;
    const plotBottom = y + chartBoxH - 16;
    const plotW = plotRight - plotLeft;
    const plotH = plotBottom - plotTop;

    const maxEarnings = Math.max(...points.map((p) => p.earnings), 1000);
    const niceMax = Math.ceil((maxEarnings * 1.15) / 1000) * 1000;

    // Horizontal Gridlines & Y-axis labels
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const ratio = i / gridSteps;
      const gy = plotBottom - ratio * plotH;
      const val = Math.round(niceMax * ratio);

      doc.setDrawColor(236, 229, 218);
      doc.setLineWidth(0.25);
      doc.line(plotLeft, gy, plotRight, gy);

      doc.setTextColor(133, 119, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const axisLabel = val >= 1000 ? `INR ${Math.round(val / 1000)}k` : `INR ${val}`;
      doc.text(axisLabel, plotLeft - 2.5, gy + 1, { align: 'right' });
    }

    // Bars + Trend Line
    const slotW = plotW / points.length;
    const barW = Math.min(14, slotW * 0.46);
    const centers: { x: number; y: number }[] = [];

    points.forEach((pt, idx) => {
      const centerX = plotLeft + slotW * idx + slotW / 2;
      const barH = niceMax > 0 ? (pt.earnings / niceMax) * plotH : 0;
      const barY = plotBottom - barH;
      centers.push({ x: centerX, y: barY });

      // Gold bar fill
      doc.setFillColor(212, 175, 55);
      doc.setDrawColor(154, 114, 30);
      doc.setLineWidth(0.25);
      doc.rect(centerX - barW / 2, barY, barW, barH, 'FD');

      // Value above bar
      doc.setTextColor(31, 24, 19);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.text(formatPdfINR(pt.earnings), centerX, Math.max(plotTop - 2.5, barY - 2.2), {
        align: 'center',
      });

      // X-axis day + bookings
      doc.setTextColor(31, 24, 19);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(pt.day, centerX, plotBottom + 5.5, { align: 'center' });

      doc.setTextColor(133, 119, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.text(`~${pt.bookings} bkg`, centerX, plotBottom + 10.5, { align: 'center' });
    });

    // Espresso trend line over bar tops
    doc.setDrawColor(27, 19, 15);
    doc.setLineWidth(0.6);
    for (let i = 0; i < centers.length - 1; i++) {
      doc.line(centers[i].x, centers[i].y, centers[i + 1].x, centers[i + 1].y);
    }
    centers.forEach((c) => {
      doc.setFillColor(27, 19, 15);
      doc.circle(c.x, c.y, 1.1, 'F');
    });
  }

  // Section 3: Daily Breakdown Table (compact)
  y += chartBoxH + 8;
  if (points.length > 0) {
    doc.setTextColor(31, 24, 19);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Daily Projection Breakdown', margin, y);
    y += 3.5;

    doc.setFillColor(245, 239, 230);
    doc.setDrawColor(226, 216, 200);
    doc.rect(margin, y, contentWidth, 7, 'FD');

    doc.setTextColor(71, 59, 49);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.text('Day', margin + 3, y + 4.8);
    doc.text('Booking Trend', margin + 30, y + 4.8);
    doc.text('Est. Bookings', margin + 115, y + 4.8, { align: 'right' });
    doc.text('Projected Earnings', margin + contentWidth - 3, y + 4.8, { align: 'right' });
    y += 7;

    points.forEach((pt, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(250, 247, 242);
        doc.rect(margin, y, contentWidth, 6.2, 'F');
      }
      doc.setDrawColor(236, 229, 218);
      doc.line(margin, y + 6.2, margin + contentWidth, y + 6.2);

      doc.setTextColor(31, 24, 19);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.text(pt.day, margin + 3, y + 4.3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(104, 90, 78);
      doc.text(pt.trendNote, margin + 30, y + 4.3);
      doc.text(String(pt.bookings), margin + 115, y + 4.3, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 24, 19);
      doc.text(formatPdfINR(pt.earnings), margin + contentWidth - 3, y + 4.3, {
        align: 'right',
      });
      y += 6.2;
    });
  }

  // Section 4: Two-column Featured Rates & Recent Activity
  y += 9;
  const colGap = 6;
  const colW = (contentWidth - colGap) / 2;
  const colTop = y;

  // Left Column: Featured Active Services
  doc.setTextColor(31, 24, 19);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Featured Service Rates', margin, colTop);

  let leftY = colTop + 4;
  if (input.featuredServices.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(104, 90, 78);
    doc.text('No featured services configured.', margin, leftY + 4);
  } else {
    input.featuredServices.slice(0, 5).forEach((svc) => {
      const rate =
        svc.offerPrice !== null && svc.offerPrice !== undefined && svc.offerPrice > 0
          ? svc.offerPrice
          : svc.price;
      doc.setDrawColor(236, 229, 218);
      doc.line(margin, leftY + 8.5, margin + colW, leftY + 8.5);

      doc.setTextColor(31, 24, 19);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(truncateText(svc.name, 34), margin, leftY + 3.5);

      doc.setTextColor(133, 119, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.text(pdfSafeText(svc.duration || 'Standard'), margin, leftY + 7);

      doc.setTextColor(154, 114, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(formatPdfINR(rate), margin + colW, leftY + 4.5, { align: 'right' });

      leftY += 9.5;
    });
  }

  // Right Column: Recent Service & Admin Activity
  const rightX = margin + colW + colGap;
  doc.setTextColor(31, 24, 19);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Recent Service Activity', rightX, colTop);

  let rightY = colTop + 4;
  if (input.recentLogs.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(104, 90, 78);
    doc.text('No activity logs recorded yet.', rightX, rightY + 4);
  } else {
    input.recentLogs.slice(0, 5).forEach((entry) => {
      doc.setDrawColor(236, 229, 218);
      doc.line(rightX, rightY + 8.5, rightX + colW, rightY + 8.5);

      doc.setTextColor(154, 114, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.text(truncateText(entry.action, 24), rightX, rightY + 3.5);

      doc.setTextColor(133, 119, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.text(pdfSafeText(formatTimestamp(entry.createdAt)), rightX + colW, rightY + 3.5, {
        align: 'right',
      });

      doc.setTextColor(71, 59, 49);
      doc.setFontSize(7.2);
      doc.text(truncateText(entry.details, 52), rightX, rightY + 7);

      rightY += 9.5;
    });
  }

  // Footer
  doc.setDrawColor(226, 216, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  doc.setTextColor(133, 119, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    'White Town, Puducherry | Operational Summary & Weekly Earnings Report',
    margin,
    pageHeight - 10
  );
  doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 10, { align: 'right' });

  const filename = `inscape-weekly-report-${dateStamp}.pdf`;
  doc.save(filename);
  return filename;
}
