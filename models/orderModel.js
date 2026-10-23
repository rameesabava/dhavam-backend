const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    userMail: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    items: [
        {
            plantId: {
                type: String,
                required: true
            },
            plantName: {
                type: String,
                required: true
            },
            plantImage: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],

    address: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        default: 'Cash on Delivery'
    },
    orderStatus: {
        type: String,
        default: "Placed"
    }
}, {
    timestamps: true
})

const orders = mongoose.model("orders", orderSchema)

module.exports = orders