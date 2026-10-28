/**
 * LEGACY 3.0 L3-024 — independent, deterministic calendar/fight time state.
 * No ambient Date/time, timers, UI, RNG, combat or persistence dependencies.
 *
 * calendar.dayIndex is an abstract integer game-calendar day, NOT a chosen
 * daily/weekly training UX or a real-world date/time-zone representation.
 * fight.elapsedMilliseconds is abstract simulated fight time; phase, round,
 * referee, playback speed and fight-event behavior belong to future tasks.
 */
export interface GameCalendarClock {
  readonly dayIndex: number;
}

export interface FightSimulationClock {
  readonly elapsedMilliseconds: number;
}

export interface GameClockState {
  readonly calendar: GameCalendarClock;
  readonly fight: FightSimulationClock;
}

/** Only explicitly dispatched domain actions can advance one isolated clock. */
export type GameClockAction =
  | { readonly type: 'advance-calendar-days'; readonly days: number }
  | { readonly type: 'advance-fight-milliseconds'; readonly milliseconds: number }
  | { readonly type: 'reset-fight-clock' };

function assertNonNegativeInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`LEGACY3 clock: ${field} must be a nonnegative safe integer`);
  }
}

function assertState(state: GameClockState): void {
  if (state === null || typeof state !== 'object' || state.calendar === null ||
      typeof state.calendar !== 'object' || state.fight === null ||
      typeof state.fight !== 'object') {
    throw new TypeError('LEGACY3 clock: invalid clock state');
  }
  assertNonNegativeInteger(state.calendar.dayIndex, 'calendar.dayIndex');
  assertNonNegativeInteger(state.fight.elapsedMilliseconds, 'fight.elapsedMilliseconds');
}

function addSafe(current: number, delta: number, field: string): number {
  assertNonNegativeInteger(delta, field);
  const result = current + delta;
  if (!Number.isSafeInteger(result)) {
    throw new RangeError(`LEGACY3 clock: ${field} overflow`);
  }
  return result;
}

function calendarSnapshot(dayIndex: number): GameCalendarClock {
  return Object.freeze({ dayIndex });
}

function fightSnapshot(elapsedMilliseconds: number): FightSimulationClock {
  return Object.freeze({ elapsedMilliseconds });
}

function clockSnapshot(calendar: GameCalendarClock, fight: FightSimulationClock): GameClockState {
  return Object.freeze({ calendar, fight });
}

/** No implicit host clock. New fights begin at simulated millisecond zero. */
export function createGameClocks(initialDayIndex = 0): GameClockState {
  assertNonNegativeInteger(initialDayIndex, 'initialDayIndex');
  return clockSnapshot(calendarSnapshot(initialDayIndex), fightSnapshot(0));
}

/** Pure transition; never advances an unrelated clock or mutates a previous snapshot. */
export function reduceGameClocks(state: GameClockState, action: GameClockAction): GameClockState {
  assertState(state);
  if (action === null || typeof action !== 'object') {
    throw new TypeError('LEGACY3 clock: invalid clock action');
  }
  switch (action.type) {
    case 'advance-calendar-days': {
      const nextDay = addSafe(state.calendar.dayIndex, action.days, 'days');
      return nextDay === state.calendar.dayIndex
        ? state
        : clockSnapshot(calendarSnapshot(nextDay), state.fight);
    }
    case 'advance-fight-milliseconds': {
      const elapsed = addSafe(state.fight.elapsedMilliseconds, action.milliseconds, 'milliseconds');
      return elapsed === state.fight.elapsedMilliseconds
        ? state
        : clockSnapshot(state.calendar, fightSnapshot(elapsed));
    }
    case 'reset-fight-clock':
      return state.fight.elapsedMilliseconds === 0
        ? state
        : clockSnapshot(state.calendar, fightSnapshot(0));
    default: {
      const impossible: never = action;
      throw new TypeError(`LEGACY3 clock: unknown clock action ${String(impossible)}`);
    }
  }
}
