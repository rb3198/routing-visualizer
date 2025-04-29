import React, {
  ChangeEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./styles.module.css";
import { CgClose } from "react-icons/cg";
import { IoWarning } from "react-icons/io5";
import { MdError, MdSource } from "react-icons/md";
import { ConfigFile } from "src/entities/config";

type ConfigLoaderProps = {
  active?: boolean;
  showWarning?: boolean;
  onClose: () => any;
  loadConfig: (config: ConfigFile) => any;
};

export const ConfigLoader: React.FC<ConfigLoaderProps> = (props) => {
  //#region States & Props
  const { active, showWarning, onClose, loadConfig } = props;
  const [screen, setScreen] = useState<"selector" | "presets">("selector");
  const [error, setError] = useState("");
  const fileRef = useRef<File>();

  //#endregion

  //#region Callbacks
  const closeLoader = useCallback(() => {
    setError("");
    fileRef.current = undefined;
    setScreen("selector");
    onClose();
  }, [onClose]);

  const validateFile = useCallback((file: File) => {
    const { name } = file;
    if (!name.endsWith("json")) {
      setError("Invalid File Format. Config files are JSON based.");
      return false;
    }
    // TODO: Add JSON-schema based validation
    setError("");
    return true;
  }, []);

  const chooseFile: ChangeEventHandler<HTMLInputElement> = useCallback(
    async (evt) => {
      const { files } = evt.target;
      if (!files || !files.length) {
        return;
      }
      const file = files[0];
      fileRef.current = file;
      if (!validateFile(file)) {
        evt.target.value = "";
        return;
      }
      evt.target.value = "";
      const jsonString = await file.text();
      const config = JSON.parse(jsonString) as ConfigFile;
      loadConfig(config);
      closeLoader();
    },
    [validateFile, loadConfig, closeLoader]
  );
  //#endregion

  //#region Sub-components
  const SelectorScreen = useMemo(() => {
    return (
      <>
        <div className={styles.option}>
          Choose a Config File
          <input
            type="file"
            onChange={chooseFile}
            id={styles.file_input}
            accept=".json"
          />
        </div>
        <div className={styles.option}>Choose from a Preset</div>
      </>
    );
  }, [chooseFile]);

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

  const Error = useMemo(() => {
    return (
      <div id={styles.error} data-visible={!!error}>
        <MdError /> {error}
      </div>
    );
  }, [error]);

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
          <CgClose onClick={closeLoader} id={styles.close} />
        </div>
        {Warning}
        {Component}
        {Error}
      </div>
    );
  }, [screen, PresetsScreen, SelectorScreen, Warning, Error, closeLoader]);
  //#endregion

  if (!active) {
    return null;
  }
  return (
    <div id={styles.container}>
      <div id={styles.backdrop} onClick={closeLoader} />
      {Content}
    </div>
  );
};
