-- Reference schema (MySQL 8). Django migrations are the source of truth:  python manage.py migrate
-- For PostgreSQL replace AUTO_INCREMENT PK with BIGSERIAL / GENERATED ALWAYS AS IDENTITY.
CREATE DATABASE IF NOT EXISTS finance_db CHARACTER SET utf8mb4;
USE finance_db;

-- 1. Users: Django's built-in auth_user table (passwords stored as PBKDF2 hashes)
CREATE TABLE auth_user (
  id INT AUTO_INCREMENT PRIMARY KEY, password VARCHAR(128) NOT NULL, last_login DATETIME NULL,
  is_superuser TINYINT(1) NOT NULL DEFAULT 0, username VARCHAR(150) NOT NULL UNIQUE,
  first_name VARCHAR(150) NOT NULL DEFAULT '', last_name VARCHAR(150) NOT NULL DEFAULT '',
  email VARCHAR(254) NOT NULL DEFAULT '', is_staff TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1, date_joined DATETIME NOT NULL
);

-- 2. UserProfiles (1:1 with user)
CREATE TABLE users_userprofile (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL DEFAULT '', currency VARCHAR(5) NOT NULL DEFAULT 'INR',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE
);

-- 3. Categories (per user, typed income/expense)
CREATE TABLE finance_category (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, name VARCHAR(50) NOT NULL,
  type ENUM('income','expense') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cat (user_id, name, type),
  FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE
);

-- 4/5/6. Transactions: income + expense records share ONE table; `type` distinguishes them
--        (the /income/ and /expenses/ endpoints are filtered views of this table).
CREATE TABLE finance_transaction (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, category_id BIGINT NOT NULL,
  type ENUM('income','expense') NOT NULL, amount DECIMAL(12,2) NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  payment_method ENUM('Cash','UPI','Credit Card','Debit Card','Bank Transfer') NOT NULL DEFAULT 'Cash',
  date DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT txn_amount_positive CHECK (amount > 0),
  INDEX idx_txn_date (date), INDEX idx_txn_type (type),
  FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES finance_category(id) ON DELETE RESTRICT
);

-- 7. Budgets (category_id NULL = overall monthly budget)
CREATE TABLE finance_budget (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, category_id BIGINT NULL,
  month DATE NOT NULL, amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_budget (user_id, category_id, month),
  FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES finance_category(id) ON DELETE CASCADE
);
