import { Reducer } from "redux";
import { OSPFGlobals } from "src/entities/ospf/config/ospf_globals";
import { getDeadInterval, getRxmtInterval } from "src/entities/ospf/constants";
import { SimulationConfigAction } from "src/types/actions";

const CONFIG_STORAGE_KEY = "SIMULATION_CONFIG";

const configFromStorage = localStorage.getItem(CONFIG_STORAGE_KEY);
const initialState = configFromStorage
  ? (JSON.parse(configFromStorage) as OSPFGlobals)
  : new OSPFGlobals({});

export const simulationConfig: Reducer<OSPFGlobals, SimulationConfigAction> = (
  state = initialState,
  action
) => {
  const { type, value } = action;
  let newState: OSPFGlobals;
  switch (type) {
    case "SET_DEF_HELLO_INTERVAL":
      newState = {
        ...state,
        helloInterval: value,
        deadInterval: getDeadInterval(value),
      };
      break;
    case "SET_PROPAGATION_DELAY":
      newState = {
        ...state,
        propagationDelay: value,
        rxmtInterval: getRxmtInterval(value),
      };
      break;
    case "SET_MAX_AGE":
      newState = {
        ...state,
        MaxAge: value,
        LsRefreshTime: value / 2,
      };
      break;
    case "SET_GRACEFUL_SHUTDOWN":
      newState = {
        ...state,
        gracefulShutdown: value,
      };
      break;
    default:
      newState = state;
      break;
  }
  newState !== state &&
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newState));
  return newState;
};
