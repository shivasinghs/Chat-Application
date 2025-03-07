import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";

const Chat = ({ API_URL, socket, user, token, onlineUsers }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [otherUsers, setOtherUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      try {
        const { data } = await axios.get(`${API_URL}/user/get-others`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Merge API response with online users
        const updatedUsers = data.data.map((user) => ({
          ...user,
          isonline: onlineUsers.includes(user.id),
        }));

        setOtherUsers(updatedUsers);
      } catch (error) {
        console.error("Error fetching users:", error.response?.data || error.message);
      }
    };

    fetchUsers();
  }, [token, onlineUsers]); // Re-fetch when online users update

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  return (
    <div className="h-screen w-full flex bg-gray-100 border-black border-2 justify-between">
      <div className="w-1/4">
        <Sidebar setSelectedChat={setSelectedChat} setSelectedGroup={setSelectedGroup} socket={socket} user={user} otherUsers={otherUsers} />
      </div>
      <div className="w-3/4 flex flex-col bg-white shadow-md">
        {selectedChat || selectedGroup ? (
          <ChatWindow API_URL={API_URL} selectedChat={selectedChat} selectedGroup={selectedGroup} socket={socket} user={user} otherUsers={otherUsers} token={token} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">Select a chat or group to start messaging</div>
        )}
      </div>
    </div>
  );
};

export default Chat;
