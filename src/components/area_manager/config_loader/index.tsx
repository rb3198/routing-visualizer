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
import { ConfigPreset } from "src/types/preset";
import { italicBoldString } from "src/components/welcome_tutorial/screens/common";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { BiChevronLeft } from "react-icons/bi";
import { IoMdCheckmark } from "react-icons/io";
import { Emoji } from "src/constants/emojis";

const ajv = new Ajv();

type ConfigLoaderProps = {
  active?: boolean;
  showWarning?: boolean;
  onClose: () => any;
  loadConfig: (config: ConfigFile) => any;
};

const presets: ConfigPreset[] = [
  {
    title: "Two Router Network",
    desc: "A simple network with a single area containing two routers.",
    filePath:
      process.env.PUBLIC_URL + "sim_configs/two-router_single.config.json",
    imgSrc: process.env.PUBLIC_URL + "sim_configs/images/two-router_single.png",
    greatFor: [],
    thingsToExpect: [],
    thingsToTry: [],
  },
  {
    title: "Triangle Network",
    desc: "Three routers fully connected in a triangle within a single area.",
    filePath:
      process.env.PUBLIC_URL + "sim_configs/triangle-intra_single.config.json",
    imgSrc: process.env.PUBLIC_URL + "sim_configs/images/triangle_single.png",
    greatFor: [],
    thingsToExpect: [],
    thingsToTry: [],
  },
  {
    title: "Star Network (Single Area)",
    desc: "A single network in which a central router is connected to 4 other routers which don't connect to each other.",
    filePath:
      process.env.PUBLIC_URL + "sim_configs/star-intra_single.config.json",
    imgSrc: process.env.PUBLIC_URL + "sim_configs/images/star-intra_single.png",
    greatFor: [],
    thingsToExpect: [
      "When the hub goes down, the entire network gets disbanded and doesn't work.",
    ],
    thingsToTry: [],
  },
  {
    title: "Star Network (Multiple Areas)",
    desc: `
    A network of multiple areas, in which each area contains a star network with a single point of failure.
    <ul>
      <li>The hub of each area acts as the <i>Area Border Router</i>.</li>
      <li>The central area (Backbone Area 0) contains multiple Area Border Routers, each connected to a single network.</li>
    </ul>
    `,
    filePath:
      process.env.PUBLIC_URL +
      "sim_configs/star-intra_single-star-inter_multiple.config.json",
    imgSrc:
      process.env.PUBLIC_URL +
      "sim_configs/images/star-intra_single-star-inter_multiple.png",
    greatFor: [],
    thingsToExpect: [
      "When the hub of an area goes down, the entire area collapses.",
      "When the Area Border Routers of the backbone network go down, the area that they connect to becomes unreachable to all other areas.",
    ],
    thingsToTry: [],
  },
  {
    title: "Mesh Areas, Single Connections",
    desc: `Each router in an area is connected to every other router in the area.
    Inter-area connections are <b>single-link</b> though, with there being only a single
    ${italicBoldString("Area Border Router")} per area.`,
    filePath:
      process.env.PUBLIC_URL +
      "sim_configs/mesh-intra_single-star-inter_multiple.config.json",
    imgSrc:
      process.env.PUBLIC_URL +
      "sim_configs/images/mesh-intra_single-star-inter_multiple.png",
    greatFor: [],
    thingsToExpect: [
      `Failure of a single router inside an area does ${italicBoldString(
        "not"
      )} result in the entire area collapsing.`,
      `However, failure of an Area Border Router isolates the area from other areas
      and disables inter-area communication from that area.`,
    ],
    thingsToTry: [],
  },
  {
    title: "Mesh Areas, Multiple Connections",
    desc: `Each router in an area is connected to every other router in the area.
    Inter-area connections are also <b>multi-link</b>,
    with there being multiple ${italicBoldString(
      "Area Border Router"
    )}s per area.`,
    filePath:
      process.env.PUBLIC_URL +
      "sim_configs/mesh-intra_multi-star-inter_multiple.config.json",
    imgSrc:
      process.env.PUBLIC_URL +
      "sim_configs/images/mesh-intra_multi-star-inter_multiple.png",
    thingsToExpect: [
      `Failure of a single router inside an area does ${italicBoldString(
        "not"
      )} result in the entire area collapsing.`,
      `Failure of a single Area Border Router does not disrupt the inter-area communications from that area`,
      `Other ABRs pick up the routing responsibilities in case of failure of an ABR.`,
      `Inter-area communication goes on till every Area Border Router in the area goes down.`,
    ],
    greatFor: [],
    thingsToTry: [],
  },
];
export const ConfigLoader: React.FC<ConfigLoaderProps> = (props) => {
  //#region States & Props
  const { active, showWarning, onClose, loadConfig } = props;
  const [screen, setScreen] = useState<
    "selector" | "presets" | "preset_detail"
  >("selector");
  const [error, setError] = useState("");
  const [activePreset, setActivePreset] = useState<ConfigPreset | null>(null);
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

  const goToPresetSelection = useCallback(() => {
    setActivePreset(null);
    setScreen("presets");
  }, []);

  const loadFile = useCallback(
    async (filePath: string) => {
      const data = await fetch(filePath);
      const config = await data.json();
      loadConfig(config);
      closeLoader();
    },
    [loadConfig, closeLoader]
  );
  //#endregion

  //#region Sub-components

  const PresetsScreen = useMemo(() => {
    return (
      <>
        {presets.map((preset) => {
          const { title, filePath } = preset;
          const onClick = () => {
            loadFile(filePath);
          };
          const openPresetDesc = () => {
            setScreen("preset_detail");
            setActivePreset(preset);
          };
          return (
            <div className={styles.preset_option_container} key={title}>
              <div
                className={styles.option}
                data-preset="true"
                onClick={onClick}
              >
                {title}
              </div>
              <AiOutlineQuestionCircle
                className={styles.question}
                title="View Description"
                onClick={openPresetDesc}
              />
            </div>
          );
        })}
      </>
    );
  }, [loadFile]);

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
    if (!error) {
      return null;
    }
    return (
      <div id={styles.error}>
        <MdError /> <div dangerouslySetInnerHTML={{ __html: error }} />
      </div>
    );
  }, [error]);

  const SelectorScreen = useMemo(() => {
    const onPresetClick = () => setScreen("presets");
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
        <div className={styles.option} onClick={onPresetClick}>
          Choose from a Preset
        </div>
        {Error}
      </>
    );
  }, [Error, chooseFile]);

  const Content = useMemo(() => {
    let Component = SelectorScreen;
    let title = "Choose a Source";
    if (screen === "presets") {
      Component = PresetsScreen;
      title = "Choose Preset";
    }
    if (screen === "preset_detail" && activePreset) {
      Component = (
        <PresetDescription
          preset={activePreset}
          onBack={goToPresetSelection}
          loadFile={loadFile}
        />
      );
      title = activePreset.title;
    }
    return (
      <div id={styles.content} data-screen={screen}>
        <div id={styles.header}>
          <h2>
            {screen !== "preset_detail" && <MdSource />}
            {title}
          </h2>
          <CgClose onClick={closeLoader} id={styles.close} />
        </div>
        {Warning}
        {Component}
      </div>
    );
  }, [
    screen,
    activePreset,
    PresetsScreen,
    SelectorScreen,
    Warning,
    closeLoader,
    goToPresetSelection,
    loadFile,
  ]);
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

