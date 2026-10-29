import { TYPE_SCALE, TYPOGRAPHY_VERSION, CSS_TYPOGRAPHY, getTypography, type TypographyRole } from '../../src/design/typography';
const invalidRole: TypographyRole = 'energy-bar';
const invalidVersion: typeof TYPOGRAPHY_VERSION = 'L3-037.V1';
TYPE_SCALE.body.fontSize = '6px';
TYPE_SCALE.numeric.fontWeight = '400';
getTypography('headline-small');
CSS_TYPOGRAPHY['--legacy-type-display-font-size'] = '2px';
getTypography(12);
void [invalidRole,invalidVersion];
