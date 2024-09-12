/**
 * A summary of the last received DD packet to be stored in the neighbor table.
 *
 * The Options field included in the spec has been excluded (i.e. has not been simulated) here.
 */
export class DDPacketSummary {
  init: boolean;
  m: boolean;
  master: boolean;
  ddSeqNumber: number;

  //   Options field has been excluded.
  constructor({
    init,
    m,
    master,
    ddSeqNumber,
  }: {
    init: boolean;
    m: boolean;
    master: boolean;
    ddSeqNumber: number;
  }) {
    this.init = init;
    this.m = m;
    this.master = master;
    this.ddSeqNumber = ddSeqNumber;
  }
}
