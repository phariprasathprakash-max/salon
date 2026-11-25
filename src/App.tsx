/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { AdminApp } from './admin/AdminApp';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeDrawer } from './components/ThemeDrawer';
import { CustomerSite } from './customer/CustomerSite';
import { ThemeProvider } from './lib/themes';

/**
 * Returns true when the visitor opened the site via the Public Website QR Code
 * (?public=1, ?view=menu, ?mode=public, or #menu). In this locked mode,
 * ONLY Website 1 (Public Customer Website) is mounted — Website 2 (Admin Portal)
 * is never rendered or reachable from the UI.
 */
function isLockedPublicQrMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const publicParam = (params.get('public') || '').toLowerCase();
  const viewParam = (params.get('view') || '').toLowerCase();
  const modeParam = (params.get('mode') || '').toLowerCase();
  return (
    publicParam === '1' ||
    publicParam === 'true' ||
    viewParam === 'menu' ||
    viewParam === 'public' ||
    modeParam === 'public' ||
    window.location.hash === '#menu'
  );
}

/**
 * Returns true when the visitor directly requested Website 2 (Admin Management Portal)
 * via /admin, ?site=admin, ?admin=1, or #admin.
 */
function isInitialAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const siteParam = (params.get('site') || '').toLowerCase();
  const adminParam = (params.get('admin') || '').toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  return (
    siteParam === 'admin' ||
    adminParam === '1' ||
    adminParam === 'true' ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    window.location.hash === '#admin'
  );
}

type AppViewMode = 'customer' | 'admin' | 'public-qr-preview';

export default function App() {
  const [lockedPublicMode] = useState<boolean>(isLockedPublicQrMode);
  const [viewMode, setViewMode] = useState<AppViewMode>(() => {
    if (isLockedPublicQrMode()) return 'customer';
    return isInitialAdminRoute() ? 'admin' : 'customer';
  });
  const [customerThemeOpen, setCustomerThemeOpen] = useState(false);

  const switchView = (next: AppViewMode) => {
    setViewMode(next);
    if (typeof window !== 'undefined' && !lockedPublicMode) {
      try {
        const url = new URL(window.location.href);
        url.pathname = '/';
        url.hash = '';
        url.searchParams.delete('public');
        url.searchParams.delete('view');
        url.searchParams.delete('mode');
        url.searchParams.delete('admin');
        if (next === 'admin') {
          url.searchParams.set('site', 'admin');
        } else {
          url.searchParams.delete('site');
        }
        window.history.replaceState({}, '', url.toString());
      } catch {
        // ignore history API errors in sandboxed iframes
      }
    }
  };

  useEffect(() => {
    const isPublicView = lockedPublicMode || viewMode !== 'admin';
    document.title = isPublicView
      ? 'INSCAPE your dream salon — White Town, Puducherry'
      : 'Admin Management Website — INSCAPE your dream salon';
  }, [lockedPublicMode, viewMode]);

  // Locked Public-Only Mode (from scanning the Full Website QR Code)
  if (lockedPublicMode) {
    return (
      <ThemeProvider>
        <ErrorBoundary>
          <CustomerSite
            publicOnly={true}
            onOpenThemes={() => setCustomerThemeOpen(true)}
          />
          <ThemeDrawer
            open={customerThemeOpen}
            onClose={() => setCustomerThemeOpen(false)}
          />
        </ErrorBoundary>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        {viewMode === 'public-qr-preview' ? (
          <>
            <CustomerSite
              publicOnly={true}
              hasBottomBanner={true}
              onOpenThemes={() => setCustomerThemeOpen(true)}
            />
            <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-control bg-t-elevated border border-t-accent/60 shadow-xl text-xs text-t-text">
              <span className="inline-flex items-center gap-1.5 text-t-accent font-semibold whitespace-nowrap">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Public QR Preview (Admin Hidden)
              </span>
              <button
                type="button"
                onClick={() => switchView('admin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Admin
              </button>
            </div>
            <ThemeDrawer
              open={customerThemeOpen}
              onClose={() => setCustomerThemeOpen(false)}
            />
          </>
        ) : viewMode === 'customer' ? (
          <>
            <CustomerSite
              onNavigateAdmin={() => switchView('admin')}
              onOpenThemes={() => setCustomerThemeOpen(true)}
            />
            <ThemeDrawer
              open={customerThemeOpen}
              onClose={() => setCustomerThemeOpen(false)}
            />
          </>
        ) : (
          <AdminApp
            onPreviewCustomer={() => switchView('customer')}
            onPreviewPublicQr={() => switchView('public-qr-preview')}
          />
        )}
      </ErrorBoundary>
    </ThemeProvider>
  );
}
