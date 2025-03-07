const { DataTypes } = require("sequelize")
const sequelize = require("../../config/sequelize")
const { CHAT_TYPE } = require("../../config/constants")

const Chat = sequelize.define(
  "Chat",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM(...Object.values(CHAT_TYPE)),
      allowNull: false,
      defaultValue: CHAT_TYPE.INDIVIDUAL
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    participants: {
      type: DataTypes.ARRAY(DataTypes.UUID),
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
      type: DataTypes.UUID,
      field: "deleted_by",
      allowNull: true
    },
    deletedAt: {
      type: DataTypes.BIGINT,
      field: "deleted_at",
      allowNull: true
    }
  },
  {
    tableName: "chats",
    freezeTableName: true,
    timestamps: false
  }
)

module.exports = Chat
