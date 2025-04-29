import React, { useMemo, useState } from "react";
import styles from "./styles.module.css";
import { CgClose } from "react-icons/cg";
import { IoWarning } from "react-icons/io5";
import { MdSource } from "react-icons/md";

type ConfigLoaderProps = {
  active?: boolean;
  showWarning?: boolean;
  onClose: () => any;
};

export const ConfigLoader: React.FC<ConfigLoaderProps> = (props) => {
  //#region States & Props
  const { active, showWarning, onClose } = props;
  const [screen, setScreen] = useState<"selector" | "presets">("selector");
  const [error, setError] = useState("");

  //#endregion

  //#region Callbacks & memos
  const SelectorScreen = useMemo(() => {
    return (
      <>
        <div className={styles.option}>Choose a Config File</div>
        <div className={styles.option}>Choose from a Preset</div>
      </>
    );
  }, []);

  const PresetsScreen = useMemo(() => {
    return <></>;
  }, []);

  const Warning = useMemo(() => {
    return showWarning ? (
      <div id={styles.warning}>
        <div id={styles.warning_icon}>
          <IoWarning />
        </div>
        <p>
          <span>Existing grid configuration will be discarded.</span>
          <br />
          Please save the grid if you wish to use it in the future.
        </p>
      </div>
    ) : (
      <></>
    );
  }, [showWarning]);

  const Content = useMemo(() => {
    let Component = SelectorScreen;
    let title = "Choose a Source";
    if (screen === "presets") {
      Component = PresetsScreen;
      title = "Choose Preset";
    }
    return (
      <div id={styles.content}>
        <div id={styles.header}>
          <h2>
            <MdSource />
            {title}
          </h2>
          <CgClose onClick={onClose} id={styles.close} />
        </div>
        {Warning}
        {Component}
      </div>
    );
  }, [screen, PresetsScreen, SelectorScreen, Warning, onClose]);
  //#endregion

  if (!active) {
    return null;
  }
  return (
    <div id={styles.container}>
      <div id={styles.backdrop} onClick={onClose} />
      {Content}
    </div>
  );
};
