const { DataTypes } = require("sequelize")
const sequelize = require("../../config/sequelize")
const Chat = require("./Chat")
const User = require("./User")

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    chatId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Chat,
        key: "id"
      },
      field: "chat_id"
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id"
      },
      field: "sender_id"
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      field: "is_active",
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.BIGINT,
      field: "created_at",
      allowNull: false,
      defaultValue: Math.floor(Date.now() / 1000)
    },
    createdBy: {
      type: DataTypes.UUID,
      field: "created_by",
      allowNull: true
    },
    updatedAt: {
      type: DataTypes.BIGINT,
      field: "updated_at",
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.UUID,
      field: "updated_by",
      allowNull: true
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      field: "is_deleted",
      defaultValue: false
    },
    deletedBy: {
      type: DataTypes.ARRAY(DataTypes.UUID), 
      field: "deleted_by",
      allowNull: true,
      defaultValue: [],
    },    
    deletedAt: {
      type: DataTypes.BIGINT,
      field: "deleted_at",
      allowNull: true
    }
  },
  {
    tableName: "messages",
    freezeTableName: true,
    timestamps: false
  }
)

module.exports = Message
