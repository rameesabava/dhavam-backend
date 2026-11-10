// services/productService.js
const db = require('./dbClient');

/* Helper */
async function query(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

/* Create product with sizes */
exports.createProduct = async ({ name, description, category, imageUrl, sizes = [] }) => {
  const result = await query(
    `INSERT INTO Product (name, description, category, imageUrl) VALUES (?,?,?,?)`,
    [name, description, category, imageUrl]
  );
  const productId = result.insertId;

  // Insert sizes (price is DECIMAL)
  for (const s of sizes) {
    await query(
      `INSERT INTO ProductSize (productId, size, price) VALUES (?,?,?)`,
      [productId, s.size, s.price]
    );
  }

  // Return product w/ sizes
  const product = await exports.getProductById(productId);
  return product;
};

/* Get product by id (includes sizes) */
exports.getProductById = async (id) => {
  const [product] = await query('SELECT * FROM Product WHERE id = ?', [id]);
  if (!product) return null;
  const sizes = await query('SELECT id, size, price FROM ProductSize WHERE productId = ?', [id]);
  product.sizes = sizes;
  return product;
};


/* Update product (including sizes) */
exports.updateProduct = async (id, data) => {
  const { name, description, category, imageUrl, sizes } = data;

  // Update main product details
  const set = [];
  const params = [];

  if (name !== undefined) {
    set.push('name = ?');
    params.push(name);
  }

  if (description !== undefined) {
    set.push('description = ?');
    params.push(description);
  }

  if (category !== undefined) {
    set.push('category = ?');
    params.push(category);
  }

  if (imageUrl !== undefined) {
    set.push('imageUrl = ?');
    params.push(imageUrl);
  }

  if (set.length > 0) {
    await query(
      `UPDATE Product SET ${set.join(', ')} WHERE id = ?`,
      [...params, id]
    );
  }

  // Replace all existing sizes when sizes are included in the request
  if (Array.isArray(sizes)) {
    // Remove old size/price rows for this product
    await query(
      'DELETE FROM ProductSize WHERE productId = ?',
      [id]
    );

    // Insert the newly submitted sizes and prices
    for (const s of sizes) {
      if (!s.size || s.price === undefined || s.price === null || s.price === '') {
        throw new Error('Each size must have a size name and price.');
      }

      const price = Number(s.price);

      if (!Number.isFinite(price) || price < 0) {
        throw new Error(`Invalid price for size ${s.size}.`);
      }

      await query(
        `INSERT INTO ProductSize (productId, size, price)
         VALUES (?, ?, ?)`,
        [id, s.size.trim(), price]
      );
    }
  }

  return await exports.getProductById(id);
};


/* Delete product (cascades sizes via foreign key ON DELETE CASCADE) */
exports.deleteProduct = async (id) => {
  await query('DELETE FROM Product WHERE id = ?', [id]);
};

/* List all products with sizes */
exports.listProducts = async () => {
  const products = await query('SELECT * FROM Product');
  for (const p of products) {
    p.sizes = await query('SELECT id, size, price FROM ProductSize WHERE productId = ?', [p.id]);
  }
  return products;
};