const mongoose = require("mongoose");
const users = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// register user
exports.registerController = async (req,res)=>{
    console.log("Inside registerController");
    const {username, email, password, phone } = req.body
    const existingUser = await users.findOne({email})
    if(existingUser){
    res.status(409).json("User Already exists!!! Please Login...")
    }else{
        let encryptedPassword = await bcrypt.hash(password,10)
        const newUser = await users.create({username,email,password:encryptedPassword,phone})
    res.status(201).json(newUser)
    }
     
}

// user login 
exports.loginController = async (req,res)=>{
    console.log("Inside loginController");
    const {email, password} = req.body
    const existingUser = await users.findOne({email})
    if(existingUser){
        const isPasswordMatch = await bcrypt.compare(password,existingUser.password)
        if(isPasswordMatch){
            const token = jwt.sign({email,role:existingUser.role},process.env.JWT_SECRET)
return res.status(200).json({
  user: {
    _id: existingUser._id,
    username: existingUser.username,
    email: existingUser.email,
    phone: existingUser.phone,
    role: existingUser.role,
  },
  token,
});        }else{
         res.status(409).json("Incorrect Email/Password...")
        }
    }else{
         res.status(409).json("Invalid Email... Please Register")
    }
     
}

// get all users
exports.getAllUsersController = async (req, res) => {
  try {
    const allUsers = await users.find({role:"user"}).select("-password").sort({ _id: -1 });

    res.status(200).json({
      success: true,
      users: allUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Delete a customer
exports.deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the customer ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    // Find the customer
    const user = await users.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Prevent deleting an admin account
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be deleted here",
      });
    }

    // Delete the customer
    await users.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
};

// Get the logged-in user's profile
exports.getMyProfileController = async (req, res) => {
  try {
    const user = await users.findOne({ email: req.payload })
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
    });
  }
};


// Update profile and optionally change password
exports.updateMyProfileController = async (req, res) => {
  try {
    const {
      username,
      email,
      phone,
      currentPassword,
      newPassword,
    } = req.body;

    const user = await users.findOne({ email: req.payload });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Validate profile fields
    if (
      typeof username !== "string" ||
      !username.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof phone !== "string" ||
      !phone.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and phone are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether another account uses this email
    const existingUser = await users.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    // Change password only when a new password is supplied
    if (newPassword !== undefined && newPassword !== "") {
      if (
        typeof currentPassword !== "string" ||
        typeof newPassword !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter your current password and new password.",
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 8 characters.",
        });
      }

      const passwordMatches = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!passwordMatches) {
        return res.status(400).json({
          success: false,
          message: "Your current password is incorrect.",
        });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    user.username = username.trim();
    user.email = normalizedEmail;
    user.phone = phone.trim();

    await user.save();

    // Issue a fresh token because the email may have changed.
    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Never send the password hash to the frontend.
    const safeUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: safeUser,
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
};