import { State } from "src/entities/ospf/enum";
import { NeighborTableRow } from "src/entities/ospf/tables";
import { getKey } from "src/utils/common";

const stateDescriptions: Record<State, string> = {
  [State.Down]: `
            The initial state of a neighbor conversation.
            It indicates that <i>there has been no recent information received from the neighbor</i>.
      `,
  [State.Init]: `Indicates that the neighbor <i>has been seen by the router</i>, 
  but bidirectional communication has <i>not yet been established</i>, since 
  <b>the router itself did not appear in the neighbor's HelloPacket</b>`,
  [State.TwoWay]: `In this state, communication between the two routers is bidirectional. Both the routers recognize each other 
  in their neighbor tables.`,
  [State.ExStart]: `
  The goal of this step is to decide which router is the master, and to decide upon the initial DD sequence number. 
  Neighbor conversations in this state or greater are called adjacencies.`,
  [State.Exchange]: `
  In this state the router is describing its entire link state database by sending Database Description packets to the neighbor.
  `,
  [State.Loading]: `
  The router is requesting the neighbor to send more Link State packets describing the neighbor's neighbors (and associated cost) in
  order to fill its routing table.
  `,
  [State.Full]: `The neighbors in this state are <b>FULLY ADJACENT</b>: Each know each other, and each other's entire world view.`,
};

export const columnNames: Record<keyof NeighborTableRow, string> = {
  routerId: "Neighbor ID",
  state: "State",
  address: "IP Address",
  interfaceId: "",
  ddSeqNumber: "DD Sequence #",
  master: "Master / Slave",
  deadTimer: "Inactivity Timer",
  rxmtTimer: "",
  linkStateRequestList: "Link State Request List",
  dbSummaryList: "Database Summary List",
  linkStateRetransmissionList: "LS Retransmission List",
};

export const descriptions: Record<keyof NeighborTableRow | "none", string> = {
  address: `
      <p>The IP address of the neighboring router's interface to the attached network.</p> 
      <ul>
            <li>Learned when Hello packets are received from the neighbor.</li>
            <li>Used as the Destination IP address when protocol packets are sent along this adjacency.</li>
      </ul>`,
  routerId: `
      <p>The Router ID of the neighbor</p>
      <ul>
      <li>Typically the <b>first IP</b> or the <b>highest IP</b> assigned to the neighbor.</li>
      <li>Learned when Hello packets are received from the neighbor.</li>
      </ul>
      </p>`,
  state: `
      <p>The State of the Neighbor. Indicates the <b>functional level</b> of the neighbor conversation.</p>
      <p>A short description of each of the possible states is as follows:</p>
      <ul>
      ${Object.keys(stateDescriptions)
        .map((k) => {
          const state = getKey(State, parseInt(k));
          return `
            <li>
                  <b>${state}</b>: ${stateDescriptions[parseInt(k) as State]}
            </li>`;
        })
        .reduce((acc, cur) => acc + cur)}
      </ul>`,
  interfaceId: "",
  ddSeqNumber: `
      <p>The <b>Sequence number of the Database Description packet</b> that is currently being sent to the neighbor.</p>
      <p>The start of the sequence is negotiated during the <b>ExStart</b> phase of the adjacency.</p>`,
  master: `
      <p>While Exchanging Database packets, one neighbor acts as the Master and controls the flow of the exchange.</p>
      <ul>
      <li>This relationship is negotiated in the <b>ExStart</b> state.
      <li>The router with the <b>higher</b> Router ID becomes the <b>master</b>, 
      and the one with the lower Router ID becomes the <b>slave</b>.
      </li>
      <li>This field indicates if the current router is the master or slave in this relationship.</li>
      </ul>`,
  deadTimer: `
      <p>A single shot timer <b>whose firing indicates that no Hello Packet has been seen from this neighbor recently</b>.</p>
      <ul>
            <li>The length of the timer is <b>RouterDeadInterval</b> seconds, which is typically set to
            <b>4 * HelloInterval</b>.
            <li>Neighbor state is set to <b>DOWN</b> once this timer fires.</li>
      </ul>`,
  rxmtTimer: "",
  linkStateRetransmissionList: `
      <p>The list of LSAs that have been <b>flooded but not acknowledged on</b> by this neighbor.</p>
      <p> These will be retransmitted at intervals until:</p>
      <ul>
            <li> They are acknowledged, OR </li>
            <li> The neighbor relationship is destroyed.</li>
      </ul>`,
  dbSummaryList: `<p>The complete list of LSAs that make up the area link-state
        database, at the moment the neighbor goes into Database Exchange
        state.  This list is sent to the neighbor in Database
        Description packets.</p>`,
  linkStateRequestList: `
      <p>The list of LSAs that need to be received from this neighbor in order to synchronize the two neighbors' link-state databases.</p>
      <ul>
            <li> This list is created as Database Description packets are received. </li>
            <li> <b>The list is then sent to the neighbor in Link State Request packets</b>.
            <li> The list is depleted as appropriate Link State Update packets are received.</li>
      </ul>`,
  none: "Hover over any column to learn about it.",
};
