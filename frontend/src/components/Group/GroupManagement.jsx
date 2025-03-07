import React, { useState } from "react";
import AddMembers from "./AddMembers";
import RemoveMember from "./RemoveMember";
import DeleteGroup from "./DeleteGroup";
import { Users } from "lucide-react";

const GroupManagement = ({ API_URL, selectedGroup, token, user, otherUsers }) => {
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showRemoveMembersModal, setShowRemoveMembersModal] = useState(false);
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);

  return (
    <div className="flex gap-2">
      {selectedGroup?.CreatedBy === user.id && (
        <div className="flex space-x-2">
          <button
            className="bg-blue-500 text-white px-3 py-1 rounded"
            onClick={() => setShowAddMembersModal(true)}
          >
            Add Members
          </button>
          <button
            className="bg-red-500 text-white px-3 py-1 rounded"
            onClick={() => setShowRemoveMembersModal(true)}
          >
            Remove Members
          </button>
          <DeleteGroup
            API_URL={API_URL}
            groupId={selectedGroup.GroupId}
            token={token}
            onGroupDeleted={() => window.location.reload()}
          />
        </div>
      )}
      <button
        className="bg-gray-500 text-white px-3 py-1 rounded flex items-center"
        onClick={() => setShowGroupMembersModal(true)}
      >
        <Users className="w-4 h-4 mr-1" /> Members
      </button>

      {/* Add Members Modal */}
      {showAddMembersModal && (
        <Modal title="Add Members" onClose={() => setShowAddMembersModal(false)}>
          <AddMembers
            groupId={selectedGroup.GroupId}
            onMemberAdded={() => setShowAddMembersModal(false)}
            otherUsers={otherUsers}
          />
        </Modal>
      )}

      {/* Remove Members Modal */}
      {showRemoveMembersModal && (
        <Modal title="Remove Members" onClose={() => setShowRemoveMembersModal(false)}>
          <RemoveMember
            groupId={selectedGroup.GroupId}
            selectedGroup={selectedGroup}
            onMemberRemoved={() => setShowRemoveMembersModal(false)}
            otherUsers={otherUsers}
          />
        </Modal>
      )}

      {/* Group Members Modal */}
      {showGroupMembersModal && (
        <Modal title="Group Members" onClose={() => setShowGroupMembersModal(false)}>
          <ul>
            {selectedGroup.GroupMembers.map((memberId, index) => {
              let member =
                otherUsers.find((u) => u.id === memberId) ||
                (memberId === user.id ? user : null);

              return (
                <li key={index} className="p-2 border-b flex justify-between items-center">
                  <span>{member ? member.name : `Unknown (ID: ${memberId})`}</span>
                  <span className="text-sm text-gray-600">
                    {member?.id === user.id ? (
                      <span className="text-green-600">Online</span>
                    ) : member?.isonline ? (
                      <span className="text-green-600">Online</span>
                    ) : member?.lastSeen ? (
                      `Last seen: ${new Date(member.lastSeen).toLocaleString()}`
                    ) : (
                      "Offline"
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded shadow-lg w-96">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      {children}
      <button className="mt-4 p-2 bg-gray-500 text-white w-full rounded" onClick={onClose}>
        Close
      </button>
    </div>
  </div>
);

export default GroupManagement;