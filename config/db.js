const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hawkeye_vision',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initDB() {
    try {
        const connection = await pool.getConnection();
        console.log("MySQL Database connected successfully");

        // Users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Products table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                model VARCHAR(150) NOT NULL,
                category VARCHAR(150) NOT NULL,
                brand VARCHAR(150) NOT NULL,
                type VARCHAR(150) NOT NULL,
                description TEXT NOT NULL,
                price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                image VARCHAR(500) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Reviews table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                user_email VARCHAR(255) NOT NULL,
                username VARCHAR(255) NOT NULL,
                rating INT NOT NULL DEFAULT 5,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Carts table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS carts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Orders table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                username VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                address TEXT NOT NULL,
                payment_method VARCHAR(100) DEFAULT 'Cash on Delivery',
                order_status ENUM('Placed', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Placed',
                total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                items_json JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Check if admin user exists, if not create default admin
        const [adminRows] = await connection.query(`SELECT * FROM users WHERE role = 'admin' LIMIT 1`);
        if (adminRows.length === 0) {
            const adminPass = await bcrypt.hash('admin123', 10);
            await connection.query(
                `INSERT INTO users (username, email, password, phone, role) VALUES (?, ?, ?, ?, 'admin')`,
                ['Hawkeye Admin', 'admin@hawkeye.com', adminPass, '9876543210']
            );
            console.log("Default admin account created: admin@hawkeye.com / admin123");
        }

        // Check if any products exist, if not seed initial products with real models, brands, categories
        const [productRows] = await connection.query(`SELECT COUNT(*) as cnt FROM products`);
        if (productRows[0].cnt === 0) {
            console.log("Seeding initial products into MySQL...");
            const initialProducts = [
                {
                    name: 'Hikvision Bullet Camera',
                    model: 'DS-2CE16D0T-IRPF',
                    category: 'Analog Camera',
                    brand: 'Hikvision',
                    type: 'Fixed Bullet',
                    description: '2 MP bullet camera with Smart IR up to 20m, IP67 weather-resistant housing for outdoor surveillance.',
                    price: 1850.00,
                    image: '/products/product-list/hikvision-bullet-camera.png'
                },
                {
                    name: 'Hikvision 8 Channel NVR',
                    model: 'DS-7608NI-Q1',
                    category: 'NVR',
                    brand: 'Hikvision',
                    type: 'Network Video Recorder',
                    description: '8-ch Mini 1U 4K NVR with up to 8 MP decoding capacity and 1 SATA interface supporting up to 8TB.',
                    price: 6490.00,
                    image: '/products/product-list/hikvision-nvr.webp'
                },
                {
                    name: 'CP Plus Dome IP Camera',
                    model: 'CP-UNC-TA21PL3',
                    category: 'IP Camera',
                    brand: 'CP Plus',
                    type: 'Dome Network Camera',
                    description: '2MP Full HD IR dome network camera with 30m IR range, DWDR, and PoE support.',
                    price: 2450.00,
                    image: '/products/product-list/cpplus-ip-camera.png'
                },
                {
                    name: 'Dahua 4 Channel DVR',
                    model: 'DH-XVR1B04H-I',
                    category: 'DVR',
                    brand: 'Dahua',
                    type: 'Digital Video Recorder',
                    description: '4-Channel 5M-N/1080P WizSense digital video recorder with AI coding and smart motion detection.',
                    price: 3890.00,
                    image: '/products/product-list/dahua-dvr.webp'
                },
                {
                    name: 'TP Link PoE Switch',
                    model: 'TL-SF1009P',
                    category: 'Switches',
                    brand: 'TP Link',
                    type: 'Unmanaged PoE Switch',
                    description: '9-Port 10/100M Desktop Switch with 8-Port PoE+, 65W total power budget, ideal for IP surveillance.',
                    price: 3200.00,
                    image: '/products/product-list/tplink-switch.jpg'
                },
                {
                    name: 'Zebronics Analog Camera',
                    model: 'ZEB-HAWKEYE-2M',
                    category: 'Analog Camera',
                    brand: 'Zebronics',
                    type: 'Dome Camera',
                    description: 'High definition 2MP analog indoor camera with ICR switch, night vision, and wide dynamic range.',
                    price: 1350.00,
                    image: '/products/product-list/zebronics-camera.webp'
                },
                {
                    name: 'Panasonic IP Camera',
                    model: 'WV-S2231L',
                    category: 'IP Camera',
                    brand: 'Panasonic',
                    type: 'i-PRO Extreme Dome',
                    description: 'Full HD vandal-resistant indoor network camera with intelligent auto and enhanced H.265 compression.',
                    price: 8900.00,
                    image: '/products/product-list/panasonic-camera.png'
                },
                {
                    name: 'Toshiba 2 TB Surveillance Hard Disk',
                    model: 'S300-HDWT720',
                    category: 'Accessories',
                    brand: 'Toshiba',
                    type: 'Surveillance HDD',
                    description: '2TB 3.5-inch SATA internal surveillance hard drive engineered for 24/7 reliability in multi-stream systems.',
                    price: 4600.00,
                    image: '/products/product-list/toshiba-hdd.webp'
                },
                {
                    name: 'WD Purple 4 TB Hard Disk',
                    model: 'WD40PURZ',
                    category: 'Accessories',
                    brand: 'Western Digital',
                    type: 'Surveillance HDD',
                    description: '4TB surveillance internal hard drive with AllFrame technology tuned for write-intensive DVR/NVR environments.',
                    price: 7900.00,
                    image: '/products/product-list/wd-purple.webp'
                },
                {
                    name: 'D Link Network Switch',
                    model: 'DES-1016D',
                    category: 'Switches',
                    brand: 'D Link',
                    type: 'Fast Ethernet Switch',
                    description: '16-Port 10/100 Mbps unmanaged desktop/rackmount switch for expandable office and CCTV network backbones.',
                    price: 2950.00,
                    image: '/products/product-list/d-link-switch.webp'
                },
                {
                    name: 'Hi Focus Bullet Camera',
                    model: 'HF-20B-IR',
                    category: 'Analog Camera',
                    brand: 'Hi Focus',
                    type: 'Outdoor Bullet',
                    description: '2.4MP HD analog bullet camera with 20m infrared night vision and sturdy waterproof casing.',
                    price: 1550.00,
                    image: '/products/product-list/hifocus-bullet-camera.webp'
                },
                {
                    name: 'eSSL Face Recognition',
                    model: 'FaceStation 301',
                    category: 'Biometric attendance',
                    brand: 'eSSL',
                    type: 'Biometric Access Control',
                    description: 'AI-powered face recognition and RFID attendance terminal with dual cameras, touch screen, and access control.',
                    price: 12500.00,
                    image: '/products/product-list/essl-face-recognition.png'
                }
            ];

            for (const p of initialProducts) {
                await connection.query(
                    `INSERT INTO products (name, model, category, brand, type, description, price, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [p.name, p.model, p.category, p.brand, p.type, p.description, p.price, p.image]
                );
            }
            console.log("Initial products seeded successfully.");
        }

        connection.release();
    } catch (err) {
        console.error("Database connection / initialization failed:", err);
    }
}

initDB();

module.exports = pool;
