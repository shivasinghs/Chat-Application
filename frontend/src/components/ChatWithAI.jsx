import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const ChatWithAI = ({ API_URL, token,user, socket }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        
        socket.on("newMessage", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        return () => {
            
        };
    }, [API_URL, token]);

    useEffect(() => {
        fetchMessages();
    }, []);
 console.log(`${API_URL}/chat/get-ai-messages`)
    const fetchMessages = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/chat/get-ai-messages`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages(data.data);
        } catch (error) {
            console.error("Error fetching AI messages:", error);
            toast.error("Failed to load messages.");
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        try {
            const { data } = await axios.post(
                `${API_URL}/chat/ai`,
                { message: newMessage },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessages((prev) => [...prev, { senderName: user.name, message: newMessage }, { senderName: "GroqAI", message: data.data.botReply }]);
            setNewMessage("");
        } catch (error) {
            console.error("Error sending message to AI:", error);
            toast.error("Failed to send message to AI.");
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.senderName === user.name ? "justify-end" : "justify-start"}`}>
                        <div className={`p-2 rounded max-w-xs ${msg.senderName === user.name ? "bg-green-500 text-white" : "bg-blue-400 text-white"}`}>
                            <strong>{msg.senderName}:</strong> {msg.message}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef}></div>
            </div>

            <div className="flex p-2 border-t">
                <input
                    type="text"
                    className="flex-1 p-2 border rounded"
                    placeholder="Ask AI..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button className="ml-2 bg-blue-500 px-4 py-2 text-white rounded" onClick={handleSend}>
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatWithAI;
