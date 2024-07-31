import "./App.css";
import { GridManager } from "./components/grid_manager";
import { Header } from "./components/header";

function App() {
  return (
    <div className="App">
      <Header />
      <GridManager gridSize={40} />
    </div>
  );
}

export default App;
