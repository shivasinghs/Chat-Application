const { Chat } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, uuidv4, CHAT_TYPE,Op } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const sequelize = require('../../../config/sequelize');

const createGroup = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { name, participants } = req.body;

    const uniqueParticipants = [...new Set([...participants, userId])];

    // Validate the input
    const validation = new VALIDATOR({ name, participants: uniqueParticipants }, {
      name: validationRules.Chat.name,
      participants: validationRules.Chat.participants
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: null,
        error: validation.errors.all(),
      });
    }

    const newGroup = await Chat.create({
      id: uuidv4(),
      name,
      type: CHAT_TYPE.GROUP,
      participants: uniqueParticipants,
      createdBy: userId,
      createdAt: Math.floor(Date.now() / 1000),
    });

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Group created successfully",
      data: {
        GroupId: newGroup.id,
        createdBy: newGroup.createdBy,
      },
      error: "",
    });
  } catch (error) {
    console.error("Error creating group:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error",
      data: "",
      error: error.message,
    });
  }
};

 // Get group details by ID

const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params; 
    const userId = req.user.id; 

    // Validate the request parameters to ensure groupId is valid
    const validation = new VALIDATOR(req.params, {
      groupId: validationRules.Chat.id
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: null,
        error: validation.errors.all(),
      });
    }

    // Fetch the group details if it exists and the user is a participant
    const group = await Chat.findOne({
      where: {
        id: groupId,
        type: CHAT_TYPE.GROUP,
        participants: { [Op.contains]: [userId] } // Check if user is in the participants list
      },
      attributes: ["id", "name", "participants", "type"]
    });

    if (!group) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Group not found",
        data: null,
        error: "",
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Group details fetched successfully",
      data: group,
      error: "",
    });
  } catch (error) {
    console.error("Error fetching group:", error);

    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error",
      data: "",
      error: error.message,
    });
  }
};

// Fetch all groups where the user is a participant

const getAllGroups = async (req, res) => {
  try {
    const userId = req.user.id; 

    const query = `
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
      AND c.type = :type -- Ensure it's a group chat
      AND u.is_deleted = false 
      AND c.is_deleted = false 
      ORDER BY c.created_at ASC; 
    `;

    // Execute the query with parameter replacements
    const groups = await sequelize.query(query, {
      replacements: { userId, type: CHAT_TYPE.GROUP },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Groups fetched successfully",
      data: groups,
      error: "",
    });
  } catch (error) {
    console.error("Error fetching groups:", error);

    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error",
      data: "",
      error: error.message,
    });
  }
};

 // Add members to a group 
 
 const addMembers = async (req, res) => {
  try {
    const { groupId, newParticipants } = req.body;
    const userId = req.user.id;

    // Validate the request body to ensure groupId and newParticipants are provided and correctly formatted
    const validation = new VALIDATOR(req.body, {
      groupId: validationRules.Chat.id,
      newParticipants: validationRules.Chat.participants
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: null,
        error: validation.errors.all(),
      });
    }

    // Fetch the group details and check if it exists
    const group = await Chat.findOne({
      where: { id: groupId, type: CHAT_TYPE.GROUP },
      attributes: ["id", "name", "participants", "createdBy"]
    });

    if (!group) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Group not found",
        data: null,
        error: "",
      });
    }

    // Ensure that only the group creator (admin) can add members
    if (group.createdBy !== userId) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "Only the group admin can add members",
        data: null,
        error: "",
      });
    }

    // Merge the new participants with existing ones, ensuring uniqueness
    group.participants = [...new Set([...group.participants, ...newParticipants])];

    // Save the updated group details in the database
    await group.save();

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Members added successfully",
      data: group,
      error: "",
    });
  } catch (error) {
    console.error("Error adding members:", error);

    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error",
      data: "",
      error: error.message,
    });
  }
};

// Remove a member from a group 

const removeMember = async (req, res) => {
  try {
    const { groupId, membersToRemove } = req.body;
    const userId = req.user.id;

    // Validate the request body to ensure groupId and membersToRemove are provided and correctly formatted
    const validation = new VALIDATOR(req.body, {
      groupId: validationRules.Chat.id,
      membersToRemove: validationRules.Chat.participants
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: null,
        error: validation.errors.all(),
      });
    }

    // Fetch the group details and check if it exists
    const group = await Chat.findOne({
      where: { id: groupId, type: CHAT_TYPE.GROUP },
      attributes: ["id", "participants", "createdBy"],
    });

    if (!group) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Group not found",
        data: null,
        error: "",
      });
    }

    // Ensure that only the group creator (admin) can remove members
    if (group.createdBy !== userId) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "Only the group creator can remove members",
        data: null,
        error: "",
      });
    }

    // Check if all users to be removed are actually in the group
    const validMembersToRemove = membersToRemove.filter((id) => group.participants.includes(id));

    if (validMembersToRemove.length === 0) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "None of the selected users are in the group",
        data: null,
        error: "",
      });
    }

    // Remove the specified users from the group's participants list
    group.participants = group.participants.filter((id) => !validMembersToRemove.includes(id));

    // Save the updated group details in the database
    await group.save();

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Members removed successfully",
      data: { GroupId: group.id, RemovedUsers: validMembersToRemove },
      error: "",
    });
  } catch (error) {
    console.error("Error removing members:", error);

    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error",
      data: "",
      error: error.message,
    });
  }
};


const deleteGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    // Validate input to ensure groupId is provided and in the correct format
    const validation = new VALIDATOR(req.params, { groupId: validationRules.Chat.id });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: null,
        error: validation.errors.all(),
      });
    }

    // Fetch the group details and check if it exists and is not deleted
    const group = await Chat.findOne({
      where: { id: groupId, type: CHAT_TYPE.GROUP, isDeleted: false },
      attributes: ["id", "createdBy"]
    });

    if (!group) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Group not found",
        data: null,
        error: "",
      });
    }

    // Only the group creator (admin) is allowed to delete the group
    if (group.createdBy !== userId) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "Only the group admin can delete the group",
        data: null,
        error: "",
      });
    }

    // Soft delete the group by updating its isDeleted flag and adding a deleted timestamp
    await Chat.update(
      { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000), deletedBy: userId },
      { where: { id: groupId } }
    );

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Group deleted successfully",
      data: { groupId },
      error: "",
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error",
      data: "",
      error: error.message,
    });
  }
}

module.exports = { 
  createGroup,
  getGroupById,
  getAllGroups,
  addMembers,
  removeMember,
  deleteGroup,
  };
