import { useMemo, useState } from 'react';
import {
  Edit2,
  Loader2,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { formatINR } from '../lib/defaults';
import { parseFirestoreErrorMessage } from '../lib/firebase';
import {
  deleteService,
  saveService,
  toggleServiceStatus,
  uploadMediaFile,
} from '../lib/salonApi';
import {
  BLUEPRINT_LIMITS,
  type MediaAsset,
  type SalonCategory,
  type SalonService,
} from '../types/salon';

interface ServiceManagerProps {
  categories: SalonCategory[];
  services: SalonService[];
  mediaAssets: MediaAsset[];
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

export function ServiceManager({
  categories,
  services,
  mediaAssets,
  onNotify,
}: ServiceManagerProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalonService | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SalonService | null>(null);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [duration, setDuration] = useState('45 mins');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((svc) => {
      if (categoryFilter !== 'all' && svc.categoryId !== categoryFilter) return false;
      if (!q) return true;
      const catName = categoryMap.get(svc.categoryId) || '';
      return (
        svc.name.toLowerCase().includes(q) ||
        svc.description.toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q)
      );
    });
  }, [services, search, categoryFilter, categoryMap]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setCategoryId(categories[0]?.id || 'hair-cuts-styling');
    setPrice('500');
    setOfferPrice('');
    setDuration('45 mins');
    setDescription('');
    setImageUrl('');
    setIsActive(true);
    setIsFeatured(false);
    setSortOrder(services.length + 1);
    setModalOpen(true);
  };

  const openEdit = (svc: SalonService) => {
    setEditing(svc);
    setName(svc.name);
    setCategoryId(svc.categoryId);
    setPrice(String(svc.price));
    setOfferPrice(svc.offerPrice !== null && svc.offerPrice !== undefined ? String(svc.offerPrice) : '');
    setDuration(svc.duration || '45 mins');
    setDescription(svc.description || '');
    setImageUrl(svc.imageUrl || '');
    setIsActive(svc.isActive);
    setIsFeatured(svc.isFeatured);
    setSortOrder(svc.sortOrder ?? 1);
    setModalOpen(true);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadMediaFile(file, name || file.name, 'service');
      setImageUrl(asset.url);
      onNotify('success', 'Service image uploaded to Firebase Storage.');
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onNotify('error', 'Service name is required.');
      return;
    }
    const numPrice = Number(price);
    if (Number.isNaN(numPrice) || numPrice < 0 || numPrice > BLUEPRINT_LIMITS.PRICE_MAX) {
      onNotify('error', 'Enter a valid price between ₹0 and ₹10,00,000.');
      return;
    }
    const numOffer = offerPrice.trim() ? Number(offerPrice) : null;
    if (numOffer !== null && (Number.isNaN(numOffer) || numOffer < 0 || numOffer >= numPrice)) {
      onNotify('error', 'Offer price must be lower than the regular price.');
      return;
    }

    setSaving(true);
    try {
      await saveService(editing ? editing.id : null, {
        name: name.trim().slice(0, BLUEPRINT_LIMITS.SERVICE_NAME_MAX),
        categoryId: categoryId || 'hair-cuts-styling',
        price: numPrice,
        offerPrice: numOffer,
        duration: duration.trim(),
        description: description.trim().slice(0, BLUEPRINT_LIMITS.SERVICE_DESC_MAX),
        imageUrl: imageUrl.trim().slice(0, BLUEPRINT_LIMITS.URL_MAX),
        isActive,
        isFeatured,
        sortOrder: Number(sortOrder) || 0,
      });
      onNotify('success', editing ? `Updated "${name}".` : `Created service "${name}".`);
      setModalOpen(false);
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (svc: SalonService) => {
    try {
      await toggleServiceStatus(svc);
      onNotify('success', `${svc.name} ${!svc.isActive ? 'activated' : 'hidden'}.`);
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteService(confirmDelete.id, confirmDelete.name);
      onNotify('success', `Deleted service "${confirmDelete.name}".`);
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
          <h2 className="font-display text-2xl font-bold text-t-text">Service Management</h2>
          <p className="text-xs sm:text-sm text-t-text-muted">
            Add, organize, feature, or pause treatments shown on the live customer price list.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-sm font-semibold cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-theme bg-t-surface border border-t-border flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-t-text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search salon services..."
            className="w-full pl-10 pr-4 py-2 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text placeholder:text-t-text-subtle"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 rounded-theme bg-t-surface border border-t-border text-center space-y-3">
          <p className="text-sm text-t-text-muted">No services match your current filter.</p>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 rounded-control bg-t-accent text-t-accent-contrast text-xs font-semibold cursor-pointer"
          >
            Add First Service
          </button>
        </div>
      ) : (
        <div className="rounded-theme bg-t-surface border border-t-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-t-border bg-t-sidebar text-xs font-medium text-t-text-muted">
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4 text-right">Rate</th>
                  <th className="py-3.5 px-4">Visibility</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-t-border text-sm">
                {filtered.map((svc) => (
                  <tr key={svc.id} className="hover:bg-t-elevated/70 transition-colors">
                    <td className="py-3 px-4 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-control bg-t-canvas border border-t-border overflow-hidden shrink-0">
                          <SafeImage
                            src={svc.imageUrl}
                            alt={svc.name}
                            fallbackTitle={svc.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-t-text truncate">{svc.name}</p>
                            {svc.isFeatured && (
                              <Star className="w-3.5 h-3.5 text-t-accent fill-current shrink-0" />
                            )}
                          </div>
                          {svc.description && (
                            <p className="text-xs text-t-text-subtle line-clamp-1">
                              {svc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-t-accent whitespace-nowrap">
                      {categoryMap.get(svc.categoryId) || svc.categoryId}
                    </td>
                    <td className="py-3 px-4 text-xs text-t-text-muted whitespace-nowrap">
                      {svc.duration || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num whitespace-nowrap">
                      {svc.offerPrice !== null && svc.offerPrice !== undefined ? (
                        <div>
                          <span className="font-semibold text-t-accent">
                            {formatINR(svc.offerPrice)}
                          </span>
                          <span className="ml-1.5 text-xs text-t-text-subtle line-through">
                            {formatINR(svc.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold text-t-text">{formatINR(svc.price)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggle(svc)}
                        className={`text-xs font-medium cursor-pointer ${
                          svc.isActive ? 'text-t-success-text' : 'text-t-warn-text'
                        }`}
                      >
                        {svc.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(svc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-medium text-t-text cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(svc)}
                          aria-label={`Delete ${svc.name}`}
                          className="p-1.5 rounded-control bg-t-danger-bg border border-t-danger-text/30 text-t-danger-text hover:opacity-80 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-t-surface border border-t-border rounded-theme max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-t-border mb-5">
              <h3 className="font-display text-xl font-bold text-t-text">
                {editing ? 'Edit Service' : 'Add New Service'}
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
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={BLUEPRINT_LIMITS.SERVICE_NAME_MAX}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="45 mins"
                    className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={BLUEPRINT_LIMITS.PRICE_MAX}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-sm text-t-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                    Offer Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Optional"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-sm text-t-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={BLUEPRINT_LIMITS.SORT_ORDER_MAX}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-sm text-t-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  maxLength={BLUEPRINT_LIMITS.SERVICE_DESC_MAX}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                  Service Image URL or Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={BLUEPRINT_LIMITS.URL_MAX}
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-medium text-t-text cursor-pointer shrink-0">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-t-accent" />
                    ) : (
                      <Upload className="w-4 h-4 text-t-accent" />
                    )}
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
                  </label>
                </div>

                {mediaAssets.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
                    {mediaAssets.slice(0, 6).map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => setImageUrl(asset.url)}
                        className="w-12 h-10 rounded border border-t-border hover:border-t-accent overflow-hidden shrink-0 cursor-pointer"
                        title={`Use ${asset.title}`}
                      >
                        <SafeImage src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="inline-flex items-center gap-2 text-sm text-t-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-t-border bg-t-canvas text-t-accent"
                  />
                  Active on Menu
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-t-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-t-border bg-t-canvas text-t-accent"
                  />
                  Featured Service
                </label>
              </div>

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
                  {editing ? 'Save Changes' : 'Create Service'}
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
            <h3 className="font-display text-xl font-bold text-t-text mb-2">Delete Service?</h3>
            <p className="text-sm text-t-text-muted mb-6">
              Permanently remove <strong className="text-t-text">{confirmDelete.name}</strong> from your salon catalog?
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
