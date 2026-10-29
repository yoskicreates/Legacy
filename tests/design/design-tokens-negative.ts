import { COLORS, SEMANTIC, DESIGN_TOKEN_VERSION, ACCESSIBLE_PAIRS, contrastRatio } from '../../src/design/tokens';
// deliberate errors for compiler rejection -- never shipped in production.
const invalidPalette: keyof typeof COLORS = 'electricNeonGreen';
const invalidSemantic: keyof typeof SEMANTIC = 'surface-unknown';
const cannotChangeVersion: typeof DESIGN_TOKEN_VERSION = 'L3-036.V1';
COLORS.warmGold = '#000000';
SEMANTIC['text-primary'] = '#000000';
ACCESSIBLE_PAIRS.push(['text-primary','surface-canvas']);
contrastRatio(42, '#ffffff');
void [invalidPalette,invalidSemantic,cannotChangeVersion];
