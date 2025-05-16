import { LSUpdatePacket } from "src/entities/ospf/packets";
import { PacketHandlerBase } from "./base";
import { IPPacket } from "src/entities/ip/packets";
import { LSType, State } from "src/entities/ospf/enum";
import {
  getPacketTypeString,
  PacketType,
} from "src/entities/ospf/enum/packet_type";
import { LSA, LSAHeader } from "src/entities/ospf/lsa";
import {
  MaxSequenceNumber,
  MinLSArrival,
  MinLSInterval,
} from "src/entities/ospf/lsa/constants";
import { RouterLSA } from "src/entities/ospf/lsa/router_lsa";
import { NeighborSMEvent } from "src/entities/ospf/enum/state_machine_events";
import { IPProtocolNumber } from "src/entities/ip/enum/ip_protocol_number";
import { SummaryLSA } from "src/entities/ospf/lsa/summary_lsa";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import { copyLsa } from "src/utils/common";
import { lsTypeToString } from "src/entities/ospf/enum/ls_type";
import { printLsaHtml } from "src/utils/ui";
import { LsDb } from "../ls_db";

export class LsUpdatePacketHandler extends PacketHandlerBase<LSUpdatePacket> {
  validPacket = (ipPacket: IPPacket, packet: LSUpdatePacket) => {
    const { header } = packet;
    const { routerId: neighborId } = header;
    const { neighborTable, dropPacket } = this.ospfInterface;
    const neighbor = neighborTable[neighborId.toString()];
    if (!neighbor || neighbor.state < State.Exchange) {
      dropPacket(
        ipPacket,
        `
        ${getPacketTypeString(
          PacketType.LinkStateUpdate
        )} packet received from a neighbor which was in a state < Exchange.
      `
      );
      return false;
    }
    return true;
  };

  /**
   * - If the LSA's LS age is equal to MaxAge, and there is currently no instance of the LSA
   * in the router's link state database, and none of router's neighbors are in states Exchange,
   * returns `true` (Discard the LSA but acknowledge its reception).
   * - Else returns `false`
   * @param areaId The Area that the neighbor sending the LSA belongs to.
   * @param lsa The LSA sent by the neighbor.
   */
  private shouldAcknowledgeAndDiscardLsa = (areaId: number, lsa: LSA) => {
    const { header } = lsa;
    const { lsAge } = header;
    const { neighborTable, lsDb, config } = this.ospfInterface;
    const { MaxAge } = config;
    const dbCopy = lsDb.getLsa(areaId, header);
    const anyNeighborSynchronizing = Object.values(neighborTable).some(
      (neighbor) =>
        neighbor.state === State.Exchange || neighbor.state === State.Loading
    );
    return !dbCopy && lsAge === MaxAge && !anyNeighborSynchronizing;
  };

  summaryLsaSpecialAction = (
    areaId: number,
    receivedLsa: SummaryLSA,
    dbCopy?: SummaryLSA
  ) => {
    const { lsDb, routingTableManager, config } = this.ospfInterface;
    const { MaxAge } = config;
    const { header: receivedHeader } = receivedLsa;
    const { linkStateId: prevAdvertisedNetworkIp } = receivedHeader;
    const advertisedNetworkReachable = routingTableManager
      .getFullTables()
      .table.some((row) => {
        const { destinationId, destType } = row;
        if (destType !== "network") {
          return false;
        }
        const destinationIp = new IPv4Address(...destinationId.bytes);
        return destinationIp.fromSameSubnet(prevAdvertisedNetworkIp);
      });
    if (!advertisedNetworkReachable) {
      const reason =
        "Router took a <b>special action</b>, flushing out the LSA it received which contained an unreachable route.";
      // flush the received LSA
      if (dbCopy) {
        dbCopy.header.lsAge = MaxAge;
        dbCopy.header.lsSeqNumber = receivedLsa.header.lsSeqNumber;
        lsDb.installLsa(areaId, dbCopy, reason, undefined, true);
      } else {
        const copy = copyLsa(receivedLsa);
        copy.header.lsAge = MaxAge;
        lsDb.floodLsa(areaId, [{ lsa: copy, reason, receivedFrom: undefined }]);
      }
      return;
    }
    const reason =
      "Router took a <b>special action</b>, incrementing the Seq. number of an existing LSA since the route was still visible.";
    if (dbCopy) {
      dbCopy.header.lsSeqNumber = receivedLsa.header.lsSeqNumber + 1;
      // Network is still reachable, increment the LS Sequence Number
      lsDb.installLsa(areaId, dbCopy, reason, undefined, true, true);
    } else {
      const copy = copyLsa(receivedLsa);
      copy.header.lsSeqNumber++;
      lsDb.installLsa(areaId, copy, reason, undefined, true);
    }
  };
  /**
   * If a router receives a self-originated LSA that is newer than the one already existing in its own database,
   * that means that the router was restarted at some point, and the LSA that was originated before
   * the restart is still flowing in the network.
   *
   * Given the LSA in its DB and the received LSA, determines if "special action needs to be taken"
   * @param areaId The ID of the area in which this LSA was received from.
   * @param receivedLsa The received LSA.
   * @param dbCopy The corresponding DB Copy of the same LSA.
   * @returns `true` if special action was taken, else returns `false`.
   */
  private specialActionTaken = (
    areaId: number,
    receivedLsa: LSA,
    dbCopy?: LSA
  ) => {
    const { router, lsDb, config } = this.ospfInterface;
    const { MaxAge } = config;
    const { id: routerId } = router;
    const { header: dbLsaHeader } = dbCopy || {};
    const { header: receivedHeader } = receivedLsa;
    const { lsSeqNumber, lsType } = receivedHeader;
    const { advertisingRouter: receivedLsaAdvRouterId } = receivedHeader;
    if (!receivedLsaAdvRouterId.equals(routerId)) {
      return false; // the received LSA is not originated by the router.
    }
    if ((dbLsaHeader?.compareAge(receivedHeader, MaxAge) ?? 1) < 0) {
      return false; // the DB LSA is younger than the received LSA.
    }
    // If LSA is a summary LSA and router's routing table does not have a route to that destination, FLUSH the LSA
    // Else the following code:
    const setRouterLsa = () => {
      const newLsa = RouterLSA.fromRouter(router, areaId, lsSeqNumber + 1);
      lsDb.installLsa(
        areaId,
        newLsa,
        "The Router took a <b>special action</b> because it saw a newer Router LSA belonging to itself in the network.",
        undefined,
        true
      );
    };
    switch (lsType) {
      case LSType.RouterLSA:
        const timeSinceDbCopy = Date.now() - (dbCopy?.createdOn ?? 0);
        if (timeSinceDbCopy < MinLSInterval) {
          setTimeout(setRouterLsa, MinLSInterval - timeSinceDbCopy);
        } else {
          setRouterLsa();
        }
        break;
      case LSType.SummaryIpLSA:
      case LSType.SummaryAsBrLSA:
        this.summaryLsaSpecialAction(
          areaId,
          receivedLsa as SummaryLSA,
          dbCopy as SummaryLSA
        );
        break;
      default:
        throw new Error(
          `Not Implemented handling Special Action for ${lsType}.`
        );
    }
    return true;
  };

