const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    userMail: {
        type: String,
        required: true
    },
    plantId: {
        type: String,
        required: true
    },
    plantName:{
        type:String,
        required:true
    },
    plantImage:{
        type:String,
        required:true
    },
    quantity: {
        type: Number,
        default: 1
    },
    price: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
}, {
    timestamps: true
})

const carts = mongoose.model("carts", cartSchema)
module.exports = carts