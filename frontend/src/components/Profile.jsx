
const Profile = ({ user }) => {
    if (!user) return <p>Loading profile...</p>;
  
    return (
      <div className="flex items-center p-4 border-b">
        <img
          src={user.profileImage || "https://via.placeholder.com/50"}
          alt={user.name}
          className="w-12 h-12 rounded-full mr-3"
        />
        <div>
          <p className="font-bold">{user.name}</p>
        </div>
      </div>
    );
  };
  
export default Profile;