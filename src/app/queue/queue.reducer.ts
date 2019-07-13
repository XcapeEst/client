import { Queue } from './models/queue';
import { createReducer, on, Action } from '@ngrx/store';
import { queueLoaded, queueSlotsRefreshed, queueSlotUpdated, queueStateUpdated } from './queue.actions';
import { QueueSlot } from './models/queue-slot';
import { QueueConfig } from './models/queue-config';
import { QueueState } from './models/queue-state';

export interface State {
  config: QueueConfig;
  slots: QueueSlot[];
  state: QueueState;
}

export const initialState: State = {
  config: null,
  slots: [],
  state: 'waiting',
};

function updateQueueSlot(slot: QueueSlot, state: State) {
  const slots = state.slots.map(s => s.id === slot.id ? slot : s);
  return { ...state, slots };
}

const queueReducer = createReducer(
  initialState,
  on(queueLoaded, (state, { queue }) => ({ ...state, ...queue })),
  on(queueSlotsRefreshed, (state, { slots }) => ({ ...state, slots })),
  on(queueSlotUpdated, (state, { slot }) => updateQueueSlot(slot, state)),
  on(queueStateUpdated, (state, { queueState }) => ({ ...state, state: queueState })),
);

export function reducer(state: State | undefined, action: Action) {
  return queueReducer(state, action);
}
