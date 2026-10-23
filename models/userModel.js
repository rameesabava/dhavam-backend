const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    
    role: {
        type: String,
        required: true,
        default: "user"
    }
})

const users = mongoose.model("users", userSchema)
module.exports = users