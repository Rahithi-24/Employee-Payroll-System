const API = 'http://localhost:3000/api';

// --- Dashboard Loader with Charts ---
async function initDashboard() {
  const res = await fetch(`${API}/stats`);
  const data = await res.json();
  document.getElementById('stat-emp').innerText = data.empCount || 0;
  document.getElementById('stat-payroll').innerText = `₹${parseFloat(data.totalPayroll).toLocaleString('en-IN')}`;
  document.getElementById('stat-salary').innerText = `₹${parseFloat(data.avgSalary).toLocaleString('en-IN')}`;
  document.getElementById('stat-pending').innerText = data.pendingCount || 0;

  // Fetch recent payrolls for table
  const pRes = await fetch(`${API}/payroll`);
  const payrolls = await pRes.json();
  document.querySelector('#dash-table tbody').innerHTML = payrolls.slice(0, 5).map(p => `
    <tr>
      <td>${p.employee_name}</td>
      <td>${p.department}</td>
      <td>₹${parseFloat(p.net_salary).toLocaleString('en-IN')}</td>
      <td>${p.payment_date ? p.payment_date.split('T')[0] : '-'}</td>
      <td><span class="badge ${p.payment_status === 'Paid' ? 'badge-paid' : 'badge-pending'}">${p.payment_status}</span></td>
    </tr>
  `).join('');

  // --- Render Chart.js Analytics ---
  const salRes = await fetch(`${API}/salaries`);
  const salaries = await salRes.json();

  // 1. Group Salaries by Department
  const deptMap = {};
  salaries.forEach(s => {
    deptMap[s.department] = (deptMap[s.department] || 0) + parseFloat(s.net_salary);
  });

  const deptLabels = Object.keys(deptMap);
  const deptData = Object.values(deptMap);

  // Render Bar Chart
  const ctxBar = document.getElementById('deptBarChart').getContext('2d');
  new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: deptLabels,
      datasets: [{
        label: 'Total Net Salary (₹)',
        data: deptData,
        backgroundColor: '#2563EB',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#E2E8F0' } },
        x: { grid: { display: false } }
      }
    }
  });

  // 2. Count Paid vs Pending Payrolls
  const paidCount = payrolls.filter(p => p.payment_status === 'Paid').length;
  const pendingCount = payrolls.filter(p => p.payment_status === 'Pending').length;

  // Render Doughnut Chart
  const ctxDonut = document.getElementById('statusDoughnutChart').getContext('2d');
  new Chart(ctxDonut, {
    type: 'doughnut',
    data: {
      labels: ['Paid', 'Pending'],
      datasets: [{
        data: [paidCount, pendingCount],
        backgroundColor: ['#16A34A', '#D97706'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { weight: '600' } } }
      }
    }
  });
}
// --- Employees Page Loader ---
async function initEmployees() {
  const res = await fetch(`${API}/employees`);
  const employees = await res.json();
  document.querySelector('#emp-table tbody').innerHTML = employees.map(e => `
    <tr>
      <td>#EMP-${e.employee_id}</td>
      <td><strong>${e.name}</strong></td>
      <td>${e.department}</td>
      <td>${e.designation}</td>
      <td>${e.email}</td>
      <td>${e.joining_date.split('T')[0]}</td>
      <td><button onclick="deleteEmployee(${e.employee_id})" style="color:var(--danger-red); background:none; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i> Delete</button></td>
    </tr>
  `).join('');
}

async function handleAddEmployee(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('e-name').value,
    department: document.getElementById('e-dept').value,
    designation: document.getElementById('e-desig').value,
    phone: document.getElementById('e-phone').value,
    email: document.getElementById('e-email').value,
    joining_date: document.getElementById('e-date').value
  };
  await fetch(`${API}/employees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  location.reload();
}

async function deleteEmployee(id) {
  if (confirm('Delete employee record?')) {
    await fetch(`${API}/employees/${id}`, { method: 'DELETE' });
    initEmployees();
  }
}

// --- Salary Page Loader ---
async function initSalaries() {
  const [empRes, salRes] = await Promise.all([fetch(`${API}/employees`), fetch(`${API}/salaries`)]);
  const employees = await empRes.json();
  const salaries = await salRes.json();

  document.getElementById('s-emp-select').innerHTML = '<option value="">Select Employee</option>' + 
    employees.map(e => `<option value="${e.employee_id}">${e.name} (${e.department})</option>`).join('');

  document.querySelector('#salary-table tbody').innerHTML = salaries.map(s => `
    <tr>
      <td>${s.employee_name}</td>
      <td>${s.department}</td>
      <td>₹${parseFloat(s.basic_salary).toLocaleString('en-IN')}</td>
      <td>+₹${parseFloat(s.allowance).toLocaleString('en-IN')}</td>
      <td>-₹${parseFloat(s.deduction).toLocaleString('en-IN')}</td>
      <td><strong>₹${parseFloat(s.net_salary).toLocaleString('en-IN')}</strong></td>
    </tr>
  `).join('');
}

function calcNetSalary() {
  const basic = parseFloat(document.getElementById('s-basic').value) || 0;
  const allow = parseFloat(document.getElementById('s-allow').value) || 0;
  const deduct = parseFloat(document.getElementById('s-deduct').value) || 0;
  document.getElementById('s-net').value = (basic + allow - deduct).toFixed(2);
}

async function handleSaveSalary(e) {
  e.preventDefault();
  const payload = {
    employee_id: document.getElementById('s-emp-select').value,
    basic_salary: document.getElementById('s-basic').value,
    allowance: document.getElementById('s-allow').value,
    deduction: document.getElementById('s-deduct').value
  };
  await fetch(`${API}/salaries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  location.reload();
}

