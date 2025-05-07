import { Emoji } from "src/constants/emojis";
import { TutorialStep } from "src/types/tutorials/sim_tutorial_step";
import { italicBoldString } from "../screens/common";

const videoSrc = (file: string) =>
  (process.env.PUBLIC_URL ?? "") + "/sim_tutorials/" + file;

export const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to OSPF Simulator",
    description: `Welcome to the OSPF Simulator — a visual and interactive tool for understanding how the OSPF routing protocol works.<br>With this simulator, you can:`,
    bullets: [
      `<b>${Emoji.Toolbox} Build a custom network topology</b> by placing areas and routers on an open grid.`,
      `<b>${Emoji.Bullseye} Watch OSPF convergence happen</b> in real time through neighbor table updates and state machine transitions.`,
      `<b>${Emoji.Bulb} View routing tables</b> that reflect the network's dynamic state.`,
      `<b>${Emoji.Package} Send packets</b> across the network and observe how routes are chosen.`,
      `<b>${Emoji.MagnifyingGlass} Inspect OSPF packets</b> like Hello packets, DBDs, and LS Updates during convergence.`,
      `<b>${Emoji.Wrench} Experiment by changing network conditions</b>, such as turning routers off and on, to see how OSPF adapts.`,
    ],
    videoSrc: videoSrc("welcome.mp4"),
    footer: "",
  },
  {
    title: "Building a Network – Placing an Area",
    description: `OSPF networks are logically divided into areas to improve scalability and performance.<br/>To place an area:`,
    bullets: [
      `${Emoji.ComputerMouse} Move your mouse over the grid.`,
      `${Emoji.HandPointingUp} Click to open the context menu.`,
      `${Emoji.Bullseye} Choose <b>"Area Boundary"</b> to define an area on the canvas.`,
    ],
    videoSrc: videoSrc("placing_an_area.mp4"),
    footer:
      "<b><i>Areas must be created before routers can be added inside them.</i></b>",
  },
  {
    title: "Building a Network – Placing a Router",
    description: `After creating an area, you can start placing routers inside it. These routers will participate in OSPF and form adjacencies with their neighbors.</p><p>To place a router:`,
    bullets: [
      `${Emoji.HandPointingUp} Click anywhere within a previously defined area.`,
      `${Emoji.ComputerMouse} Select <b>"Router"</b> from the menu that appears.`,
    ],
    videoSrc: videoSrc("placing_a_router.mp4"),
    footer:
      "Routers placed inside an area will automatically become part of that area for OSPF.",
  },
  {
    title: "Building a Network – Connecting Routers",
    description: `To enable communication and OSPF adjacency formation, routers need to be connected.</p><p>To connect two routers:`,
    bullets: [
      `${Emoji.HandPointingUp} Click on one of the routers to open its context menu.`,
      `${Emoji.Link} Choose <b>"Connect"</b>.`,
      `${Emoji.Bullseye} Then, click on the router you want to connect to.`,
    ],
    videoSrc: videoSrc("connecting_routers.mp4"),
    footer:
      "A bidirectional link will be created, and OSPF neighbor discovery will begin.",
  },
  {
    title: "Navigating the Grid - Panning",
    description: `The simulation grid is large and designed for flexible network layouts.`,
    bullets: [
      `${Emoji.HandRaised} <b>To pan around the grid, hold the right mouse button and drag.</b>`,
    ],
    videoSrc: videoSrc("panning.mp4"),
    footer: "This allows you to easily navigate large or complex topologies.",
  },
  {
    title: "Navigating the Grid - Zooming In",
    description: `To <b><i>zoom in</i></b>, <b><u>scroll up</u></b> on your mouse wheel, or <b><u>zoom in</u></b> using your touchpad.`,
    bullets: [],
    videoSrc: videoSrc("zooming.mp4"),
    footer: "",
  },
  {
    title: "Navigating the Grid - Zooming Out",
    description: `To <b><i>zoom out</i></b>, <b><u>scroll down</u></b> on your mouse wheel, or <b><u>zoom out</u></b> using your touchpad.`,
    bullets: [],
    videoSrc: videoSrc("zooming_out.mp4"),
    footer: "",
  },
  {
    title: "Viewing Router State",
    description: `<p>Each router maintains its own OSPF data structures. You can inspect these in real-time.</p><p>To view a router’s internal state:</p>`,
    bullets: [
      `${italicBoldString("Click on the router")}, and then choose from:`,
      `${Emoji.Clipboard} <b>Neighbor Table</b>: Lists neighbors and their OSPF states.`,
      `${Emoji.FileCabin} <b>Link-State Database (LSDB)</b>: Shows the LSAs known to the router.`,
      `${Emoji.Clipboard} <b>Routing Table</b>: The computed shortest paths.`,
      `${Emoji.Package} <b>Send Packet</b>: Initiate a packet to another router and trace its route.`,
    ],
    videoSrc: videoSrc("viewing_router_state.mp4"),
    footer: "This helps you understand OSPF’s behavior step-by-step.",
  },
  {
    title: "Sending Packets",
    description: `<p>You can test the network by sending packets and observing how they are routed.</p><p>To send a packet:</p>`,
    bullets: [
      `${Emoji.ComputerMouse} Click on the source router.`,
      `${Emoji.Package} Select <b>"Send a Packet"</b>.`,
      `${Emoji.Bullseye} Choose the destination router from the prompt.`,
    ],
    videoSrc: videoSrc("sending_packets.mp4"),
    footer:
      "<b>The simulator will trace the path based on the current routing tables.</b>",
  },
  {
    title: "Observing Events using Event Log",
    description: `<p>OSPF works through a series of control messages and state transitions. The <b>Event Log</b> shows all of this as it happens.</p>`,
    bullets: [
      `${Emoji.Scroll} Open the <b>Event Log</b> to watch OSPF messages like Hellos, LSAs, and acknowledgments.`,
      `${Emoji.Rotate} Follow the progression of neighbor states (Init, 2-Way, ExStart, etc.) toward Full.`,
    ],
    videoSrc: videoSrc("event_log.mp4"),
    footer:
      "This gives insight into how routers learn about each other and build the network map.",
  },
  {
    title: "The Toolbar – Configuring the Simulation",
    description: `The toolbar lets you customize how the simulation behaves. <b>Click the toolbar to expand it</b>. Here, you can modify:`,
    bullets: [
      `${Emoji.Turtle} <b>Propagation delay</b>: Sets the speed of packets moving from router to router.
      <br/><b>Slow it down</b> to observe network convergence more closely.<br/>
      <b>Accelerate it</b> to have network converge quickly.`,
      `${Emoji.Handshake} <b>Hello Interval</b>: Frequency of Hello packets. Changing it also affects the ${Emoji.NoEntry} <b>Dead Interval</b>`,
      `${Emoji.OldWoman} <b>MaxAge</b>: Time after which LSAs expire. Changing it also affects the ${Emoji.Recycle} <b>LS Refresh Time</b>`,
    ],
    videoSrc: videoSrc("toolbar.mp4"),
    footer: `
You can also toggle <b>"Shutdown Gracefully"</b> to simulate routers exiting the network cleanly by sending final updates.`,
  },
  {
    title: "The Toolbar - Saving Configurations",
    description: `You can save your current network layout and simulation settings to revisit or share them later.`,
    bullets: [
      "After making changes to the grid or toolbar, click <b>Save</b> on the toolbar to download the config.",
    ],
    videoSrc: videoSrc("config_save.mp4"),
    footer:
      "<b>This helps you create reusable scenarios or demonstrations.</b>",
  },
  {
    title: "The Toolbar - Loading Configurations",
    description: `When the simulation is not playing, you can load pre-configured setups to quickly get started. You can do that by either`,
    bullets: [
      "<b><i>Loading from a file</i></b> which you saved in the previous step, OR",
      "<b><i>Choosing from a pre-loaded configuration</i></b> that we've curated for you.",
    ],
    videoSrc: videoSrc("config_load.mp4"),
    footer: "",
  },
  {
    title: "The Toolbar - Clearing Configurations",
    description: `Want to clear up a messy grid? No problem.<br/>
    When the simulation is not playing, you can clear the grid by clicking <b><i>"Clear"</i></b> button on the toolbar.`,
    bullets: [],
    videoSrc: videoSrc("config_clear.mp4"),
    footer: "",
  },
  {
    title: "Re-opening the Tutorial",
    description: `<p>Need a reminder of how to use the simulator?</p>`,
    bullets: [
      "Click <b>“How to Use”</b> in the top header to open this tutorial again at any time.",
    ],
    videoSrc: videoSrc("how_to_use.mp4"),
    footer: "",
  },
];
