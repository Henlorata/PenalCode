import {Route, Routes} from "react-router-dom";
import {HomePage} from "./pages/Home";
import {SfsdLayout} from "./layouts/SfsdLayout";
import {PenalCodePage} from "./pages/sfsd/PenalCode";
import {DashboardPage} from "./pages/sfsd/DashboardPage";
import {SzabalyzatPage} from "./pages/sfsd/SzabalyzatPage";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage/>}/>

      <Route path="/sfsd" element={<SfsdLayout/>}>
        <Route index element={<DashboardPage/>}/>
        <Route path="penalcode" element={<PenalCodePage/>}/>
        <Route path="szabalyzat" element={<SzabalyzatPage/>}/>
      </Route>

    </Routes>
  );
}

export default App;