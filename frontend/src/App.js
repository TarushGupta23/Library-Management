import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Gate from "./pages/Gate/Gate";
import Home from "./pages/Home/Home";
import LoginPage from "./pages/LoginPage/LoginPage";
import Admin from './pages/Admin/Admin';

const serverUrl = 'http://localhost:8081'
const inOutDisplayTime = 4 // sec

function App() {
  return <Router>
    <Routes>
      <Route path="/admin" element={<Admin />} />
      <Route path="/gate" element={<Gate />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Home />} />
    </Routes>
  </Router>
}

export default App;
export { serverUrl, inOutDisplayTime }