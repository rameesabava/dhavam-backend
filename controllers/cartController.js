const carts = require('../models/cartModel')
const products = require('../models/productModel')

// // add to cart
exports.addToCartController = async (req, res) => {
    console.log("Inside addToCartController");
    const userMail = req.payload
    const { productId } = req.body
    const product = await products.findById({ _id: productId })
    if (product) {
        const existingProduct = await carts.findOne({ userMail, productId })
        if (existingProduct) {
            existingProduct.quantity += 1
            await existingProduct.save()
            res.status(200).json({
                status: 200,
                data: existingProduct
            })
        } else {
            const newItemCart = await carts.create({ userMail, productId, productName: product.name, productImage: product.image, size, quantity: 1 })
            res.status(201).json({ status: 201, data: newItemCart })

        }
    } else {
        res.status(404).json("Product Not Found")
    }

}

// // get cart items
exports.getCartController = async (req, res) => {
    console.log("Inside getCartController");
    const userMail = req.payload
    const allCartItems = await carts.find({ userMail })
    res.status(200).json(allCartItems)
}

// // increment quantity controller
exports.incrementQuantityController = async (req, res) => {
    console.log("Inside incrementQuantityController");
    const { cartId } = req.params
    const cartItem = await carts.findById(cartId)
    cartItem.quantity += 1
    await cartItem.save()
    res.status(200).json(cartItem)
}

// // decrement quantity controller
exports.decrementQuantityController = async (req, res) => {
    console.log("Inside decrementQuantityController");
    const { cartId } = req.params
    const cartItem = await carts.findById(cartId)
    if (cartItem.quantity > 1) {
        cartItem.quantity -= 1
        await cartItem.save()
        res.status(200).json({ data: cartItem, message: "Quantity decremented" })

    } else {
        await carts.findByIdAndDelete(cartId)
        res.status(200).json({ message: "Product removed from cart" })

    }

}

// // delete cart item
exports.removeCartItemController = async (req, res) => {
    console.log("Inside removeCartItemController");
    const { cartId } = req.params
    const removeItem = await carts.findByIdAndDelete(cartId)
    res.status(200).json(removeItem)

}

// // delete all items from cart after place order
exports.removeAllCartItemsController = async (req, res) => {
    console.log("Inside removeAllCartItemsController");
    const  userMail  = req.payload
    const removeAllCartItems = await carts.deleteMany({userMail})
    res.status(200).json(removeAllCartItems)

}