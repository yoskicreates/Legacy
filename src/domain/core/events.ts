/**
 * LEGACY 3.0 L3-026 — compile-time domain-event contracts only.
 *
 * Four neutral records, not gameplay decisions: no winners, training gains,
 * monetary amounts, relationship sentiment, timers, event bus, storage, or
 * runtime validation. Future code must narrow on `type` before reading payload.
 * Readonly is a TypeScript contract, not a runtime freeze or security boundary.
 */
export interface DomainEventPayloads {
  readonly 'fight.recorded': Readonly<{
    fightId: string;
    fighterId: string;
    opponentId: string;
  }>;
  readonly 'training.recorded': Readonly<{
    sessionId: string;
    fighterId: string;
  }>;
  readonly 'purchase.recorded': Readonly<{
    purchaseId: string;
    buyerId: string;
  }>;
  readonly 'relationship.recorded': Readonly<{
    relationshipId: string;
    participantId: string;
    counterpartyId: string;
  }>;
}

/** All and only the four events approved for the L3-026 contract milestone. */
export type DomainEventType = keyof DomainEventPayloads;

/** The conditional type preserves correlation between event kind and payload. */
export type DomainEventOf<T extends DomainEventType> = T extends DomainEventType
  ? Readonly<{
      eventId: string;
      type: T;
      payload: DomainEventPayloads[T];
    }>
  : never;

/** Narrowable discriminated union; no emitter, handler, or side effects. */
export type DomainEvent = { [T in DomainEventType]: DomainEventOf<T> }[DomainEventType];
