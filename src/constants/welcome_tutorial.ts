import { ExpertiseCard } from "src/types/welcome_tutorial/expertise_card";
import {
  ITutorialScreen as IScreen,
  TutorialScreen as Screen,
  TutorialScreen,
} from "src/types/welcome_tutorial/screen";
import { Emoji } from "./emojis";
import { PlaceHolder } from "src/components/placeholder";
import { CourierLocal } from "src/components/welcome_tutorial/screens/internet/courier_local";
import { NetworkDefinition } from "src/components/welcome_tutorial/screens/internet/network_definition";

export const screenMap: Record<Screen, IScreen> = {
  [Screen.Welcome]: {
    title: "Hello & Welcome to OSPF Visualizer!",
    subScreens: [],
  },
  [Screen.InternetIntro]: {
    title: "Introduction to the Internet",
    subScreens: [
      {
        title: "Building a Local Courier Service",
        screen: CourierLocal({}),
      },
      {
        title: "Defining a Network",
        screen: NetworkDefinition({}),
      },
      {
        title: "Scaling up our Courier Service",
        screen: PlaceHolder(),
      },
      {
        title: "A Network of Networks",
        screen: PlaceHolder(),
      },
      {
        title: "Communication in the internet",
        screen: PlaceHolder(),
      },
    ],
  },
  [Screen.OSIModel]: {
    title: "The OSI Model",
    subScreens: [],
  },
  [Screen.UpperLayers]: {
    title: "Upper Layers of the OSI Model",
    subScreens: [],
  },
  [Screen.NetworkLayer]: {
    title: "The Network Layer",
    subScreens: [],
  },
  [Screen.NetworkTypesByTopology]: {
    title: "Types of Networks - By Topology",
    subScreens: [],
  },
  [Screen.DeviceAddressing]: {
    title: "Device Addressing",
    subScreens: [
      {
        title: "Device Addressing Intro",
        screen: PlaceHolder(),
      },
    ],
  },
  [Screen.OSPFIntro]: {
    title: "Introduction to OSPF",
    subScreens: [],
  },
  [Screen.OSPFDetail]: {
    title: "The OSPF Protocol",
    subScreens: [],
  },
  [Screen.VisualizerTutorial]: {
    title: "Visualizer Tutorial",
    subScreens: [],
  },
  [Screen.Complete]: {
    title: "",
    subScreens: [],
  },
};

export const getExpertiseCards = (
  setScreen: (
    screen: TutorialScreen,
    subScreenIdx: number,
    writeToStorage?: boolean
  ) => unknown,
  writeToStorage?: boolean
): ExpertiseCard[] => [
  {
    title: `${Emoji.Seedling} The Absolute Beginner`,
    prefix: "You are:",
    description: [
      {
        text: "Just starting to explore networking concepts.",
      },
      { text: "Not yet familiar with IP addresses, routers, or switches." },
      { text: "Curious about how the internet and devices communicate." },
      {
        text: `Ready to take the first step into the exciting world of networking! ${Emoji.Rocket}`,
      },
    ],
    buttonLabel: `Start Your Networking Journey`,
    onClick: setScreen.bind(
      null,
      TutorialScreen.InternetIntro,
      0,
      writeToStorage
    ),
  },
  {
    title: `${Emoji.Toolbox} The Network Amateur`,
    prefix: "You:",
    description: [
      {
        text: "Know what is a computer network and how it is formed.",
        checked: true,
      },
      {
        text: "Are familiar with the terms ISP, LANs, IPs, Protocols, Routers etc.",
        checked: true,
      },
      {
        text: `Are unfamiliar with the construction of IP Addresses and routing tables.`,
      },
      {
        text: "Interested in learning or refreshing your knowledge of the OSI Model.",
      },
      {
        text: `Know barely anything about the OSPF Protocol but would love to learn it. ${Emoji.Rocket}`,
      },
    ],
    buttonLabel: `Explore the OSI Model`,
    onClick: setScreen.bind(
      null,
      TutorialScreen.DeviceAddressing,
      0,
      writeToStorage
    ),
  },
  {
    title: `${Emoji.SatelliteDish} The Intermediate`,
    prefix: "You:",
    description: [
      {
        text: "Are thorough in your understanding of the OSI model and its layered architecture.",
        checked: true,
      },
      {
        text: "Are familiar with CIDR IP addressing.",
        checked: true,
      },
      {
        text: "Understand packet forwarding well.",
        checked: true,
      },
      {
        text: "Are unfamiliar with / would love a refresher of the OSPF Protocol.",
      },
    ],
    buttonLabel: `Dive Into OSPF`,
    onClick: setScreen.bind(
      null,
      TutorialScreen.DeviceAddressing,
      0,
      writeToStorage
    ),
  },
  {
    title: `${Emoji.Electricity} The Network Pro`,
    prefix: "You:",
    description: [
      {
        text: "Are very familiar with all the layers of the OSI Model.",
        checked: true,
      },
      {
        text: "Are familiar with IP addressing and packet forwarding.",
        checked: true,
      },
      {
        text: "Have a thorough understanding of the OSPF Model.",
        checked: true,
      },
      {
        text: `Confident in OSPF concepts and ready to jump into the visualizer! ${Emoji.Rocket}`,
      },
    ],
    buttonLabel: `Start Visualizing OSPF`,
    onClick: setScreen.bind(
      null,
      TutorialScreen.VisualizerTutorial,
      0,
      writeToStorage
    ),
  },
];
