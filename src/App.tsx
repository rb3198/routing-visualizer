import { GridManager } from "./components/grid_manager";
import { Header } from "./components/header";
import { NotificationTooltip } from "./components/notification_tooltip";
import { Provider } from "react-redux";
import { store } from "./store";
import { EventLog } from "./components/event_log";
import { ModalManager as EventModalManager } from "./components/modals/manager";
import styles from "./App.module.css";
import { Footer } from "./components/footer";

function App() {
  return (
    <div className={styles.App}>
      <Provider store={store}>
        <Header />
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
