export interface RealtimeEvent<TPayload = unknown> {
  channel: string;
  event: string;
  payload: TPayload;
}

export interface RealtimePublisher {
  publish<TPayload>(event: RealtimeEvent<TPayload>): Promise<void>;
}
