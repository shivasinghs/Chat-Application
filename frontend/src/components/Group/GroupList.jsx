import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:4000";

const GroupList = ({ onSelectGroup }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token missing");

        const res = await axios.get(`${API_URL}/group/get-all`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setGroups(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  if (loading) return <p className="p-4">Loading groups...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4 border-r w-full max-w-sm">
      {groups.length === 0 ? (
        <p className="text-gray-500">No groups available</p>
      ) : (
        <ul className="space-y-2">
          {groups.map((group) => (
            <li
              key={group.GroupId}
              className="cursor-pointer p-3 rounded-md hover:bg-gray-100 flex justify-between items-center"
              onClick={() => onSelectGroup(group)}
            >
              <div>
                <p className="font-semibold">{group.GroupName}</p>
                <p className="text-sm text-gray-500">Created by: {group.CreatedByName}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GroupList;
