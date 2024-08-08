import "./App.css";
import { Grid } from "./components/grid";
import { Header } from "./components/header";

function App() {
  return (
    <div className="App">
      <Header />
      <Grid gridSize={40} />
    </div>
  );
}

export default App;
