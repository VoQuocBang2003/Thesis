const db = require("../knexfile.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const _const = require("../config/constant");
const { createResponse } = require("../jsend.js");

const userController = {
  getAllUsers: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10000;
    const offset = (page - 1) * limit;

    try {
      const users = await db("users").select("*").limit(limit).offset(offset);
      res
        .status(200)
        .json(createResponse(true, users, "Users retrieved successfully"));
    } catch (err) {
      res
        .status(500)
        .json(createResponse(false, null, "Error retrieving users"));
    }
  },

  createUser: async (req, res) => {
    try {
      const { email, phone, username, password, role, status } = req.body;

      if (!email || !phone || !username || !password) {
        return res
          .status(400)
          .json(createResponse(false, null, "Missing required fields"));
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res
          .status(400)
          .json(createResponse(false, null, "Invalid email format"));
      }

      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(phone)) {
        return res
          .status(400)
          .json(createResponse(false, null, "Invalid phone number"));
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json(
            createResponse(
              false,
              null,
              "Password must be at least 6 characters"
            )
          );
      }

      if (username.length < 3 || username.length > 20) {
        return res
          .status(400)
          .json(
            createResponse(false, null, "Username must be 3-20 characters")
          );
      }

      const existingEmail = await db("users").where("email", email).first();
      if (existingEmail) {
        return res
          .status(200)
          .json(
            createResponse(false, null, "User with this email already exists")
          );
      }

      const existingPhone = await db("users").where("phone", phone).first();
      if (existingPhone) {
        return res
          .status(200)
          .json(
            createResponse(
              false,
              null,
              "User with this phone number already exists"
            )
          );
      }

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);

      const [userId] = await db("users").insert({
        email,
        phone,
        username,
        password: hashed,
        role: role || "user",
        status: status || "active",
      });

      res
        .status(200)
        .json(
          createResponse(
            true,
            { id: userId, email, phone, username, role, status },
            "User created successfully"
          )
        );
    } catch (err) {
      console.error("Error creating user:", err);
      res.status(500).json(createResponse(false, null, "Error creating user"));
    }
  },

  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;

      const user = await db("users").where("id", userId).first();

      if (!user) {
        return res
          .status(404)
          .json(createResponse(false, null, "User not found"));
      }

      await db("users").where("id", userId).del();

      res
        .status(200)
        .json(createResponse(true, null, "User deleted successfully"));
    } catch (err) {
      res.status(500).json(createResponse(false, null, "Error deleting user"));
    }
  },

  updateUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const { username, email, password, role, phone, status } = req.body;

      const existingEmail = await db("users")
        .where("email", email)
        .whereNot("id", userId)
        .first();

      if (existingEmail) {
        return res
          .status(400)
          .json(createResponse(false, null, "Email already exists"));
      }

      const updateData = {
        username,
        email,
        role,
        phone,
        status,
      };

      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }

      const result = await db("users").where("id", userId).update(updateData);

      if (result === 0) {
        return res
          .status(404)
          .json(createResponse(false, null, "User not found"));
      }

      res
        .status(200)
        .json(createResponse(true, null, "User updated successfully"));
    } catch (err) {
      console.log(err);
      res.status(500).json(createResponse(false, null, "Error updating user"));
    }
  },

  logout: async (req, res) => {
    // logout
  },

  searchUserByEmail: async (req, res) => {
    const email = req.query.email;

    try {
      const userList = await db("users")
        .where("email", "like", `%${email}%`)
        .select("*");
      res
        .status(200)
        .json(createResponse(true, userList, "Users searched successfully"));
    } catch (err) {
      res
        .status(500)
        .json(createResponse(false, null, "Error searching users"));
    }
  },

  getProfile: async (req, res) => {
    jwt.verify(
      req.headers.authorization,
      _const.JWT_ACCESS_KEY,
      async (err, decodedToken) => {
        if (err) {
          res.status(401).json(createResponse(false, null, "Unauthorized"));
        } else {
          try {
            const userId = decodedToken.user.id;

            const user = await db("users").where("id", userId).first();

            if (!user) {
              return res
                .status(404)
                .json(createResponse(false, null, "User not found"));
            }

            const formattedUser = {
              user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                username: user.username,
                password: user.password,
                role: user.role,
                status: user.status,
                image: user.image,
                created_at: user.created_at,
                updated_at: user.updated_at,
              },
              iat: decodedToken.iat,
              exp: decodedToken.exp,
            };

            res
              .status(200)
              .json(
                createResponse(
                  true,
                  formattedUser,
                  "Profile retrieved successfully"
                )
              );
          } catch (err) {
            console.log(err);
            res
              .status(500)
              .json(createResponse(false, null, "Error retrieving profile"));
          }
        }
      }
    );
  },

  // API mới cho frontend - lấy profile của user hiện tại
  getUserProfile: async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    console.log('Received token:', token); // Debug log
    console.log('Authorization header:', req.headers.authorization); // Debug log
    
    if (!token) {
      return res.status(401).json(createResponse(false, null, "Token required"));
    }

    jwt.verify(token, _const.JWT_ACCESS_KEY, async (err, decodedToken) => {
      if (err) {
        console.log('JWT verify error:', err); // Debug log
        return res.status(401).json(createResponse(false, null, "Invalid token"));
      }

      console.log('Decoded token:', decodedToken); // Debug log

      try {
        const userId = decodedToken.user.id;
        const user = await db("users").where("id", userId).first();

        if (!user) {
          return res.status(404).json(createResponse(false, null, "User not found"));
        }

        // Không trả về password
        const { password, ...userWithoutPassword } = user;

        res.status(200).json({
          status: 'success',
          data: userWithoutPassword,
          message: "Profile retrieved successfully"
        });
      } catch (err) {
        console.log(err);
        res.status(500).json(createResponse(false, null, "Error retrieving profile"));
      }
    });
  },

  // API mới cho frontend - cập nhật profile của user hiện tại
  updateUserProfile: async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json(createResponse(false, null, "Token required"));
    }

    jwt.verify(token, _const.JWT_ACCESS_KEY, async (err, decodedToken) => {
      if (err) {
        return res.status(401).json(createResponse(false, null, "Invalid token"));
      }

      try {
        const userId = decodedToken.user.id;
        const { username, phone, image, address } = req.body;

        // Kiểm tra username đã tồn tại chưa (trừ user hiện tại)
        if (username) {
          const existingUser = await db("users")
            .where("username", username)
            .whereNot("id", userId)
            .first();
          
          if (existingUser) {
            return res.status(400).json(createResponse(false, null, "Username already exists"));
          }
        }

        const updateData = {};
        if (username) updateData.username = username;
        if (phone) updateData.phone = phone;
        if (image) updateData.image = image;
        if (address !== undefined) updateData.address = address;

        const result = await db("users").where("id", userId).update(updateData);

        if (result === 0) {
          return res.status(404).json(createResponse(false, null, "User not found"));
        }

        res.status(200).json({
          status: 'success',
          data: null,
          message: "Profile updated successfully"
        });
      } catch (err) {
        console.log(err);
        res.status(500).json(createResponse(false, null, "Error updating profile"));
      }
    });
  },

  // API mới cho frontend - đổi mật khẩu của user hiện tại
  changeUserPassword: async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json(createResponse(false, null, "Token required"));
    }

    jwt.verify(token, _const.JWT_ACCESS_KEY, async (err, decodedToken) => {
      if (err) {
        return res.status(401).json(createResponse(false, null, "Invalid token"));
      }

      try {
        const userId = decodedToken.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
          return res.status(400).json(createResponse(false, null, "Current password and new password are required"));
        }

        if (newPassword.length < 6) {
          return res.status(400).json(createResponse(false, null, "New password must be at least 6 characters"));
        }

        const user = await db("users").where("id", userId).first();

        if (!user) {
          return res.status(404).json(createResponse(false, null, "User not found"));
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
          return res.status(400).json(createResponse(false, null, "Current password is incorrect"));
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        await db("users").where("id", userId).update({ password: hashedNewPassword });

        res.status(200).json({
          status: 'success',
          data: null,
          message: "Password changed successfully"
        });
      } catch (err) {
        console.log(err);
        res.status(500).json(createResponse(false, null, "Error changing password"));
      }
    });
  },

  updateProfile: async (req, res) => {
    try {
      const userId = req.params.id;
      const { username, email, phone, status, image } = req.body;

      const result = await db("users").where("id", userId).update({
        username,
        email,
        image,
        phone,
        status,
      });

      if (result === 0) {
        return res
          .status(404)
          .json(createResponse(false, null, "User not found"));
      }

      res
        .status(200)
        .json(createResponse(true, null, "Profile updated successfully"));
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json(createResponse(false, null, "Error updating profile"));
    }
  },

  changePassword: async (req, res) => {
    try {
      const userId = req.params.id;
      const { currentPassword, newPassword } = req.body;

      const user = await db("users").where("id", userId).first();

      if (!user) {
        return res
          .status(200)
          .json(createResponse(false, null, "User not found"));
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        return res
          .status(200)
          .json(createResponse(false, null, "Current password is incorrect"));
      }

      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      await db("users")
        .where("id", userId)
        .update({ password: hashedNewPassword });

      res
        .status(200)
        .json(createResponse(true, null, "Password changed successfully"));
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json(createResponse(false, null, "Error changing password"));
    }
  },
};

module.exports = userController;
