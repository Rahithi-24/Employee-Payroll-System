CREATE DATABASE IF NOT EXISTS payroll_db;
USE payroll_db;

-- 1. Employees Table
CREATE TABLE IF NOT EXISTS employees (
  employee_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  email VARCHAR(100) NOT NULL UNIQUE,
  joining_date DATE NOT NULL
);

-- 2. Salary Details Table
CREATE TABLE IF NOT EXISTS salary_details (
  salary_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL UNIQUE,
  basic_salary DECIMAL(10,2) NOT NULL,
  allowance DECIMAL(10,2) DEFAULT 0.00,
  deduction DECIMAL(10,2) DEFAULT 0.00,
  net_salary DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
);

-- 3. Payroll Table
CREATE TABLE IF NOT EXISTS payroll (
  payroll_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  salary_id INT NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  payment_date DATE NOT NULL,
  payment_status VARCHAR(30) DEFAULT 'Pending',
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  FOREIGN KEY (salary_id) REFERENCES salary_details(salary_id) ON DELETE CASCADE
);

-- Sample Seed Data (9 Employees)
INSERT INTO employees (name, department, designation, phone, email, joining_date) VALUES
('Sarah Jenkins', 'Engineering', 'Senior Developer', '9876543210', 'sarah.j@company.com', '2023-01-15'),
('Michael Chen', 'Human Resources', 'HR Manager', '9876543211', 'michael.c@company.com', '2022-06-01'),
('Priya Sharma', 'Finance', 'Financial Analyst', '9876543212', 'priya.s@company.com', '2023-09-10'),
('Rohan Verma', 'Engineering', 'Backend Developer', '9812345670', 'rohan.v@company.com', '2023-02-15'),
('Ananya Deshmukh', 'Marketing', 'Content Strategist', '9823456781', 'ananya.d@company.com', '2023-04-10'),
('Vikram Malhotra', 'Finance', 'Tax Consultant', '9834567892', 'vikram.m@company.com', '2022-11-01'),
('Kavya Reddy', 'Human Resources', 'Talent Acquisition Lead', '9845678903', 'kavya.r@company.com', '2023-08-20'),
('Arjun Nair', 'Engineering', 'DevOps Engineer', '9856789014', 'arjun.n@company.com', '2024-01-05'),
('Sneha Patel', 'Operations', 'Operations Manager', '9867890125', 'sneha.p@company.com', '2022-03-18');

INSERT INTO salary_details (employee_id, basic_salary, allowance, deduction, net_salary) VALUES
(1, 75000.00, 12000.00, 5000.00, 82000.00),
(2, 65000.00, 8000.00, 4000.00, 69000.00),
(3, 55000.00, 6000.00, 3000.00, 58000.00),
(4, 60000.00, 8000.00, 3500.00, 64500.00),  -- Rohan Verma
(5, 45000.00, 5000.00, 2500.00, 47500.00),  -- Ananya Deshmukh
(6, 70000.00, 10000.00, 4500.00, 75500.00), -- Vikram Malhotra
(7, 52000.00, 6500.00, 3000.00, 55500.00),  -- Kavya Reddy
(8, 68000.00, 9500.00, 4000.00, 73500.00),  -- Arjun Nair
(9, 58000.00, 7200.00, 3200.00, 62000.00);  -- Sneha Patel

INSERT INTO payroll (employee_id, salary_id, month, year, payment_date, payment_status) VALUES
(1, 1, 11, 2026, '2026-11-01', 'Paid'),
(2, 2, 11, 2026, '2026-11-01', 'Paid'),
(3, 3, 11, 2026, '2026-11-05', 'Pending'),
(4, 4, 11, 2026, '2026-11-01', 'Paid'),
(5, 5, 11, 2026, '2026-11-01', 'Paid'),
(6, 6, 11, 2026, '2026-11-02', 'Paid'),
(7, 7, 11, 2026, '2026-11-05', 'Pending'),
(8, 8, 11, 2026, '2026-11-05', 'Pending'),
(9, 9, 11, 2026, '2026-11-01', 'Paid');
