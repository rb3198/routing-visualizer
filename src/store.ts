import { createStore } from "redux";
import { rootReducer } from "./reducers";

export const store = createStore(
  rootReducer,
  "__REDUX_DEVTOOLS_EXTENSION__" in window &&
    typeof window["__REDUX_DEVTOOLS_EXTENSION__"] === "function"
    ? window.__REDUX_DEVTOOLS_EXTENSION__()
    : undefined
);
