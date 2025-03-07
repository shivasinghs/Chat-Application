const JWT = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const VALIDATOR = require('validatorjs');
const BCRYPT = require('bcryptjs');
const { Op } = require('sequelize');
const PATH = require('path');
const FS = require('fs');
const MULTER = require('multer');


const HTTP_STATUS_CODE = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    SERVER_ERROR: 500,
};

// Token expiry durations
const TOKEN_EXPIRY = 60 * 60; //  3600 seconds (1 Hour)

CHAT_TYPE = {
  INDIVIDUAL : "individual",
  GROUP : "group",
  AI_CHAT : "chat-with-ai"
}

module.exports = {
  JWT,
  uuidv4,
  VALIDATOR,
  BCRYPT,
  Op,
  HTTP_STATUS_CODE,
  TOKEN_EXPIRY,
  PATH,
  FS,
  MULTER,
  CHAT_TYPE,
};
