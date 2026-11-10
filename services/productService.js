// services/productService.js

// Base API URL (used to build public image URLs)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper: turn a stored filename into a fully‑qualified URL
function publicImageUrl(filename) {
  if (!filename) return '';
  // If the DB already contains a complete URL, just return it
  if (/^https?:\/\//i.test(filename)) return filename;
  // Encode any special characters (spaces, etc.)
  const encoded = encodeURIComponent(filename);
  return `${API_URL}/uploads/${encoded}`;
}

const db = require('./dbClient');

/** Helper to execute a query and return rows */
async function query(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

/** Create a new product (admin) */
exports.createProduct = async ({ name, description, category, imageUrl, sizes = [] }) => {
  const result = await query(
    `INSERT INTO Product (name, description, category, imageUrl) VALUES (?,?,?,?)`,
    [name, description, category, imageUrl]
  );
  const productId = result.insertId;

  // Insert size/price rows
  for (const s of sizes) {
    await query(
      `INSERT INTO ProductSize (productId, size, price) VALUES (?,?,?)`,
      [productId, s.size, s.price]
    );
  }

  // Return the freshly created product (image URL is fixed by getProductById)
  return await exports.getProductById(productId);
};

/** Retrieve a single product, including its sizes */
exports.getProductById = async (id) => {
  const [product] = await query('SELECT * FROM Product WHERE id = ?', [id]);
  if (!product) return null;
  const sizes = await query('SELECT id, size, price FROM ProductSize WHERE productId = ?', [id]);
  product.sizes = sizes;
  product.imageUrl = publicImageUrl(product.imageUrl);
  return product;
};

/** List all products (public) */
exports.listProducts = async () => {
  const products = await query('SELECT * FROM Product');
  for (const p of products) {
    p.sizes = await query('SELECT id, size, price FROM ProductSize WHERE productId = ?', [p.id]);
    p.imageUrl = publicImageUrl(p.imageUrl);
  }
  return products;
};

/** Update an existing product (admin) */
exports.updateProduct = async (id, data) => {
  const { name, description, category, imageUrl, sizes } = data;
  const set = [];
  const params = [];

  if (name !== undefined) { set.push('name = ?'); params.push(name); }
  if (description !== undefined) { set.push('description = ?'); params.push(description); }
  if (category !== undefined) { set.push('category = ?'); params.push(category); }
  if (imageUrl !== undefined) { set.push('imageUrl = ?'); params.push(imageUrl); }

  if (set.length > 0) {
    await query(`UPDATE Product SET ${set.join(', ')} WHERE id = ?`, [...params, id]);
  }

  // Replace sizes if supplied
  if (Array.isArray(sizes)) {
    await query('DELETE FROM ProductSize WHERE productId = ?', [id]);
    for (const s of sizes) {
      if (!s.size || s.price === undefined || s.price === null || s.price === '') {
        throw new Error('Each size must have a size name and price.');
      }
      const price = Number(s.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error(`Invalid price for size ${s.size}.`);
      }
      await query(
        `INSERT INTO ProductSize (productId, size, price) VALUES (?,?,?)`,
        [id, s.size.trim(), price]
      );
    }
  }

  return await exports.getProductById(id);
};

/** Delete a product (admin) */
exports.deleteProduct = async (id) => {
  await query('DELETE FROM Product WHERE id = ?', [id]);
};
