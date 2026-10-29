import { makeFighterFixture, makeCareerFixture, makeSaveFixture, makeFixtureBundle, makeInvalidStateFixture, makeBoundaryFixtures } from './fixture-system';
import { validateGameState } from '@domain/core';
import { loadManualSlot,saveManualSlot } from '@domain/persistence/manual-slots';
declare global {interface Window {__LEGACY3_FIXTURES_QA__?: unknown}}
window.__LEGACY3_FIXTURES_QA__ = Object.freeze({makeFighterFixture,makeCareerFixture,makeSaveFixture,makeFixtureBundle,makeInvalidStateFixture,makeBoundaryFixtures,validateGameState,loadManualSlot,saveManualSlot});
document.documentElement.dataset.fixtureQaReady='true';
