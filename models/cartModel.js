const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    userMail: {
        type: String,
        required: true
    },
    productId: {
        type: String,
        required: true
    },
    productName:{
        type:String,
        required:true
    },
    productImage:{
        type:String,
        required:true
    },
    size:{
        type: String,
        required:true
    },
    quantity: {
        type: Number,
        default: 1
    },
    
}, {
    timestamps: true
})

const carts = mongoose.model("carts", cartSchema)
module.exports = carts