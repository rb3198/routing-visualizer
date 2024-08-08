export enum NeighborSMEvent {
  // Progressive Events
  HelloReceived,
  Start,
  TwoWayReceived,
  NegotiationDone,
  ExchangeDone,
  BadLSReq,
  LoadingDone,
  AdjOK,
  // Regressive Events
  SeqNumberMismatch,
  OneWay,
  KillNbr,
  InactivityTimer,
  LLDown,
}
