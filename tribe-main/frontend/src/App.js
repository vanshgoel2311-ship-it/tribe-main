import "./App.css";
import axios from "axios";

axios.defaults.baseURL = process.env.REACT_APP_API_ENDPOINT || "http://localhost:5000";

import Homepage from "./Pages/Homepage";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Chatpage from "./Pages/Chatpage";

import { useColorMode } from "@chakra-ui/react";

function App() {
  const { colorMode } = useColorMode();
  return (
    <div className={`App ${colorMode}`}>
      <Routes>
        <Route path="/" element={<Homepage />} exact />
        <Route path="/chats" element={<Chatpage />} />
      </Routes>
    </div>
  );
}

export default App;
