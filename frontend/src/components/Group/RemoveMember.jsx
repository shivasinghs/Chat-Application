import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:4000";

const RemoveMember = ({ groupId, onMemberRemoved, selectedGroup, otherUsers }) => {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Extract the group members' IDs
  const groupMembers = selectedGroup?.GroupMembers || [];

  // Get full user details of group members
  const groupMemberDetails = otherUsers.filter((user) => groupMembers.includes(user.id));

  const handleRemove = async () => {
    if (selectedMembers.length === 0) {
      return toast.error("Please select at least one member to remove.");
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/group/remove-members`,
        { groupId, membersToRemove: selectedMembers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Members removed successfully!");
      setSelectedMembers([]);
      onMemberRemoved();
    } catch (error) {
      console.error("Error removing members:", error);
      toast.error(error.response?.data?.message || "Failed to remove members");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (e) => {
    const selectedUserId = e.target.value;
    if (selectedUserId && !selectedMembers.includes(selectedUserId)) {
      setSelectedMembers([...selectedMembers, selectedUserId]);
    }
  };

  const handleRemoveFromList = (id) => {
    setSelectedMembers((prev) => prev.filter((userId) => userId !== id));
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">Remove Members</h3>

      {/* Dropdown for selecting members */}
      <select onChange={handleSelectChange} className="border p-2 w-full mb-2">
        <option value="">Select a member to remove</option>
        {groupMemberDetails
          .filter((user) => !selectedMembers.includes(user.id))
          .map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
      </select>

      {/* Selected members as removable tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedMembers.map((userId) => {
          const user = groupMemberDetails.find((u) => u.id === userId);
          return (
            <div
              key={userId}
              className="flex items-center bg-gray-200 px-3 py-1 rounded-full text-sm"
            >
              {user?.name} ({user?.email})
              <button
                onClick={() => handleRemoveFromList(userId)}
                className="ml-2 text-red-500"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleRemove}
        disabled={loading}
        className="mt-2 p-2 bg-red-500 text-white w-full disabled:opacity-50"
      >
        {loading ? "Removing..." : "Remove Members"}
      </button>
    </div>
  );
};

export default RemoveMember;
