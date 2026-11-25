import { useState } from 'react';
import { Check, Copy, Image as ImageIcon, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { parseFirestoreErrorMessage } from '../lib/firebase';
import { deleteMediaAsset, saveMediaAsset, uploadMediaFile } from '../lib/salonApi';
import { BLUEPRINT_LIMITS, type MediaAsset } from '../types/salon';

interface MediaManagerProps {
  mediaAssets: MediaAsset[];
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

export function MediaManager({ mediaAssets, onNotify }: MediaManagerProps) {
  const [title, setTitle] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [folder, setFolder] = useState<MediaAsset['folder']>('salon');
  const [uploading, setUploading] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadMediaFile(file, title.trim() || file.name, folder);
      setTitle('');
      onNotify('success', 'Image uploaded to Firebase Storage.');
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalUrl.trim()) {
      onNotify('error', 'Please enter an image URL.');
      return;
    }
    setSavingUrl(true);
    try {
      await saveMediaAsset(title.trim() || 'Salon Photo', externalUrl, folder);
      setTitle('');
      setExternalUrl('');
      onNotify('success', 'Added media asset to gallery.');
    } catch (err) {
      onNotify('error', parseFirestoreErrorMessage(err));
    } finally {
      setSavingUrl(false);
    }
  };

  const handleCopy = async (asset: MediaAsset) => {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId(null), 1800);
      onNotify('success', 'Image URL copied to clipboard.');
    } catch {
      onNotify('error', 'Could not copy URL.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-t-text">Image Gallery</h2>
        <p className="text-xs sm:text-sm text-t-text-muted">
          Upload salon photos, service showcases, and campaign banners for quick selection across categories and offers.
        </p>
      </div>

      {/* Upload / Add Card */}
      <form
        onSubmit={handleAddUrl}
        className="p-6 rounded-theme bg-t-surface border border-t-border space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Image Title
            </label>
            <input
              type="text"
              maxLength={BLUEPRINT_LIMITS.MEDIA_TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Bridal Styling Suite"
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-t-text-secondary mb-1.5">
              Folder Tag
            </label>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value as MediaAsset['folder'])}
              className="w-full px-3.5 py-2.5 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
            >
              <option value="salon">Salon Interior</option>
              <option value="service">Service Photo</option>
              <option value="banner">Offer Banner</option>
              <option value="logo">Brand Logo</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-sm font-semibold cursor-pointer">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>Upload File to Storage</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-t-border">
          <input
            type="text"
            maxLength={BLUEPRINT_LIMITS.URL_MAX}
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="Or paste image URL (https://... or /src/assets/...)"
            className="flex-1 px-3.5 py-2 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text"
          />
          <button
            type="submit"
            disabled={savingUrl}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text cursor-pointer shrink-0"
          >
            {savingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 text-t-accent" />}
            Save Image Link
          </button>
        </div>
      </form>

      {mediaAssets.length === 0 ? (
        <div className="p-12 rounded-theme bg-t-surface border border-t-border text-center">
          <ImageIcon className="w-8 h-8 text-t-accent mx-auto mb-3 opacity-80" />
          <p className="text-sm text-t-text-muted">No images saved in the gallery yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mediaAssets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-theme bg-t-surface border border-t-border overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/10] bg-t-canvas overflow-hidden">
                <SafeImage
                  src={asset.url}
                  alt={asset.title}
                  fallbackTitle={asset.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-t-text truncate">{asset.title}</p>
                  <p className="text-xs text-t-text-subtle capitalize">{asset.folder}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(asset)}
                    title="Copy URL"
                    className="p-1.5 rounded-control bg-t-elevated border border-t-border text-t-text-secondary hover:text-t-accent cursor-pointer"
                  >
                    {copiedId === asset.id ? (
                      <Check className="w-3.5 h-3.5 text-t-success-text" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await deleteMediaAsset(asset);
                        onNotify('success', `Removed "${asset.title}".`);
                      } catch (err) {
                        onNotify('error', parseFirestoreErrorMessage(err));
                      }
                    }}
                    title="Delete asset"
                    className="p-1.5 rounded-control bg-t-danger-bg border border-t-danger-text/30 text-t-danger-text hover:opacity-80 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
