/** L3-024 compile-only strict type contract; never invoked by UI or engine. */
import {
  createGameClocks, reduceGameClocks,
  type GameClockAction, type GameClockState,
} from '@domain/core';

const initial: GameClockState = createGameClocks(7);
const calendarAction: GameClockAction = { type: 'advance-calendar-days', days: 1 };
const fightAction: GameClockAction = { type: 'advance-fight-milliseconds', milliseconds: 5000 };
const calendarOnly: GameClockState = reduceGameClocks(initial, calendarAction);
const fightOnly: GameClockState = reduceGameClocks(calendarOnly, fightAction);
const day: number = fightOnly.calendar.dayIndex;
const fightTime: number = fightOnly.fight.elapsedMilliseconds;
void day;
void fightTime;

// @ts-expect-error: combat time must not accept calendar units
const badUnit: GameClockAction = { type: 'advance-fight-milliseconds', days: 1 };
// @ts-expect-error: calendar time must not accept combat milliseconds
const badCalendar: GameClockAction = { type: 'advance-calendar-days', milliseconds: 1000 };
// @ts-expect-error: time cannot implicitly pass via a generic tick
const implicitTick: GameClockAction = { type: 'tick' };
// @ts-expect-error: time never takes a floating text string
const badString: GameClockAction = { type: 'advance-calendar-days', days: '1' };
// @ts-expect-error: game-calendar indices cannot be written through state
initial.calendar.dayIndex = 9;
// @ts-expect-error: fight elapsed milliseconds cannot be written through state
initial.fight.elapsedMilliseconds = 7;
void badUnit;
void badCalendar;
void implicitTick;
void badString;
