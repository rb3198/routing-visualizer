import React from "react";
import commonStyles from "../../common_styles.module.css";
import styles from "./styles.module.css";
import { italicBold, underlineBold } from "../../common";
import { RoutingExample } from "./routing_example";

export const NetworkDefinition: React.FC = () => {
  return (
    <div>
      <p>
        Are you wondering how networks are related to a courier service? <br />
        Well, it turns out that a computer network provides largely the same
        services to our devices that a courier provides to us humans!
      </p>
      <h3 className={commonStyles.heading}>Drawing Parallels</h3>
      <p>
        We will now draw some parallels between the courier service and a
        computer network.
      </p>
      <h4 className={commonStyles.sub_heading}>Humans vs Devices</h4>
      <ul className={commonStyles.list}>
        <li>
          Similar to how us humans play the roles of senders and recipients for
          shipments of a courier service, {italicBold("our computing devices")}{" "}
          play these roles in a computer network.
        </li>
        <li>
          Therefore, a computer network can be seen as{" "}
          {italicBold("a service to deliver messages between devices.")}
        </li>
      </ul>
      <h4 className={commonStyles.sub_heading}>Shipments vs Packets</h4>
      <ul className={commonStyles.list}>
        <li>A courier network delivers {italicBold("shipments")}.</li>
        <li>
          A computer network delivers data wrapped in {italicBold("packets")}.
        </li>
      </ul>
      <h4 className={commonStyles.sub_heading}>Addresses</h4>
      <ul className={commonStyles.list}>
        <li>
          Senders and recipients in a {italicBold("courier network")}{" "}
          communicate from {underlineBold("physical addresses,")} which may
          refer to the location of an office, home, factory, etc.
        </li>
        <li>
          Similarly, devices connecting to a {italicBold("computer network")}{" "}
          use an {underlineBold("IP Address.")} It refers to the location of a
          computing device, like a computer, smartphone, router, etc.
          <br />
          <br />
          Notice how a physical address is not used to identify a human, but
          rather the {italicBold("location")} from which they're communicating.
          Likewise,{" "}
          <b>
            an IP Address is not used to identify a machine, but rather the{" "}
            <i>location from which it is connected to the network.</i>
          </b>
        </li>
        <li>
          Similar to how an address can change when a human relocates, the IP
          address of a machine can change when it relocates within / outside a
          network.
        </li>
      </ul>
      <h4 className={commonStyles.sub_heading}>Routes in the Network</h4>
      <ul className={commonStyles.list}>
        <li>
          Routes in a {italicBold("courier network")} might be composed of
          roads, air, or water ways.
        </li>
        <li>
          Similarly, routes in a {italicBold("computer network")} are composed
          of {italicBold("links")}, which may be wired or wireless.
        </li>
        <li>
          Just like the primary objective of a courier service is to deliver the
          shipments efficiently in minimal time, the primary objective of a
          computer network is to route messages (packets) in minimal time using
          the shortest paths.
        </li>
      </ul>
      <RoutingExample />
      <h4 className={commonStyles.sub_heading}>
        Routing the Packages (Packets)
      </h4>
      <ul className={commonStyles.list}>
        <li>
          In a courier service network, the employees are tasked with shipping
          the package to the appropriate destination.
        </li>
        <li>
          In a computer network, {italicBold("routers")} or{" "}
          {italicBold("switches")} are tasked with redirecting the incoming
          packets to their intended destination
        </li>
      </ul>
      <h4 className={commonStyles.sub_heading}>
        Summarizing our Computer Network Definition
      </h4>
      <p>
        In summary, a computer network is a system that connects two or more
        computing devices to enable them to share information and resources,
        using physical or wireless connections and following established
        communication protocols. The key components of a computer network
        include:
      </p>
      <ol className={commonStyles.list} id={styles.components_list}>
        <li>
          {underlineBold("Network Devices")} wanting to communicate with each
          other
        </li>
        <li>{underlineBold("Links")} connecting the devices</li>
        <li>
          {underlineBold("Communication Protocols")} through which the devices
          communicate.
        </li>
      </ol>
      The primary objective of a computer network is to route packets in minimal
      time with maximum efficiency.
    </div>
  );
};
