const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register user
exports.registerController = async (req, res) => {
    try {
        console.log("Inside registerController");
        const { username, email, password, phone } = req.body;

        if (!username || !email || !password || !phone) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if existing user
        const [existing] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
        if (existing.length > 0) {
            return res.status(409).json({ message: "An account with this email already exists. Please log in." });
        }

        const encryptedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            "INSERT INTO users (username, email, password, phone, role) VALUES (?, ?, ?, ?, 'user')",
            [username.trim(), normalizedEmail, encryptedPassword, phone.trim()]
        );

        const newUser = {
            id: result.insertId,
            username: username.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            role: "user"
        };

        return res.status(201).json(newUser);
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ success: false, message: "Server error during registration", error: error.message });
    }
};

// User / Admin login
exports.loginController = async (req, res) => {
    try {
        console.log("Inside loginController");
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "No account found with this email. Please register." });
        }

        const existingUser = rows[0];
        const isPasswordMatch = await bcrypt.compare(password, existingUser.password);

        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Incorrect password. Please try again." });
        }

        const token = jwt.sign(
            { email: existingUser.email, role: existingUser.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            user: {
                id: existingUser.id,
                username: existingUser.username,
                email: existingUser.email,
                phone: existingUser.phone,
                role: existingUser.role,
            },
            token,
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Server error during login", error: error.message });
    }
};

// Get all users (Admin only)
exports.getAllUsersController = async (req, res) => {
    try {
        const [allUsers] = await pool.query(
            "SELECT id, username, email, phone, role, created_at FROM users WHERE role = 'user' ORDER BY id DESC"
        );

        return res.status(200).json({
            success: true,
            users: allUsers,
        });
    } catch (error) {
        console.error("Get all users error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message,
        });
    }
};

// Delete a customer (Admin only)
exports.deleteUserController = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        const user = rows[0];
        if (user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin accounts cannot be deleted here",
            });
        }

        await pool.query("DELETE FROM users WHERE id = ?", [id]);

        return res.status(200).json({
            success: true,
            message: "Customer deleted successfully",
        });
    } catch (error) {
        console.error("Delete customer error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete customer",
            error: error.message,
        });
    }
};

// Get the logged-in user's profile
exports.getMyProfileController = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, username, email, phone, role, created_at FROM users WHERE email = ? LIMIT 1",
            [req.payload]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            user: rows[0],
        });
    } catch (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch profile.",
            error: error.message,
        });
    }
};

// Update profile and optionally change password
exports.updateMyProfileController = async (req, res) => {
    try {
        const {
            username,
            email,
            phone,
            currentPassword,
            newPassword,
        } = req.body;

        const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [req.payload]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const user = rows[0];

        if (
            typeof username !== "string" ||
            !username.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof phone !== "string" ||
            !phone.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Username, email, and phone are required.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if another account uses this email
        const [existing] = await pool.query(
            "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
            [normalizedEmail, user.id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered.",
            });
        }

        let updatedPassword = user.password;

        if (newPassword !== undefined && newPassword !== "") {
            if (
                typeof currentPassword !== "string" ||
                typeof newPassword !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Enter your current password and new password.",
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "New password must be at least 6 characters.",
                });
            }

            const passwordMatches = await bcrypt.compare(
                currentPassword,
                user.password
            );

            if (!passwordMatches) {
                return res.status(400).json({
                    success: false,
                    message: "Your current password is incorrect.",
                });
            }

            updatedPassword = await bcrypt.hash(newPassword, 10);
        }

        await pool.query(
            "UPDATE users SET username = ?, email = ?, phone = ?, password = ? WHERE id = ?",
            [username.trim(), normalizedEmail, phone.trim(), updatedPassword, user.id]
        );

        // Issue fresh token
        const token = jwt.sign(
            { email: normalizedEmail, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const safeUser = {
            id: user.id,
            username: username.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            role: user.role,
        };

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: safeUser,
            token,
        });
    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile.",
            error: error.message,
        });
    }
};
