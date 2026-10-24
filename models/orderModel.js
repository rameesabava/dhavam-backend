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
            productId: {
                type: String,
                required: true
            },
            productName: {
                type: String,
                required: true
            },
            productImage: {
                type: String,
                required: true
            },
            size: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            
        }
    ],

    address: {
        type: String,
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