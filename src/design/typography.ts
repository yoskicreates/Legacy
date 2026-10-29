/** L3-036: type scales only; L3-035 color tokens and all gameplay are untouched. */
export const TYPOGRAPHY_VERSION = 'L3-036.V1' as const;
export const TYPE_SCALE = Object.freeze({
  display: Object.freeze({fontSize:'clamp(2.25rem, 8.2vw, 4.25rem)',lineHeight:'1.08',fontWeight:'800',letterSpacing:'-0.035em'}),
  headline: Object.freeze({fontSize:'clamp(1.625rem, 5.6vw, 2.5rem)',lineHeight:'1.18',fontWeight:'750',letterSpacing:'-0.025em'}),
  panel: Object.freeze({fontSize:'1.125rem',lineHeight:'1.35',fontWeight:'750',letterSpacing:'-0.01em'}),
  body: Object.freeze({fontSize:'1rem',lineHeight:'1.6',fontWeight:'400',letterSpacing:'0em'}),
  label: Object.freeze({fontSize:'0.875rem',lineHeight:'1.45',fontWeight:'700',letterSpacing:'0.015em'}),
  caption: Object.freeze({fontSize:'0.8125rem',lineHeight:'1.5',fontWeight:'550',letterSpacing:'0.01em'}),
  numeric: Object.freeze({fontSize:'clamp(1.25rem, 5vw, 2rem)',lineHeight:'1.2',fontWeight:'750',letterSpacing:'-0.015em'}),
} as const);
export type TypographyRole = keyof typeof TYPE_SCALE;
export type TypographyProperty = keyof (typeof TYPE_SCALE)['body'];
export const TYPOGRAPHY_ROLES = Object.freeze(Object.keys(TYPE_SCALE) as TypographyRole[]);
export const CSS_TYPOGRAPHY = Object.freeze(Object.fromEntries(
  Object.entries(TYPE_SCALE).flatMap(([role,properties]) => Object.entries(properties).map(([property,value]) => [`--legacy-type-${role}-${property.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase())}`,value]))
) as Readonly<Record<`--legacy-type-${TypographyRole}-${string}`, string>>);
export function getTypography(role: TypographyRole): Readonly<(typeof TYPE_SCALE)[TypographyRole]> { return TYPE_SCALE[role]; }
