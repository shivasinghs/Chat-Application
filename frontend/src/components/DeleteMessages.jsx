import { useState } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const DeleteMessages = ({ API_URL, chatId, token, selectedChat }) => {
  const [deleteOption, setDeleteOption] = useState("me");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAllMessages = async () => {
    setIsDeleting(true);
    try {
      const deleteForEveryone = selectedChat?.name === "ChatWithAI" || deleteOption === "everyone";
      
      const { data } = await axios.post(
        `${API_URL}/message/delete-all`,
        { chatId, deleteForEveryone },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      toast.success(data.message);
      setShowConfirmation(false);
    } catch (error) {
      console.error("Error deleting messages:", error);
      toast.error("Failed to delete messages.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenConfirmation = () => {
    if (!chatId) {
      toast.error("No messages to delete");
      return;
    }
    setShowConfirmation(true);
  };

  return (
    <>
      <button
        className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors duration-200 flex items-center justify-center gap-2"
        onClick={handleOpenConfirmation}
        title="Delete messages"
      >
        Delete All Messages <Trash2 className="w-5 h-5" />
      </button>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                <h3 className="font-bold text-lg text-gray-800">Delete All Messages</h3>
              </div>
              <button 
                onClick={() => setShowConfirmation(false)}
                className="text-gray-500 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <p className="mb-4 text-gray-600">
                {selectedChat?.name === "ChatWithAI" 
                  ? "This will permanently delete all messages in this conversation with AI." 
                  : "Choose how you want to delete these messages:"}
              </p>
              
              {selectedChat?.name !== "ChatWithAI" && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="radio"
                      id="deleteForMe"
                      name="deleteOption"
                      value="me"
                      checked={deleteOption === "me"}
                      onChange={() => setDeleteOption("me")}
                      className="w-4 h-4 text-green-500 border-gray-300 focus:ring-green-500"
                    />
                    <label htmlFor="deleteForMe" className="text-gray-700">Delete for me only</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="deleteForEveryone"
                      name="deleteOption"
                      value="everyone"
                      checked={deleteOption === "everyone"}
                      onChange={() => setDeleteOption("everyone")}
                      className="w-4 h-4 text-green-500 border-gray-300 focus:ring-green-500"
                    />
                    <label htmlFor="deleteForEveryone" className="text-gray-700">Delete for everyone</label>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500 mb-4">
                {deleteOption === "everyone" 
                  ? "This action cannot be undone. All messages will be permanently deleted for all participants."
                  : "Messages will only be removed from your view."}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllMessages}
                  disabled={isDeleting}
                  className={`px-4 py-2 text-white rounded flex items-center justify-center ${
                    isDeleting ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
                  } transition-colors`}
                >
                  {isDeleting ? (
                    <>
                      <span className="mr-2">Deleting</span>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span>Delete All Messages</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteMessages;