import React from "react";
import styles from "./styles.module.css";
import commonStyles from "../../common_styles.module.css";
import { italicBold, underlineBold } from "../../common";
import { Layers } from "./layers";
import { Emoji } from "src/constants/emojis";
import { HomeNetwork } from "./home_network";
import { Distribution } from "./distribution";
import { Core } from "./core";

type HubData = {
  type: string;
  focus: string;
  role: string;
  volume: string;
  interactions: string;
  design: string;
};

const italicBoldString = (str: string) => `<b><i>${str}</i></b>`;

const data: HubData[] = [
  {
    type: "<b>Last Mile Hubs</b>",
    focus: "A very small, localized area",
    role: `Responsible for the 
      ${italicBoldString("first")} and ${italicBoldString(
      "last"
    )} legs of delivery.`,
    interactions: `Interact with the "endpoints", i.e.,
      the ${italicBoldString("senders")} and ${italicBoldString(
      "recipients"
    )}.`,
    volume: "Low volume of shipments.",
    design: `
    <ul class="${commonStyles.list}">
      <li>Small storage capacities</li>
      <li><u>Not</u> available 24/7</li>
      <li>Small offices</li>
      <li>Minimally affects the network when closed</li>
    </ul>`,
  },
  {
    type: "<b>Regional Hubs</b>",
    focus: "Medium-sized / Wide Area",
    role: `Act as an ${italicBoldString(
      "intermediary"
    )} between local hubs or between national and local hubs.`,
    interactions: `Interact with local and national hubs.`,
    volume: "Medium volume of shipments.",
    design: `
    <ul class="${commonStyles.list}">
      <li>Medium storage capacities</li>
      <li>Highly available</li>
      <li>Medium-sized offices</li>
      <li>Closure affects a significant part of the network.</li>
    </ul>
    `,
  },
  {
    type: "<b>National Hubs</b>",
    focus: "Largest Area",
    role: `Central repository of shipments.`,
    interactions: `Interact with regional hubs.`,
    volume: "Highest volume of shipments.",
    design: `
    <ul class="${commonStyles.list}">
      <li>Biggest storage capacities</li>
      <li>Maximum Availability</li>
      <li>Biggest offices</li>
      <li>Closure can handicap the network.</li>
    </ul>
    `,
  },
];

