import React from "react";

export enum TutorialScreen {
  Welcome = 0,
  InternetIntro = 1, // What is the internet and Network types by size
  IPAddressing = 2, // IP Addressing & Packet Forwarding
  Structure = 3, // AS, Areas
  OSIModel = 4,
  UpperLayers = 5,
  NetworkLayer = 6,
  OSPFIntro = 7,
  NetworkTypesByTopology = 8, // Advanced Network types (by topology)
  OSPFDetail = 9,
  VisualizerTutorial = 10,
  Complete = 11,
}
export type SubScreen = {
  title: string;
  screen: JSX.Element | React.ReactNode;
};
export type ITutorialScreen = {
  title: string;
  subScreens: SubScreen[];
};

export const ScreenNameMap: Record<TutorialScreen, string> = {
  [TutorialScreen.Welcome]: "Welcome",
  [TutorialScreen.InternetIntro]: "Introduction to Internet",
  [TutorialScreen.IPAddressing]: "IP Addressing",
  [TutorialScreen.Structure]: "Architecture of the Internet",
  [TutorialScreen.OSIModel]: "OSI Model",
  [TutorialScreen.UpperLayers]: "OSI Upper Layers",
  [TutorialScreen.NetworkLayer]: "OSI Network Layer",
  [TutorialScreen.OSPFIntro]: "Intro to OSPF",
  [TutorialScreen.NetworkTypesByTopology]: "Network Types",
  [TutorialScreen.OSPFDetail]: "OSPF In Detail",
  [TutorialScreen.VisualizerTutorial]: "Visualizer Tutorial",
  [TutorialScreen.Complete]: "Close Tutorial",
};

export type TutorialScreenCache = {
  /**
   * The principal screen that the user was on before exiting
   */
  screen: TutorialScreen;
  /**
   * The sub-screen idx that the user was on before exiting
   */
  subScreenIdx: number;
};

export type SetScreenCallback = (
  screen: TutorialScreen,
  subScreenIdx: number,
  writeToStorage?: boolean
) => unknown;
