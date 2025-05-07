import { ExpertiseCard } from "src/types/tutorials/expertise_card";
import {
  ITutorialScreen as IScreen,
  TutorialScreen as Screen,
  TutorialScreen,
} from "src/types/tutorials/screen";
import { Emoji } from "./emojis";
import { CourierLocal } from "src/components/tutorials/screens/internet/courier_local";
import { NetworkDefinition } from "src/components/tutorials/screens/internet/network_definition";
import { ScalingUp } from "src/components/tutorials/screens/internet/scaling_up_courier";
import { CoreDistEdge } from "src/components/tutorials/screens/internet/core_dist_edge";
import { PlaceHolder } from "src/components/tutorials/placeholder";

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
        screen: ScalingUp({}),
      },
      {
        title: "The Core, Distribution, and Edge",
        screen: CoreDistEdge({}),
      },
    ],
  },
  [Screen.IPAddressing]: {
    title: "IP Addressing",
    subScreens: [
      {
        title: "IP Addressing",
        screen: PlaceHolder({ type: "coming_soon" }),
      },
    ],
  },
  [Screen.Structure]: {
    title: "Architecture of the Internet",
    // subScreens: [
    //   {
    //     title: "Autonomous Systems",
    //     screen: NetworkOfAs({}),
    //   },
    // ],
    subScreens: [
      {
        title: "Autonomous Systems",
        screen: PlaceHolder({ type: "coming_soon" }),
      },
    ],
  },
  [Screen.OSIModel]: {
    title: "The OSI Model",
    subScreens: [
      {
        title: "The Layered Approach",
        screen: PlaceHolder({ type: "coming_soon" }),
      },
    ],
  },
  [Screen.UpperLayers]: {
    title: "Upper Layers of the OSI Model",
    subScreens: [
      {
        title: "The Application Layer",
        screen: PlaceHolder({ type: "coming_soon" }),
      },
    ],
  },
  [Screen.NetworkLayer]: {
    title: "The Network Layer",
    subScreens: [
      {
        title: "Responsibilities",
        screen: PlaceHolder({ type: "coming_soon" }),
      },
    ],
  },
  [Screen.NetworkTypesByTopology]: {
    title: "Types of Networks - By Topology",
    subScreens: [
      {
        title: "LANs, WANs, MANs",
        screen: PlaceHolder({ type: "coming_soon" }),
      },
    ],
  },
  [Screen.OSPFIntro]: {
    title: "Introduction to OSPF",
    subScreens: [
      {
        title: "What is OSPF?",
        screen: PlaceHolder({ type: "coming_soon" }),
      },
    ],
  },
  [Screen.OSPFDetail]: {
    title: "The OSPF Protocol",
    subScreens: [
      {
        title: "Adjacencies",
        screen: PlaceHolder({ type: "coming_soon" }),
      },
    ],
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
  setScreen: (screen: TutorialScreen, subScreenIdx?: number) => unknown
): ExpertiseCard[] => [
  {
    title: `${Emoji.Seedling} The Absolute Beginner`,
    prefix: "You are:",
    screen: TutorialScreen.InternetIntro,
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
    buttonLabel: `Start Your Journey`,
    onClick: setScreen.bind(null, TutorialScreen.InternetIntro, 0),
  },
  {
    title: `${Emoji.Toolbox} The Network Amateur`,
    prefix: "You:",
    screen: TutorialScreen.IPAddressing,
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
    buttonLabel: `Explore IP Addressing`,
    onClick: setScreen.bind(null, TutorialScreen.IPAddressing, 0),
  },
  {
    title: `${Emoji.SatelliteDish} The Intermediate`,
    prefix: "You:",
    screen: TutorialScreen.OSPFIntro,
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
    onClick: setScreen.bind(null, TutorialScreen.OSPFIntro, 0),
  },
  {
    title: `${Emoji.Electricity} The Network Pro`,
    prefix: "You:",
    screen: TutorialScreen.VisualizerTutorial,
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
    onClick: (e) => {
      e.preventDefault();
      setScreen(TutorialScreen.VisualizerTutorial, 0);
    },
  },
];
