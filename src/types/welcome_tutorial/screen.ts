export enum TutorialScreen {
  Welcome = 0,
  InternetIntro = 1, // What is the internet and Network types by size
  DeviceAddressing = 2, // IP Addressing & Packet Forwarding
  OSIModel = 3,
  UpperLayers = 4,
  NetworkLayer = 5,
  OSPFIntro = 6,
  NetworkTypesByTopology = 7, // Advanced Network types (by topology)
  OSPFDetail = 8,
  VisualizerTutorial = 9,
  Complete = 10,
}

export type ITutorialScreen = {
  title: string;
  subScreens: { title: string; screen: JSX.Element }[];
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
