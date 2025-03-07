import { useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

const API_URL = "http://localhost:4000";

const CreateGroup = ({ users, onGroupCreated }) => {
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSelectParticipant = (userId) => {
    const selectedUser = users.find((user) => user.id === userId);
    if (selectedUser && !participants.some((p) => p.id === selectedUser.id)) {
      setParticipants([...participants, selectedUser]);
    }
  };

  const handleRemoveParticipant = (id) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleCreate = async () => {
    if (!name.trim()) return alert("Group name cannot be empty.");
    if (participants.length === 0) return alert("Select at least one participant.");

    const participantIds = participants.map((p) => p.id);

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_URL}/group/create`,
        { name, participants: participantIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onGroupCreated(res.data.data);
      setName("");
      setParticipants([]);
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md w-full max-w-md bg-white">
      <h2 className="text-lg font-semibold mb-4 text-center">Create a Group</h2>
      
      <input
        type="text"
        placeholder="Group Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 w-full mb-3 text-black rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <select
        onChange={(e) => handleSelectParticipant(e.target.value)}
        className="border p-2 w-full rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="">Select Participants</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-2 mb-3">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center bg-gray-200 px-3 py-1 rounded-full">
            <span className="mr-2">{p.name}</span>
            <button
              onClick={() => handleRemoveParticipant(p.id)}
              className="text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleCreate}
        disabled={loading}
        className="p-2 bg-blue-500 text-white w-full rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Group"}
      </button>
    </div>
  );
};

export default CreateGroup;
