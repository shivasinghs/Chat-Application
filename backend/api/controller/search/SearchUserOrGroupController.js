const sequelize = require("../../../config/sequelize");

const searchUsersOrGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const { searchTerm } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        status: false,
        message: "Search term is required",
        data: null,
        error: "Invalid request",
      });
    }

    const usersQuery = `
      SELECT 
        id, 
        name, 
        email, 
        gender, 
        profile_image AS "profileImage", 
        is_online AS "isOnline", 
        last_seen AS "lastSeen"
      FROM users
      WHERE id != :userId AND email != :groqAiEmail
        AND is_deleted = false
        AND name ILIKE :searchTerm
      ORDER BY created_at ASC;
    `;

    const groupsQuery = `
      SELECT 
        c.id AS "GroupId",
        c.name AS "GroupName",
        c.type AS "GroupType",
        c.participants AS "GroupMembers",
        c.created_by AS "CreatedBy",
        u.name AS "CreatedByName"
      FROM chats c
      JOIN users u ON u.id = c.created_by
      WHERE :userId = ANY(c.participants)
        AND c.type = 'group'
        AND u.is_deleted = false 
        AND c.is_deleted = false 
        AND c.name ILIKE :searchTerm
      ORDER BY c.created_at ASC;
    `;

    // Fetch users
    const users = await sequelize.query(usersQuery, {
      replacements: { userId, searchTerm: `%${searchTerm}%`,groqAiEmail : "groqai@example.com" },
      type: sequelize.QueryTypes.SELECT,
    });

    // Fetch groups
    const groups = await sequelize.query(groupsQuery, {
      replacements: { userId, searchTerm: `%${searchTerm}%` },
      type: sequelize.QueryTypes.SELECT,
    });

    // Construct response object dynamically
    let responseData = {};
    if (users.length > 0) responseData.users = users;
    if (groups.length > 0) responseData.groups = groups;

    return res.status(200).json({
      status: true,
      message: "Search results retrieved successfully",
      data: Object.keys(responseData).length > 0 ? responseData : null, 
      error: null,
    });

  } catch (error) {
    console.error("Error in search:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      data: null,
      error: error.message,
    });
  }
};

module.exports = { searchUsersOrGroups };
