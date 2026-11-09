// services/userService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./dbClient');

/* Helper – returns rows (or empty array) */
async function query(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

/* Register a new user */
exports.register = async ({ username, email, password, phone }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1️⃣ check existence
  const exists = await query('SELECT id FROM User WHERE email = ?', [normalizedEmail]);
  if (exists.length) {
    const err = new Error('User already exists');
    err.status = 409;
    throw err;
  }

  // 2️⃣ hash password
  const hashed = await bcrypt.hash(password, 10);

  // 3️⃣ insert
  const result = await query(
    `INSERT INTO User (username, email, password, phone, role) VALUES (?,?,?, ?, 'user')`,
    [username?.trim(), normalizedEmail, hashed, phone?.trim()]
  );

  // 4️⃣ return the created row (without password)
  const [user] = await query(
    'SELECT id, email, username, phone, role FROM User WHERE id = ?',
    [result.insertId]
  );
  return user;
};

/* Login */
exports.login = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await query('SELECT * FROM User WHERE email = ?', [normalizedEmail]);

  if (!user) {
    const err = new Error('Invalid email');
    err.status = 401;
    throw err;
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const err = new Error('Incorrect password');
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    { email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  const { password: _, ...userInfo } = user;
  return { user: userInfo, token };
};

/* Get all non‑admin users */
exports.getAllUsers = async () => {
  return await query("SELECT id, email, username, phone, role FROM User WHERE role = 'user'");
};

/* Delete a user (admin only) */
exports.deleteUser = async (id) => {
  const [row] = await query('SELECT role FROM User WHERE id = ?', [Number(id)]);
  if (!row) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  if (row.role === 'admin') {
    const err = new Error('Cannot delete admin account');
    err.status = 403;
    throw err;
  }
  await query('DELETE FROM User WHERE id = ?', [Number(id)]);
};

/* Get profile of logged‑in user */
exports.getProfile = async (email) => {
  const [user] = await query(
    'SELECT id, email, username, phone, role FROM User WHERE email = ?',
    [email.trim().toLowerCase()]
  );
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
};

/* Update profile (optional password change) */
exports.updateProfile = async (email, updates) => {
  const { username, phone, currentPassword, newPassword } = updates;
  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await query('SELECT * FROM User WHERE email = ?', [normalizedEmail]);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const set = [];
  const params = [];

  if (username) {
    set.push('username = ?');
    params.push(username.trim());
  }
  if (phone) {
    set.push('phone = ?');
    params.push(phone.trim());
  }

  if (newPassword) {
    if (!currentPassword) {
      const err = new Error('Current password required to set a new password');
      err.status = 400;
      throw err;
    }
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      const err = new Error('Current password is incorrect');
      err.status = 400;
      throw err;
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    set.push('password = ?');
    params.push(hashed);
  }

  if (set.length) {
    const sql = `UPDATE User SET ${set.join(', ')} WHERE email = ?`;
    params.push(normalizedEmail);
    await query(sql, params);
  }

  // Return fresh user data
  const [updated] = await query(
    'SELECT id, email, username, phone, role FROM User WHERE email = ?',
    [normalizedEmail]
  );
  return { user: updated };
};