import React from "react";
import { italicBold, underlineBold } from "../../common";
import commonStyles from "../../common_styles.module.css";

export const NetworkOfAs: React.FC = () => {
  return (
    <div>
      <ul>
        <li>Gain knowledge on {italicBold("Autonomous Systems")}</li>
        <li>
          Understand that the Internet is a{" "}
          {italicBold("network of Autonomous Systems")}
        </li>
      </ul>
      <h4 className={commonStyles.sub_heading}>The Role of ISPs</h4>
      <p>
        In a courier network, the onus of building the network is on the courier
        service provider. Likewise,{" "}
        <b>
          The onus of connecting your device to the internet lies with your
          <i>I</i>nternet <i>S</i>ervice <i>P</i>rovider, or <i>ISP</i>.
        </b>
      </p>
      <ul className={commonStyles.list}>
        <li>
          When you subscribe to your ISP, it connects your device to its own
          network.
        </li>
        <li>
          Everyone subscribed to your ISP becomes a part of the ISP's network.
        </li>
      </ul>
      The internet is thus composed of networks formed by these ISPs. These
      networks connect to each other, some ISPs manage only the edge Unlike the
      courier network we built, the internet is highly decentralized.{" "}
      {italicBold(
        "It is basically a network of networks formed by different ISPs"
      )}
      .<br />
      Hence, each of the networks Therefore The{" "}
      {underlineBold("Distribution Layer")} is concerned with the intermediary
      role of{" "}
    </div>
  );
};
