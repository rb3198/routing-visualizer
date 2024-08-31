import { ActiveModalState } from "src/reducers/modals";

export type ModalAction =
  | ({
      type: "OPEN_MODAL";
    } & ActiveModalState)
  | {
      type: "CLOSE_MODAL";
    };
