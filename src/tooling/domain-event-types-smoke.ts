/** L3-026 compile-only positive contract, never mounted by UI. */
import type { DomainEvent, DomainEventOf, DomainEventPayloads, DomainEventType } from '@domain/core';

const types: DomainEventType[] = ['fight.recorded', 'training.recorded', 'purchase.recorded', 'relationship.recorded'];
const fight: DomainEventOf<'fight.recorded'> = {
  eventId: 'evt-f1', type: 'fight.recorded',
  payload: { fightId: 'fight-1', fighterId: 'fighter-1', opponentId: 'fighter-2' },
};
const training: DomainEventOf<'training.recorded'> = {
  eventId: 'evt-t1', type: 'training.recorded',
  payload: { sessionId: 'session-1', fighterId: 'fighter-1' },
};
const purchase: DomainEventOf<'purchase.recorded'> = {
  eventId: 'evt-p1', type: 'purchase.recorded',
  payload: { purchaseId: 'purchase-1', buyerId: 'fighter-1' },
};
const relationship: DomainEventOf<'relationship.recorded'> = {
  eventId: 'evt-r1', type: 'relationship.recorded',
  payload: { relationshipId: 'relationship-1', participantId: 'person-a', counterpartyId: 'person-b' },
};
const all: readonly DomainEvent[] = [fight, training, purchase, relationship];
const examplePayload: DomainEventPayloads['purchase.recorded'] = purchase.payload;

/** Proves the payload remains appropriately narrowed, even after union assignment. */
function describe(event: DomainEvent): string {
  switch (event.type) {
    case 'fight.recorded': return event.payload.fightId;
    case 'training.recorded': return event.payload.sessionId;
    case 'purchase.recorded': return event.payload.purchaseId;
    case 'relationship.recorded': return event.payload.relationshipId;
    default: {
      const impossible: never = event;
      return impossible;
    }
  }
}
void types;
void all;
void examplePayload;
void describe;

// @ts-expect-error: a purchase payload cannot be accepted as a fight payload
const mixed: DomainEventOf<'fight.recorded'> = purchase;
void mixed;
// @ts-expect-error: the readonly event type cannot change
fight.type = 'training.recorded';
// @ts-expect-error: payload fields are readonly at compile time
fight.payload.fighterId = 'other';
