import { useState, useCallback, useEffect } from "react";
import { BiChevronDown } from "react-icons/bi";
import { screenMap } from "src/constants/tutorials";
import {
  SetScreenCallback,
  SubScreen,
  TutorialScreen,
} from "src/types/tutorials/screen";
import styles from "./styles.module.css";

interface NavigatorProps {
  selectedScreen: Omit<
    TutorialScreen,
    "Welcome" | "VisualizerTutorial" | "Complete"
  >;
  setSelectedScreen: SetScreenCallback;
  selectedSubScreenIdx: number;
  writeToStorage?: boolean;
}

export const Navigator: React.FC<NavigatorProps> = (props) => {
  const {
    selectedScreen,
    writeToStorage,
    selectedSubScreenIdx,
    setSelectedScreen,
  } = props;
  const [expandedScreen, setExpandedScreen] = useState<
    Omit<TutorialScreen, "Welcome"> | undefined
  >(selectedScreen);

  useEffect(() => {
    setExpandedScreen(selectedScreen);
  }, [selectedScreen]);

  const Header = (
    <div id={styles.navigator_header}>
      <h3>Contents</h3>
    </div>
  );

  const renderTopic = useCallback(
    (topic: TutorialScreen) => {
      const { title, subScreens } = screenMap[topic];
      const onClick = () =>
        setExpandedScreen((prev) => (prev === topic ? undefined : topic));
      return (
        <div key={topic} className={styles.nav_topic_container}>
          <div className={styles.nav_topic} onClick={onClick}>
            {title}
            <BiChevronDown
              data-expanded={expandedScreen === topic}
              className={styles.nav_topic_status}
            />
          </div>
          <SubScreenList
            expanded={topic === expandedScreen}
            screen={topic}
            selectedScreen={selectedScreen}
            setSelectedScreen={setSelectedScreen}
            subScreens={subScreens}
            selectedSubScreenIdx={selectedSubScreenIdx}
            writeToStorage={writeToStorage}
          />
        </div>
      );
    },
    [
      expandedScreen,
      selectedScreen,
      writeToStorage,
      selectedSubScreenIdx,
      setSelectedScreen,
    ]
  );

  return (
    <nav id={styles.navigator}>
      {Header}
      <div id={styles.topic_container}>
        {Object.keys(TutorialScreen)
          .filter(
            (screen) =>
              !isNaN(parseInt(screen)) &&
              parseInt(screen) &&
              (parseInt(screen) as TutorialScreen) <
                TutorialScreen.VisualizerTutorial
          )
          .map((screen) => renderTopic(parseInt(screen) as TutorialScreen))}
      </div>
    </nav>
  );
};

interface SubScreenListProps {
  subScreens: SubScreen[];
  screen: TutorialScreen;
  selectedScreen: Omit<TutorialScreen, "Welcome">;
  selectedSubScreenIdx: number;
  expanded?: boolean;
  writeToStorage?: boolean;
  setSelectedScreen: SetScreenCallback;
}

const SubScreenList: React.FC<SubScreenListProps> = ({
  expanded,
  screen,
  selectedScreen,
  selectedSubScreenIdx,
  subScreens,
  writeToStorage,
  setSelectedScreen,
}) => {
  const [maxHeight, setMaxHeight] = useState(0);

  const refCallback = useCallback((e: HTMLDivElement | null) => {
    setMaxHeight(e?.getBoundingClientRect().height ?? 0);
  }, []);
  return (
    <div
      className={styles.nav_sub_screen_container}
      data-expanded={expanded}
      style={{ maxHeight: expanded ? maxHeight : 0 }}
    >
      <div ref={refCallback}>
        {subScreens.map(({ title }, idx) => (
          <SubScreenComponent
            key={title}
            title={title}
            idx={idx}
            screen={screen}
            selected={selectedScreen === screen && selectedSubScreenIdx === idx}
            setSelectedScreen={setSelectedScreen}
            writeToStorage={writeToStorage}
          />
        ))}
      </div>
    </div>
  );
};

interface SubScreenComponentProps {
  title: string;
  screen: TutorialScreen;
  idx: number;
  selected?: boolean;
  writeToStorage?: boolean;
  setSelectedScreen: SetScreenCallback;
}

const SubScreenComponent: React.FC<SubScreenComponentProps> = (props) => {
  const { title, selected, idx, screen, writeToStorage, setSelectedScreen } =
    props;

  const onClick = useCallback(() => {
    setSelectedScreen(screen, idx, writeToStorage);
  }, [idx, screen, writeToStorage, setSelectedScreen]);
  return (
    <div
      className={styles.sub_screen_title}
      data-selected={selected}
      onClick={onClick}
    >
      {title}
    </div>
  );
};
