import { GridManager } from "./components/grid_manager";
import { Header } from "./components/header";
import { NotificationTooltip } from "./components/notification_tooltip";
import { Provider } from "react-redux";
import { store } from "./store";
import { EventLog } from "./components/event_log";
import { ModalManager as EventModalManager } from "./components/modals/manager";
import styles from "./App.module.css";
import { Footer } from "./components/footer";
import NetworkTutorial from "./components/tutorials";
import { LAST_TUTORIAL_KEY } from "./constants/storage";
import { TutorialScreen, TutorialScreenCache } from "./types/tutorials/screen";
import { useCallback, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { AppRoutes } from "./constants/app_routes";
import { WelcomeScreen } from "./components/tutorials/screens/welcome";
import { SimulatorTutorial } from "./components/tutorials/simulator_tutorial";

const readTutScreenFromStorage = (): TutorialScreenCache => {
  const cache = localStorage.getItem(LAST_TUTORIAL_KEY);
  if (!cache) {
    return {
      screen: TutorialScreen.Welcome,
      subScreenIdx: 0,
    };
  }
  return JSON.parse(cache) as TutorialScreenCache;
};

const writeTutScreenToStorage = (config: TutorialScreenCache) => {
  localStorage.setItem(LAST_TUTORIAL_KEY, JSON.stringify(config));
};

const initialScreenConfig = readTutScreenFromStorage();
const { screen: initScreen } = initialScreenConfig;

function App() {
  const [tutScreen, setTutScreen] = useState(initScreen);
  const openTutScreen = useCallback(
    (screen: TutorialScreen, nextSubScreenIdx?: number) => {
      setTutScreen(screen);
      const configInStore = readTutScreenFromStorage();
      const writeToStorage = configInStore.screen < screen;
      writeToStorage &&
        writeTutScreenToStorage({
          screen,
          subScreenIdx: nextSubScreenIdx ?? 0,
        });
    },
    []
  );

  const showWelcomeScreen =
    tutScreen === TutorialScreen.Welcome &&
    process.env.NODE_ENV === "development";
  const showSimTutorial =
    !showWelcomeScreen && tutScreen <= TutorialScreen.VisualizerTutorial;
  return (
    <div className={styles.App}>
      <Provider store={store}>
        <BrowserRouter>
          <Header setTutorialScreen={openTutScreen} />
          <Routes>
            <Route
              path={AppRoutes.Index}
              element={
                <div id="grid_container">
                  {showWelcomeScreen && (
                    <WelcomeScreen setScreen={openTutScreen} />
                  )}
                  {showSimTutorial && (
                    <SimulatorTutorial setScreen={openTutScreen} />
                  )}
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
              element={<NetworkTutorial setScreen={openTutScreen} />}
            />
          </Routes>
        </BrowserRouter>
        <Footer />
      </Provider>
    </div>
  );
}

export default App;
