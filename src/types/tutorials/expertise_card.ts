import { MouseEventHandler } from "react";
import { TutorialScreen } from "./screen";

export type ExpertiseCard = {
  title: string;
  buttonLabel: string;
  prefix: string;
  screen: TutorialScreen;
  description: { text: string; checked?: boolean }[];
  onClick: MouseEventHandler;
};
