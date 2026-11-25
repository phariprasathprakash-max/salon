import { useState } from 'react';
import { Calendar, Edit2, Loader2, Plus, Tag, Trash2, Upload, X } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { getOfferStatusLabel } from '../lib/defaults';
import { parseFirestoreErrorMessage } from '../lib/firebase';
import { deleteOffer, saveOffer, toggleOfferStatus, uploadMediaFile } from '../lib/salonApi';
import { BLUEPRINT_LIMITS, type SalonCategory, type SalonOffer } from '../types/salon';

interface OfferManagerProps {
  categories: SalonCategory[];
  offers: SalonOffer[];
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

export function OfferManager({ categories, offers, onNotify }: OfferManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalonOffer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SalonOffer | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercent, setDiscountPercent] = useState('15');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [applicableCategory, setApplicableCategory] = useState('all');
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setDiscountPercent('15');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setApplicableCategory('all');
    setBannerUrl('');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (offer: SalonOffer) => {
    setEditing(offer);
    setTitle(offer.title);
    setDescription(offer.description || '');
    setDiscountPercent(String(offer.discountPercent));
    setStartDate(offer.startDate);
    setEndDate(offer.endDate);
    setApplicableCategory(offer.applicableCategory || 'all');
    setBannerUrl(offer.bannerUrl || '');
    setIsActive(offer.isActive);
    setModalOpen(true);
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadMediaFile(file, title || file.name, 'banner');
      setBannerUrl(asset.url);
      onNotify('success', 'Offer banner uploaded to Firebase Storage.');
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onNotify('error', 'Offer title is required.');
      return;
    }
    if (endDate < startDate) {
      onNotify('error', 'End date must be on or after the start date.');
      return;
    }
    const pct = Number(discountPercent);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      onNotify('error', 'Discount percentage must be between 0 and 100.');
      return;
    }

    setSaving(true);
    try {
      await saveOffer(editing ? editing.id : null, {
        title: title.trim().slice(0, BLUEPRINT_LIMITS.OFFER_TITLE_MAX),
        description: description.trim().slice(0, BLUEPRINT_LIMITS.OFFER_DESC_MAX),
        discountPercent: pct,
        startDate,
        endDate,
        bannerUrl: bannerUrl.trim().slice(0, BLUEPRINT_LIMITS.URL_MAX),
        applicableCategory,
        isActive,
      });
      onNotify('success', editing ? `Updated offer "${title}".` : `Published offer "${title}".`);
      setModalOpen(false);
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (offer: SalonOffer) => {
    try {
      await toggleOfferStatus(offer);
      onNotify('success', `${offer.title} ${!offer.isActive ? 'activated' : 'paused'}.`);
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteOffer(confirmDelete.id, confirmDelete.title);
      onNotify('success', `Deleted offer "${confirmDelete.title}".`);
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-t-text">Special Offers</h2>
          <p className="text-xs sm:text-sm text-t-text-muted">
            Create promotional campaigns. Expired offers are automatically hidden on the customer website.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-sm font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Offer
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="p-12 rounded-theme bg-t-surface border border-t-border text-center">
          <Tag className="w-8 h-8 text-t-accent mx-auto mb-3 opacity-80" />
          <p className="text-sm text-t-text-muted mb-4">No special offers created yet.</p>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 rounded-control bg-t-accent text-t-accent-contrast text-sm font-semibold cursor-pointer"
          >
            Create First Offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {offers.map((offer) => {
            const status = getOfferStatusLabel(offer);
            const statusColor =
              status === 'Active'
                ? 'text-t-success-text'
                : status === 'Scheduled'
                  ? 'text-t-accent'
                  : status === 'Expired'
                    ? 'text-t-danger-text'
                    : 'text-t-warn-text';

            return (
              <div
                key={offer.id}
                className="rounded-theme bg-t-surface border border-t-border overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/7] bg-t-canvas overflow-hidden">
                  <SafeImage
                    src={offer.bannerUrl}
                    alt={offer.title}
                    fallbackTitle={offer.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-xs font-mono-num text-t-accent">
                        {offer.discountPercent}% OFF · {status}
                      </p>
                      <h3 className="text-lg font-semibold text-t-text mt-0.5">{offer.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle(offer)}
                      className={`text-xs font-medium ${statusColor} cursor-pointer shrink-0`}
                    >
                      {offer.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>

                  {offer.description && (
                    <p className="text-xs text-t-text-muted leading-relaxed mb-4">
                      {offer.description}
                    </p>
                  )}

                  <div className="mt-auto pt-3 border-t border-t-border flex items-center justify-between gap-2 text-xs text-t-text-subtle">
                    <span className="inline-flex items-center gap-1.5 font-mono-num">
                      <Calendar className="w-3.5 h-3.5 text-t-accent" />
                      {offer.startDate} to {offer.endDate}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(offer)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-control bg-t-elevated border border-t-border text-t-text hover:border-t-accent cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(offer)}
                        className="p-1.5 rounded-control bg-t-danger-bg border border-t-danger-text/30 text-t-danger-text hover:opacity-80 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-t-surface border border-t-border rounded-theme max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-t-border mb-5">
              <h3 className="font-display text-xl font-bold text-t-text">
                {editing ? 'Edit Offer' : 'Create Special Offer'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-t-text-subtle hover:text-t-text cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  maxLength={BLUEPRINT_LIMITS.OFFER_TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Monsoon Hair Spa Privilege"
                  className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                  Offer Details
                </label>
                <textarea
                  rows={2}
                  maxLength={BLUEPRINT_LIMITS.OFFER_DESC_MAX}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                    Discount % *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-sm text-t-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                    Applicable Category
                  </label>
                  <select
                    value={applicableCategory}
                    onChange={(e) => setApplicableCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
                  >
                    <option value="all">All Services</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-sm text-t-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-sm text-t-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                  Banner Image URL or Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={BLUEPRINT_LIMITS.URL_MAX}
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-medium text-t-text cursor-pointer shrink-0">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-t-accent" />
                    ) : (
                      <Upload className="w-4 h-4 text-t-accent" />
                    )}
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleUploadBanner} className="hidden" />
                  </label>
                </div>
              </div>

              <label className="inline-flex items-center gap-2.5 text-sm text-t-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-t-border bg-t-canvas text-t-accent"
                />
                Offer Active
              </label>

              <div className="pt-4 border-t border-t-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-control bg-t-elevated text-sm text-t-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-sm font-semibold cursor-pointer"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Update Offer' : 'Publish Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-t-surface border border-t-border rounded-theme max-w-sm w-full p-6">
            <h3 className="font-display text-xl font-bold text-t-text mb-2">Delete Offer?</h3>
            <p className="text-sm text-t-text-muted mb-6">
              Are you sure you want to delete <strong className="text-t-text">{confirmDelete.title}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-control bg-t-elevated text-sm text-t-text-secondary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-control bg-red-600 hover:bg-red-500 text-white text-sm font-semibold cursor-pointer"
              >
                Delete Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
