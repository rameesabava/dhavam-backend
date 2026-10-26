const users = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

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
            res.status(200).json({user:existingUser,token})
        }else{
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await users.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Prevent deleting administrator accounts
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be deleted here.",
      });
    }

    await users.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete customer.",
      error: error.message,
    });
  }
};
