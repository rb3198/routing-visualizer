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
  MaxAge,
  MaxSequenceNumber,
  MinLSArrival,
} from "src/entities/ospf/lsa/constants";
import { RouterLSA } from "src/entities/ospf/lsa/router_lsa";
import { NeighborSMEvent } from "src/entities/ospf/enum/state_machine_events";
import { IPProtocolNumber } from "src/entities/ip/enum/ip_protocol_number";
import { Colors } from "src/constants/theme";

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
    const { neighborTable, lsDb } = this.ospfInterface;
    const dbCopy = lsDb.getLsa(areaId, header);
    const anyNeighborSynchronizing = Object.values(neighborTable).some(
      (neighbor) =>
        neighbor.state === State.Exchange || neighbor.state === State.Loading
    );
    return !dbCopy && lsAge === MaxAge && !anyNeighborSynchronizing;
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
    if (!dbCopy) {
      return false;
    }
    const { router, lsDb } = this.ospfInterface;
    const { id: routerId } = router;
    const { header: dbLsaHeader } = dbCopy;
    const { header: receivedHeader } = receivedLsa;
    const { lsSeqNumber, lsType } = receivedHeader;
    const { advertisingRouter: receivedLsaAdvRouterId } = receivedHeader;
    if (!receivedLsaAdvRouterId.equals(routerId)) {
      return false; // the received LSA is not originated by the router.
    }
    if (dbLsaHeader.compareAge(receivedHeader) < 0) {
      return false; // the DB LSA is younger than the received LSA.
    }
    // TODO: (Post routing table construction)
    // If LSA is a summary LSA and router's routing table does not have a route to that destination, FLUSH the LSA
    // Else the following code:
    switch (lsType) {
      case LSType.RouterLSA:
        const newLsa = new RouterLSA(router, areaId, lsSeqNumber + 1);
        lsDb.setLsDb(areaId, newLsa, true);
        break;
      default:
        throw new Error(
          "Not Implemented handling Special Action for types other than Router LSA."
        );
    }
    return true;
  };

  private removeOldLsaFromRetransmissionLists = (oldCopy: LSA) => {
    const { neighborTable, setNeighbor } = this.ospfInterface;
    Object.values(neighborTable).forEach((neighbor) => {
      const { linkStateRetransmissionList, routerId: neighborId } = neighbor;
      const newRetransmissionList = linkStateRetransmissionList.filter(
        (lsa) => !lsa.equals(oldCopy)
      );
      setNeighbor(
        {
          ...neighbor,
          linkStateRetransmissionList: newRetransmissionList,
        },
        `Removed the stale LSA copy from neighbor ${neighborId}'s Link State Retransmission List.`
      );
    });
  };

  handle = (
    interfaceId: string,
    ipPacket: IPPacket,
    packet: LSUpdatePacket
  ) => {
    if (!this.validPacket(ipPacket, packet)) {
      return;
    }
    const { lsDb, neighborTable, router } = this.ospfInterface;
    const { ipInterfaces, id: routerId } = router;
    /**
     * List of Acknowledgements to be sent back to the neighbor.
     */
    const acknowledgements: LSAHeader[] = [];
    const { header, body } = packet;
    const { areaId, routerId: neighborId } = header;
    const { lsaList } = body;
    for (const lsa of lsaList) {
      const { header } = lsa;
      if (this.shouldAcknowledgeAndDiscardLsa(areaId, lsa)) {
        acknowledgements.push(header);
        continue;
      }
      const dbCopy = lsDb.getLsa(areaId, header);
      const { header: dbCopyHeader, updatedOn: dbUpdatedOn } = dbCopy || {};
      const { lsAge: dbCopyAge, lsSeqNumber: dbLsSeqNumber } = dbCopyHeader;
      if (!dbCopy || dbCopyHeader.compareAge(header) > 0) {
        // Either there is no copy of the LSA in the DB, or the existing copy is older.
        if (this.specialActionTaken(areaId, lsa, dbCopy)) {
          continue;
        }
        if (dbCopy && Date.now() - dbUpdatedOn < MinLSArrival) {
          // Discarding the LSA without acknowledging it.
          continue;
        }
        // Install the LSA and flood it.
        lsa.updatedOn = Date.now();
        this.removeOldLsaFromRetransmissionLists(dbCopy);
        lsDb.setLsDb(areaId, lsa, true);
        acknowledgements.push(header); //TODO: Conditionally, based on 13.5
        continue;
      }
      const neighbor = neighborTable[neighborId.toString()];
      const { linkStateRequestList, linkStateRetransmissionList, address } =
        neighbor;
      if (linkStateRequestList.some((lsaHeader) => lsaHeader.equals(lsa))) {
        // an error has occurred in the Database Exchange process.
        this.ospfInterface.neighborStateMachine(
          neighborId.toString(),
          NeighborSMEvent.BadLSReq
        );
        return; // The whole function stops, since a neighbor state error has occurred.
      }
      if (dbCopy.equals(lsa)) {
        // Received LSA is the same instance as the database copy.
        if (
          linkStateRetransmissionList.some((neighborLsa) =>
            neighborLsa.equals(lsa)
          )
        ) {
          // Implied Acknowledgement.
          const newRetransmissionList = linkStateRetransmissionList.filter(
            (neighborLsa) => !neighborLsa.equals(lsa)
          );
          this.ospfInterface.setNeighbor(
            {
              ...neighbor,
              linkStateRetransmissionList: newRetransmissionList,
            },
            `Retransmission list of neighbor ${neighborId} truncated, since it sent an LSA packet which was to be sent to it.`
          );
          // No ACK to be sent back to the neighbor.
          continue;
        }
        acknowledgements.push(header);
        continue;
      }
      // The DB copy is more recent.
      // Do not ACK the LSU sent by the neighbor.
      if (dbCopyAge === MaxAge && dbLsSeqNumber === MaxSequenceNumber) {
        continue; // Simply discard the LSA, its LS Sequence number is warping.
      }
      // Immediately send the LSU containing the more recent copy
      const { ipInterface } = ipInterfaces.get(interfaceId) || {};
      ipInterface?.sendMessage(
        router,
        address,
        IPProtocolNumber.ospf,
        new LSUpdatePacket(routerId, areaId, [dbCopy]),
        Colors.lsUpdate
      );
    }
  };
}
