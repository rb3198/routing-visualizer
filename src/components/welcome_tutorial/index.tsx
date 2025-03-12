import React, { useCallback, useState } from "react";
import styles from "./styles.module.css";
import { Modal } from "../modals";
import {
  ScreenNameMap,
  SetScreenCallback,
  TutorialScreen,
} from "src/types/welcome_tutorial/screen";
import { screenMap } from "src/constants/welcome_tutorial";
import { WelcomeScreen } from "./welcome_screens";
import { Navigator } from "./navigator";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";

type WelcomeScreenProps = {
  screen: TutorialScreen;
  subScreenIdx: number;
  writeToStorage?: boolean;
  setScreen: SetScreenCallback;
};

const WelcomeTutorial: React.FC<WelcomeScreenProps> = (props) => {
  const { screen, subScreenIdx, writeToStorage, setScreen } = props;
  const [navExpanded, setNavExpanded] = useState(true);

  const { title, subScreens } = screenMap[screen];

  const onModalClose = useCallback(() => {
    setScreen(TutorialScreen.Complete, 0, writeToStorage);
  }, [writeToStorage, setScreen]);

  const visible = screen !== TutorialScreen.Complete;

  const getControlsConfig = useCallback(() => {
    if (screen === TutorialScreen.Welcome) {
      return { visible: false, next: null, prev: null };
    }
    const nextScreen = (screen + 1) as TutorialScreen;
    const prevScreen = (screen - 1) as TutorialScreen;
    const { subScreens: prevSubScreens } = screenMap[prevScreen];
    const { title: nextSubScrTitle } = subScreens[subScreenIdx + 1] ?? {};
    const getNextTitle = () => {
      if (subScreenIdx === subScreens.length - 1) {
        return `Proceed to ${
          nextScreen === TutorialScreen.Complete
            ? "the Visualizer!"
            : ScreenNameMap[nextScreen]
        }`;
      }
      return `Proceed to ${nextSubScrTitle}`;
    };
    const getPrevTitle = () => {
      if (subScreenIdx === 0) {
        return `Back to ${ScreenNameMap[prevScreen]}`;
      }
      return `Back to ${subScreens[subScreenIdx - 1].title}`;
    };
    const navPrev = (
      subScreenIdx === 0 ? screen - 1 : screen
    ) as TutorialScreen;
    const navPrevSubScr =
      navPrev < screen ? prevSubScreens.length - 1 : subScreenIdx - 1;
    const navNext = (
      subScreenIdx === subScreens.length - 1 ? screen + 1 : screen
    ) as TutorialScreen;
    const navNextSubScr = navNext > screen ? 0 : subScreenIdx + 1;
    return {
      visible: true,
      prev: {
        title: getPrevTitle(),
        onClick: () => setScreen(navPrev, navPrevSubScr, writeToStorage),
      },
      next: {
        title: getNextTitle(),
        onClick: () => setScreen(navNext, navNextSubScr, writeToStorage),
      },
    };
  }, [screen, subScreens, subScreenIdx, writeToStorage, setScreen]);

  const renderControls = () => {
    const { visible, next, prev } = getControlsConfig();
    if (!visible) {
      return null;
    }
    const { title: prevTitle, onClick: prevOnClick } = prev || {};
    const { title: nextTitle, onClick: nextOnClick } = next || {};
    return (
      <div id={styles.controls_container}>
        <button onClick={prevOnClick} className={styles.control}>
          <BiChevronLeft />
          {prevTitle}
        </button>
        <button onClick={nextOnClick} className={styles.control}>
          {nextTitle}
          <BiChevronRight />
        </button>
      </div>
    );
  };

  const getTitle = () => {
    const subScreenTitle = subScreens[subScreenIdx]?.title;
    if (subScreenTitle) {
      return `${title} - ${subScreenTitle}`;
    }
    return title;
  };
  return (
    <Modal
      title={getTitle()}
      close={onModalClose}
      visible={visible}
      classes={styles.modal}
    >
      {screen === TutorialScreen.Welcome ? (
        <WelcomeScreen setScreen={setScreen} writeToStorage={writeToStorage} />
      ) : (
        <div id={styles.body}>
          <Navigator
            selectedScreen={screen}
            setSelectedScreen={setScreen}
            expanded={navExpanded}
            setExpanded={setNavExpanded}
            selectedSubScreenIdx={subScreenIdx}
            writeToStorage={writeToStorage}
          />
          <div id={styles.sub_screen_container}>
            {subScreens[subScreenIdx]?.screen}
            {renderControls()}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default WelcomeTutorial;