  _handle = (
    interfaceId: string,
    ipPacket: IPPacket,
    packet: LSUpdatePacket
  ) => {
    if (!this.validPacket(ipPacket, packet)) {
      return;
    }
    const { lsDb, neighborTable, router, config, sendLSAckPacket } =
      this.ospfInterface;
    const { MaxAge } = config;
    const { id: routerId } = router;
    /**
     * List of Acknowledgements to be sent back to the neighbor.
     */
    const acknowledgements: LSAHeader[] = [];
    const { header, body } = packet;
    const { areaId, routerId: neighborId } = header;
    const { lsaList } = body;
    if (!lsaList.length) {
      console.warn(
        `Empty LSA List received by ${routerId} from ${neighborId}!`
      );
      return;
    }
    const qDesc = `<b>${router.id} received ${lsaList.length} LSA${
      lsaList.length === 1 ? "" : "s"
    } from ${neighborId} in this LS Update Packet.</b>`;
    this.packetProcessedEventBuilder?.addQuestion(qDesc);
    let idx = 0,
      action = "";
    const neighbor = neighborTable[neighborId.toString()];
    const { linkStateRequestList, linkStateRetransmissionList, address } =
      neighbor;
    const sendImmediate: LSA[] = [];
    for (const lsa of lsaList) {
      action = "";
      const { header } = lsa;
      action += `<b>LSA ${++idx}:</b> <br>`;
      action += printLsaHtml(header, true);
      if (this.shouldAcknowledgeAndDiscardLsa(areaId, lsa)) {
        acknowledgements.push(header);
        action += `<b>Discarded</b> but <b>will be acknowledged</b> since:
        <ul>
          <li>The age of the LSA is <code>MaxAge</code> </li>
          <li>There is no copy of the LSA in ${router.id}'s own DB </li>
          <li>The router isn't synchronizing with any of its neighbors.</li>
        </ul>`;
        this.packetProcessedEventBuilder?.addAction(action);
        continue;
      }
      const dbCopy = lsDb.getLsa(areaId, header);
      const { header: dbCopyHeader, updatedOn: dbUpdatedOn } = dbCopy || {};
      const { lsAge: dbCopyAge, lsSeqNumber: dbLsSeqNumber } =
        dbCopyHeader || {};
      const shouldInstallLsa =
        !dbCopy || dbCopyHeader!.compareAge(header, MaxAge) > 0;
      if (shouldInstallLsa) {
        // Either there is no copy of the LSA in the DB, or the existing copy is older.
        if (this.specialActionTaken(areaId, lsa, dbCopy)) {
          action += `
          <ul>
            <li>This LSA was generated by the receiving router ${routerId}.</li>
            <li>The received copy is newer than the copy in ${routerId}'s LS Database.</li>
            <li>Hence, ${routerId} <b>has taken a special action</b>: <br>
            <b>It has generated a new ${lsTypeToString(
              header.lsType
            )} with sequence number
            1 greater than the received sequence number</b></li>
            <li>The router will now flood this newly generated LSA into the area.</li>
          </ul>
          `;
          this.packetProcessedEventBuilder?.addAction(action);
          continue;
        }
        if (dbCopy && Date.now() - dbUpdatedOn! < MinLSArrival) {
          // Discarding the LSA without acknowledging it.
          action += `<b>Discarding</b> the LSA </b>without acknowledgement</b> since
          <code>MinLSArrival</code> ${MinLSArrival} seconds have <i>not</i> passed since the arrival
          of the last copy.`;
          this.packetProcessedEventBuilder?.addAction(action);
          continue;
        }
        // Install the LSA and flood it.
        // Only calculate the routing table if this LSA is the last in the list, to avoid multiple calculations.
        const skipRoutingTableCalc = idx !== lsaList.length;
        action +=
          "Attempted Installation.<br> <b>Installation Procedure:</b><ol>";
        action += lsDb.installLsa(
          areaId,
          lsa,
          "New LSAs were installed and hence are being flooded out.",
          neighborId,
          true,
          skipRoutingTableCalc
        );
        action += `<li>Pushed to the Acknowledgements to be sent back to ${neighborId}</li></ol>`;
        acknowledgements.push(header);
        this.packetProcessedEventBuilder?.addAction(action);
        continue;
      }
      if (
        linkStateRequestList.some((lsaHeader) => lsaHeader.isInstanceOf(lsa))
      ) {
        // an error has occurred in the Database Exchange process.
        action += `An instance of this LSA was requested from this neighbor but the router got an LSA older than the one in the DB.`;
        action += `<b>Therefore, an error has occurred in the exchange process. 
        Generating <code>BadLSReq</code> event for the neighbor
        </b>. <br>`;
        action =
          this.ospfInterface.neighborStateMachine(
            neighborId.toString(),
            NeighborSMEvent.BadLSReq,
            action
          ) ?? "";
        this.packetProcessedEventBuilder?.addAction(action);
        return; // The whole function stops, since a neighbor state error has occurred.
      }
      if (dbCopy.equals(lsa, MaxAge)) {
        // Received LSA is the same instance as the database copy.
        const key = LsDb.getLsDbKey(lsa.header);
        const { lsa: lsInList } = linkStateRetransmissionList.get(key) || {};
        if (lsInList && lsInList.equals(lsa, MaxAge)) {
          const { header } = lsa;
          const { lsAge } = header;
          // Implied Acknowledgement.
          action += `The received LSA from ${neighborId} is the same instance as the one requested by it. Hence, 
          treating the receipt as an <i>implied acknowledgement</i> from ${neighborId}. No ACK will be sent back to it.`;
          linkStateRetransmissionList.delete(key);
          this.ospfInterface.setNeighbor({
            ...neighbor,
            linkStateRetransmissionList: new Map(linkStateRetransmissionList),
          });
          if (lsAge === MaxAge) {
            action += `The received LSA is of age <code>MaxAge</code>. 
            Potentially clearing it from the DB and originating a new Router LSA
            `;
            action +=
              Object.keys(lsDb.db).length > 1 ? " and Summary LSA" : ".";
            lsDb.removeMaxAgeLsas(areaId, [lsa]);
          }
          this.packetProcessedEventBuilder?.addAction(action);
          // No ACK to be sent back to the neighbor.
          continue;
        }
        action += `LSA pushed to Acknowledgements to be sent back to ${neighborId}<br>
        <b>The LSA was not installed</b> since an exact instance of the LSA was already present in the LS DB.`;
        acknowledgements.push(header);
        this.packetProcessedEventBuilder?.addAction(action);
        continue;
      }
      // The DB copy is more recent.
      // Do not ACK the LSU sent by the neighbor.
      if (dbCopyAge === MaxAge && dbLsSeqNumber === MaxSequenceNumber) {
        action += `Sequence number of the LSA is warping since a more recent LSA of
        <code>MaxAge</code> and maximum sequence number is <i>already present in the LS DB</i>.<br>
        Hence, <b>Discarding</b> this LSA.`;
        this.packetProcessedEventBuilder?.addAction(action);
        continue; // Simply discard the LSA, its LS Sequence number is warping.
      }
      // Immediately send the LSU containing the more recent copy
      action += `This LSA is older than the one presently stored in ${routerId}'s database.
      <br>Hence, sending the newer copy back to the neighbor.`;
      this.packetProcessedEventBuilder?.addAction(action);
      sendImmediate.push(dbCopy);
    }
    sendImmediate.length &&
      router.originateIpPacket(
        address,
        IPProtocolNumber.ospf,
        new LSUpdatePacket(routerId, areaId, sendImmediate),
        interfaceId,
        [
          "The router received LSA(s) that were older than the one present in the router's database, so it sent the LSAs immediately.",
        ]
      );
    acknowledgements.length &&
      setTimeout(() => sendLSAckPacket(neighborId, acknowledgements));
  };
}
