export type SimulationConfigAction =
  | {
      type: "SET_PROPAGATION_DELAY" | "SET_DEF_HELLO_INTERVAL" | "SET_MAX_AGE";
      value: number;
    }
  | {
      type: "SET_GRACEFUL_SHUTDOWN";
      value: boolean;
    };
