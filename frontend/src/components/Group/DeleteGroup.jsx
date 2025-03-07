import axios from "axios";
import { useState } from "react";
import { Trash2 } from "lucide-react";

const DeleteGroup = ({ API_URL, groupId, onGroupDeleted, token }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/group/delete/${groupId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onGroupDeleted();
    } catch (error) {
      console.error("Error deleting group:", error);
      alert(error.response?.data?.message || "Failed to delete group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="bg-red-500 text-white px-3 py-1 rounded flex items-center disabled:opacity-50"
      disabled={loading}
    >
      {loading ? "Deleting..." : "Delete"}
      <Trash2 className="w-4 h-4 ml-1" />
    </button>
  );
};

export default DeleteGroup;
