import { useCallback, useState } from "react";
import { GridManager } from "./components/grid_manager";
import { Header } from "./components/header";
import { NotificationTooltipContext } from "./contexts/notification_tooltip";
import { NotificationTooltip } from "./components/notification_tooltip";
import { Provider } from "react-redux";
import { store } from "./store";
import { EventLog } from "./components/event_log";
import { ModalManager as EventModalManager } from "./components/modals/manager";
import styles from "./App.module.css";

function App() {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState("");
  const closeTooltip = useCallback(() => {
    setTooltipVisible(false);
  }, []);

  const openTooltip = useCallback((message: string) => {
    setTooltipVisible(true);
    setTooltipMessage(message);
  }, []);

  return (
    <div className="App">
      <Provider store={store}>
        <NotificationTooltipContext.Provider
          value={{
            visible: tooltipVisible,
            close: closeTooltip,
            duration: 2000,
            message: tooltipMessage,
            open: openTooltip,
          }}
        >
          <Header />
          <GridManager gridSize={35} />
          <EventLog showControlPanel classes={styles.event_log} />
          <NotificationTooltip />
          <EventModalManager />
        </NotificationTooltipContext.Provider>
      </Provider>
    </div>
  );
}

export default App;
