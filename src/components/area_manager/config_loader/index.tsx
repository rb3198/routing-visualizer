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
import { ConfigFile, ConfigFileJsonSchema } from "src/entities/config";
import Ajv from "ajv/dist/2020";

const ajv = new Ajv();

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

  const validateFile = useCallback(async (file: File) => {
    const { name } = file;
    if (!name.endsWith("json")) {
      setError("Invalid File Format. Config files are JSON based.");
      return false;
    }
    const validateConfig = ajv.compile(ConfigFileJsonSchema);
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      const valid = validateConfig(json);
      if (!valid) {
        const { errors } = validateConfig;
        let errorMessage = "Invalid config file provided.";
        if (errors) {
          errorMessage += "<ol>";
          errors.forEach(({ instancePath, message }) => {
            errorMessage += `<li><span>${instancePath}</span> ${message}</li>`;
          });
          errorMessage += "</ol>";
        }
        setError(errorMessage);
        return false;
      }
      setError("");
      return true;
    } catch (error) {
      setError("File contains invalid JSON.");
      return false;
    }
  }, []);

  const chooseFile: ChangeEventHandler<HTMLInputElement> = useCallback(
    async (evt) => {
      const { files } = evt.target;
      if (!files || !files.length) {
        return;
      }
      const file = files[0];
      fileRef.current = file;
      if (!(await validateFile(file))) {
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
        <MdError /> <div dangerouslySetInnerHTML={{ __html: error }} />
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
