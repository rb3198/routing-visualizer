import { GridManager } from "./components/grid_manager";
import { Header } from "./components/header";
import { NotificationTooltip } from "./components/notification_tooltip";
import { Provider } from "react-redux";
import { store } from "./store";
import { EventLog } from "./components/event_log";
import { ModalManager as EventModalManager } from "./components/modals/manager";
import styles from "./App.module.css";
import { Footer } from "./components/footer";
import WelcomeTutorial from "./components/tutorials";
import { WELCOME_LAST_SCREEN_KEY } from "./constants/storage";
import { TutorialScreen, TutorialScreenCache } from "./types/tutorials/screen";
import { useCallback, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { AppRoutes } from "./constants/app_routes";

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
      setTutScreen(nextScreen);
      setSubScreenIdx(nextSubScreenIdx);
      writeToStorage &&
        writeTutScreenToStorage({
          screen: nextScreen,
          subScreenIdx: nextSubScreenIdx,
        });
    },
    []
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
      <Provider store={store}>
        <BrowserRouter>
          <Header openTutorial={openTutScreen} />
          <Routes>
            <Route
              path={AppRoutes.Index}
              element={
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
              }
            />
            <Route
              path={AppRoutes.Tutorials}
              element={
                <WelcomeTutorial
                  screen={tutScreen}
                  subScreenIdx={subScreenIdx}
                  setScreen={setTutorialConfig}
                  writeToStorage={writeToStorage}
                />
              }
            />
          </Routes>
        </BrowserRouter>
        <Footer />
      </Provider>
    </div>
  );
}

export default App;
