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
exports.getAllUsersController = async (req,res)=>{
    console.log("Inside getAllUsersController");
    const allUsers = await users.find({role:"user"})
    res.status(200).json(allUsers)
}
