// services/cartService.js
const db = require('./dbClient');
const bcrypt = require('bcryptjs'); // keep for password checks if needed

async function query(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

/* Add an item to cart */
exports.addToCart = async ({ userId, productId, size, quantity = 1 }) => {
  // Fetch product name & image for convenience (optional)
  const [product] = await query('SELECT name, imageUrl FROM Product WHERE id = ?', [productId]);
  if (!product) throw new Error('Product not found');

  // Insert cart item
  await query(
    `INSERT INTO CartItem (userId, productId, productName, productImage, size, quantity)
     VALUES (?,?,?, ?, ?, ?)`,
    [userId, productId, product.name, product.imageUrl, size, quantity]
  );
};

/* Get cart for a user (with price lookup) */
exports.getCartItems = async (userId) => {
  const items = await query(
    `SELECT ci.id, ci.productId, ci.productName, ci.productImage, ci.size, ci.quantity,
            ps.price
     FROM CartItem ci
     JOIN ProductSize ps ON ps.productId = ci.productId AND ps.size = ci.size
     WHERE ci.userId = ?`,
    [userId]
  );
  return items;
};

/* Remove cart item */
exports.removeFromCart = async (cartItemId, userId) => {
  await query('DELETE FROM CartItem WHERE id = ? AND userId = ?', [cartItemId, userId]);
};

/* Clear cart */
exports.clearCart = async (userId) => {
  await query('DELETE FROM CartItem WHERE userId = ?', [userId]);
};

/* Update quantity (+1 or -1) */
exports.updateQuantity = async (cartItemId, delta) => {
  const [item] = await query('SELECT quantity FROM CartItem WHERE id = ?', [cartItemId]);
  if (!item) throw new Error('Cart item not found');

  const newQty = Math.max(1, item.quantity + delta);
  await query('UPDATE CartItem SET quantity = ? WHERE id = ?', [newQty, cartItemId]);

  const [updated] = await query('SELECT * FROM CartItem WHERE id = ?', [cartItemId]);
  return updated;
};
