const express = require('express')
const userController = require('../controllers/userController')
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const adminMiddleware = require('../middlewares/adminMiddleware')
const jwtMiddleware = require('../middlewares/jwtMiddleware')
const multerMiddleware = require('../middlewares/multerMiddleware')

const router = new express.Router()

// -------unauthorised-------------------------
// register
router.post('/register',userController.registerController)
// login
router.post('/login',userController.loginController)

// -------------------admin----------------------------------------
// add product
router.post('/product/add',adminMiddleware,multerMiddleware.single('image'), productController.addProductController)

// update product
router.put('/product/:id',adminMiddleware,multerMiddleware.single('image'), productController.updateProductController)

// get all users
router.get('/admin/users', adminMiddleware, userController.getAllUsersController)

// get all orders
router.get('/admin/orders', adminMiddleware, orderController.getAllOrdersController)

// view order
router.get('/order/:id', adminMiddleware, orderController.viewOrderController)

// update status of order
router.put("/order/status/:id", adminMiddleware,orderController.updateOrderStatusController);

// to delete user
router.delete("/admin/users/:id",adminMiddleware,userController.deleteUserController);


// -------------------------user------------------------------------
// get products
router.get('/products', jwtMiddleware, productController.getAllProductsController)

// view plant
router.get('/product/:id', jwtMiddleware, productController.viewProductController)

// add plant to cart
router.post('/cart/add',jwtMiddleware, cartController.addToCartController)

// get cart items
router.get('/cart', jwtMiddleware, cartController.getCartController)

// incremet quantity
router.put('/cart/increment/:cartId', jwtMiddleware, cartController.incrementQuantityController)

// decremet quantity
router.put('/cart/decrement/:cartId', jwtMiddleware, cartController.decrementQuantityController)

// remove cart item
router.delete('/cart/remove/:cartId', jwtMiddleware, cartController.removeCartItemController)

// remove all cart items
router.delete('/cart/remove', jwtMiddleware, cartController.removeAllCartItemsController)

// add order
router.post('/order/add',jwtMiddleware, orderController.addOrderController)

// Get logged-in user's orders
router.get('/myOrders',jwtMiddleware,orderController.getMyOrdersController);

// delete product
router.delete("/product/:id",adminMiddleware,productController.deleteProductController);


/* User routes */
router.put(
  "/myOrders/cancel/:id",
  jwtMiddleware,
  orderController.cancelMyOrderController
);

module.exports = router