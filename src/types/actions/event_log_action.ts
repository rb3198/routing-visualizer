import { NetworkEventBase } from "src/entities/network_event/base";

export type EventLogAction =
  | {
      type: "ADD_LOG";
      data: NetworkEventBase;
    }
  | {
      type: "SET_KEEP_COUNT";
      data: number;
    };
