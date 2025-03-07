import { useState } from "react"
import { Users, X, Circle, Clock } from "lucide-react"
import Profile from "./Profile"
import Logout from "./Logout"
import CreateGroup from "./Group/CreateGroup"
import GroupList from "./Group/GroupList"
import SearchComponent from "./SearchComponent"
import { Bot } from "lucide-react"

const Sidebar = ({
  setSelectedChat,
  setSelectedGroup,
  user,
  otherUsers,
  socket
}) => {
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  return (
    <div className="w-full flex flex-col h-full p-4 border-r">
      {/* Header with Create Group Button */}
      <div className="flex justify-between items-center mt-3">
        <h2 className="text-lg font-bold">Users</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Users size={18} />
            <span>Create Group</span>
          </button>
          <SearchComponent
            setSelectedChat={setSelectedChat}
            setSelectedGroup={setSelectedGroup}
          />
        </div>
      </div>

      {/* Wrapping Users and Groups together */}
      <div className="overflow-auto flex-1">
        {/* User List */}
        <ul className="mb-8 mt-4">
          {otherUsers.length > 0 ? (
            otherUsers.map((chatUser) => (
              <li
                key={chatUser.id}
                className="flex items-center p-2 cursor-pointer hover:bg-gray-300 rounded"
                onClick={() => {
                  setSelectedChat(chatUser)
                  setSelectedGroup(null)
                }}
              >
                <img
                  src={chatUser.profileImage}
                  alt={chatUser.name}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div className="flex flex-col flex-1">
                  <span className="font-medium">{chatUser.name}</span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Circle
                      size={12}
                      className={`mr-1 ${
                        chatUser.isOnline ? "text-green-500" : "text-gray-400"
                      }`}
                    />
                    {chatUser.isOnline ? (
                      <span className="text-green-600">Online</span>
                    ) : (
                      chatUser.lastSeen && (
                        <div className="flex items-center">
                          <Clock size={12} className="mr-1" />
                          <span>
                            Last seen:{" "}
                            {new Date(chatUser.lastSeen).toLocaleString()}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </li>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No users found</p>
          )}
        </ul>

        {/* Group List */}
        <div className="mt-4">
          <h2 className="text-lg font-bold ">Groups</h2>
          <GroupList
            onSelectGroup={(group) => {
              setSelectedGroup(group)
              setSelectedChat(null)
            }}
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-500" />
          <h2
            className="text-lg font-bold cursor-pointer"
            onClick={() => setSelectedChat({ name: "ChatWithAI" })}
          >
            ChatWithAI
          </h2>
        </div>
      </div>

      {/* Profile & Logout Section */}
      <div className="mt-auto">
        <Profile user={user} />
        <Logout socket={socket} />
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative bg-white w-full h-full flex flex-col justify-center items-center p-4">
            <button
              onClick={() => setShowCreateGroup(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
            >
              <X size={24} />
            </button>
            <CreateGroup
              users={otherUsers}
              onGroupCreated={() => setShowCreateGroup(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
