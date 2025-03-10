import { GridManager } from "./components/grid_manager";
import { Header } from "./components/header";
import { NotificationTooltip } from "./components/notification_tooltip";
import { Provider } from "react-redux";
import { store } from "./store";
import { EventLog } from "./components/event_log";
import { ModalManager as EventModalManager } from "./components/modals/manager";
import styles from "./App.module.css";
import { Footer } from "./components/footer";
import WelcomeTutorial from "./components/welcome_tutorial";
import { WELCOME_LAST_SCREEN_KEY } from "./constants/storage";
import {
  TutorialScreen,
  TutorialScreenCache,
} from "./types/welcome_tutorial/screen";
import { useCallback, useState } from "react";

const readTutScreenFromStorage = (): TutorialScreenCache => {
  const cache = localStorage.getItem(WELCOME_LAST_SCREEN_KEY);
  if (!cache) {
    return {
      screen: TutorialScreen.Welcome,
      subScreenIdx: 0,
    };
  }
  return JSON.parse(cache) as TutorialScreenCache;
};

const writeTutScreenToStorage = (config: TutorialScreenCache) => {
  localStorage.setItem(WELCOME_LAST_SCREEN_KEY, JSON.stringify(config));
};

const initialScreenConfig = readTutScreenFromStorage();
const { screen: initScreen, subScreenIdx: initSubScreenIdx } =
  initialScreenConfig;

function App() {
  const [tutScreen, setTutScreen] = useState(initScreen);
  const [subScreenIdx, setSubScreenIdx] = useState(initSubScreenIdx);
  const [writeToStorage, setWriteToStorage] = useState(true);

  const setTutorialConfig = useCallback(
    (
      nextScreen: TutorialScreen,
      nextSubScreenIdx: number,
      writeToStorage?: boolean
    ) => {
      if (nextScreen !== tutScreen) {
        setTutScreen(nextScreen);
        setSubScreenIdx(0);
      } else {
        setSubScreenIdx(nextSubScreenIdx);
      }
      writeToStorage &&
        writeTutScreenToStorage({
          screen: nextScreen,
          subScreenIdx: nextSubScreenIdx,
        });
    },
    [tutScreen]
  );

  const openTutScreen = useCallback(
    (tutScreen: TutorialScreen, writeToStorage?: boolean) => {
      setTutScreen(tutScreen);
      setWriteToStorage(writeToStorage ?? false);
    },
    []
  );
  return (
    <div className={styles.App}>
      <WelcomeTutorial
        screen={tutScreen}
        subScreenIdx={subScreenIdx}
        setScreen={setTutorialConfig}
        writeToStorage={writeToStorage}
      />
      <Provider store={store}>
        <Header openTutorial={openTutScreen} />
        <div id="grid_container">
          <GridManager />
          <EventLog
            showControlPanel
            classes={styles.event_log}
            showExpandToggle
          />
          <NotificationTooltip />
          <EventModalManager />
        </div>
        <Footer />
      </Provider>
    </div>
  );
}

export default App;
