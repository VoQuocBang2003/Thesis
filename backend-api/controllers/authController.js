const db = require("../knexfile.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const _const = require("../config/constant");
const { createResponse } = require("../jsend.js");

const authController = {
  registerUser: async (req, res) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(req.body.password, salt);

      const existingUser = await db("users").where("email", req.body.email).first();
      if (existingUser) {
        return res.status(200).json(createResponse(false, null, "Email already exists"));
      }

      // Validate and set default role
      const userRole = req.body.role === 'isClient' || !req.body.role ? 'user' : req.body.role;
      
      const [userId] = await db("users").insert({
        username: req.body.username,
        email: req.body.email,
        password: hashed,
        phone: req.body.phone,
        role: userRole,
        status: req.body.status || "active",
      });

      const user = {
        id: userId,
        username: req.body.username,
        email: req.body.email,
        phone: req.body.phone,
        role: userRole,
        status: req.body.status || "active",
      };

      return res.status(200).json(createResponse(true, user, "User registered successfully"));
    } catch (err) {
      console.error(err);
      return res.status(500).json(createResponse(false, null, "Register failed"));
    }
  },

  login: async (req, res) => {
    try {
      const user = await db("users").where("email", req.body.email).first();
      if (!user) {
        return res.status(200).json(createResponse(false, null, "Unregistered account!"));
      }

      const validatePassword = await bcrypt.compare(req.body.password, user.password);
      if (!validatePassword) {
        return res.status(200).json(createResponse(false, null, "Wrong password!"));
      }

      const token = jwt.sign({ user }, _const.JWT_ACCESS_KEY, { expiresIn: "1d" });

      res.header("Authorization", token);
      res.status(200).json(createResponse(true, { token, user }, "Login successful"));
    } catch (error) {
      console.error(error);
      res.status(500).json(createResponse(false, null, "Error during login"));
    }
  },
};

module.exports = authController;
