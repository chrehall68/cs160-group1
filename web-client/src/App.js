import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Accounts from "./pages/Accounts";
import Transfer from "./pages/Transfer";
import ATM from "./pages/ATM";
import ManagerDashboard from "./pages/ManagerDashboard";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/atm" element={<ATM />} />
        <Route path="/manager" element={<ManagerDashboard />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;