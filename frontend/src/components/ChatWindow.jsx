import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import GroupManagement from "./Group/GroupManagement";
import { Bot, Send, Loader2, User, Users, Trash2, Clock } from "lucide-react";
import DeleteMessages from "./DeleteMessages";

const ChatWindow = ({ API_URL, selectedChat, selectedGroup, socket, user, otherUsers, token }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Efficiently initialize and update chatId when selectedChat or selectedGroup changes
  useEffect(() => {
    // Clear state when no chat is selected
    if (!selectedChat && !selectedGroup) {
      setChatId("");
      return;
    }

    // Initialize chatId based on the selected conversation
    if (selectedChat) {
      // Use a consistent key format with chat type prefix for better organization
      const storageKey = selectedChat.name === "ChatWithAI" 
        ? "ai_chat" 
        : `user_chat_${selectedChat.id}`;
      
      const storedChatId = localStorage.getItem(storageKey);
      if (storedChatId) {
        setChatId(storedChatId);
      }
    } else if (selectedGroup) {
      // For groups, the GroupId itself serves as the chatId
      setChatId(selectedGroup.GroupId);
    }
  }, [selectedChat, selectedGroup]);

  // Function to update chatId consistently across the component
  const updateChatId = useCallback((newChatId, chatType) => {
    if (!newChatId) return;
    
    setChatId(newChatId);
    
    // Store with appropriate key based on chat type
    if (chatType === "ai") {
      localStorage.setItem("ai_chat", newChatId);
    } else if (chatType === "user" && selectedChat) {
      localStorage.setItem(`user_chat_${selectedChat.id}`, newChatId);
    }
    // Note: For groups, we don't need to store in localStorage as the GroupId is stable
  }, [selectedChat]);

  useEffect(() => {
    if (!selectedChat && !selectedGroup) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        let endpoint = selectedChat
          ? selectedChat.name === "ChatWithAI"
            ? "/chat/get-ai-messages"
            : `/message/get/${selectedChat.id}`
          : `/message/get-group/${selectedGroup.GroupId}`;

        const { data } = await axios.get(`${API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
       
        if (selectedChat && data?.data?.[0]?.chatId) {
          const newChatId = data.data[0].chatId;
          const chatType = selectedChat.name === "ChatWithAI" ? "ai" : "user";
          updateChatId(newChatId, chatType);
        }
        
        setMessages(data.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      toast.success(`New message from ${message.senderName}: ${message.message}`);
    };

    if (selectedChat && selectedChat?.name !== "ChatWithAI") {
      socket.on("newMessage", handleNewMessage);
    }

    if (selectedGroup) {
      socket.on("newGroupMessage", handleNewMessage);
    }

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("newGroupMessage", handleNewMessage);
    };
  }, [selectedChat, selectedGroup, socket, token, API_URL, updateChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // Focus the input field when chat changes
    inputRef.current?.focus();
  }, [messages, selectedChat, selectedGroup]);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim()) return;

    let endpoint, messageData;

    if (selectedChat?.name === "ChatWithAI") {
      endpoint = "/chat/ai";
      messageData = { message: newMessage };
      
      // Add chatId to the request if we have it (for continuing conversations)
      if (chatId) {
        messageData.chatId = chatId;
      }

      setMessages((prev) => [
        ...prev,
        { senderName: user.name, message: newMessage },
        { senderName: "GroqAI", message: "Typing...", isLoading: true },
      ]);
    } else if (selectedChat) {
      endpoint = "/message/send";
      messageData = { message: newMessage, receiverId: selectedChat.id };
      
      // Add chatId to the request if we have it
      if (chatId) {
        messageData.chatId = chatId;
      }
    } else if (selectedGroup) {
      endpoint = "/message/send-group";
      messageData = { message: newMessage, groupId: selectedGroup.GroupId };
    }

    try {
      const { data } = await axios.post(`${API_URL}${endpoint}`, messageData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update chatId if it's in the response
      if (data?.data?.chatId) {
        const chatType = selectedChat?.name === "ChatWithAI" ? "ai" : "user";
        updateChatId(data.data.chatId, chatType);
      }

      if (selectedChat?.name === "ChatWithAI") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.isLoading ? { senderName: "GroqAI", message: data.data.botReply } : msg
          )
        );
      } else {
        setMessages((prev) => [...prev, data.data]);
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      if (selectedChat?.name === "ChatWithAI") {
        setMessages((prev) => prev.filter(msg => !msg.isLoading));
      }
    }
  }, [newMessage, selectedChat, selectedGroup, user, API_URL, token, chatId, updateChatId]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const renderChatIcon = () => {
    if (selectedChat?.name === "ChatWithAI") {
      return <Bot className="h-8 w-8 text-blue-500" />;
    } else if (selectedGroup) {
      return <Users className="h-8 w-8 text-purple-500" />;
    } else {
      return <img src={selectedChat.profileImage} alt={selectedChat.name} className="h-8 w-8 rounded-full" />;
    }
  };

  return (
    <div className="w-full flex flex-col bg-gray-50 h-full shadow-lg rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center">
          <div className="mr-3 p-2 rounded-full bg-gray-100">
            {renderChatIcon()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {selectedChat?.name === "ChatWithAI"
                ? "Chat with AI"
                : selectedChat?.name || selectedGroup?.GroupName || "Chat"}
            </h2>
            <p className="text-sm text-gray-600 flex items-center">
              {selectedChat?.name === "ChatWithAI" ? (
                <>Powered by Groq AI</>
              ) : selectedGroup ? (
                <>{selectedGroup.GroupName} • {selectedGroup.GroupMembers.length || 0} members</>
              ) : (
                <>
                  {selectedChat?.isonline ? (
                    <><span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>Online</>
                  ) : (
                    <><Clock className="h-4 w-4 mr-1" /> Last seen: {new Date(selectedChat?.lastSeen).toLocaleString()}</>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          {selectedGroup && selectedChat?.name !== "ChatWithAI" && (
            <GroupManagement
              API_URL={API_URL}
              selectedGroup={selectedGroup}
              token={token}
              user={user}
              otherUsers={otherUsers}
            />
          )}

          {(selectedChat || selectedGroup) && (
            <DeleteMessages
              chatId={chatId}
              token={token}
              API_URL={API_URL}
              selectedChat={selectedChat}
            />
          )} 
        </div>
      </div>

      {/* Messages Display */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ minHeight: "300px" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
            <span className="ml-2 text-gray-500">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Bot className="h-16 w-16 mb-4" />
            <p className="text-center">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            
            <div
              key={index}
              className={`flex ${ msg?.senderId === user?.id || msg?.senderName === user?.name? "justify-end" : "justify-start"}`}
            >
              <div className="flex flex-col max-w-xs md:max-w-md lg:max-w-lg">
                {selectedGroup && msg.senderName !== user.name && (
                  <span className="text-xs text-gray-500 ml-2 mb-1">{msg.senderName}</span>
                )}
                <div
                  className={`p-3 rounded-lg ${
                    msg.senderName === user.name
                      ? "bg-green-500 text-white rounded-tr-none"
                      : msg.senderName === "GroqAI"
                      ? "bg-blue-500 text-white rounded-tl-none"
                      : "bg-orange-400 text-white rounded-tl-none"
                  } ${msg.isLoading ? "animate-pulse" : ""}`}
                >
                  {msg.isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {msg.message}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{msg.message}</div>
                  )}
                </div>
                <span className="text-xs text-gray-500 mt-1 self-end">
                  {formatTimestamp(msg.timestamp || Date.now())}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Message Input */}
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-center bg-gray-100 rounded-full p-1 pl-4">
          <textarea
            ref={inputRef}
            rows="1"
            className="flex-1 p-2 bg-transparent border-none focus:outline-none resize-none"
            placeholder={
              selectedChat?.name === "ChatWithAI"
                ? "Ask AI something..."
                : "Type a message..."
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            style={{ maxHeight: "100px", minHeight: "44px" }}
          />
          <button
            className={`ml-2 p-3 rounded-full transition-colors ${
              !newMessage.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
            onClick={handleSend}
            disabled={!newMessage.trim()}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1 text-center">
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
};

export default ChatWindow;