import { useState } from 'react';
import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  Palette,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { BRAND_FACADE_URL, resolveLogoUrl } from '../lib/defaults';
import { auth } from '../lib/firebase';
import { ADMIN_LOGIN_USERNAME, BOOTSTRAPPED_ADMIN_EMAIL } from '../types/salon';

interface AdminLoginProps {
  unauthorizedEmail?: string;
  onOpenThemes?: () => void;
  onPreviewCustomer?: () => void;
  onSignOut?: () => void;
}

export function AdminLogin({
  unauthorizedEmail,
  onOpenThemes,
  onPreviewCustomer,
  onSignOut,
}: AdminLoginProps) {
  const [identifier, setIdentifier] = useState(ADMIN_LOGIN_USERNAME);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const resolveEmailFromIdentifier = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed.includes('@') && trimmed.toLowerCase() === ADMIN_LOGIN_USERNAME.toLowerCase()) {
      return BOOTSTRAPPED_ADMIN_EMAIL;
    }
    return trimmed;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!identifier.trim() || !password) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      const email = resolveEmailFromIdentifier(identifier);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setError(
          `Invalid credentials for ${ADMIN_LOGIN_USERNAME}. If you have not linked your password yet, click "Sign In with Google Account" below once, then save your password under Website Settings → Admin Login Credentials.`
        );
      } else if (code === 'auth/operation-not-allowed') {
        setError(
          'Email/Password sign-in is not enabled yet in Firebase Console. Enable it under Authentication → Sign-in method → Email/Password, or sign in with Google below.'
        );
      } else {
        setError(err instanceof Error ? err.message : 'Unable to sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setNotice('');
    const email = resolveEmailFromIdentifier(identifier);
    if (!email.includes('@')) {
      setError(`Enter ${ADMIN_LOGIN_USERNAME} or your admin email first.`);
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setNotice(`Password reset link sent to ${email}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not send password reset email.'
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setNotice('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-t-canvas text-t-text flex flex-col justify-center items-center p-6 relative isolate overflow-hidden">
      {/* Full-Page Storefront Photo Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <img
          src={BRAND_FACADE_URL}
          alt=""
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(16,11,8,0.78) 0%, rgba(16,11,8,0.58) 55%, rgba(16,11,8,0.72) 100%)',
          }}
        />
      </div>

      {onPreviewCustomer && (
        <button
          type="button"
          onClick={onPreviewCustomer}
          className="fixed top-5 left-5 z-20 inline-flex items-center gap-2 px-3.5 py-2 rounded-control bg-t-surface/90 backdrop-blur border border-t-border hover:border-t-accent text-xs font-medium text-t-text whitespace-nowrap cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-t-accent" />
          Public Customer Website
        </button>
      )}

      {onOpenThemes && (
        <button
          type="button"
          onClick={onOpenThemes}
          className="fixed top-5 right-5 z-20 inline-flex items-center gap-2 px-3.5 py-2 rounded-control bg-t-surface/90 backdrop-blur border border-t-border hover:border-t-accent text-xs font-medium text-t-text whitespace-nowrap cursor-pointer"
        >
          <Palette className="w-3.5 h-3.5 text-t-accent" />
          Themes
        </button>
      )}

      <div className="relative z-10 w-full max-w-md p-7 rounded-theme bg-t-surface/92 backdrop-blur-md border border-t-border shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <BrandLogo
            src={resolveLogoUrl()}
            alt="INSCAPE your dream salon"
            className="w-40 rounded-control border border-t-accent/40"
          />
          <div>
            <h1 className="font-display text-2xl font-bold text-t-text">
              INSCAPE Admin Portal
            </h1>
            <p className="text-xs text-t-text-muted mt-1">
              White Town, Puducherry · Authorized Personnel Only
            </p>
          </div>
        </div>

        {unauthorizedEmail && (
          <div className="p-4 rounded-control bg-t-danger-bg border border-t-danger-text/40 space-y-2">
            <div className="flex items-start gap-2.5 text-xs text-t-danger-text">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Signed in as <strong>{unauthorizedEmail}</strong>, which does not have admin access.
              </p>
            </div>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="text-xs font-semibold text-t-text underline cursor-pointer"
              >
                Sign out and switch account
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-control bg-t-danger-bg border border-t-danger-text/40 text-xs text-t-danger-text leading-relaxed">
            {error}
          </div>
        )}

        {notice && (
          <div className="p-3.5 rounded-control bg-t-success-bg border border-t-success-text/40 text-xs text-t-success-text leading-relaxed">
            {notice}
          </div>
        )}

        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Username or Admin Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={ADMIN_LOGIN_USERNAME}
              autoComplete="username"
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-medium text-t-text-secondary">
                Password
              </label>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resetLoading}
                className="text-[11px] font-medium text-t-accent hover:underline cursor-pointer disabled:opacity-60"
              >
                {resetLoading ? 'Sending...' : 'Reset via email'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-t-text-subtle hover:text-t-text cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-control bg-t-accent hover:bg-t-accent-hover disabled:opacity-60 text-t-accent-contrast text-sm font-semibold cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Sign In to Dashboard
          </button>
        </form>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-t-border" />
          <span className="shrink mx-3 text-[11px] text-t-text-subtle">or continue with</span>
          <div className="flex-grow border-t border-t-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text cursor-pointer"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-t-accent" />
          ) : (
            <UserCheck className="w-4 h-4 text-t-accent" />
          )}
          Sign In with Google Account
        </button>
      </div>
    </div>
  );
}
