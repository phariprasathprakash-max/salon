import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { slugifyId } from '../lib/defaults';
import { parseFirestoreErrorMessage } from '../lib/firebase';
import { deleteCategory, saveCategory, uploadMediaFile } from '../lib/salonApi';
import { BLUEPRINT_LIMITS, type MediaAsset, type SalonCategory, type SalonService } from '../types/salon';

interface CategoryManagerProps {
  categories: SalonCategory[];
  services: SalonService[];
  mediaAssets: MediaAsset[];
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

export function CategoryManager({
  categories,
  services,
  mediaAssets,
  onNotify,
}: CategoryManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalonCategory | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SalonCategory | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setSortOrder(categories.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (cat: SalonCategory) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setImageUrl(cat.imageUrl || '');
    setSortOrder(cat.sortOrder ?? 1);
    setIsActive(cat.isActive);
    setModalOpen(true);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadMediaFile(file, name || file.name, 'salon');
      setImageUrl(asset.url);
      onNotify('success', 'Category image uploaded to Firebase Storage.');
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onNotify('error', 'Category name is required.');
      return;
    }
    setSaving(true);
    try {
      const slug = editing ? editing.slug : slugifyId(name);
      await saveCategory(editing ? editing.id : slug, {
        name: name.trim().slice(0, BLUEPRINT_LIMITS.CATEGORY_NAME_MAX),
        slug,
        description: description.trim().slice(0, BLUEPRINT_LIMITS.CATEGORY_DESC_MAX),
        imageUrl: imageUrl.trim().slice(0, BLUEPRINT_LIMITS.URL_MAX),
        isActive,
        sortOrder: Number(sortOrder) || 0,
      });
      onNotify('success', editing ? `Updated "${name}" category.` : `Created "${name}" category.`);
      setModalOpen(false);
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleMoveOrder = async (cat: SalonCategory, delta: number) => {
    try {
      await saveCategory(cat.id, {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        isActive: cat.isActive,
        sortOrder: Math.max(0, (cat.sortOrder ?? 1) + delta),
      });
      onNotify('success', `Updated display order for "${cat.name}".`);
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const linkedCount = services.filter((s) => s.categoryId === confirmDelete.id).length;
    if (linkedCount > 0) {
      onNotify(
        'error',
        `Cannot delete "${confirmDelete.name}" while ${linkedCount} service(s) belong to it. Reassign or delete those services first.`
      );
      setConfirmDelete(null);
      return;
    }
    try {
      await deleteCategory(confirmDelete.id, confirmDelete.name);
      onNotify('success', `Deleted category "${confirmDelete.name}".`);
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
          <h2 className="font-display text-2xl font-bold text-t-text">Category Management</h2>
          <p className="text-xs sm:text-sm text-t-text-muted">
            Organize salon departments, showcase imagery, and price list ordering.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-sm font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="p-12 rounded-theme bg-t-surface border border-t-border text-center">
          <p className="text-sm text-t-text-muted mb-4">No categories created yet.</p>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 rounded-control bg-t-accent text-t-accent-contrast text-sm font-semibold cursor-pointer"
          >
            Create First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const svcCount = services.filter((s) => s.categoryId === cat.id).length;
            return (
              <div
                key={cat.id}
                className="rounded-theme bg-t-surface border border-t-border overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/9] bg-t-canvas relative overflow-hidden">
                  <SafeImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    fallbackTitle={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-semibold text-t-text">{cat.name}</h3>
                      <p className="text-xs text-t-text-subtle font-mono-num mt-0.5">
                        Order #{cat.sortOrder} · {svcCount} {svcCount === 1 ? 'service' : 'services'}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        cat.isActive ? 'text-t-success-text' : 'text-t-warn-text'
                      }`}
                    >
                      {cat.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-t-text-muted line-clamp-2 mb-4">{cat.description}</p>
                  )}

                  <div className="mt-auto pt-3 border-t border-t-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(cat, -1)}
                        title="Move up in display order"
                        className="p-1.5 rounded-control bg-t-elevated border border-t-border text-t-text-secondary hover:text-t-accent cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(cat, 1)}
                        title="Move down in display order"
                        className="p-1.5 rounded-control bg-t-elevated border border-t-border text-t-text-secondary hover:text-t-accent cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-t-elevated border border-t-border hover:border-t-accent/60 text-xs font-medium text-t-text cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(cat)}
                        aria-label={`Delete ${cat.name}`}
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-t-surface border border-t-border rounded-theme max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-t-border mb-5">
              <h3 className="font-display text-xl font-bold text-t-text">
                {editing ? 'Edit Category' : 'Add New Category'}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={BLUEPRINT_LIMITS.CATEGORY_NAME_MAX}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Hair Services"
                  className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  maxLength={BLUEPRINT_LIMITS.CATEGORY_DESC_MAX}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description displayed under the category heading..."
                  className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={BLUEPRINT_LIMITS.SORT_ORDER_MAX}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm font-mono-num text-t-text"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2.5 text-sm text-t-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-t-border bg-t-canvas text-t-accent"
                    />
                    Visible to Customers
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
                  Category Image URL or Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={BLUEPRINT_LIMITS.URL_MAX}
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... or /src/assets/..."
                    className="flex-1 px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-medium text-t-text cursor-pointer shrink-0">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-t-accent" />
                    ) : (
                      <Upload className="w-4 h-4 text-t-accent" />
                    )}
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadImage}
                      className="hidden"
                    />
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

              <div className="pt-4 border-t border-t-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-control bg-t-elevated text-sm text-t-text-secondary hover:text-t-text cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-sm font-semibold cursor-pointer"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-t-surface border border-t-border rounded-theme max-w-sm w-full p-6">
            <h3 className="font-display text-xl font-bold text-t-text mb-2">
              Delete Category?
            </h3>
            <p className="text-sm text-t-text-muted mb-6">
              Are you sure you want to permanently remove <strong className="text-t-text">{confirmDelete.name}</strong>?
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
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
