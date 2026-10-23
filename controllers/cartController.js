// const carts = require('../models/cartModel')
// const plants = require('../models/plantModel')

// // add to cart
// exports.addToCartController = async (req, res) => {
//     console.log("Inside addToCartController");
//     const userMail = req.payload
//     const { plantId } = req.body
//     const plant = await plants.findById({ _id: plantId })
//     if (plant) {
//         const existingPlant = await carts.findOne({ userMail, plantId })
//         if (existingPlant) {
//             existingPlant.quantity += 1
//             existingPlant.totalPrice = existingPlant.quantity * existingPlant.price
//             await existingPlant.save()
//             res.status(200).json({
//                 status: 200,
//                 data: existingPlant
//             })
//         } else {
//             const newItemCart = await carts.create({ userMail, plantId, plantName: plant.name, plantImage: plant.image, quantity: 1, price: plant.price, totalPrice: plant.price })
//             res.status(201).json({ status: 201, data: newItemCart })

//         }
//     } else {
//         res.status(404).json("Plant Not Found")
//     }

// }

// // get cart items
// exports.getCartController = async (req, res) => {
//     console.log("Inside getCartController");
//     const userMail = req.payload
//     const allCartItems = await carts.find({ userMail })
//     res.status(200).json(allCartItems)
// }

// // increment quantity controller
// exports.incrementQuantityController = async (req, res) => {
//     console.log("Inside incrementQuantityController");
//     const { cartId } = req.params
//     const cartItem = await carts.findById(cartId)
//     cartItem.quantity += 1
//     cartItem.totalPrice = cartItem.quantity * cartItem.price
//     await cartItem.save()
//     res.status(200).json(cartItem)
// }

// // decrement quantity controller
// exports.decrementQuantityController = async (req, res) => {
//     console.log("Inside decrementQuantityController");
//     const { cartId } = req.params
//     const cartItem = await carts.findById(cartId)
//     if (cartItem.quantity > 1) {
//         cartItem.quantity -= 1
//         cartItem.totalPrice = cartItem.quantity * cartItem.price
//         await cartItem.save()
//         res.status(200).json({ data: cartItem, message: "Quantity decremented" })

//     } else {
//         await carts.findByIdAndDelete(cartId)
//         res.status(200).json({ message: "Plant removed from cart" })

//     }

// }

// // delete cart item
// exports.removeCartItemController = async (req, res) => {
//     console.log("Inside removeCartItemController");
//     const { cartId } = req.params
//     const removeItem = await carts.findByIdAndDelete(cartId)
//     res.status(200).json(removeItem)

// }

// // delete all items from cart after place order
// exports.removeAllCartItemsController = async (req, res) => {
//     console.log("Inside removeAllCartItemsController");
//     const  userMail  = req.payload
//     const removeAllCartItems = await carts.deleteMany({userMail})
//     res.status(200).json(removeAllCartItems)

// }