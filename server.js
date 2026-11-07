const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- EMPLOYEES API ---
app.get('/api/employees', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees ORDER BY employee_id DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { name, department, designation, phone, email, joining_date } = req.body;
    const [res1] = await pool.query(
      'INSERT INTO employees (name, department, designation, phone, email, joining_date) VALUES (?, ?, ?, ?, ?, ?)',
      [name, department, designation, phone, email, joining_date]
    );
    res.json({ message: 'Employee added successfully', employee_id: res1.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM employees WHERE employee_id = ?', [req.params.id]);
    res.json({ message: 'Employee deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SALARY DETAILS API ---
app.get('/api/salaries', async (req, res) => {
  try {
    const query = `
      SELECT s.*, e.name AS employee_name, e.department, e.designation 
      FROM salary_details s 
      JOIN employees e ON s.employee_id = e.employee_id
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/salaries', async (req, res) => {
  try {
    const { employee_id, basic_salary, allowance, deduction } = req.body;
    const net_salary = parseFloat(basic_salary) + parseFloat(allowance || 0) - parseFloat(deduction || 0);

    const [existing] = await pool.query('SELECT salary_id FROM salary_details WHERE employee_id = ?', [employee_id]);
    if (existing.length > 0) {
      await pool.query(
        'UPDATE salary_details SET basic_salary=?, allowance=?, deduction=?, net_salary=? WHERE employee_id=?',
        [basic_salary, allowance, deduction, net_salary, employee_id]
      );
    } else {
      await pool.query(
        'INSERT INTO salary_details (employee_id, basic_salary, allowance, deduction, net_salary) VALUES (?, ?, ?, ?, ?)',
        [employee_id, basic_salary, allowance, deduction, net_salary]
      );
    }
    res.json({ message: 'Salary structure updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PAYROLL API ---
app.get('/api/payroll', async (req, res) => {
  try {
    const query = `
      SELECT p.*, e.name AS employee_name, e.department, s.net_salary, s.basic_salary, s.allowance, s.deduction
      FROM payroll p
      JOIN employees e ON p.employee_id = e.employee_id
      JOIN salary_details s ON p.salary_id = s.salary_id
      ORDER BY p.payroll_id DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/payroll', async (req, res) => {
  try {
    const { employee_id, month, year, payment_date, payment_status } = req.body;
    const [sal] = await pool.query('SELECT salary_id FROM salary_details WHERE employee_id = ?', [employee_id]);
    if (sal.length === 0) return res.status(400).json({ error: 'Configure employee salary details first!' });

    await pool.query(
      'INSERT INTO payroll (employee_id, salary_id, month, year, payment_date, payment_status) VALUES (?, ?, ?, ?, ?, ?)',
      [employee_id, sal[0].salary_id, month, year, payment_date, payment_status || 'Pending']
    );
    res.json({ message: 'Payroll processed successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/payroll/:id/status', async (req, res) => {
  try {
    const { payment_status } = req.body;
    await pool.query('UPDATE payroll SET payment_status = ? WHERE payroll_id = ?', [payment_status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- STATS SUMMARY API ---
app.get('/api/stats', async (req, res) => {
  try {
    const [[{ empCount }]] = await pool.query('SELECT COUNT(*) AS empCount FROM employees');
    const [[{ totalPayroll }]] = await pool.query('SELECT IFNULL(SUM(s.net_salary), 0) AS totalPayroll FROM payroll p JOIN salary_details s ON p.salary_id = s.salary_id WHERE p.payment_status = "Paid"');
    const [[{ avgSalary }]] = await pool.query('SELECT IFNULL(SUM(net_salary), 0) AS avgSalary FROM salary_details');
    const [[{ pendingCount }]] = await pool.query('SELECT COUNT(*) AS pendingCount FROM payroll WHERE payment_status = "Pending"');

    res.json({ empCount, totalPayroll, avgSalary, pendingCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`HR Payroll System active at http://localhost:${PORT}`));