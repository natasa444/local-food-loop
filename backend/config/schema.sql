-- Local Food Loop Database Schema

CREATE TABLE IF NOT EXISTS user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('consumer', 'farmer', 'admin') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produce (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  unit VARCHAR(50) NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  available_from DATE NOT NULL,
  available_until DATE NOT NULL,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscription (
  id INT AUTO_INCREMENT PRIMARY KEY,
  box_size ENUM('small', 'medium', 'large') NOT NULL DEFAULT 'medium',
  frequency ENUM('weekly', 'biweekly', 'monthly') NOT NULL DEFAULT 'weekly',
  start_date DATE NOT NULL,
  status ENUM('active', 'paused', 'cancelled') NOT NULL DEFAULT 'active',
  pause_start DATE NULL,
  pause_end DATE NULL,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS delivery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scheduled_date DATE NOT NULL,
  status ENUM('pending', 'in_transit', 'delivered') NOT NULL DEFAULT 'pending',
  drop_off_location VARCHAR(255) NOT NULL,
  subscription_id INT NOT NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscription(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS manifest (
  id INT AUTO_INCREMENT PRIMARY KEY,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  finalized BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_id INT NOT NULL,
  FOREIGN KEY (delivery_id) REFERENCES delivery(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS manifest_item (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  manifest_id INT NOT NULL,
  produce_id INT NOT NULL,
  FOREIGN KEY (manifest_id) REFERENCES manifest(id) ON DELETE CASCADE,
  FOREIGN KEY (produce_id) REFERENCES produce(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS box_customization (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deadline DATETIME NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  subscription_id INT NOT NULL,
  produce_id INT NOT NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscription(id) ON DELETE CASCADE,
  FOREIGN KEY (produce_id) REFERENCES produce(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('low_inventory', 'delivery_update', 'subscription_change') NOT NULL,
  message TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Admin user (password: admin123)
INSERT IGNORE INTO user (first_name, last_name, email, password_hash, role)
VALUES ('Admin', 'User', 'admin@localfoodloop.com',
'$2a$10$L5rY5U2UfsjIeqQIijzG9.JqjXQor/6QQIXl4OGaJf1E9V/Iflbnm', 'admin');