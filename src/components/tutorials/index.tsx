import React, { useEffect } from "react";
import styles from "./styles.module.css";
import {
  ScreenNameMap,
  SetScreenCallback,
  TutorialScreen,
} from "src/types/tutorials/screen";
import { screenMap } from "src/constants/tutorials";
import { Navigator } from "./navigator";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { useNavigate, useSearchParams } from "react-router";

type NetworkTutorialProps = {
  setScreen: SetScreenCallback;
};

const NetworkTutorial: React.FC<NetworkTutorialProps> = (props) => {
  const { setScreen } = props;
  const [searchParams, setSearchParams] = useSearchParams();
  const redirect = useNavigate();
  const screen: TutorialScreen = parseInt(
    searchParams.get("screen") ?? TutorialScreen.InternetIntro.toString()
  );
  const subScreenIdx: number = parseInt(
    searchParams.get("subScreenIdx") ?? "0"
  );

  let skipRender =
    screen <= TutorialScreen.Welcome ||
    screen >= TutorialScreen.VisualizerTutorial;
  skipRender ||= (() => {
    const { subScreens } = screenMap[screen];
    return !subScreens[subScreenIdx];
  })();

  useEffect(() => {
    skipRender && redirect("/");
  }, [skipRender, redirect]);
  if (skipRender) {
    return null;
  }
  const { title, subScreens } = screenMap[screen];

  const navigate = (screen: TutorialScreen, subScreenIdx: number) => {
    setScreen(screen, subScreenIdx);
    if (
      screen === TutorialScreen.Welcome ||
      screen >= TutorialScreen.VisualizerTutorial
    ) {
      redirect("/");
      return;
    }
    const params = new URLSearchParams();
    params.set("screen", screen.toString());
    params.set("subScreenIdx", subScreenIdx.toString());
    setSearchParams(params);
  };

  const getControlsConfig = () => {
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
      return nextSubScrTitle;
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
      prev: {
        title: getPrevTitle(),
        onClick: () => navigate(navPrev, navPrevSubScr),
      },
      next: {
        title: getNextTitle(),
        onClick: () => navigate(navNext, navNextSubScr),
      },
    };
  };

  const renderControls = () => {
    const { next, prev } = getControlsConfig();
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

  // TODO: Make an empty page
  return skipRender ? null : (
    <div id={styles.body}>
      <Navigator
        selectedScreen={screen}
        setSelectedScreen={navigate}
        selectedSubScreenIdx={subScreenIdx}
      />
      <div id={styles.sub_screen_container}>
        <h2 id={styles.title}>{getTitle()}</h2>
        {subScreens[subScreenIdx]?.screen}
        {renderControls()}
      </div>
    </div>
  );
};

export default NetworkTutorial;
