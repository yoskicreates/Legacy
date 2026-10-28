/** L3-026 intentionally invalid event contracts. MUST fail under strict tsc. */
import type { DomainEvent, DomainEventOf, DomainEventType } from '../../src/domain/core/events';

// EV-NEG-01: invalid event discriminator
export const wrongKind: DomainEventType = 'fight.won';
// EV-NEG-02: number where fight fighter ID must be a string
export const wrongFight: DomainEventOf<'fight.recorded'> = {
  eventId: 'e-1', type: 'fight.recorded',
  payload: { fightId: 'f', fighterId: 123, opponentId: 'o' },
};
// EV-NEG-03: training payload omits required fighterId
export const missingTraining: DomainEventOf<'training.recorded'> = {
  eventId: 'e-2', type: 'training.recorded', payload: { sessionId: 's' },
};
// EV-NEG-04: purchase payload is mistakenly supplied as a relationship event
export const mixedRelationship: DomainEventOf<'relationship.recorded'> = {
  eventId: 'e-3', type: 'relationship.recorded',
  payload: { purchaseId: 'p', buyerId: 'b' },
};
// EV-NEG-05: mismatched event discriminator + payload in the discriminated union
export const mixedUnion: DomainEvent = {
  eventId: 'e-4', type: 'purchase.recorded',
  payload: { fightId: 'f', fighterId: 'a', opponentId: 'b' },
};
// EV-NEG-06: an event may not be reassigned after creation
export const readonlyEvent: DomainEventOf<'purchase.recorded'> = {
  eventId: 'e-5', type: 'purchase.recorded', payload: { purchaseId: 'p', buyerId: 'b' },
};
readonlyEvent.eventId = 'mutated';
