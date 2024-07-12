import "./App.css";
import { Grid } from "./components/grid";
import { Header } from "./components/header";
import { ComponentPicker } from "./components/network_component_picker";

function App() {
  return (
    <div className="App">
      <Header />
      <ComponentPicker />
      <Grid />
    </div>
  );
}

export default App;
