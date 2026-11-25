import { BRAND_LOGO_URL, resolveLogoUrl } from '../lib/defaults';

interface BrandLogoProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export function BrandLogo({
  src,
  alt = 'INSCAPE your dream salon',
  className = '',
}: BrandLogoProps) {
  const resolved = resolveLogoUrl(src);
  const isOfficialWordmark = resolved === BRAND_LOGO_URL;

  return (
    <div
      className={`aspect-[3/1] bg-[#3B1A06] overflow-hidden select-none ${className}`}
    >
      <img
        src={resolved}
        alt={alt}
        referrerPolicy="no-referrer"
        className={
          isOfficialWordmark
            ? 'w-full h-full object-cover'
            : 'w-full h-full object-contain p-1'
        }
        style={
          isOfficialWordmark
            ? {
                objectPosition: '50% 53%',
                transform: 'scale(1.22)',
                transformOrigin: '92% 53%',
              }
            : undefined
        }
      />
    </div>
  );
}