export const CoreDistEdge: React.FC = () => {
  return (
    <div>
      <p>
        In this section, we'll summarize the principles we applied to our
        courier network and apply the same principles towards building the
        internet! We will:
      </p>
      <ol className={commonStyles.list}>
        <li>Summarize the characteristics of our courier network</li>
        <li>
          Learn about the terms {italicBold("Core, Distribution, ")} and{" "}
          {italicBold("Edge")}.
        </li>
        <li>
          Learn about how the internet is structured using these components
        </li>
      </ol>
      <h3 className={commonStyles.heading}>
        Summarizing the Characteristics of our Hubs
      </h3>
      We'll now discuss the focus area size, role, interaction points, volume of
      shipments handled, and design of our hubs.
      <table className={styles.table}>
        <tbody>
          <tr>
            <th>Hub Type</th>
            <th>Role</th>
            <th>Area in Focus</th>
            <th>Volume Handled</th>
            <th>Interactions</th>
            <th className={styles.design}>Design</th>
          </tr>
          {data.map(({ type, role, focus, volume, interactions, design }) => (
            <tr key={type}>
              <td dangerouslySetInnerHTML={{ __html: type }}></td>
              <td dangerouslySetInnerHTML={{ __html: role }}></td>
              <td dangerouslySetInnerHTML={{ __html: focus }}></td>
              <td dangerouslySetInnerHTML={{ __html: volume }}></td>
              <td dangerouslySetInnerHTML={{ __html: interactions }}></td>
              <td
                dangerouslySetInnerHTML={{ __html: design }}
                className={styles.design}
              ></td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className={commonStyles.heading}>A Layered View of Our Hierarchy</h3>
      <p>
        We can close the discussion on our network by viewing our hierarchy as a{" "}
        {underlineBold("collection of layers.")}
      </p>
      <div className={styles.ex_container}>
        <Layers width={"100%"} />
      </div>
      <ul className={commonStyles.list}>
        <li>
          The {italicBold("National Hubs")} form the {underlineBold("Core")} of
          our network: They operate 24/7, serve as the central route for the
          traffic of our shipments, have the maximum capabilities, cover all of
          the area in our network collectively, and their primary role is to
          forward the traffic of shipments to an appropriate regional hub.
        </li>
        <li>
          The {italicBold("Regional Hubs")} are tasked with the{" "}
          {underlineBold("Distribution")} of shipments in our network: They have
          minimal downtime, have good capabilities, act as the{" "}
          {italicBold("transit")} between the core and the end addresses or
          between two end addresses, serve a large area, and handle medium sized
          workloads.
        </li>
        <li>
          The {italicBold("Local Hubs")} form the {underlineBold("Edge")} of our
          network: They have small offices with small capabilities and minimal
          costs, {italicBold("connect the end customers to our network")}, serve
          a local area, and handle small workloads.
        </li>
      </ul>
      <h3 className={commonStyles.heading}>
        The Core, Distribution, and Edge of the Internet
      </h3>
      We see that the internet is created using the same layered approach -
      <br />
      It can be fragmented into 3 layers:
      <ul className={commonStyles.list}>
        <b>
          <li>The Network Core</li>
          <li>Network Distribution</li>
          <li>The Network Edge</li>
        </b>
      </ul>
      <br />
      <b>{Emoji.Bulb} Remember:</b>
      <ul className={commonStyles.list}>
        <li>The internet is a collection of interconnected networks.</li>
        <li>
          Like the primary task of a courier service was to enable you to send
          shipments to any location,{" "}
          <b>
            the primary task of an internet service is to enable your devices to
            send messages to any other device.
          </b>
        </li>
        <li>
          The job of routing information being exchanged on the internet by
          networking devices lies with the {underlineBold("router")}.
        </li>
      </ul>
      <b>
        Hence, all the layers in the internet are basically networks of varying
        capabilities, responsibilities, and availability.
      </b>
      <h4 className={commonStyles.sub_heading}>Routes served</h4>
      This structure also works on the basis of route aggregation we discussed
      in the previous section:
      <br />
      As you move down the hierarchy, networks serve increasingly specific{" "}
      {italicBold("IP Addresses")}. As you move up the hierarchy, networks serve
      a broader range of IP Addresses.
      <ul className={commonStyles.list}>
        <li>
          {italicBold("The Network Core")} sits on top of the hierarchy and
          serves the biggest range of IP Addresses as it aggregates traffic from
          several distribution layer networks.
        </li>
        <li>
          Networks in the {italicBold("Distribution Layer")} serve a smaller
          range of IP Addresses than the core.
        </li>
        <li>
          Networks that are a part of the {italicBold("Network Edge")} serve the
          most specific IP addresses, and hence serve the smallest range of IPs.
        </li>
      </ul>
      <h4 className={commonStyles.sub_heading}>
        <u>The Network Edge</u>
      </h4>
      <p>
        To provide you internet services, your Internet Service Provider (ISP)
        installs {italicBold("a router and a modem")} at your home.
      </p>
      <ul className={commonStyles.list}>
        <li>
          The router helps form a <u>{italicBold("local home network")}</u> of
          your devices.
        </li>
        <li>
          The modem, connected to your router, enables your home network to
          connect to the internet, i.e. other networks managed by your ISP.
        </li>
        <b>
          {Emoji.Bulb} Can you spot an analogy with the local hub of our courier
          service here?
        </b>
        <li>
          While a local courier hub helped connect different addresses to the
          courier network,{" "}
          {italicBold(`the router and modem together help connect the
          devices at your home to the internet.`)}
        </li>
        <li>
          Your home network is thus part of the <b>Network Edge</b>.
        </li>
        <li>
          The characteristics of the network edge are similar to those of a
          local courier hub:
          <ul>
            <li>It is {italicBold("cheap")}.</li>
            <li>
              It is {underlineBold("not")} guaranteed to be highly available -
              The network collapses as soon as power to the router is cut.
            </li>
            <li>
              It {italicBold("connects the endpoints")} (i.e. your devices) to
              the network.
            </li>
            <li>
              It {italicBold("deals with low traffic")}, i.e. a handful of
              devices at home or a few hundred in a business.
            </li>
          </ul>
        </li>
      </ul>
      <div className={styles.ex_container}>
        <HomeNetwork />
        <p>Figure: The Network Edge</p>
      </div>
      <h4 className={commonStyles.sub_heading}>
        <u>The Distribution Layer</u>
      </h4>
      <ul className={commonStyles.list}>
        <li>
          {italicBold(`The networks in the Distribution Layer play the same role as the
          regional hubs in our courier networks`)}{" "}
          - They serve as the intersection between many edge networks, as well
          as help route packets between the network core and the network edge.
        </li>
        <li>
          Unlike a courier network managed by one organization, the internet is
          {italicBold(" a decentralized system")} where multiple ISPs
          collaborate at this layer to interconnect networks securely
        </li>
        <li>
          Hence, the distribution layer here also provides security services
          like {italicBold("applying security policies")} to keep unwanted
          packets out of the network.
        </li>
        <li>
          Additionally, the routers in the distribution layer networks are
          almost always available, guaranteeing reliable network service to the
          end-user.
        </li>
        <li>
          A {underlineBold(`single failure`)} at this layer{" "}
          {italicBold(`can cause multiple edge networks to
          disconnect from the internet`)}
          . Hence, backup routers are kept by the ISPs in this layer in case a
          router goes down.
        </li>
        <li>
          Also, {italicBold("multiple paths to the core")} are stored so that
          traffic is continually routed even if some router in the core goes
          down.
        </li>
        <li>
          Many local, national, and international ISPs manage networks in this
          layer.
        </li>
      </ul>
      <div className={styles.ex_container}>
        <Distribution />
        <p>Figure: The Distribution Layer</p>
      </div>
      <h4 className={commonStyles.sub_heading}>The Network Core</h4>
      <ul className={commonStyles.list}>
        <li>
          The {underlineBold("Network Core")} is composed of networks with
          routers that are {italicBold("highly available")}, are{" "}
          {italicBold("very fast")}, can{" "}
          {italicBold(`accommodate large amounts of traffic`)}, and have minimal
          processing and low latency.
        </li>
        <li>
          The tasks of this layer are analogous to the tasks being done by our
          national hubs.
        </li>
        <li>
          They're highly {italicBold("redundant")}, meaning that there are many
          backup routers available in the network, ready to step in if a router
          goes down.
        </li>
        <li>The most expensive and highly capable routers form this layer.</li>
        <li>
          The primary task here is to {italicBold("forward traffic")} to the
          appropriate routers in the distribution layer.
        </li>
        <li>
          The network core is typically {italicBold("costly to maintain")} and
          is usually maintained by a few large ISPs in a country.
          <br />
          Example: AT&T, Verizon, Cogent, etc. in the U.S.
        </li>
      </ul>
      <b className={styles.conclusion}>
        In conclusion, this is what the architecture of the internet looks like:
      </b>
      <Core />
    </div>
  );
};
