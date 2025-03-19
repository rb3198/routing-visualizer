import React from "react";
import commonStyles from "../../common_styles.module.css";
import styles from "./styles.module.css";
import { MdOutlineArrowRightAlt } from "react-icons/md";
import { Colors } from "src/constants/theme";
import { italicBold, underlineBold } from "../../common";

export const CourierLocal: React.FC = () => {
  const drawOnCanvas = (e: HTMLCanvasElement | null) => {
    if (!e) {
      return;
    }
    e.width = 250;
    e.height = 250;
    const ctx = e.getContext("2d");
    if (!ctx) {
      return;
    }
    const gridSize = 50;

    // Define points
    const source = { x: 0.2, y: 0.2 };
    const destination = { x: 4.5, y: 4.5 };

    // Convert grid points to pixel coordinates
    const toPixel = (point: { x: number; y: number }) => {
      return { x: point.x * gridSize, y: point.y * gridSize };
    };

    const srcPixel = toPixel(source);
    const destPixel = toPixel(destination);

    // Draw suboptimal route (S-shaped path in gray)
    ctx.strokeStyle = "#aaaaaa77";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(srcPixel.x, srcPixel.y);
    ctx.lineTo(srcPixel.x, srcPixel.y + gridSize * 2);
    ctx.lineTo(srcPixel.x + gridSize * 3, srcPixel.y + gridSize * 2);
    ctx.lineTo(srcPixel.x + gridSize * 3, gridSize * 4.5);
    ctx.lineTo(destPixel.x, destPixel.y);
    ctx.stroke();

    // Draw optimal route (straight line in blue)
    ctx.strokeStyle = Colors.accent;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(srcPixel.x, srcPixel.y);
    ctx.lineTo(destPixel.x, destPixel.y);
    ctx.stroke();

    // Draw source point (gray circle)
    ctx.fillStyle = Colors.accent;
    ctx.beginPath();
    ctx.arc(srcPixel.x, srcPixel.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Draw destination point (blue circle)
    ctx.fillStyle = Colors.accent;
    ctx.beginPath();
    ctx.arc(destPixel.x, destPixel.y, 10, 0, Math.PI * 2);
    ctx.fill();
  };

  const renderCanvas = () => {
    return (
      <div id={styles.canvas_outer_container}>
        <div id={styles.canvas_container}>
          <canvas ref={drawOnCanvas} id={styles.canvas}></canvas>
          <div id={styles.legend}>
            <div>
              <div style={{ backgroundColor: Colors.accent }} />
              Optimal Route
            </div>
            <div>
              <div style={{ backgroundColor: Colors.grid }} />
              Suboptimal Route
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTransformation = () => {
    return (
      <div id={styles.transformation}>
        <div className={styles.packet}>
          <div className={styles.packet_component}>Message</div>
        </div>
        <MdOutlineArrowRightAlt className={styles.arrow_right} />
        <div className={styles.packet}>
          <div className={styles.packet_component}>Source (Sent By)</div>
          <div className={styles.packet_component}>Destination</div>
          <div className={styles.packet_component}>Type of Service</div>
          <div className={styles.packet_component}>Message</div>
          <div className={styles.packet_component}>Signature of Recipient</div>
        </div>
      </div>
    );
  };
  return (
    <div>
      <p>
        Welcome to your journey of exploring the internet!
        <br /> This may sound counterintuitive, but to understand how the
        internet is built up, we'll start by building a{" "}
        <b>local courier service</b>.<br />
        Don't worry about its relevance just yet. We'll soon draw parallels
        between the services offered by a computer network and a courier
        service. (Spoiler Alert: They're very similar).
      </p>
      <h3 className={commonStyles.heading}>Building a Local Courier Service</h3>
      <p>
        Our first exercise is to build a courier service. For this, we'll gather
        its basic objectives and then design our operations around these
        objectives. We'll then gradually build this service from a local one to
        a national one, and see how the internet is built using the same
        philosophy!
      </p>
      <h4 className={commonStyles.sub_heading}>Basic Objectives</h4>
      <ol className={`${commonStyles.list} ${commonStyles.bold_ol}`}>
        <li>
          The {underlineBold("primary task")} of a courier service is to deliver
          messages / shipments from a source address to a destination.
        </li>
        <li>
          Like any other business, its{" "}
          {underlineBold("primary business objective")} is to{" "}
          {italicBold("maximize its profit.")}
        </li>
        <li>
          Its primary service of delivery must be {underlineBold("secure")}.{" "}
        </li>
      </ol>
      <h4 className={commonStyles.sub_heading}>Designing the Operations</h4>
      <ul className={commonStyles.list}>
        <li>
          To {underlineBold("deliver shipments")}, the service establishes a{" "}
          {underlineBold("protocol")}:<br />
          <MdOutlineArrowRightAlt /> For every shipment it receives, it attaches
          a {italicBold("source")} and {italicBold("destination")} address on
          top of the shipment. <br />
          <MdOutlineArrowRightAlt /> A {italicBold("Type of Service")}{" "}
          <i>(High Priority Express Mail / Normal Priority / etc.)</i> is
          attached with the delivery. <br />
          <MdOutlineArrowRightAlt /> {italicBold("Signatures")} of recipients
          are added as proof of delivery.
          {renderTransformation()}
          <MdOutlineArrowRightAlt /> A{" "}
          {italicBold("failure handling mechanism")} is put in place for lost
          shipments.
          <br />
          <b>Establishing a protocol has the following advantages:</b>
          <ul>
            <li>
              Ensures that every shipment follows{" "}
              {italicBold("standardized rules")}, which can be used by workers
              to do their job efficiently.
            </li>
            <li>
              Enables parcels to be quickly sorted into correct delivery routes,
              improving operational efficiency and reducing errors.
            </li>
            <li>Helps simplify return management.</li>
          </ul>
        </li>
        <li>
          To {italicBold("maximize its profit")}, the service prioritizes
          delivery through the {underlineBold("most optimal routes")} between
          addresses.
          <br />
          <MdOutlineArrowRightAlt /> This helps save both time and cost of the
          delivery.
        </li>
        <li>
          The optimal route might change based on the traffic, weather, etc.
          This means that the optimal route is{" "}
          {italicBold("dynamically chosen")}.
        </li>
        {renderCanvas()}
      </ul>
    </div>
  );
};
