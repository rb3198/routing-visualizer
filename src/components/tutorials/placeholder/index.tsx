import React from "react";
import styles from "./styles.module.css";
import { Link } from "react-router";
import { Emoji } from "src/constants/emojis";

export type PlaceHolderProps = {
  type: "404" | "coming_soon";
};

const disconnectedImgSrc = process.env.PUBLIC_URL + "/404.jpg";
const barrierImgSrc = process.env.PUBLIC_URL + "/barrier.png";
export const PlaceHolder: React.FC<PlaceHolderProps> = ({ type }) => {
  if (type === "404") {
    return (
      <div id={styles.not_found_container}>
        <div id={styles.disconnected_img_container}>
          <img
            src={disconnectedImgSrc}
            id={styles.disconnected_img}
            alt="disconnected"
          />
        </div>
        <div id={styles.not_found_detail}>
          <h1>404</h1>
          <p id={styles.not_found_title}>Page Not Found</p>
          <p id={styles.not_found_subtitle}>
            You've probably wandered here by mistake.
          </p>
          <div id={styles.links_container}>
            <Link to={"/"} className={styles.link}>
              Go Home
            </Link>
            <Link to={"/tutorials"} className={styles.link}>
              Go To Network Tutorials
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div id={styles.coming_soon_container}>
      <img src={barrierImgSrc} alt="barrier" id={styles.barrier} />
      <h1>Coming Soon...</h1>
      <p>This page will be added soon. Stay Tuned {Emoji.Smiling}</p>
    </div>
  );
};
