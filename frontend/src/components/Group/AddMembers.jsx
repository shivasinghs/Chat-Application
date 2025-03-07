import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:4000";

const AddMembers = ({ groupId, onMemberAdded, otherUsers }) => {
  const [newParticipants, setNewParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (newParticipants.length === 0) {
      return toast.error("Please select at least one member to add.");
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/group/add-members`,
        { groupId, newParticipants },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Members added successfully!");
      setNewParticipants([]);
      onMemberAdded();
    } catch (error) {
      console.error("Error adding members:", error);
      toast.error(error.response?.data?.message || "Failed to add members");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (e) => {
    const selectedUserId = e.target.value;
    if (selectedUserId && !newParticipants.includes(selectedUserId)) {
      setNewParticipants([...newParticipants, selectedUserId]);
    }
  };

  const handleRemoveParticipant = (id) => {
    setNewParticipants(newParticipants.filter((userId) => userId !== id));
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">Add Members</h3>

      {/* Dropdown for selecting users */}
      <select onChange={handleSelectChange} className="border p-2 w-full mb-2">
        <option value="">Select a user</option>
        {otherUsers
          .filter((user) => !newParticipants.includes(user.id))
          .map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
      </select>

      {/* Selected members as tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {newParticipants.map((userId) => {
          const user = otherUsers.find((u) => u.id === userId);
          return (
            <div
              key={userId}
              className="flex items-center bg-gray-200 px-3 py-1 rounded-full text-sm"
            >
              {user?.name} ({user?.email})
              <button
                onClick={() => handleRemoveParticipant(userId)}
                className="ml-2 text-red-500"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleAdd}
        disabled={loading}
        className="mt-2 p-2 bg-blue-500 text-white w-full disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Members"}
      </button>
    </div>
  );
};

export default AddMembers;
