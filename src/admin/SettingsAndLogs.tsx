import { useEffect, useState } from 'react';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  reauthenticateWithPopup,
  updatePassword,
} from 'firebase/auth';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Palette,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
  Upload,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import {
  BRAND_FACADE_URL,
  BRAND_LOGO_URL,
  formatTimestamp,
  resolveHeroBackgroundUrl,
  resolveLogoUrl,
} from '../lib/defaults';
import { auth, parseFirestoreErrorMessage } from '../lib/firebase';
import {
  deleteAdminUser,
  logAdminActivity,
  saveAdminUser,
  saveSalonSettings,
  uploadMediaFile,
} from '../lib/salonApi';
import { useTheme } from '../lib/themes';
import {
  type ActivityLogEntry,
  ADMIN_LOGIN_USERNAME,
  type AdminUserRecord,
  BOOTSTRAPPED_ADMIN_EMAIL,
  type SalonSettings,
} from '../types/salon';

interface SettingsManagerProps {
  settings: SalonSettings;
  admins: AdminUserRecord[];
  currentUserEmail: string;
  currentUserUid: string;
  onOpenThemes: () => void;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

export function SettingsManager({
  settings,
  admins,
  currentUserEmail,
  currentUserUid,
  onOpenThemes,
  onNotify,
}: SettingsManagerProps) {
  const { activePreset, config } = useTheme();
  const [form, setForm] = useState<SalonSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<'logo' | 'hero' | null>(null);

  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleUploadAsset = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logo' | 'hero'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    try {
      const asset = await uploadMediaFile(file, `${field}-${file.name}`, 'salon');
      setForm((prev) => ({
        ...prev,
        [field === 'logo' ? 'logoUrl' : 'heroBackgroundUrl']: asset.url,
      }));
      onNotify('success', 'Image uploaded to Firebase Storage. Remember to save settings.');
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setUploadingField(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.salonName.trim()) {
      onNotify('error', 'Salon name cannot be empty.');
      return;
    }
    if (form.publicCustomerUrl.includes('/admin')) {
      onNotify('error', 'Public customer URL must never point to /admin.');
      return;
    }
    setSaving(true);
    try {
      await saveSalonSettings(form);
      onNotify('success', 'Saved salon settings. Customer website updated live.');
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUid.trim() || !newAdminEmail.trim()) {
      onNotify('error', 'Both Firebase Auth UID and Email are required.');
      return;
    }
    setAddingAdmin(true);
    try {
      await saveAdminUser(newAdminUid.trim(), {
        email: newAdminEmail.trim(),
        displayName: newAdminName.trim() || newAdminEmail.trim(),
        role: 'admin',
        isActive: true,
      });
      setNewAdminUid('');
      setNewAdminEmail('');
      setNewAdminName('');
      onNotify('success', `Granted admin access to ${newAdminEmail}.`);
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !user.email) {
      onNotify('error', 'No active administrator session found.');
      return;
    }
    if (newPassword.length < 6) {
      onNotify('error', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      onNotify('error', 'Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const hasPasswordProvider = user.providerData.some((p) => p.providerId === 'password');
      const applyPasswordChange = async () => {
        if (hasPasswordProvider) {
          await updatePassword(user, newPassword);
        } else {
          const credential = EmailAuthProvider.credential(user.email!, newPassword);
          await linkWithCredential(user, credential);
        }
      };

      try {
        await applyPasswordChange();
      } catch (err) {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/requires-recent-login') {
          const hasGoogleProvider = user.providerData.some((p) => p.providerId === 'google.com');
          if (hasGoogleProvider) {
            const googleProvider = new GoogleAuthProvider();
            googleProvider.setCustomParameters({ login_hint: user.email });
            await reauthenticateWithPopup(user, googleProvider);
            await applyPasswordChange();
          } else {
            throw new Error(
              'For security, please sign out and sign back in before changing your password.'
            );
          }
        } else {
          throw err;
        }
      }

      await logAdminActivity(
        'Password updated',
        'admin',
        `Updated Email/Password login credentials for ${user.email}`
      );
      setNewPassword('');
      setConfirmPassword('');
      onNotify(
        'success',
        `Admin login password updated. You can now sign in with username "${ADMIN_LOGIN_USERNAME}".`
      );
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        onNotify(
          'error',
          'Email/Password sign-in is disabled in Firebase Console. Enable it under Authentication → Sign-in method, then save your password again.'
        );
      } else {
        onNotify('error', err instanceof Error ? err.message : 'Failed to update password.');
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-t-text">Website Settings</h2>
        <p className="text-xs sm:text-sm text-t-text-muted">
          Update salon branding, phone, WhatsApp, address, maps, appearance themes, and social links.
        </p>
      </div>

      {/* Advanced Theme Studio Banner */}
      <div className="p-6 rounded-theme bg-t-surface border border-t-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-control bg-t-elevated text-t-accent shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-t-text">
              Workspace Appearance &amp; Advanced Themes
            </h3>
            <p className="text-xs text-t-text-muted mt-0.5">
              Active palette: <strong className="text-t-text">{activePreset.name}</strong> ·{' '}
              {activePreset.mode === 'dark' ? 'Dark' : 'Light'} Mode · {config.surfaceStyle}{' '}
              surface · {config.radius} corners · {config.typography} typography · {config.density}{' '}
              density
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenThemes}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Palette className="w-4 h-4" />
          Open Advanced Theme Studio
        </button>
      </div>

      <form
        onSubmit={handleSaveSettings}
        className="p-6 rounded-theme bg-t-surface border border-t-border space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Salon Name *
            </label>
            <input
              type="text"
              required
              value={form.salonName}
              onChange={(e) => setForm({ ...form, salonName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">Tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Primary Phone Number
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-sm text-t-text"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Landline / Secondary Phone
            </label>
            <input
              type="text"
              value={form.secondaryPhone}
              onChange={(e) => setForm({ ...form, secondaryPhone: e.target.value })}
              placeholder="0413 233 5558"
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-sm text-t-text"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              WhatsApp Number (with country code, e.g., 918883035558)
            </label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-sm text-t-text"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Opening Hours
            </label>
            <input
              type="text"
              value={form.openingHours}
              onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Salon Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Customer Rating Summary
            </label>
            <input
              type="text"
              value={form.ratingSummary}
              onChange={(e) => setForm({ ...form, ratingSummary: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Review Platform Note
            </label>
            <input
              type="text"
              value={form.reviewPlatformsNote}
              onChange={(e) => setForm({ ...form, reviewPlatformsNote: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Appointment Policy
            </label>
            <input
              type="text"
              value={form.appointmentPolicy}
              onChange={(e) => setForm({ ...form, appointmentPolicy: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Accepted Payments
            </label>
            <input
              type="text"
              value={form.paymentMethods}
              onChange={(e) => setForm({ ...form, paymentMethods: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Accessibility &amp; Parking Note
            </label>
            <input
              type="text"
              value={form.accessibilityNote}
              onChange={(e) => setForm({ ...form, accessibilityNote: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Google Maps Location URL
            </label>
            <input
              type="url"
              value={form.mapsUrl}
              onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Permanent Public Customer URL (for QR Code)
            </label>
            <input
              type="url"
              placeholder="https://www.inscapesalon.com/price-list"
              value={form.publicCustomerUrl}
              onChange={(e) => setForm({ ...form, publicCustomerUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Instagram Link
            </label>
            <input
              type="url"
              value={form.instagramUrl}
              onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Facebook Link
            </label>
            <input
              type="url"
              value={form.facebookUrl}
              onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-medium text-t-text-secondary">
                Salon Logo URL
              </label>
              {resolveLogoUrl(form.logoUrl) !== BRAND_LOGO_URL && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, logoUrl: BRAND_LOGO_URL })}
                  className="text-[11px] font-medium text-t-accent hover:underline cursor-pointer"
                >
                  Use Official Logo
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <BrandLogo
                src={resolveLogoUrl(form.logoUrl)}
                alt="Salon Logo Preview"
                className="w-24 rounded-control border border-t-accent/40 shrink-0"
              />
              <input
                type="text"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-control bg-t-elevated border border-t-border text-xs font-medium text-t-text cursor-pointer shrink-0">
                {uploadingField === 'logo' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-t-accent" />
                ) : (
                  <Upload className="w-4 h-4 text-t-accent" />
                )}
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadAsset(e, 'logo')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-medium text-t-text-secondary">
                Website Background URL
              </label>
              {resolveHeroBackgroundUrl(form.heroBackgroundUrl) !== BRAND_FACADE_URL && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, heroBackgroundUrl: BRAND_FACADE_URL })}
                  className="text-[11px] font-medium text-t-accent hover:underline cursor-pointer"
                >
                  Use Official Facade
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-10 rounded-control bg-t-canvas border border-t-border overflow-hidden shrink-0">
                <img
                  src={resolveHeroBackgroundUrl(form.heroBackgroundUrl)}
                  alt="Website Background Preview"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <input
                type="text"
                value={form.heroBackgroundUrl}
                onChange={(e) => setForm({ ...form, heroBackgroundUrl: e.target.value })}
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-control bg-t-elevated border border-t-border text-xs font-medium text-t-text cursor-pointer shrink-0">
                {uploadingField === 'hero' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-t-accent" />
                ) : (
                  <Upload className="w-4 h-4 text-t-accent" />
                )}
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadAsset(e, 'hero')}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
            About the Salon Copy
          </label>
          <textarea
            rows={3}
            value={form.aboutText}
            onChange={(e) => setForm({ ...form, aboutText: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-sm font-semibold cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Website Settings
          </button>
        </div>
      </form>

      {/* Admin Login Credentials */}
      <div
        id="admin-credentials"
        className="p-6 rounded-theme bg-t-surface border border-t-border space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-t-accent shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-t-text">Admin Login Credentials</h3>
              <p className="text-xs text-t-text-muted">
                Login username:{' '}
                <span className="font-mono-num text-t-accent font-semibold">
                  {ADMIN_LOGIN_USERNAME}
                </span>{' '}
                (maps to{' '}
                <span className="font-mono-num text-t-text-secondary">
                  {BOOTSTRAPPED_ADMIN_EMAIL}
                </span>
                )
              </p>
            </div>
          </div>

          {auth.currentUser?.providerData.some((p) => p.providerId === 'password') ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-t-success-text shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              Password Login Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-t-warn-text shrink-0">
              <AlertTriangle className="w-4 h-4" />
              Password Not Linked Yet
            </span>
          )}
        </div>

        <form
          onSubmit={handleUpdateAdminPassword}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              New Password (min 6 chars)
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                placeholder="Enter new password"
                className="w-full pl-3.5 pr-10 py-2 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-t-text-subtle hover:text-t-text cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Confirm Password
            </label>
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
              placeholder="Re-enter password"
              className="w-full px-3.5 py-2 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>

          <button
            type="submit"
            disabled={updatingPassword}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-control bg-t-accent hover:bg-t-accent-hover disabled:opacity-60 text-t-accent-contrast text-sm font-semibold cursor-pointer"
          >
            {updatingPassword ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {updatingPassword ? 'Updating...' : 'Set / Update Password'}
          </button>
        </form>
      </div>

      {/* Authorized Admin Accounts */}
      <div className="p-6 rounded-theme bg-t-surface border border-t-border space-y-5">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-t-accent" />
          <div>
            <h3 className="text-base font-semibold text-t-text">Authorized Admin Accounts</h3>
            <p className="text-xs text-t-text-muted">
              Primary owner:{' '}
              <span className="font-mono-num text-t-accent">{BOOTSTRAPPED_ADMIN_EMAIL}</span> · Active
              session UID:{' '}
              <span className="font-mono-num text-t-text-secondary">{currentUserUid}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={newAdminUid}
            onChange={(e) => setNewAdminUid(e.target.value)}
            placeholder="Firebase Auth UID"
            className="px-3.5 py-2 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-xs text-t-text"
          />
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="Admin Email"
            className="px-3.5 py-2 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
          />
          <input
            type="text"
            value={newAdminName}
            onChange={(e) => setNewAdminName(e.target.value)}
            placeholder="Display Name"
            className="px-3.5 py-2 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
          />
          <button
            type="submit"
            disabled={addingAdmin}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-sm font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Admin
          </button>
        </form>

        {admins.length > 0 && (
          <div className="divide-y divide-t-border border-t border-t-border">
            {admins.map((adm) => (
              <div key={adm.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-t-text truncate">
                    {adm.displayName || adm.email}
                  </p>
                  <p className="font-mono-num text-xs text-t-text-subtle truncate">
                    {adm.email} · UID: {adm.uid}
                  </p>
                </div>
                {adm.email !== currentUserEmail && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await deleteAdminUser(adm.uid, adm.email);
                        onNotify('success', `Removed admin ${adm.email}.`);
                      } catch (err) {
                        onNotify('error', parseFirestoreErrorMessage(err));
                      }
                    }}
                    className="p-1.5 rounded-control bg-t-danger-bg border border-t-danger-text/30 text-t-danger-text hover:opacity-80 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivityLogsView({ logs }: { logs: ActivityLogEntry[] }) {
  const [search, setSearch] = useState('');

  const filtered = logs.filter((l) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.adminEmail.toLowerCase().includes(q) ||
      l.entityType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-t-text">Admin Activity Log</h2>
          <p className="text-xs sm:text-sm text-t-text-muted">
            Immutable audit trail of service updates, price changes, categories, and offers.
          </p>
        </div>

        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-t-text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter logs..."
            className="w-full pl-10 pr-4 py-2 rounded-control bg-t-surface border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 rounded-theme bg-t-surface border border-t-border text-center">
          <p className="text-sm text-t-text-muted">No activity logs recorded yet.</p>
        </div>
      ) : (
        <div className="rounded-theme bg-t-surface border border-t-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-t-border bg-t-sidebar text-xs font-medium text-t-text-muted">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Admin</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-t-border text-sm">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-t-elevated/70">
                    <td className="py-3 px-4 font-mono-num text-xs text-t-text-subtle whitespace-nowrap">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-xs text-t-text-secondary whitespace-nowrap">
                      {log.adminEmail || log.adminUid}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-t-accent whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-xs text-t-text">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
