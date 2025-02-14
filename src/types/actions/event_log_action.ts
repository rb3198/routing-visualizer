import { NetworkEvent } from "src/entities/network_event";

export type EventLogAction =
  | {
      type: "ADD_LOG";
      data: NetworkEvent;
    }
  | {
      type: "SET_KEEP_COUNT";
      data: number;
    };
