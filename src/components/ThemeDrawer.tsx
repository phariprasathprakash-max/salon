import { useState } from 'react';
import {
  AlertTriangle,
  BookmarkPlus,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Layers,
  Moon,
  Palette,
  RotateCcw,
  Sliders,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ATELIER_STYLE_LOOKS,
  CURATED_ACCENTS,
  getContrastRatio,
  getWcagGrade,
  normalizeHex,
  type ThemeBackdropVeil,
  type ThemeDensity,
  type ThemeFontScale,
  type ThemeMode,
  type ThemeMotion,
  type ThemeRadius,
  type ThemeSurfaceStyle,
  type ThemeTokenOverrides,
  type ThemeTypography,
  TYPOGRAPHY_PAIRINGS,
  useTheme,
} from '../lib/themes';

interface ThemeDrawerProps {
  open: boolean;
  onClose: () => void;
}

type DrawerTab = 'presets' | 'studio' | 'library';

export function ThemeDrawer({ open, onClose }: ThemeDrawerProps) {
  const {
    config,
    activePreset,
    effectiveTokens,
    presets,
    customPresets,
    setPreset,
    applyAtelierLook,
    setAccentOverride,
    setTokenOverride,
    applyHarmonizedSeeds,
    autoFixContrast,
    setRadius,
    setTypography,
    setDensity,
    setSurfaceStyle,
    setBackdropVeil,
    setMotion,
    setFontScale,
    saveCustomPreset,
    deleteCustomPreset,
    exportThemeJson,
    importThemeJson,
    resetTheme,
  } = useTheme();

  const [tab, setTab] = useState<DrawerTab>('presets');
  const [seedMode, setSeedMode] = useState<ThemeMode>(activePreset.mode);
  const [seedCanvas, setSeedCanvas] = useState(effectiveTokens.canvas);
  const [seedAccent, setSeedAccent] = useState(effectiveTokens.accent);

  const [customName, setCustomName] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [libraryFeedback, setLibraryFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [importText, setImportText] = useState('');

  if (!open) return null;

  const darkPresets = presets.filter((p) => p.mode === 'dark');
  const lightPresets = presets.filter((p) => p.mode === 'light');
  const currentAccent = effectiveTokens.accent;

  const textOnCanvasRatio = getContrastRatio(effectiveTokens.text, effectiveTokens.canvas);
  const buttonContrastRatio = getContrastRatio(
    effectiveTokens.accentContrast,
    effectiveTokens.accent
  );
  const accentOnSurfaceRatio = getContrastRatio(effectiveTokens.accent, effectiveTokens.surface);
  const needsContrastFix =
    textOnCanvasRatio < 4.5 || buttonContrastRatio < 4.5 || accentOnSurfaceRatio < 3.0;

  const hasTokenOverrides =
    Boolean(config.accentOverride) ||
    Boolean(config.tokenOverrides.canvas) ||
    Boolean(config.tokenOverrides.surface) ||
    Boolean(config.tokenOverrides.border) ||
    Boolean(config.tokenOverrides.text);

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setLibraryFeedback({ type: 'error', text: 'Enter a name for your custom theme.' });
      return;
    }
    const created = saveCustomPreset(customName, customSubtitle);
    setCustomName('');
    setCustomSubtitle('');
    setLibraryFeedback({
      type: 'success',
      text: `Saved "${created.name}" to your custom presets.`,
    });
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(exportThemeJson());
      setLibraryFeedback({ type: 'success', text: 'Theme JSON copied to clipboard.' });
    } catch {
      setLibraryFeedback({ type: 'error', text: 'Clipboard unavailable in this browser.' });
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([exportThemeJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inscape-theme-${activePreset.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLibraryFeedback({ type: 'success', text: 'Downloaded theme JSON file.' });
  };

  const handleImportJson = () => {
    if (!importText.trim()) {
      setLibraryFeedback({ type: 'error', text: 'Paste theme JSON before importing.' });
      return;
    }
    const result = importThemeJson(importText);
    if (result.ok) {
      setImportText('');
      setLibraryFeedback({ type: 'success', text: 'Imported and applied theme configuration.' });
    } else {
      setLibraryFeedback({ type: 'error', text: result.error });
    }
  };

  const tokenFields: {
    key: keyof ThemeTokenOverrides;
    label: string;
    value: string;
  }[] = [
    { key: 'canvas', label: 'Canvas Background', value: effectiveTokens.canvas },
    { key: 'surface', label: 'Card Surface', value: effectiveTokens.surface },
    { key: 'border', label: 'Hairline Border', value: effectiveTokens.border },
    { key: 'text', label: 'Primary Text', value: effectiveTokens.text },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        aria-label="Advanced Theme Studio"
        className="relative z-10 w-full max-w-lg bg-t-sidebar border-l border-t-border h-full flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-t-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Palette className="w-5 h-5 text-t-accent shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold text-t-text leading-tight truncate">
                Advanced Theme Studio
              </h2>
              <p className="text-xs text-t-text-muted truncate">
                14 luxury atelier palettes, backdrop veil, typography &amp; live WCAG tuning
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Theme Studio"
            className="p-2 rounded-control text-t-text-subtle hover:text-t-text hover:bg-t-elevated cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 pb-3 border-b border-t-border bg-t-sidebar">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-control bg-t-surface border border-t-border">
            {(
              [
                { id: 'presets', label: 'Atelier Themes', icon: Palette },
                { id: 'studio', label: 'Fine Tuning', icon: Sliders },
                { id: 'library', label: 'Save & Share', icon: BookmarkPlus },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-control text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-t-accent text-t-accent-contrast font-semibold'
                      : 'text-t-text-muted hover:text-t-text'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Live Rate Card Specimen Preview */}
          <div className="p-4 rounded-theme bg-t-surface border border-t-border shadow-theme space-y-3">
            <div className="flex items-center justify-between gap-2 text-[11px] text-t-accent font-medium">
              <span>
                {activePreset.name}
                {hasTokenOverrides ? ' · Custom' : ''}
              </span>
              <span className="font-mono-num text-t-text-muted">
                Contrast {textOnCanvasRatio}:1 ({getWcagGrade(textOnCanvasRatio)})
              </span>
            </div>
            <div className="divide-y divide-t-border border-y border-t-border">
              <div className="py-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-t-text truncate">
                  Stylist Hair Cut
                </span>
                <span className="font-mono-num text-sm font-semibold text-t-accent shrink-0">
                  ₹800
                </span>
              </div>
              <div className="py-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-t-text truncate">
                  Keratin Treatment
                </span>
                <span className="font-mono-num text-sm font-semibold text-t-accent shrink-0">
                  ₹4,500**
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-t-text-subtle">
              <span>
                {activePreset.mode === 'dark' ? 'Dark' : 'Light'} · {config.typography} ·{' '}
                {config.surfaceStyle} · {config.backdropVeil} veil
              </span>
              <button
                type="button"
                onClick={() => setTab('studio')}
                className="text-t-accent font-semibold hover:underline cursor-pointer"
              >
                Customize
              </button>
            </div>
          </div>

          {tab === 'presets' && (
            <>
              {/* One-Click Signature Atelier Looks */}
              <section className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-t-text-secondary">
                  <Sparkles className="w-3.5 h-3.5 text-t-accent" />
                  <span>One-Click Signature Looks</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ATELIER_STYLE_LOOKS.map((look) => {
                    const lookPreset = presets.find((p) => p.id === look.presetId);
                    const isCurrent =
                      config.presetId === look.presetId &&
                      config.typography === look.typography &&
                      config.surfaceStyle === look.surfaceStyle &&
                      config.radius === look.radius &&
                      config.backdropVeil === look.backdropVeil &&
                      !hasTokenOverrides;
                    return (
                      <button
                        key={look.id}
                        type="button"
                        onClick={() => applyAtelierLook(look)}
                        className={`p-3 rounded-theme border text-left transition-colors cursor-pointer space-y-1.5 ${
                          isCurrent
                            ? 'bg-t-elevated border-t-accent'
                            : 'bg-t-surface border-t-border hover:border-t-accent/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-t-text truncate">
                            {look.name}
                          </span>
                          {lookPreset && (
                            <span className="flex items-center gap-1 shrink-0">
                              <span
                                className="w-3 h-3 rounded-full border border-t-border"
                                style={{ backgroundColor: lookPreset.tokens.canvas }}
                              />
                              <span
                                className="w-3 h-3 rounded-full border border-t-border"
                                style={{ backgroundColor: lookPreset.tokens.accent }}
                              />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-t-text-muted leading-snug">
                          {look.tagline}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Saved Custom Themes */}
              {customPresets.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-t-text-secondary">
                    <BookmarkPlus className="w-3.5 h-3.5 text-t-accent" />
                    <span>Your Saved Themes ({customPresets.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {customPresets.map((preset) => {
                      const selected = preset.id === activePreset.id && !hasTokenOverrides;
                      return (
                        <div
                          key={preset.id}
                          className={`p-3 rounded-theme border flex items-center justify-between gap-2 transition-colors ${
                            selected
                              ? 'bg-t-elevated border-t-accent'
                              : 'bg-t-surface border-t-border hover:border-t-accent/50'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setPreset(preset.id)}
                            className="min-w-0 flex-1 text-left cursor-pointer"
                          >
                            <p className="text-xs font-semibold text-t-text truncate">
                              {preset.name}
                            </p>
                            <p className="text-[11px] text-t-text-subtle truncate">
                              {preset.subtitle}
                            </p>
                          </button>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-t-border"
                              style={{ backgroundColor: preset.tokens.canvas }}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-t-border"
                              style={{ backgroundColor: preset.tokens.accent }}
                            />
                            <button
                              type="button"
                              onClick={() => deleteCustomPreset(preset.id)}
                              aria-label={`Delete custom theme ${preset.name}`}
                              className="p-1 rounded-control text-t-text-subtle hover:text-t-danger-text cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Dark Atelier Palettes */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-t-text-secondary">
                  <Moon className="w-3.5 h-3.5 text-t-accent" />
                  <span>Dark Atelier Collection ({darkPresets.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {darkPresets.map((preset) => {
                    const selected = preset.id === activePreset.id && !hasTokenOverrides;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setPreset(preset.id)}
                        className={`p-3 rounded-theme border text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          selected
                            ? 'bg-t-elevated border-t-accent'
                            : 'bg-t-surface border-t-border hover:border-t-accent/50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-t-text truncate">
                            {preset.name}
                          </p>
                          <p className="text-[11px] text-t-text-subtle truncate">
                            {preset.subtitle}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/15"
                            style={{ backgroundColor: preset.tokens.canvas }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/15"
                            style={{ backgroundColor: preset.tokens.surface }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/15"
                            style={{ backgroundColor: preset.tokens.accent }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Daylight Atelier Palettes */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-t-text-secondary">
                  <Sun className="w-3.5 h-3.5 text-t-accent" />
                  <span>Daylight Atelier Collection ({lightPresets.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {lightPresets.map((preset) => {
                    const selected = preset.id === activePreset.id && !hasTokenOverrides;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setPreset(preset.id)}
                        className={`p-3 rounded-theme border text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          selected
                            ? 'bg-t-elevated border-t-accent'
                            : 'bg-t-surface border-t-border hover:border-t-accent/50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-t-text truncate">
                            {preset.name}
                          </p>
                          <p className="text-[11px] text-t-text-subtle truncate">
                            {preset.subtitle}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/15"
                            style={{ backgroundColor: preset.tokens.canvas }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/15"
                            style={{ backgroundColor: preset.tokens.surface }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/15"
                            style={{ backgroundColor: preset.tokens.accent }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Quick Accent Swatches */}
              <section className="space-y-3 pt-2 border-t border-t-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-t-text-secondary">
                    Signature Accent Metal &amp; Ink
                  </span>
                  <span className="font-mono-num text-[11px] text-t-text-subtle uppercase">
                    {currentAccent}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {CURATED_ACCENTS.map((item) => {
                    const isSelected = currentAccent.toLowerCase() === item.hex.toLowerCase();
                    return (
                      <button
                        key={item.hex}
                        type="button"
                        title={item.label}
                        aria-label={`Select accent ${item.label}`}
                        onClick={() => setAccentOverride(item.hex)}
                        className={`w-8 h-8 rounded-control border flex items-center justify-center cursor-pointer transition-transform ${
                          isSelected
                            ? 'border-t-text scale-105'
                            : 'border-t-border hover:scale-105'
                        }`}
                        style={{ backgroundColor: item.hex }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {tab === 'studio' && (
            <>
              {/* Backdrop Atmosphere / Veil Control */}
              <section className="p-4 rounded-theme bg-t-surface border border-t-border space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-t-accent" />
                  <span className="text-xs font-semibold text-t-text">
                    Storefront Backdrop Atmosphere
                  </span>
                </div>
                <p className="text-[11px] text-t-text-muted">
                  Control how softly the real White Town salon facade shines behind the theme.
                </p>
                <div className="grid grid-cols-3 gap-2 p-1 rounded-control bg-t-canvas border border-t-border">
                  {(
                    [
                      { id: 'sheer', label: 'Sheer Glass' },
                      { id: 'balanced', label: 'Balanced' },
                      { id: 'solid', label: 'Solid Atelier' },
                    ] as { id: ThemeBackdropVeil; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBackdropVeil(opt.id)}
                      className={`py-2 px-2 rounded-control text-xs font-medium transition-colors cursor-pointer ${
                        config.backdropVeil === opt.id
                          ? 'bg-t-accent text-t-accent-contrast font-semibold'
                          : 'text-t-text-muted hover:text-t-text'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Palette Harmonizer */}
              <section className="p-4 rounded-theme bg-t-surface border border-t-border space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-t-accent" />
                    <span className="text-xs font-semibold text-t-text">
                      Smart Palette Harmonizer
                    </span>
                  </div>
                  <div className="inline-flex p-0.5 rounded-control bg-t-canvas border border-t-border">
                    {(['dark', 'light'] as ThemeMode[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSeedMode(m)}
                        className={`px-2.5 py-1 rounded-control text-[11px] font-medium capitalize cursor-pointer ${
                          seedMode === m
                            ? 'bg-t-accent text-t-accent-contrast font-semibold'
                            : 'text-t-text-muted hover:text-t-text'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-t-text-muted">
                  Pick any canvas &amp; accent color to auto-generate a WCAG-balanced palette.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-control bg-t-canvas border border-t-border cursor-pointer">
                    <span className="text-xs text-t-text-secondary">Canvas Seed</span>
                    <input
                      type="color"
                      value={seedCanvas}
                      onChange={(e) => setSeedCanvas(e.target.value)}
                      className="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-control bg-t-canvas border border-t-border cursor-pointer">
                    <span className="text-xs text-t-text-secondary">Accent Seed</span>
                    <input
                      type="color"
                      value={seedAccent}
                      onChange={(e) => setSeedAccent(e.target.value)}
                      className="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => applyHarmonizedSeeds(seedCanvas, seedAccent, seedMode)}
                  className="w-full py-2 px-3 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-xs font-semibold cursor-pointer"
                >
                  Generate Harmonized Palette
                </button>
              </section>

              {/* Granular Token Overrides */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-t-text-secondary">
                    Granular Color Tokens
                  </span>
                  {hasTokenOverrides && (
                    <button
                      type="button"
                      onClick={() => setPreset(activePreset.id)}
                      className="text-xs text-t-accent hover:underline cursor-pointer"
                    >
                      Clear Overrides
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-control bg-t-surface border border-t-border">
                    <span className="text-xs text-t-text-secondary">Primary Accent</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num text-[11px] text-t-text-subtle">
                        {effectiveTokens.accent}
                      </span>
                      <input
                        type="color"
                        aria-label="Primary Accent color"
                        value={effectiveTokens.accent}
                        onChange={(e) => setAccentOverride(e.target.value)}
                        className="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {tokenFields.map((field) => (
                    <div
                      key={field.key}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-control bg-t-surface border border-t-border"
                    >
                      <span className="text-xs text-t-text-secondary">{field.label}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => {
                            const norm = normalizeHex(e.target.value);
                            if (norm) setTokenOverride(field.key, norm);
                          }}
                          aria-label={`${field.label} hex`}
                          className="w-20 px-2 py-1 rounded-control bg-t-canvas border border-t-border font-mono-num text-[11px] text-t-text text-center"
                        />
                        <input
                          type="color"
                          aria-label={`${field.label} picker`}
                          value={field.value}
                          onChange={(e) => setTokenOverride(field.key, e.target.value)}
                          className="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* WCAG Contrast Diagnostics */}
              <section className="p-4 rounded-theme bg-t-surface border border-t-border space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-t-text">
                    WCAG Contrast Diagnostics
                  </span>
                  {needsContrastFix && (
                    <button
                      type="button"
                      onClick={autoFixContrast}
                      className="px-2.5 py-1 rounded-control bg-t-accent text-t-accent-contrast text-[11px] font-semibold cursor-pointer"
                    >
                      Auto-Fix Contrast
                    </button>
                  )}
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Body Text on Canvas', ratio: textOnCanvasRatio, min: 4.5 },
                    { label: 'Button Label on Accent', ratio: buttonContrastRatio, min: 4.5 },
                    { label: 'Accent on Card Surface', ratio: accentOnSurfaceRatio, min: 3.0 },
                  ].map((row) => {
                    const grade = getWcagGrade(row.ratio);
                    const passes = row.ratio >= row.min;
                    return (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-2 text-t-text-secondary"
                      >
                        <span>{row.label}</span>
                        <span
                          className={`inline-flex items-center gap-1.5 font-mono-num text-[11px] font-medium ${
                            passes ? 'text-t-success-text' : 'text-t-warn-text'
                          }`}
                        >
                          {passes ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                          {row.ratio}:1 · {grade}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Typography Pairing */}
              <section className="space-y-2.5 pt-2 border-t border-t-border">
                <span className="block text-xs font-semibold text-t-text-secondary">
                  Typography Pairing
                </span>
                <div className="space-y-2">
                  {TYPOGRAPHY_PAIRINGS.map((pair) => {
                    const active = config.typography === pair.id;
                    return (
                      <button
                        key={pair.id}
                        type="button"
                        onClick={() => setTypography(pair.id as ThemeTypography)}
                        className={`w-full p-3 rounded-control border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                          active
                            ? 'bg-t-elevated border-t-accent'
                            : 'bg-t-surface border-t-border hover:border-t-accent/50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p
                            className="text-sm font-bold text-t-text truncate"
                            style={{ fontFamily: pair.display }}
                          >
                            {pair.label} — {pair.displayName}
                          </p>
                          <p className="text-[11px] text-t-text-muted truncate">
                            {pair.bodyName} · {pair.note}
                          </p>
                        </div>
                        {active && <Check className="w-4 h-4 text-t-accent shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Surface Depth */}
              <section className="space-y-2.5 pt-2 border-t border-t-border">
                <span className="block text-xs font-semibold text-t-text-secondary">
                  Card Surface Finish
                </span>
                <div className="grid grid-cols-3 gap-2 p-1 rounded-control bg-t-surface border border-t-border">
                  {(
                    [
                      { id: 'hairline', label: 'Hairline' },
                      { id: 'elevated', label: 'Elevated' },
                      { id: 'frosted', label: 'Frosted' },
                    ] as { id: ThemeSurfaceStyle; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSurfaceStyle(opt.id)}
                      className={`py-2 px-2 rounded-control text-xs font-medium transition-colors cursor-pointer ${
                        config.surfaceStyle === opt.id
                          ? 'bg-t-accent text-t-accent-contrast font-semibold'
                          : 'text-t-text-muted hover:text-t-text'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Corner Geometry */}
              <section className="space-y-2.5 pt-2 border-t border-t-border">
                <span className="block text-xs font-semibold text-t-text-secondary">
                  Corner Geometry
                </span>
                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-control bg-t-surface border border-t-border">
                  {(
                    [
                      { id: 'architectural', label: 'Square' },
                      { id: 'sharp', label: 'Sharp' },
                      { id: 'refined', label: 'Refined' },
                      { id: 'soft', label: 'Soft' },
                    ] as { id: ThemeRadius; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRadius(opt.id)}
                      className={`py-2 px-1.5 rounded-control text-xs font-medium transition-colors cursor-pointer ${
                        config.radius === opt.id
                          ? 'bg-t-accent text-t-accent-contrast font-semibold'
                          : 'text-t-text-muted hover:text-t-text'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Font Scale & Density & Motion */}
              <section className="space-y-4 pt-2 border-t border-t-border">
                <div>
                  <span className="block text-xs font-semibold text-t-text-secondary mb-2">
                    Base Type Scale
                  </span>
                  <div className="grid grid-cols-3 gap-2 p-1 rounded-control bg-t-surface border border-t-border">
                    {(
                      [
                        { id: 'compact', label: '15px Compact' },
                        { id: 'standard', label: '16px Standard' },
                        { id: 'large', label: '17px Large' },
                      ] as { id: ThemeFontScale; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFontScale(opt.id)}
                        className={`py-2 px-1.5 rounded-control text-xs font-medium transition-colors cursor-pointer ${
                          config.fontScale === opt.id
                            ? 'bg-t-accent text-t-accent-contrast font-semibold'
                            : 'text-t-text-muted hover:text-t-text'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-t-text-secondary mb-2">
                    Workspace Density
                  </span>
                  <div className="grid grid-cols-3 gap-2 p-1 rounded-control bg-t-surface border border-t-border">
                    {(
                      [
                        { id: 'compact', label: 'Compact' },
                        { id: 'balanced', label: 'Balanced' },
                        { id: 'airy', label: 'Airy' },
                      ] as { id: ThemeDensity; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDensity(opt.id)}
                        className={`py-2 px-2 rounded-control text-xs font-medium transition-colors cursor-pointer ${
                          config.density === opt.id
                            ? 'bg-t-accent text-t-accent-contrast font-semibold'
                            : 'text-t-text-muted hover:text-t-text'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-t-text-secondary mb-2">
                    Motion Preference
                  </span>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-control bg-t-surface border border-t-border">
                    {(
                      [
                        { id: 'smooth', label: 'Smooth Transitions' },
                        { id: 'reduced', label: 'Reduced Motion' },
                      ] as { id: ThemeMotion; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMotion(opt.id)}
                        className={`py-2 px-2 rounded-control text-xs font-medium transition-colors cursor-pointer ${
                          config.motion === opt.id
                            ? 'bg-t-accent text-t-accent-contrast font-semibold'
                            : 'text-t-text-muted hover:text-t-text'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {tab === 'library' && (
            <>
              {libraryFeedback && (
                <div
                  className={`p-3 rounded-control border text-xs flex items-center gap-2 ${
                    libraryFeedback.type === 'success'
                      ? 'bg-t-success-bg border-t-success-text/40 text-t-success-text'
                      : 'bg-t-danger-bg border-t-danger-text/40 text-t-danger-text'
                  }`}
                >
                  {libraryFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{libraryFeedback.text}</span>
                </div>
              )}

              {/* Save as Custom Preset */}
              <form
                onSubmit={handleSaveCustom}
                className="p-4 rounded-theme bg-t-surface border border-t-border space-y-3"
              >
                <h3 className="text-xs font-semibold text-t-text">
                  Save Current Style as Preset
                </h3>
                <p className="text-[11px] text-t-text-muted">
                  Stores your active colors, typography, corners, veil, and surface settings in your
                  local Atelier library.
                </p>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Theme name (e.g., Monsoon Courtyard)"
                  maxLength={48}
                  className="w-full px-3 py-2 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-xs text-t-text"
                />
                <input
                  type="text"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  placeholder="Optional subtitle (e.g., Evening Bridal Gold)"
                  maxLength={64}
                  className="w-full px-3 py-2 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none text-xs text-t-text"
                />
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-xs font-semibold cursor-pointer"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  Save Custom Preset
                </button>
              </form>

              {/* Export Theme JSON */}
              <section className="p-4 rounded-theme bg-t-surface border border-t-border space-y-3">
                <h3 className="text-xs font-semibold text-t-text">Export Theme JSON</h3>
                <p className="text-[11px] text-t-text-muted">
                  Share this theme across workstations or keep a backup of your token palette.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-medium text-t-text cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-t-accent" />
                    Copy JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-medium text-t-text cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-t-accent" />
                    Download .json
                  </button>
                </div>
              </section>

              {/* Import Theme JSON */}
              <section className="p-4 rounded-theme bg-t-surface border border-t-border space-y-3">
                <h3 className="text-xs font-semibold text-t-text">Import Theme JSON</h3>
                <textarea
                  rows={5}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='Paste exported JSON ({"schema":"inscape-theme-v3", ...})'
                  className="w-full px-3 py-2 rounded-control bg-t-canvas border border-t-border focus:border-t-accent focus:outline-none font-mono-num text-[11px] text-t-text"
                />
                <button
                  type="button"
                  onClick={handleImportJson}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-t-accent" />
                  Apply Imported Theme
                </button>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-t-border flex items-center justify-between gap-3 bg-t-surface">
          <button
            type="button"
            onClick={() => {
              resetTheme();
              setLibraryFeedback(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control border border-t-border text-xs font-medium text-t-text-secondary hover:text-t-text cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </aside>
    </div>
  );
}