// --- Payroll Page Loader ---
async function initPayroll() {
  const [empRes, payRes] = await Promise.all([fetch(`${API}/employees`), fetch(`${API}/payroll`)]);
  const employees = await empRes.json();
  const payrolls = await payRes.json();

  document.getElementById('p-emp-select').innerHTML = '<option value="">Select Employee</option>' + 
    employees.map(e => `<option value="${e.employee_id}">${e.name}</option>`).join('');

  document.querySelector('#payroll-table tbody').innerHTML = payrolls.map(p => `
    <tr>
      <td>#PAY-${p.payroll_id}</td>
      <td>${p.employee_name}</td>
      <td>Month ${p.month}, ${p.year}</td>
      <td>₹${parseFloat(p.net_salary).toLocaleString('en-IN')}</td>
      <td>${p.payment_date.split('T')[0]}</td>
      <td><span class="badge ${p.payment_status === 'Paid' ? 'badge-paid' : 'badge-pending'}">${p.payment_status}</span></td>
      <td>
        ${p.payment_status === 'Pending' ? `<button onclick="updateStatus(${p.payroll_id}, 'Paid')" class="btn-primary" style="padding:4px 10px; font-size:0.75rem;">Mark Paid</button>` : 'Completed'}
      </td>
    </tr>
  `).join('');
}

async function handleProcessPayroll(e) {
  e.preventDefault();
  const payload = {
    employee_id: document.getElementById('p-emp-select').value,
    month: document.getElementById('p-month').value,
    year: document.getElementById('p-year').value,
    payment_date: document.getElementById('p-date').value,
    payment_status: document.getElementById('p-status').value
  };
  const res = await fetch(`${API}/payroll`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await res.json();
  if (res.ok) location.reload();
  else alert(data.error);
}

async function updateStatus(id, status) {
  await fetch(`${API}/payroll/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_status: status }) });
  initPayroll();
}



// --- Reports Loader ---
async function initReports() {
  const res = await fetch(`${API}/payroll`);
  const payrolls = await res.json();
  const totalPaid = payrolls.filter(p => p.payment_status === 'Paid').reduce((acc, c) => acc + parseFloat(c.net_salary), 0);

  document.getElementById('report-total-payout').innerText = `₹${totalPaid.toLocaleString('en-IN')}`;
  
  document.querySelector('#report-table tbody').innerHTML = payrolls.map(p => `
    <tr>
      <td>#PAY-${p.payroll_id}</td>
      <td><strong>${p.employee_name}</strong></td>
      <td>₹${parseFloat(p.basic_salary).toLocaleString('en-IN')}</td>
      <td>+₹${parseFloat(p.allowance).toLocaleString('en-IN')}</td>
      <td>-₹${parseFloat(p.deduction).toLocaleString('en-IN')}</td>
      <td><strong>₹${parseFloat(p.net_salary).toLocaleString('en-IN')}</strong></td>
      <td><span class="badge ${p.payment_status === 'Paid' ? 'badge-paid' : 'badge-pending'}">${p.payment_status}</span></td>
      <td>
        <button onclick='openPayslipModal(${JSON.stringify(p)})' class="btn-primary" style="padding: 6px 12px; font-size: 0.75rem;">
          <i class="fa-solid fa-file-lines"></i> View Slip
        </button>
      </td>
    </tr>
  `).join('');
}

function openPayslipModal(p) {
  const content = `
    <div class="payslip-row"><span>Employee Name:</span> <strong>${p.employee_name}</strong></div>
    <div class="payslip-row"><span>Department:</span> <strong>${p.department || 'General'}</strong></div>
    <div class="payslip-row"><span>Pay Period:</span> <strong>Month ${p.month}, ${p.year}</strong></div>
    <div class="payslip-row"><span>Payment Date:</span> <strong>${p.payment_date ? p.payment_date.split('T')[0] : 'N/A'}</strong></div>
    <br/>
    <div class="payslip-row"><span>Basic Salary:</span> ₹${parseFloat(p.basic_salary).toLocaleString('en-IN')}</div>
    <div class="payslip-row"><span>Allowances:</span> +₹${parseFloat(p.allowance).toLocaleString('en-IN')}</div>
    <div class="payslip-row"><span>Deductions:</span> -₹${parseFloat(p.deduction).toLocaleString('en-IN')}</div>
    <div class="payslip-total"><span>Net Payable Salary:</span> <span style="color:var(--primary-blue);">₹${parseFloat(p.net_salary).toLocaleString('en-IN')}</span></div>
  `;
  document.getElementById('payslip-content').innerHTML = content;
  document.getElementById('payslipModal').style.display = 'flex';
}

function closePayslipModal() {
  document.getElementById('payslipModal').style.display = 'none';
}



