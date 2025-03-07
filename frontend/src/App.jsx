import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Chat from "./components/Chat";
import { io } from "socket.io-client";
import { Toaster} from "react-hot-toast";

const API_URL = "http://localhost:4000";
const socket = io(API_URL, { autoConnect: false });

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) return;
  
      try {
        const { data } = await axios.get(`${API_URL}/user/get-by-id`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        socket.io.opts.query = { userId: data.data.id };
        socket.connect();

        setUser({ ...data.data });
  
        socket.on("getOnlineUsers", (onlineUsers) => {
          setOnlineUsers(onlineUsers);
          setUser((prevUser) => ({
            ...prevUser,
            isOnline: onlineUsers.includes(data.data.id),
          }));
        });
  
        // Handle window close or refresh
        window.addEventListener("beforeunload", () => {
          socket.disconnect();
        });
  
      } catch (error) {
        console.error("Error fetching user profile:", error.response?.data || error.message);
      }
    };
  
    fetchUserProfile();
  
    return () => {
      socket.disconnect();
      socket.off("getOnlineUsers");
      window.removeEventListener("beforeunload", () => {
        socket.disconnect();
      });
    };
  }, [token]);
  

  return (
    <Router>
      <div className="flex flex-col items-center justify-center w-full">
        <Toaster position="top-right" reverseOrder={false} />

        <Routes>
          <Route path="/signup" element={<Signup API_URL={API_URL} />} />
          <Route path="/login" element={<Login API_URL={API_URL} />} />
          <Route 
            path="/chat" 
            element={<Chat API_URL={API_URL} socket={socket} user={user} token={token} onlineUsers={onlineUsers} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
