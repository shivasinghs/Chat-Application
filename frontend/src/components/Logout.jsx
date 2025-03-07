import { useNavigate } from "react-router-dom";

const Logout = ({ socket }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (socket) {
      socket.disconnect(); 
    }
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full mt-4 bg-red-500 text-white py-2 rounded hover:bg-red-600"
    >
      Logout
    </button>
  );
};

export default Logout;
