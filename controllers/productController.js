const products = require('../models/productModel')

// add product
exports.addProductController = async (req, res) => {
    console.log("Inside addProductController");
    const { name, description, group, image, sizes } = req.body
    const uploadimage = req.file?req.file.filename:image
    const productDetails = await products.create({ name, description, group, image:uploadimage, sizes })
    res.status(200).json(productDetails)
}

// get products
exports.getAllProductsController = async (req,res)=>{
    console.log("Inside getAllProductsController");
    const allProducts = await products.find()
    res.status(200).json(allProducts)
}

// view product
exports.viewProductController = async (req,res)=>{
    console.log("Inside viewProductController");
    const {id} = req.params
    const productDetails = await products.findById({_id:id})
    res.status(200).json(productDetails)
}

// update product
exports.updateProductController = async (req, res) => {
    console.log("Inside updateProductController")

    const { id } = req.params
    const {name, description, group, image, sizes} = req.body

    const uploadedimage = req.file ? req.file.filename : image

    const updatedProduct = await products.findByIdAndUpdate({ _id: id },{name, description, group, image: uploadedimage, sizes},{ new: true })
    
    res.status(200).json(updatedProduct)
}