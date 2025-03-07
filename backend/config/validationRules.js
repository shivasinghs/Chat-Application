const {CHAT_TYPE} = require('./constants')

const commonRules = {
  password: 'required|string|regex:/^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/',
};

const validationRules = {
  User: {
    id: "required|string",
    name: "required|string|max:64",
    email: "required|email",
    password: commonRules.password,
    gender: "required|string|in:Male,Female,Other",
  },

  Chat: {
    id: "required|string",
    type: `required|string|in:${Object.values(CHAT_TYPE).join(",")}`,
    name: "string|max:64",
    participants: "array|min:1",
  },

  Message: {
    id: "required|string",
    chatId: "required|string",
    senderId: "required|string",
    message: "required|string",
    deleteForEveryone: "required|boolean"
  },
};

module.exports = validationRules;
