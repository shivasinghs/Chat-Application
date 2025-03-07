import React, { useState, useEffect } from "react"
import axios from "axios"
import { Search, Loader2, User, Users, X } from "lucide-react"

const API_URL = "http://localhost:4000"

const SearchComponent = ({ setSelectedChat, setSelectedGroup }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState({ users: [], groups: [] })
  const [loading, setLoading] = useState(false)
  const [searchModal, setSearchModal] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch()
      }
    }, 500)

    return () => clearTimeout(delaySearch)
  }, [searchTerm])

  const handleSearch = async () => {
    setLoading(true)
    setError("")
    setResults({ users: [], groups: [] })

    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`${API_URL}/search/users-or-group`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { searchTerm }
      })

      if (response.data.status) {
        const { users, groups } = response.data.data
        setResults({ users, groups })

        if (users.length > 0) {
          setSelectedChat(users[0])
          setSelectedGroup(null)
        } else if (groups.length > 0) {
          setSelectedGroup(groups[0])
          setSelectedChat(null)
        }
      } else {
        setError(response.data.message || "No results found.")
      }
    } catch (err) {
      setError(err.response?.data?.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="">
      <button
        onClick={() => setSearchModal(true)}
        className="bg-slate-700 text-white px-4 py-2 rounded-md"
      >
        <Search size={20} />
      </button>

      {/* Search Modal */}
      {searchModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 p-4 ">
          <div className="relative w-full max-w-lg mx-auto p-10 bg-white shadow-xl rounded-xl ">
            {/* Close Button */}
            <button
              onClick={() => setSearchModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
            >
              <X size={24} />
            </button>

            {/* Search Bar */}
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
              <input
                type="text"
                placeholder="Search users or groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 text-gray-700 outline-none"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
              </button>
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 mt-3 text-center">{error}</p>}

            {/* Search Results */}
            {!loading && (results.users?.length > 0 || results.groups?.length > 0) && (
              <div className="mt-4 space-y-4">
                {/* User Results */}
                {results.users?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <User size={18} className="text-blue-500" /> Users
                    </h3>
                    <div className="mt-2 bg-gray-100 rounded-lg p-3 shadow-sm">
                      {results.users.map((user) => (
                        <div
                          key={user.id}
                          className="p-2 flex items-center border-b last:border-none cursor-pointer hover:bg-gray-200"
                          onClick={() => {
                            setSelectedChat(user)
                            setSelectedGroup(null)
                            setSearchModal(false) // Close modal after selection
                          }}
                        >
                          <img
                            src={user.profileImage || "/default-avatar.png"}
                            alt={user.name}
                            className="w-10 h-10 rounded-full border mr-3"
                          />
                          <div>
                            <span className="text-gray-800 font-medium">{user.name}</span>
                            <p className="text-sm text-gray-500">
                              {user.isOnline ? "Online" : `Last seen: ${new Date(user.lastSeen).toLocaleString()}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Group Results */}
                {results.groups?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <Users size={18} className="text-green-500" /> Groups
                    </h3>
                    <div className="mt-2 bg-gray-100 rounded-lg p-3 shadow-sm">
                      {results.groups.map((group) => (
                        <div
                          key={group.GroupId}
                          className="p-2 border-b last:border-none cursor-pointer hover:bg-gray-200"
                          onClick={() => {
                            setSelectedGroup(group)
                            setSelectedChat(null)
                            setSearchModal(false) // Close modal after selection
                          }}
                        >
                          <span className="text-gray-800 font-medium">{group.GroupName}</span>
                          <p className="text-sm text-gray-500">Created by: {group.CreatedByName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchComponent
