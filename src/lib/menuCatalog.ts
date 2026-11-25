import type { SalonCategory, SalonService } from '../types/salon';

export const MENU_IMAGES = {
  salonInterior: '/assets/aistudio/WhatsApp_Image_2026-11-17_at_11.04.35_PM_45b77185.jpeg',
  salonInsideReal: '/assets/aistudio/download_bad2d585.jpg',
  hairSpa: '',
  hairStyling: '',
  facialSkincare: '',
  bridalMakeup: '',
  manicureGrooming: '',
  mensGrooming: '',
} as const;

/**
 * Strips any previously saved AI-generated image URLs (/src/assets/images/*)
 * so only genuine salon photographs or clean text-only service rows appear.
 */
export function replaceLegacyAiImageUrl(url?: string | null): string {
  const cleaned = (url || '').trim();
  if (!cleaned) return '';
  if (isLegacyAiImageUrl(cleaned)) return '';
  return cleaned;
}

export function isLegacyAiImageUrl(url?: string | null): boolean {
  const cleaned = (url || '').trim();
  return (
    cleaned.includes('/src/assets/images/') ||
    cleaned.includes('natural_hair') ||
    cleaned.includes('natural_facial') ||
    cleaned.includes('natural_bridal') ||
    cleaned.includes('natural_nails') ||
    cleaned.includes('natural_mens')
  );
}

export const LEGACY_SEED_CATEGORY_IDS = [
  'haircuts-styling',
  'hair-treatments-color',
  'mens-grooming',
  'skincare-facials',
  'hair-removal',
  'nails-spa-bridal',
] as const;

export const LEGACY_SEED_SERVICE_IDS = [
  'womens-layer-face-framing-cut',
  'mens-haircut-blowdry',
  'kids-haircut-blowdry-curling',
  'keratin-nanoplastia-treatment',
  'balayage-ombre-highlights',
  'nourishing-hair-spa',
  'beard-styling-trim-shave',
  'deep-cleansing-anti-aging-facial',
  'detan-bleach-cleanup',
  'threading-full-face',
  'waxing-body-arms-legs',
  'manicure-detan-pedicure-head-massage',
  'party-makeup-bridal-grooming',
] as const;

export const OFFICIAL_MENU_CATEGORIES: Omit<SalonCategory, 'createdAt' | 'updatedAt'>[] = [
  // WOMEN (Pages 1–9)
  {
    id: 'women-hair-cut-blow-wave',
    name: 'Women · Hair Cut & Blow Wave',
    slug: 'women-hair-cut-blow-wave',
    description:
      'Stylist to Creative Director cuts, hair trim, wash & conditioning, blow dry, ironing, tongs, and hairdo.',
    imageUrl: MENU_IMAGES.hairStyling,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'women-colour-creative',
    name: 'Women · Colour & Creative Services',
    slug: 'women-colour-creative',
    description:
      'Root touch-up, ammonia-free global colour, contouring, classic highlights, pure gloss, ombre, balayage & makeover colour.',
    imageUrl: MENU_IMAGES.hairStyling,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'women-hair-spa-treatments',
    name: 'Women · Hair Spa, Oil & Expert Treatments',
    slug: 'women-hair-spa-treatments',
    description:
      'Anti-dandruff, anti-hair fall & sensitive scalp therapy, moisturiser & repair hair spas, protein & Moroccan oil treatments.',
    imageUrl: MENU_IMAGES.hairSpa,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'women-texture-services',
    name: 'Women · Texture Services',
    slug: 'women-texture-services',
    description: 'Perming, smoothening, keratin, straightening, and straight therapy.',
    imageUrl: MENU_IMAGES.hairSpa,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'women-threading-clean-up',
    name: 'Women · Threading & Clean-Up',
    slug: 'women-threading-clean-up',
    description:
      'Precision facial threading (lip, chin, forehead, eyebrows, side, full face), un-tan pack, classic & acne clean-ups.',
    imageUrl: MENU_IMAGES.facialSkincare,
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'women-facials-peel-off',
    name: 'Women · Facials & Peel-Off Masks',
    slug: 'women-facials-peel-off',
    description:
      'Premium & luxury facials (Gold, Vitamin C, O2C2, Radiant) and Vitamin C, Green Tea, Charcoal & Bridal Glow peel-off masks.',
    imageUrl: MENU_IMAGES.facialSkincare,
    isActive: true,
    sortOrder: 6,
  },
  {
    id: 'women-bleaching',
    name: 'Women · Bleaching Services',
    slug: 'women-bleaching',
    description:
      'Under arm, feet, blouse line, face & neck, full back, half leg, full arm, and full body bleaching.',
    imageUrl: MENU_IMAGES.facialSkincare,
    isActive: true,
    sortOrder: 7,
  },
  {
    id: 'women-waxing',
    name: 'Women · Face, Rica & Lipo Waxing',
    slug: 'women-waxing',
    description:
      'Gentle face waxing plus Flavour Rica and Flavour Lipo waxing for arms, legs, back, front, bikini & full body.',
    imageUrl: MENU_IMAGES.facialSkincare,
    isActive: true,
    sortOrder: 8,
  },
  {
    id: 'women-pedi-mani-relaxing',
    name: 'Women · Pedi/Mani & Relaxing Treatments',
    slug: 'women-pedi-mani-relaxing',
    description:
      'Classic, Spa, Ice Cream & Black Diamond manicure/pedicure, heel peel treatment, and soothing eye, face, foot, hand & back massages.',
    imageUrl: MENU_IMAGES.manicureGrooming,
    isActive: true,
    sortOrder: 9,
  },
  {
    id: 'women-nails-polish',
    name: 'Women · Nails & Polish',
    slug: 'women-nails-polish',
    description:
      'Nail polish, nail art, glitter, chrome, ring stone, gel polish, French polish, gel & acrylic extensions, and jewellery polish.',
    imageUrl: MENU_IMAGES.manicureGrooming,
    isActive: true,
    sortOrder: 10,
  },
  {
    id: 'women-makeup-mehandi',
    name: 'Women · Make-Up & Mehandi',
    slug: 'women-makeup-mehandi',
    description:
      'Classic, MAC, HD, Air Brush, Party & Kids make-up, outdoor charges, and Classic, Arabic & Bridal Mehandi.',
    imageUrl: MENU_IMAGES.bridalMakeup,
    isActive: true,
    sortOrder: 11,
  },

  // MEN (Pages 10–14)
  {
    id: 'men-hair-cut-grooming',
    name: 'Men · Hair Cut & Grooming',
    slug: 'men-hair-cut-grooming',
    description:
      'Stylist, Senior & Creative Stylist haircuts, beard trim & styling, premium shave, wash & conditioning, oil massage & kids cut.',
    imageUrl: MENU_IMAGES.mensGrooming,
    isActive: true,
    sortOrder: 12,
  },
  {
    id: 'men-hair-colour',
    name: 'Men · Hair & Creative Colour',
    slug: 'men-hair-colour',
    description:
      'Silver coverage (regular & ammonia-free), moustache & beard colour, pure gloss, blend & fashion colouring.',
    imageUrl: MENU_IMAGES.mensGrooming,
    isActive: true,
    sortOrder: 13,
  },
  {
    id: 'men-hair-spa-texture',
    name: 'Men · Hair Spa, Expert & Texture',
    slug: 'men-hair-spa-texture',
    description:
      'Serie Expert scalp treatments, restorative hair spas, protein treatment, keratin, smoothening & straightening.',
    imageUrl: MENU_IMAGES.hairSpa,
    isActive: true,
    sortOrder: 14,
  },
  {
    id: 'men-beauty-facials',
    name: 'Men · Clean-Up, Facials & Masks',
    slug: 'men-beauty-facials',
    description:
      'Clean-ups, un-tan pack, premium & luxury facials (Gold, Vitamin C, O2C2, Radiant), and peel-off masks.',
    imageUrl: MENU_IMAGES.facialSkincare,
    isActive: true,
    sortOrder: 15,
  },
  {
    id: 'men-pedi-mani-relaxing',
    name: 'Men · Pedi/Mani & Relaxing Treatments',
    slug: 'men-pedi-mani-relaxing',
    description:
      'Classic, Spa, Ice Cream & Black Diamond Luxury manicure/pedicure, heel peel treatment, and targeted massages.',
    imageUrl: MENU_IMAGES.manicureGrooming,
    isActive: true,
    sortOrder: 16,
  },
  {
    id: 'men-makeup',
    name: 'Men · Groom & Party Make-Up',
    slug: 'men-makeup',
    description:
      'Classic, MAC & HD groom make-up, party groom styling, and outdoor venue charges.',
    imageUrl: MENU_IMAGES.bridalMakeup,
    isActive: true,
    sortOrder: 17,
  },
];

