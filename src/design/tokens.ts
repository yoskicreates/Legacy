/** L3-035 — immutable visual tokens. Does not select typography or implement gameplay. */
export const DESIGN_TOKEN_VERSION = 'L3-035.V1' as const;
export const COLORS = Object.freeze({
  midnightNavy: '#101824',
  blueGrayDark: '#172433',
  blueGrayMid: '#223246',
  blueGrayBorder: '#465568',
  blueGrayDivider: '#344356',
  warmGold: '#DDBD82',
  warmGoldHover: '#EBD19E',
  mutedRed: '#D97B78',
  mutedRedHover: '#EC9E9B',
  softWhite: '#F3F5F8',
  coolMuted: '#B9C7D4',
  coolSubtle: '#BECBD7',
} as const);
export type ColorToken = keyof typeof COLORS;
export type SemanticToken = keyof typeof SEMANTIC;
export const SEMANTIC = Object.freeze({
  'surface-canvas': COLORS.midnightNavy,
  'surface-panel': COLORS.blueGrayDark,
  'surface-raised': COLORS.blueGrayMid,
  'border-default': COLORS.blueGrayBorder,
  'border-subtle': COLORS.blueGrayDivider,
  'text-primary': COLORS.softWhite,
  'text-secondary': COLORS.coolMuted,
  'text-subtle': COLORS.coolSubtle,
  'accent-primary': COLORS.warmGold,
  'accent-hover': COLORS.warmGoldHover,
  'alert-primary': COLORS.mutedRed,
  'alert-hover': COLORS.mutedRedHover,
  'on-accent': COLORS.midnightNavy,
  'on-alert': COLORS.midnightNavy,
  'focus-ring': COLORS.warmGoldHover,
} as const);

/** Explicitly paired semantic foregrounds/backgrounds; WCAG AA requires >= 4.5:1. */
export const ACCESSIBLE_PAIRS = [
  ['text-primary','surface-canvas'],
  ['text-primary','surface-panel'],
  ['text-primary','surface-raised'],
  ['text-secondary','surface-panel'],
  ['text-secondary','surface-raised'],
  ['text-subtle','surface-canvas'],
  ['accent-primary','surface-canvas'],
  ['accent-primary','surface-panel'],
  ['alert-primary','surface-canvas'],
  ['alert-primary','surface-panel'],
  ['on-accent','accent-primary'],
  ['on-alert','alert-primary'],
] as const satisfies ReadonlyArray<readonly [SemanticToken,SemanticToken]>;

export function relativeLuminance(hex: string): number {
  if (!/^#[\da-fA-F]{6}$/.test(hex)) throw new TypeError('Color must be six-digit sRGB hex');
  const components=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  const linear=components.map(n=>n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4);
  return linear[0]! * .2126 + linear[1]! * .7152 + linear[2]! * .0722;
}
export function contrastRatio(foreground: string, background: string): number {
  const x=relativeLuminance(foreground),y=relativeLuminance(background);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
export function meetsNormalTextAA(foreground: string,background: string): boolean {
  return contrastRatio(foreground,background)>=4.5;
}
export function assertDesignContrast(): true {
  for (const [foreground,background] of ACCESSIBLE_PAIRS) {
    if (!meetsNormalTextAA(SEMANTIC[foreground],SEMANTIC[background])) {
      throw new Error(`Design contrast failure: ${foreground} on ${background}`);
    }
  }
  return true;
}

/** Fixed, non-editable semantic CSS properties to keep runtime and stylesheet aligned. */
export const CSS_TOKENS = Object.freeze(Object.fromEntries(Object.entries(SEMANTIC).map(([k,v])=>[`--legacy-${k}`,v])) as Readonly<Record<`--legacy-${SemanticToken}`,string>>);
