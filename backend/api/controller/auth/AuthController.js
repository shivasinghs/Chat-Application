const { User } = require("../../models/index")
const { BCRYPT, HTTP_STATUS_CODE, VALIDATOR, TOKEN_EXPIRY, uuidv4} = require("../../../config/constants")
const validationRules = require("../../../config/validationRules")
const { generateJWTToken } = require("../../helper/auth/generateJWTToken")
const deleteImage = require("../../helper/imageHandler/delete")
const sequelize = require("../../../config/sequelize")

const signUp = async (req, res) => {
  try {
    // Extract user input from request body
    const { name, email, password, gender } = req.body
    const image = req.file
    const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`

    // Validate input fields using defined validation rules
    const validation = new VALIDATOR(req.body, {
      name: validationRules.User.name,
      email: validationRules.User.email,
      password: validationRules.User.password,
      gender: validationRules.User.gender
    })

    // If validation fails, return an error response
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all()
      })
    }

    // Check if the user with the given email already exists
    const existingUser = await User.findOne({
      where: { email, isDeleted: false },
      attributes: ["id"]
    })

    // If user already exists, return an error response
    if (existingUser) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Email already exists.",
        data: "",
        error: ""
      })
    }

    let imagePath = null

    // Handle image upload if provided
    if (image) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"]

      // Validate file type
      if (!allowedTypes.includes(image.mimetype)) {
        deleteImage(image.path)
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid file type. Only PNG, JPEG, and JPG are allowed.",
          data: null,
          error: null
        })
      }

      // Validate file size (max 2MB)
      if (image.size > 2 * 1024 * 1024) {
        deleteImage(image.path)
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "File size exceeds 2MB limit.",
          data: null,
          error: null
        })
      }

      // Construct the image path URL
      imagePath = baseUrl + image.filename
    }

    // Hash the user's password before storing it
    const hashedPassword = await BCRYPT.hash(password, 10)

    // Create a new user record
    const newUser = await User.create({
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      gender,
      profileImage: imagePath
    })

    // Return success response after successful signup
    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Signup successful.",
      data: { userId: newUser.id }
    })
  } catch (error) {
    // Handle and log errors in the signup process
    console.error("Error in signup:", error)
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message
    })
  }
}

const login = async (req, res) => {
  try {
    // Extract required fields from request body
    const { email, password } = req.body

    //Validate the request body fields
    const validation = new VALIDATOR(req.body, {
      email: validationRules.User.email,
      password: validationRules.User.password
    })

    //if validation fails return error
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all()
      })
    }

    //find user in database with email and select required fields
    const user = await User.findOne({
      where: { email, isDeleted: false },
      attributes: ["id", "email", "password", "isActive"]
    })

    //if user not found return a response
    if (!user) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: "Invalid email or password.",
        data: "",
        error: ""
      })
    }

    // If user is not active return a response
    if (!user.isActive) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "Account is deactivated. Contact support.",
        data: "",
        error: ""
      })
    }

    //Compare the password provide in request body with password stored in database
    const isPasswordValid = await BCRYPT.compare(password, user.password)

    //If password is not correct return a response
    if (!isPasswordValid) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: "Invalid email or password.",
        data: "",
        error: ""
      })
    }

    //Generate a JWT token for authentication
    const token = generateJWTToken({ id: user.id, email }, TOKEN_EXPIRY)

    //return a success response
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Login successful.",
      data: {
        userId: user.id,
        email: user.email,
        token: token
      }
    })
  } catch (error) {
    console.error("Error in login:", error)
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message
    })
  }
}

const getUserById = async (req, res) => {
  try {
    const userId = req.user.id

    // Fetch user data excluding password
    const user = await User.findOne({
      where: { id: userId, isDeleted: false, isActive: true },
      attributes: ["id", "name", "email", "gender", "profileImage","isOnline","lastSeen"]
    })

    // If user not found, return a response
    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "User not found.",
        data: "",
        error: ""
      })
    }
  
    // Return user details
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "User details fetched successfully.",
      data: user
    })
  } catch (error) {
    console.error("Error in fetching user details:", error)
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message
    })
  }
}

const getOtherUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user.id

    // Query to retrieve users excluding the logged-in user and soft-deleted users
    const query = `
          SELECT id, name, email, gender, profile_image AS "profileImage", is_online AS "isOnline" ,last_seen AS "lastSeen"
          FROM users
          WHERE id != :loggedInUserId AND is_deleted = false AND email != :groqAiEmail
          ORDER BY created_at ASC
      `

    // Execute query to fetch users
    const otherUsers = await sequelize.query(query, {
      replacements: { loggedInUserId,groqAiEmail : "groqai@example.com" },
      type: sequelize.QueryTypes.SELECT,
      raw: true
    })

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Other users fetched successfully.",
      data: otherUsers,
      error: null
    })
  } catch (error) {
    console.error("Error fetching other users:", error)
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message
    })
  }
}

module.exports = {
  signUp,
  login,
  getUserById,
  getOtherUsers
}