interface RawMenuRow {
  id: string;
  categoryId: string;
  section: string;
  name: string;
  price: number;
  starting?: boolean;
  duration?: string;
  featured?: boolean;
  imageUrl: string;
}

const RAW_MENU_ROWS: RawMenuRow[] = [
  // ── PAGE 2: WOMEN · HAIR CUT & BLOW WAVE ──
  { id: 'w-hc-hair-trim', categoryId: 'women-hair-cut-blow-wave', section: 'Hair Cut', name: 'Hair Trim', price: 500, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-hc-stylist', categoryId: 'women-hair-cut-blow-wave', section: 'Hair Cut', name: 'Stylist Hair Cut', price: 800, featured: true, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-hc-senior-stylist', categoryId: 'women-hair-cut-blow-wave', section: 'Hair Cut', name: 'Senior Stylist Hair Cut', price: 1000, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-hc-creative-stylist', categoryId: 'women-hair-cut-blow-wave', section: 'Hair Cut', name: 'Creative Stylist Hair Cut', price: 1200, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-hc-creative-director', categoryId: 'women-hair-cut-blow-wave', section: 'Hair Cut', name: 'Creative Director Hair Cut', price: 1500, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-bw-wash-conditioning', categoryId: 'women-hair-cut-blow-wave', section: 'Blow Wave', name: 'Hair Wash & Conditioning', price: 500, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-bw-blow-dry', categoryId: 'women-hair-cut-blow-wave', section: 'Blow Wave', name: 'Blow Dry', price: 600, starting: true, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-bw-volume-blow-dry', categoryId: 'women-hair-cut-blow-wave', section: 'Blow Wave', name: 'Volume Blow Dry', price: 800, starting: true, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-bw-ironing', categoryId: 'women-hair-cut-blow-wave', section: 'Blow Wave', name: 'Ironing', price: 1500, starting: true, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-bw-tongs', categoryId: 'women-hair-cut-blow-wave', section: 'Blow Wave', name: 'Tongs', price: 1500, starting: true, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-bw-hairdo', categoryId: 'women-hair-cut-blow-wave', section: 'Blow Wave', name: 'Hairdo', price: 1500, starting: true, imageUrl: MENU_IMAGES.hairStyling },

  // ── PAGE 2: WOMEN · COLOUR & CREATIVE SERVICES ──
  { id: 'w-col-root-touchup', categoryId: 'women-colour-creative', section: 'Colour Services', name: 'Root Touch - Up', price: 1300, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-col-root-touchup-af', categoryId: 'women-colour-creative', section: 'Colour Services', name: 'Root Touch - Up (Ammonia Free)', price: 1500, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-col-global', categoryId: 'women-colour-creative', section: 'Colour Services', name: 'Global Colour', price: 3000, starting: true, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-col-global-af', categoryId: 'women-colour-creative', section: 'Colour Services', name: 'Global Colour (Ammonia Free)', price: 3500, starting: true, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-cre-contouring', categoryId: 'women-colour-creative', section: 'Creative Services', name: 'Contouring', price: 2000, starting: true, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-cre-classic-highlights', categoryId: 'women-colour-creative', section: 'Creative Services', name: 'Classic Highlights', price: 3000, starting: true, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-cre-pure-gloss', categoryId: 'women-colour-creative', section: 'Creative Services', name: 'Pure Gloss', price: 4000, starting: true, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-cre-ombre', categoryId: 'women-colour-creative', section: 'Creative Services', name: 'Ombre', price: 4500, starting: true, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-cre-balayage', categoryId: 'women-colour-creative', section: 'Creative Services', name: 'Balayage', price: 5000, starting: true, featured: true, imageUrl: MENU_IMAGES.hairStyling },
  { id: 'w-cre-makeover-colour', categoryId: 'women-colour-creative', section: 'Creative Services', name: 'Make Over Colour', price: 7000, starting: true, imageUrl: MENU_IMAGES.hairStyling },

  // ── PAGE 3: WOMEN · HAIR SPA, OIL & EXPERT TREATMENTS ──
  { id: 'w-exp-anti-dandruff', categoryId: 'women-hair-spa-treatments', section: 'Expert Treatment', name: 'Anti-Dandruff Treatment', price: 1000, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-exp-anti-hairfall', categoryId: 'women-hair-spa-treatments', section: 'Expert Treatment', name: 'Anti-Hair Fall Treatment', price: 1000, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-exp-sensitive-scalp', categoryId: 'women-hair-spa-treatments', section: 'Expert Treatment', name: 'Sensitive Scalp Treatment', price: 1000, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-spa-moisturiser', categoryId: 'women-hair-spa-treatments', section: 'Hair Spa Services', name: 'Moisturiser Hair Spa', price: 1500, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-spa-intense-smoothing', categoryId: 'women-hair-spa-treatments', section: 'Hair Spa Services', name: 'Intense Smoothing Hair Spa', price: 1500, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-spa-lepidium-repair', categoryId: 'women-hair-spa-treatments', section: 'Hair Spa Services', name: 'Lepidium Repair Hair Spa', price: 1500, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-spa-radiant-colour-protect', categoryId: 'women-hair-spa-treatments', section: 'Hair Spa Services', name: 'Radiant Colour Protect Hair Spa', price: 1500, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-spa-pure-balance', categoryId: 'women-hair-spa-treatments', section: 'Hair Spa Services', name: 'Pure Balance Hair Spa', price: 1500, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-spa-protein-treatment', categoryId: 'women-hair-spa-treatments', section: 'Hair Spa Services', name: 'Protein Treatment', price: 2500, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-oil-express', categoryId: 'women-hair-spa-treatments', section: 'Oil Treatment', name: 'Express Oil Treatment', price: 700, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-oil-essential', categoryId: 'women-hair-spa-treatments', section: 'Oil Treatment', name: 'Essential Oil Treatment', price: 1000, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-oil-moroccan', categoryId: 'women-hair-spa-treatments', section: 'Oil Treatment', name: 'Moroccan Oil Treatment', price: 2500, starting: true, imageUrl: MENU_IMAGES.hairSpa },

  // ── PAGE 3: WOMEN · TEXTURE SERVICES ──
  { id: 'w-tex-perming', categoryId: 'women-texture-services', section: 'Texture Services', name: 'Perming', price: 5000, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-tex-smoothening', categoryId: 'women-texture-services', section: 'Texture Services', name: 'Smoothening', price: 6000, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-tex-keratin', categoryId: 'women-texture-services', section: 'Texture Services', name: 'Keratin', price: 6000, starting: true, featured: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-tex-straightening', categoryId: 'women-texture-services', section: 'Texture Services', name: 'Straightening', price: 8000, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-tex-straight-therapy', categoryId: 'women-texture-services', section: 'Texture Services', name: 'Straight Therapy', price: 10000, starting: true, imageUrl: MENU_IMAGES.hairSpa },

  // ── PAGE 4: WOMEN · THREADING & CLEAN-UP ──
  { id: 'w-thr-lower-lip', categoryId: 'women-threading-clean-up', section: 'Threading', name: 'Lower Lip Threading', price: 30, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-thr-upper-lip', categoryId: 'women-threading-clean-up', section: 'Threading', name: 'Upper Lip Threading', price: 30, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-thr-chin', categoryId: 'women-threading-clean-up', section: 'Threading', name: 'Chin Threading', price: 50, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-thr-forehead', categoryId: 'women-threading-clean-up', section: 'Threading', name: 'Forehead Threading', price: 50, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-thr-eyebrows', categoryId: 'women-threading-clean-up', section: 'Threading', name: 'Eyebrows Threading', price: 60, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-thr-side', categoryId: 'women-threading-clean-up', section: 'Threading', name: 'Side Threading', price: 60, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-thr-full-face', categoryId: 'women-threading-clean-up', section: 'Threading', name: 'Full Face Threading', price: 270, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-cu-untan-pack', categoryId: 'women-threading-clean-up', section: 'Clean-Up', name: 'Un-Tan Pack', price: 700, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-cu-classic-dry', categoryId: 'women-threading-clean-up', section: 'Clean-Up', name: 'Classic Clean-Up (Dry)', price: 800, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-cu-classic-oily', categoryId: 'women-threading-clean-up', section: 'Clean-Up', name: 'Classic Clean-Up (Oily)', price: 800, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-cu-acne', categoryId: 'women-threading-clean-up', section: 'Clean-Up', name: 'Acne Clean-Up', price: 800, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-cu-under-eye', categoryId: 'women-threading-clean-up', section: 'Clean-Up', name: 'Under Eye Treatment', price: 1000, imageUrl: MENU_IMAGES.facialSkincare },

  // ── PAGES 4–5: WOMEN · FACIALS & PEEL-OFF MASKS ──
  { id: 'w-pf-pure-moist', categoryId: 'women-facials-peel-off', section: 'Premium Facial', name: 'Pure Moist Facial', price: 1000, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-pf-fruit-dry', categoryId: 'women-facials-peel-off', section: 'Premium Facial', name: 'Fruit Facial (Dry)', price: 1200, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-pf-detan', categoryId: 'women-facials-peel-off', section: 'Premium Facial', name: 'De-Tan Facial', price: 1500, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-pf-sensi-glow', categoryId: 'women-facials-peel-off', section: 'Premium Facial', name: 'Sensi Glow Facial', price: 1800, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-pf-natural-brightening', categoryId: 'women-facials-peel-off', section: 'Premium Facial', name: 'Natural Brightening Facial', price: 2000, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-lf-gold', categoryId: 'women-facials-peel-off', section: 'Luxury Facial', name: 'Gold Facial', price: 2500, featured: true, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-lf-vitamin-c', categoryId: 'women-facials-peel-off', section: 'Luxury Facial', name: 'Vitamin C Facial', price: 3500, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-lf-o2c2', categoryId: 'women-facials-peel-off', section: 'Luxury Facial', name: 'O2C2 Facial', price: 4000, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-lf-advance-lightening', categoryId: 'women-facials-peel-off', section: 'Luxury Facial', name: 'Advance Skin Lightening Facial', price: 4500, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-lf-radiant', categoryId: 'women-facials-peel-off', section: 'Luxury Facial', name: 'Radiant Facial', price: 5500, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-pm-vitamin-c', categoryId: 'women-facials-peel-off', section: 'Peel-Off Mask', name: 'Vitamin C Peel-Off Mask', price: 700, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-pm-green-tea', categoryId: 'women-facials-peel-off', section: 'Peel-Off Mask', name: 'Green Tea Peel-Off Mask', price: 700, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-pm-charcoal', categoryId: 'women-facials-peel-off', section: 'Peel-Off Mask', name: 'Charcoal Peel-Off Mask', price: 1000, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-pm-bridal-glow', categoryId: 'women-facials-peel-off', section: 'Peel-Off Mask', name: 'Bridal Glow Peel-Off Mask', price: 1500, imageUrl: MENU_IMAGES.facialSkincare },

  // ── PAGE 5: WOMEN · BLEACHING SERVICES ──
  { id: 'w-bl-under-arm', categoryId: 'women-bleaching', section: 'Bleaching Services', name: 'Under Arm Bleaching', price: 300, starting: true, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-bl-feet', categoryId: 'women-bleaching', section: 'Bleaching Services', name: 'Feet Bleach', price: 400, starting: true, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-bl-blouse-line', categoryId: 'women-bleaching', section: 'Bleaching Services', name: 'Blouse Line Bleach', price: 500, starting: true, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-bl-face-neck', categoryId: 'women-bleaching', section: 'Bleaching Services', name: 'Face Neck Bleach', price: 700, starting: true, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-bl-full-back', categoryId: 'women-bleaching', section: 'Bleaching Services', name: 'Full Back Bleach', price: 700, starting: true, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-bl-half-leg', categoryId: 'women-bleaching', section: 'Bleaching Services', name: 'Half Leg Bleach', price: 800, starting: true, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-bl-full-arm', categoryId: 'women-bleaching', section: 'Bleaching Services', name: 'Full Arm Bleach', price: 800, starting: true, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-bl-full-body', categoryId: 'women-bleaching', section: 'Bleaching Services', name: 'Full Body Bleach', price: 3700, starting: true, imageUrl: MENU_IMAGES.facialSkincare },

  // ── PAGES 5–6: WOMEN · WAXING (FOR FACE, FLAVOUR RICA, FLAVOUR LIPO) ──
  { id: 'w-fw-upper-lip', categoryId: 'women-waxing', section: 'For Face Wax', name: 'Upper Lip Wax', price: 100, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-fw-chin', categoryId: 'women-waxing', section: 'For Face Wax', name: 'Chin Wax', price: 100, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-fw-side', categoryId: 'women-waxing', section: 'For Face Wax', name: 'Side Wax', price: 200, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-fw-full-face', categoryId: 'women-waxing', section: 'For Face Wax', name: 'Full Face Wax', price: 500, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-rica-under-arms', categoryId: 'women-waxing', section: 'Flavour Rica Waxing', name: 'Under Arms (Rica Wax)', price: 150, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-rica-half-arms', categoryId: 'women-waxing', section: 'Flavour Rica Waxing', name: 'Half Arms (Rica Wax)', price: 300, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-rica-full-arms', categoryId: 'women-waxing', section: 'Flavour Rica Waxing', name: 'Full Arms (Rica Wax)', price: 400, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-rica-half-legs', categoryId: 'women-waxing', section: 'Flavour Rica Waxing', name: 'Half Legs (Rica Wax)', price: 400, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-rica-abdomen', categoryId: 'women-waxing', section: 'Flavour Rica Waxing', name: 'Abdomen (Rica Wax)', price: 500, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-rica-full-front', categoryId: 'women-waxing', section: 'Flavour Rica Waxing', name: 'Full Front (Rica Wax)', price: 600, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-rica-full-legs', categoryId: 'women-waxing', section: 'Flavour Rica Waxing', name: 'Full Legs (Rica Wax)', price: 600, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-rica-full-back', categoryId: 'women-waxing', section: 'Flavour Rica Waxing', name: 'Full Back (Rica Wax)', price: 600, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-rica-bikini-line', categoryId: 'women-waxing', section: 'Flavour Rica Waxing', name: 'Bikini Line (Rica Wax)', price: 800, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-rica-full-bikini', categoryId: 'women-waxing', section: 'Flavour Rica Waxing', name: 'Full Bikini (Rica Wax)', price: 2000, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-rica-full-body', categoryId: 'women-waxing', section: 'Flavour Rica Waxing', name: 'Full Body (Rica Wax)', price: 3000, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-lipo-under-arms', categoryId: 'women-waxing', section: 'Flavour Lipo Waxing', name: 'Under Arms (Lipo Wax)', price: 200, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-lipo-half-arms', categoryId: 'women-waxing', section: 'Flavour Lipo Waxing', name: 'Half Arms (Lipo Wax)', price: 400, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-lipo-full-arms', categoryId: 'women-waxing', section: 'Flavour Lipo Waxing', name: 'Full Arms (Lipo Wax)', price: 500, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-lipo-half-legs', categoryId: 'women-waxing', section: 'Flavour Lipo Waxing', name: 'Half Legs (Lipo Wax)', price: 500, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-lipo-abdomen', categoryId: 'women-waxing', section: 'Flavour Lipo Waxing', name: 'Abdomen (Lipo Wax)', price: 550, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-lipo-full-front', categoryId: 'women-waxing', section: 'Flavour Lipo Waxing', name: 'Full Front (Lipo Wax)', price: 550, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-lipo-full-back', categoryId: 'women-waxing', section: 'Flavour Lipo Waxing', name: 'Full Back (Lipo Wax)', price: 800, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-lipo-full-leg', categoryId: 'women-waxing', section: 'Flavour Lipo Waxing', name: 'Full Leg (Lipo Wax)', price: 850, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'w-lipo-full-body', categoryId: 'women-waxing', section: 'Flavour Lipo Waxing', name: 'Full Body (Lipo Wax)', price: 3500, imageUrl: MENU_IMAGES.facialSkincare },

  // ── PAGE 7: WOMEN · PEDI/MANI & RELAXING TREATMENTS ──
  { id: 'w-pm-classic-manicure', categoryId: 'women-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Classic Manicure', price: 600, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pm-classic-pedicure', categoryId: 'women-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Classic Pedicure', price: 800, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pm-spa-manicure', categoryId: 'women-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Spa Manicure', price: 1000, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pm-spa-pedicure', categoryId: 'women-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Spa Pedicure', price: 1200, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pm-icecream-manicure', categoryId: 'women-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Ice Cream Manicure', price: 1200, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pm-icecream-pedicure', categoryId: 'women-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Ice Cream Pedicure', price: 1500, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pm-black-diamond-mani', categoryId: 'women-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Black Diamond Manicure', price: 1500, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pm-black-diamond-pedi', categoryId: 'women-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Black Diamond Pedicure', price: 1700, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pm-heel-peel', categoryId: 'women-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Heel Peel Treatment', price: 2100, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-rel-eye-massage', categoryId: 'women-pedi-mani-relaxing', section: 'Relaxing Treatments', name: 'Eye Massage', price: 300, duration: '10 mins', starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-rel-face-massage', categoryId: 'women-pedi-mani-relaxing', section: 'Relaxing Treatments', name: 'Face Massage', price: 500, duration: '15 mins', starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-rel-foot-massage-20', categoryId: 'women-pedi-mani-relaxing', section: 'Relaxing Treatments', name: 'Foot Massage (20 mins)', price: 600, duration: '20 mins', starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-rel-hand-massage-20', categoryId: 'women-pedi-mani-relaxing', section: 'Relaxing Treatments', name: 'Hand Massage (20 mins)', price: 600, duration: '20 mins', starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-rel-foot-massage-30', categoryId: 'women-pedi-mani-relaxing', section: 'Relaxing Treatments', name: 'Foot Massage (30 mins)', price: 700, duration: '30 mins', starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'w-rel-neck-back-30', categoryId: 'women-pedi-mani-relaxing', section: 'Relaxing Treatments', name: 'Neck & Back Massage (30 mins)', price: 700, duration: '30 mins', starting: true, imageUrl: MENU_IMAGES.hairSpa },

  // ── PAGE 8: WOMEN · NAILS & POLISH ──
  { id: 'w-nl-classic-polish', categoryId: 'women-nails-polish', section: 'Nails', name: 'Classic Nail Polish (Hand/Leg)', price: 250, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-nl-premium-art', categoryId: 'women-nails-polish', section: 'Nails', name: 'Premium Nail Art', price: 500, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-nl-luxury-polish', categoryId: 'women-nails-polish', section: 'Nails', name: 'Luxury Nail Polish', price: 700, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-nl-temp-extension', categoryId: 'women-nails-polish', section: 'Nails', name: 'Temporary Nail Extension', price: 1000, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pol-nail-art-finger', categoryId: 'women-nails-polish', section: 'Polish', name: 'Nail Art (Per Finger)', price: 50, starting: true, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pol-glitter-finger', categoryId: 'women-nails-polish', section: 'Polish', name: 'Glitter (Per Finger)', price: 50, starting: true, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pol-chrome-finger', categoryId: 'women-nails-polish', section: 'Polish', name: 'Chrome (Per Finger)', price: 50, starting: true, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pol-ring-stone-finger', categoryId: 'women-nails-polish', section: 'Polish', name: 'Ring Stone (Per Finger)', price: 50, starting: true, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pol-acrylic-ext-finger', categoryId: 'women-nails-polish', section: 'Polish', name: 'Acrylic Extension (Per Finger)', price: 250, starting: true, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pol-gel-remover', categoryId: 'women-nails-polish', section: 'Polish', name: 'Gel Polish Remover', price: 500, starting: true, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pol-gel-hand-leg', categoryId: 'women-nails-polish', section: 'Polish', name: 'Gel Polish (Hand/Leg)', price: 1200, starting: true, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pol-french', categoryId: 'women-nails-polish', section: 'Polish', name: 'French Polish', price: 1500, starting: true, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pol-gel-ext-polish', categoryId: 'women-nails-polish', section: 'Polish', name: 'Gel Extension With Polish', price: 3000, starting: true, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pol-acrylic-ext-polish', categoryId: 'women-nails-polish', section: 'Polish', name: 'Acrylic Extension With Polish', price: 3500, starting: true, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'w-pol-jewellery-polish', categoryId: 'women-nails-polish', section: 'Polish', name: 'Jewellery Polish', price: 4500, starting: true, imageUrl: MENU_IMAGES.manicureGrooming },

  // ── PAGE 9: WOMEN · MAKE-UP & MEHANDI ──
  { id: 'w-mu-classic', categoryId: 'women-makeup-mehandi', section: 'Make-Up', name: 'Classic Make-up', price: 10000, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'w-mu-mac', categoryId: 'women-makeup-mehandi', section: 'Make-Up', name: 'MAC Make-up', price: 13000, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'w-mu-hd', categoryId: 'women-makeup-mehandi', section: 'Make-Up', name: 'HD Make-up', price: 15000, featured: true, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'w-mu-airbrush', categoryId: 'women-makeup-mehandi', section: 'Make-Up', name: 'Air Brush Make-up', price: 20000, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'w-mu-party', categoryId: 'women-makeup-mehandi', section: 'Make-Up', name: 'Party Make-up', price: 5000, starting: true, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'w-mu-kids', categoryId: 'women-makeup-mehandi', section: 'Make-Up', name: 'Kids Make-up', price: 2500, starting: true, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'w-mu-outdoor-charges', categoryId: 'women-makeup-mehandi', section: 'Make-Up', name: 'Outdoor Charges', price: 2000, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'w-mh-classic', categoryId: 'women-makeup-mehandi', section: 'Mehandi', name: 'Classic Mehandi', price: 750, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'w-mh-classic-bridal-leg', categoryId: 'women-makeup-mehandi', section: 'Mehandi', name: 'Classic Bridal Leg Mehandi', price: 1000, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'w-mh-arabic', categoryId: 'women-makeup-mehandi', section: 'Mehandi', name: 'Arabic Mehandi', price: 1500, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'w-mh-premium-bridal-leg', categoryId: 'women-makeup-mehandi', section: 'Mehandi', name: 'Premium Bridal Leg Mehandi', price: 2000, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'w-mh-classic-bridal-hand', categoryId: 'women-makeup-mehandi', section: 'Mehandi', name: 'Classic Bridal Hand Mehandi', price: 3000, imageUrl: MENU_IMAGES.bridalMakeup },

  // ── PAGE 11: MEN · HAIR CUT & GROOMING ──
  { id: 'm-hc-stylist', categoryId: 'men-hair-cut-grooming', section: 'Hair Cut', name: 'Stylist Hair Cut', price: 300, featured: true, imageUrl: MENU_IMAGES.mensGrooming },
  { id: 'm-hc-senior-stylist', categoryId: 'men-hair-cut-grooming', section: 'Hair Cut', name: 'Senior Stylist Hair Cut', price: 400, imageUrl: MENU_IMAGES.mensGrooming },
  { id: 'm-hc-creative-stylist', categoryId: 'men-hair-cut-grooming', section: 'Hair Cut', name: 'Creative Stylist Hair Cut', price: 500, imageUrl: MENU_IMAGES.mensGrooming },
  { id: 'm-hc-beard-trim', categoryId: 'men-hair-cut-grooming', section: 'Hair Cut', name: 'Beard Trim', price: 150, imageUrl: MENU_IMAGES.mensGrooming },
  { id: 'm-hc-premium-shave', categoryId: 'men-hair-cut-grooming', section: 'Hair Cut', name: 'Premium Shave', price: 150, imageUrl: MENU_IMAGES.mensGrooming },
  { id: 'm-hc-beard-styling', categoryId: 'men-hair-cut-grooming', section: 'Hair Cut', name: 'Beard Styling', price: 250, imageUrl: MENU_IMAGES.mensGrooming },
  { id: 'm-hc-wash-conditioning', categoryId: 'men-hair-cut-grooming', section: 'Hair Cut', name: 'Hair Wash & Conditioning', price: 250, imageUrl: MENU_IMAGES.mensGrooming },
  { id: 'm-hc-oil-massage', categoryId: 'men-hair-cut-grooming', section: 'Hair Cut', name: 'Oil Massage', price: 500, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-hc-kids-cut', categoryId: 'men-hair-cut-grooming', section: 'Hair Cut', name: 'Kids Cut (<5 years)', price: 250, imageUrl: MENU_IMAGES.mensGrooming },

  // ── PAGE 11: MEN · HAIR & CREATIVE COLOUR ──
  { id: 'm-col-silver-coverage', categoryId: 'men-hair-colour', section: 'Hair Colour', name: 'Silver Coverage', price: 1000, imageUrl: MENU_IMAGES.mensGrooming },
  { id: 'm-col-silver-coverage-af', categoryId: 'men-hair-colour', section: 'Hair Colour', name: 'Silver Coverage (Ammonia Free)', price: 1200, imageUrl: MENU_IMAGES.mensGrooming },
  { id: 'm-col-moustache', categoryId: 'men-hair-colour', section: 'Hair Colour', name: 'Moustache Colour', price: 200, imageUrl: MENU_IMAGES.mensGrooming },
  { id: 'm-col-beard', categoryId: 'men-hair-colour', section: 'Hair Colour', name: 'Beard Colour', price: 300, imageUrl: MENU_IMAGES.mensGrooming },
  { id: 'm-cc-pure-gloss', categoryId: 'men-hair-colour', section: 'Creative Colour', name: 'Pure Gloss Colouring', price: 1500, imageUrl: MENU_IMAGES.mensGrooming },
  { id: 'm-cc-blend', categoryId: 'men-hair-colour', section: 'Creative Colour', name: 'Blend Colouring', price: 2000, imageUrl: MENU_IMAGES.mensGrooming },
  { id: 'm-cc-fashion', categoryId: 'men-hair-colour', section: 'Creative Colour', name: 'Fashion Colouring', price: 3000, imageUrl: MENU_IMAGES.mensGrooming },

  // ── PAGE 12: MEN · SERIE EXPERT, HAIR SPA & TEXTURE ──
  { id: 'm-exp-anti-dandruff', categoryId: 'men-hair-spa-texture', section: 'Serie Expert Treatment', name: 'Anti-Dandruff Treatment', price: 800, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-exp-anti-hairfall', categoryId: 'men-hair-spa-texture', section: 'Serie Expert Treatment', name: 'Anti-Hair Fall Treatment', price: 800, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-exp-sensitive-scalp', categoryId: 'men-hair-spa-texture', section: 'Serie Expert Treatment', name: 'Sensitive Scalp Treatment', price: 800, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-spa-moisturizer', categoryId: 'men-hair-spa-texture', section: 'Hair Spa', name: 'Moisturizer Hair Spa', price: 1000, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-spa-intense-smoothening', categoryId: 'men-hair-spa-texture', section: 'Hair Spa', name: 'Intense Smoothening Hair Spa', price: 1200, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-spa-lepidium-repair', categoryId: 'men-hair-spa-texture', section: 'Hair Spa', name: 'Lipidium Repair Hair Spa', price: 1200, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-spa-radiant-colour-protect', categoryId: 'men-hair-spa-texture', section: 'Hair Spa', name: 'Radiant Colour Protect Hair Spa', price: 1200, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-spa-protein', categoryId: 'men-hair-spa-texture', section: 'Hair Spa', name: 'Protein Treatment', price: 2000, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-tex-keratin', categoryId: 'men-hair-spa-texture', section: 'Texture Services', name: 'Keratin', price: 3000, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-tex-smoothening', categoryId: 'men-hair-spa-texture', section: 'Texture Services', name: 'Smoothening', price: 4000, starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-tex-straightening', categoryId: 'men-hair-spa-texture', section: 'Texture Services', name: 'Straightening', price: 4000, starting: true, imageUrl: MENU_IMAGES.hairSpa },

  // ── PAGE 13: MEN · BEAUTY SERVICES ──
  { id: 'm-cu-classic-dry', categoryId: 'men-beauty-facials', section: 'Clean-Up', name: 'Classic Clean-Up (Dry)', price: 700, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-cu-classic-oily', categoryId: 'men-beauty-facials', section: 'Clean-Up', name: 'Classic Clean-Up (Oily)', price: 700, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-cu-untan-pack', categoryId: 'men-beauty-facials', section: 'Clean-Up', name: 'Un-Tan Pack', price: 700, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-cu-acne', categoryId: 'men-beauty-facials', section: 'Clean-Up', name: 'Acne Clean-Up', price: 800, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-cu-under-eye', categoryId: 'men-beauty-facials', section: 'Clean-Up', name: 'Under Eye Treatment', price: 800, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-pf-pure-moist', categoryId: 'men-beauty-facials', section: 'Premium Facial', name: 'Pure Moist Facial', price: 1000, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-pf-fruit-dry', categoryId: 'men-beauty-facials', section: 'Premium Facial', name: 'Fruit Facial (Dry)', price: 1200, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-pf-detan', categoryId: 'men-beauty-facials', section: 'Premium Facial', name: 'De-Tan Facial', price: 1500, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-pf-sensi-glow', categoryId: 'men-beauty-facials', section: 'Premium Facial', name: 'Sensi Glow Facial', price: 1800, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-pf-natural-brightening', categoryId: 'men-beauty-facials', section: 'Premium Facial', name: 'Natural Brightening Facial', price: 2000, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-lf-gold', categoryId: 'men-beauty-facials', section: 'Luxury Facial', name: 'Gold Facial', price: 2500, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-lf-vitamin-c', categoryId: 'men-beauty-facials', section: 'Luxury Facial', name: 'Vitamin C Facial', price: 3500, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-lf-o2c2', categoryId: 'men-beauty-facials', section: 'Luxury Facial', name: 'O2C2 Facial', price: 4000, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-lf-advance-lightening', categoryId: 'men-beauty-facials', section: 'Luxury Facial', name: 'Advance Skin Lightening Facial', price: 4500, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-lf-radiant', categoryId: 'men-beauty-facials', section: 'Luxury Facial', name: 'Radiant Facial', price: 5000, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-pm-vitamin-c', categoryId: 'men-beauty-facials', section: 'Peel-Off Mask', name: 'Vitamin C Peel-Off Mask', price: 700, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-pm-green-tea', categoryId: 'men-beauty-facials', section: 'Peel-Off Mask', name: 'Green Tea Peel-Off Mask', price: 700, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-pm-charcoal', categoryId: 'men-beauty-facials', section: 'Peel-Off Mask', name: 'Charcoal Peel-Off Mask', price: 1000, imageUrl: MENU_IMAGES.facialSkincare },
  { id: 'm-pm-bridal-glow', categoryId: 'men-beauty-facials', section: 'Peel-Off Mask', name: 'Bridal Glow Peel-Off Mask', price: 1500, imageUrl: MENU_IMAGES.facialSkincare },

  // ── PAGE 14: MEN · PEDI/MANI & RELAXING TREATMENTS ──
  { id: 'm-pm-classic-manicure', categoryId: 'men-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Classic Manicure', price: 500, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'm-pm-classic-pedicure', categoryId: 'men-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Classic Pedicure', price: 700, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'm-pm-spa-manicure', categoryId: 'men-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Spa Manicure', price: 1000, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'm-pm-spa-pedicure', categoryId: 'men-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Spa Pedicure', price: 1200, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'm-pm-icecream-manicure', categoryId: 'men-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Ice Cream Manicure', price: 1200, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'm-pm-icecream-pedicure', categoryId: 'men-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Ice Cream Pedicure', price: 1500, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'm-pm-black-diamond-mani', categoryId: 'men-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Black Diamond Luxury Manicure', price: 1500, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'm-pm-black-diamond-pedi', categoryId: 'men-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Black Diamond Luxury Pedicure', price: 1700, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'm-pm-heel-peel', categoryId: 'men-pedi-mani-relaxing', section: 'Pedi/Mani Services', name: 'Heel Peel Treatment', price: 2100, imageUrl: MENU_IMAGES.manicureGrooming },
  { id: 'm-rel-eye-massage', categoryId: 'men-pedi-mani-relaxing', section: 'Relaxing Treatments', name: 'Eye Massage', price: 300, duration: '10 mins', starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-rel-face-massage', categoryId: 'men-pedi-mani-relaxing', section: 'Relaxing Treatments', name: 'Face Massage', price: 500, duration: '15 mins', starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-rel-foot-massage-20', categoryId: 'men-pedi-mani-relaxing', section: 'Relaxing Treatments', name: 'Foot Massage (20 mins)', price: 600, duration: '20 mins', starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-rel-hand-massage-20', categoryId: 'men-pedi-mani-relaxing', section: 'Relaxing Treatments', name: 'Hand Massage (20 mins)', price: 600, duration: '20 mins', starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-rel-foot-massage-30', categoryId: 'men-pedi-mani-relaxing', section: 'Relaxing Treatments', name: 'Foot Massage (30 mins)', price: 700, duration: '30 mins', starting: true, imageUrl: MENU_IMAGES.hairSpa },
  { id: 'm-rel-neck-back-30', categoryId: 'men-pedi-mani-relaxing', section: 'Relaxing Treatments', name: 'Neck & Back Massage (30 mins)', price: 800, duration: '30 mins', starting: true, imageUrl: MENU_IMAGES.hairSpa },

  // ── PAGE 14: MEN · MAKE UP ──
  { id: 'm-mu-classic', categoryId: 'men-makeup', section: 'Make Up', name: 'Classic Make-up', price: 4000, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'm-mu-mac', categoryId: 'men-makeup', section: 'Make Up', name: 'MAC Make-up', price: 5000, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'm-mu-hd', categoryId: 'men-makeup', section: 'Make Up', name: 'HD Make-up', price: 6000, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'm-mu-party-groom', categoryId: 'men-makeup', section: 'Make Up', name: 'Party (Groom) Make-up', price: 2500, imageUrl: MENU_IMAGES.bridalMakeup },
  { id: 'm-mu-outdoor-charges', categoryId: 'men-makeup', section: 'Make Up', name: 'Outdoor Charges', price: 2000, imageUrl: MENU_IMAGES.bridalMakeup },
];

export const OFFICIAL_MENU_SERVICES: Omit<SalonService, 'createdAt' | 'updatedAt'>[] =
  RAW_MENU_ROWS.map((row, idx) => ({
    id: row.id,
    name: row.name,
    categoryId: row.categoryId,
    price: row.price,
    offerPrice: null,
    duration: row.duration || (row.starting ? 'Starting price (**)' : 'Incl. of GST'),
    description: row.starting
      ? `${row.section} · ** Starting price (varies by hair length / density). All prices incl. of GST.`
      : `${row.section} · All prices incl. of GST.`,
    imageUrl: '',
    isActive: true,
    isFeatured: Boolean(row.featured),
    sortOrder: idx + 1,
  }));

export function isStartingPriceService(service: Pick<SalonService, 'duration' | 'description'>): boolean {
  return (
    (service.duration || '').includes('**') ||
    (service.description || '').includes('**')
  );
}

export function getCategoryAudience(category: Pick<SalonCategory, 'id' | 'name'>): 'women' | 'men' | 'unisex' {
  const idLower = category.id.toLowerCase();
  const nameLower = category.name.toLowerCase();
  if (idLower.startsWith('women-') || nameLower.startsWith('women')) return 'women';
  if (idLower.startsWith('men-') || nameLower.startsWith('men')) return 'men';
  return 'unisex';
}
