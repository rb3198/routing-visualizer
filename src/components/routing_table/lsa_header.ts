import { LSAHeader } from "src/entities/ospf/lsa";
import styles from "./lsa_header_styles.module.css";
import { IPv4Address } from "src/entities/ip/ipv4_address";

export const renderLSAHeader = (header: LSAHeader) => {
  const { advertisingRouter, linkStateId, lsSeqNumber } = header;
  const cols = [
    {
      label: "Advertising Router",
      value: new IPv4Address(...advertisingRouter.bytes),
    },
    {
      label: "Link State ID",
      value: new IPv4Address(...linkStateId.bytes),
    },
    {
      label: "LS Seq. Number",
      value: lsSeqNumber,
    },
  ];
  return `
  <div class=${styles.lsa_header}>
    ${cols
      .map(
        ({ label, value }) => `
      <div>
        <p class=${styles.lsa_header_label}>${label}</p>
        <p class=${styles.lsa_header_value}>${value}</p>
      </div>
    `
      )
      .join("")}
  </div>
  `;
};
