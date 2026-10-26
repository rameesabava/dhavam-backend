const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    group: {
        type: String,
        default: "whole"
    },

    image: {
        type: String,
        required: true
    },
    sizes:{
        type: [String],
        default:[]
        
    }

})

const products = mongoose.model("products", productSchema)
module.exports = products