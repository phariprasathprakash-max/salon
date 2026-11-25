import { useEffect, useState } from 'react';
import { Scissors } from 'lucide-react';
import { replaceLegacyAiImageUrl } from '../lib/menuCatalog';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  fallbackTitle?: string;
  className?: string;
}

export function SafeImage({
  src,
  alt,
  fallbackTitle,
  className = 'w-full h-full object-cover',
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const cleaned = replaceLegacyAiImageUrl(src);

  useEffect(() => {
    setFailed(false);
  }, [cleaned]);

  if (!cleaned || failed) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center"
        style={{
          background:
            'linear-gradient(135deg, var(--t-elevated) 0%, var(--t-surface) 55%, var(--t-canvas) 100%)',
        }}
      >
        <Scissors className="w-6 h-6 text-t-accent/70" />
        <span className="text-xs font-medium text-t-text-muted line-clamp-2 max-w-[180px]">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={cleaned}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