type PresetDescriptionProps = {
  preset: ConfigPreset;
  onBack: () => unknown;
  loadFile: (filePath: string) => unknown;
};

const PresetDescription: React.FC<PresetDescriptionProps> = ({
  preset,
  onBack,
  loadFile,
}) => {
  const {
    title,
    filePath,
    desc,
    thingsToExpect,
    imgSrc,
    greatFor,
    thingsToTry,
  } = preset;
  const onSelect = () => {
    loadFile(filePath);
  };
  const imgAlt = `Example ${title} Network`;
  return (
    <div id={styles.preset_desc_container}>
      <section className={styles.preset_desc_section}>
        <div dangerouslySetInnerHTML={{ __html: desc }} />
        <div id={styles.preset_desc_img}>
          <img src={imgSrc} alt={imgAlt} title={imgAlt} />
          <p>{imgAlt}</p>
        </div>
      </section>
      <section className={styles.preset_desc_section}>
        <h3 className={styles.detail_heading}>
          {Emoji.Bullseye} Expected Behavior
        </h3>
        <ol>
          {thingsToExpect.map((ex) => (
            <li key={ex} dangerouslySetInnerHTML={{ __html: ex }} />
          ))}
        </ol>
      </section>
      <section className={styles.preset_desc_section}>
        <h3 className={styles.detail_heading}>{Emoji.Electricity} Great For</h3>
        <ol>
          {greatFor.map((ex) => (
            <li key={ex} dangerouslySetInnerHTML={{ __html: ex }} />
          ))}
        </ol>
      </section>
      <section className={styles.preset_desc_section}>
        <h3 className={styles.detail_heading}>{Emoji.Wrench} Things To Try</h3>
        <ol>
          {thingsToTry.map((ex) => (
            <li key={ex} dangerouslySetInnerHTML={{ __html: ex }} />
          ))}
        </ol>
      </section>
      <div id={styles.preset_desc_button_container}>
        <button onClick={onBack} className={styles.nav_button}>
          <BiChevronLeft />
          Go Back
        </button>
        <button onClick={onSelect} className={styles.nav_button}>
          <IoMdCheckmark />
          Select This Preset
        </button>
      </div>
    </div>
  );
};
