import { scenarioInsets, applySimulatedInsets, type InsetSide, type PixelInset, type SafeAreaScenario } from '../../src/shell/safe-area';
const wrongSide: InsetSide = 'center';
const wrongUnit: PixelInset = '34vh';
const wrongScenario: SafeAreaScenario = 'future';
scenarioInsets('invalid');
applySimulatedInsets(document.body, 34);
const wrongNumber: PixelInset = 34;
const wrongCase: InsetSide = 'Top';
void [wrongSide, wrongUnit, wrongScenario, wrongNumber, wrongCase];
