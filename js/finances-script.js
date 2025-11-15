const SUPABASE_URL = 'https://qnroaigdrpoceasbqtmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucm9haWdkcnBvY2Vhc2JxdG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzIzMzgsImV4cCI6MjA3ODEwODMzOH0.AnySEJv5FLNikQ6aGlpg-p7YSpqINjvbMuuLe4SFKQc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEMO_MODE = true;

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const greeting = document.getElementById('greeting');
const signOutBtn = document.getElementById('sign-out');
const financeTableBody = document.getElementById('financeTableBody');
const addFinanceBtn = document.getElementById('addFinanceBtn');
const financeModal = document.getElementById('financeModal');
const financeForm = document.getElementById('financeForm');
const paymentHistoryModal = document.getElementById('paymentHistoryModal');
const closeModalBtns = document.querySelectorAll('.close-modal, .btn-cancel');
const financeSearch = document.getElementById('financeSearch');

let allFinanceRecords = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Initialize sidebar state for mobile
  if (window.innerWidth <= 768) {
    sidebar.classList.add('collapsed');
  }
  setupEventListeners();
  loadFinanceRecords();
  loadStudentsForDropdown();
  setGreeting();
});

function setGreeting() {
  const hour = new Date().getHours();
  let greetingText = 'Good ';
  if (hour < 12) greetingText += 'Morning';
  else if (hour < 18) greetingText += 'Afternoon';
  else greetingText += 'Evening';
  greeting.textContent = `${greetingText}, Admin`;
}

function setupEventListeners() {
  // Sidebar toggle
  menuToggle.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // Navigation
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function () {
      if (this.classList.contains('sign-out')) {
        handleSignOut();
      } else {
        const page = this.getAttribute('data-page');
        if (page) {
          navigateToPage(page);
          // Only close sidebar on mobile
          if (window.innerWidth <= 768) {
            closeSidebar();
          }
        }
      }
    });
  });

  // Add finance button
  addFinanceBtn.addEventListener('click', openAddFinanceModal);

  // Search
  financeSearch.addEventListener('input', (e) => {
    filterFinanceRecords(e.target.value);
  });

  // Modal close
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeAllModals();
    }
  });

  // Form submit
  financeForm.addEventListener('submit', handleFinanceSubmit);

  // Auto-calculate balance
  document.getElementById('totalFees').addEventListener('input', calculateBalance);
  document.getElementById('amountPaid').addEventListener('input', calculateBalance);

  // Sign out
  signOutBtn.addEventListener('click', handleSignOut);

  window.addEventListener('resize', handleResize);
}

function navigateToPage(page) {
  if (page === 'dashboard') {
    window.location.href = '../index.html';
  } else if (page === 'students') {
    window.location.href = '../index.html';
  } else if (page === 'courses') {
    window.location.href = 'courses.html';
  } else if (page === 'assignments') {
    window.location.href = 'assignments.html';
  } else if (page === 'schedules') {
    window.location.href = 'schedules.html';
  } else if (page === 'calendar') {
    window.location.href = 'calendar.html';
  } else if (page === 'notifications') {
    window.location.href = 'notifications.html';
  } else if (page === 'events') {
    window.location.href = 'events.html';
  } else if (page === 'files') {
    window.location.href = '../index.html#files';
  }
}

async function loadStudentsForDropdown() {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('id, student_id, first_name, last_name')
      .order('student_id');

    if (error) throw error;

    const select = document.getElementById('studentSelect');
    select.innerHTML = '<option value="">Select Student</option>';
    
    students.forEach(student => {
      const option = document.createElement('option');
      option.value = student.student_id;
      option.textContent = `${student.student_id} - ${student.first_name} ${student.last_name}`;
      select.appendChild(option);
    });

  } catch (error) {
    console.error('Error loading students:', error);
  }
}

async function loadFinanceRecords() {
  financeTableBody.innerHTML = '<tr><td colspan="9" class="loading">Loading finance records...</td></tr>';

  try {
    // Get all students with their info
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .order('student_id');

    if (studentsError) throw studentsError;

    // Get all finance records
    const { data: finances, error: financesError } = await supabase
      .from('student_finances')
      .select('*');

    if (financesError) throw financesError;

    // Merge data
    allFinanceRecords = students.map(student => {
      const financeRecord = finances?.find(f => f.student_id === student.student_id) || {};
      
      const totalFees = financeRecord.total_fees || 0;
      const amountPaid = financeRecord.amount_paid || 0;
      const balance = totalFees - amountPaid;
      const status = balance <= 0 ? 'paid' : balance < totalFees ? 'partial' : 'outstanding';

      return {
        ...student,
        finance_id: financeRecord.id,
        total_fees: totalFees,
        amount_paid: amountPaid,
        balance: balance,
        status: status,
        last_payment_date: financeRecord.last_payment_date,
        payment_method: financeRecord.payment_method,
        notes: financeRecord.notes
      };
    });

    renderFinanceTable(allFinanceRecords);
    updateFinanceStats(allFinanceRecords);

  } catch (error) {
    console.error('Error loading finance records:', error);
    financeTableBody.innerHTML = '<tr><td colspan="9" class="error">Failed to load finance records</td></tr>';
    showAlert('Failed to load finance records', 'error');
  }
}

function renderFinanceTable(records) {
  if (!records || records.length === 0) {
    financeTableBody.innerHTML = '<tr><td colspan="9" class="no-data">No finance records found</td></tr>';
    return;
  }

  financeTableBody.innerHTML = records.map(record => {
    const statusClass = record.status === 'paid' ? 'status-paid' : 
                       record.status === 'partial' ? 'status-partial' : 'status-outstanding';
    const statusText = record.status === 'paid' ? 'Paid' : 
                      record.status === 'partial' ? 'Partial' : 'Outstanding';
    const lastPayment = record.last_payment_date ? 
                       new Date(record.last_payment_date).toLocaleDateString() : 'No payments';

    return `
      <tr data-finance-id="${record.finance_id || ''}" data-student-id="${record.student_id}">
        <td>${record.student_id || '-'}</td>
        <td>${record.first_name} ${record.last_name}</td>
        <td>Year ${record.year || '-'}</td>
        <td>R ${formatCurrency(record.total_fees)}</td>
        <td>R ${formatCurrency(record.amount_paid)}</td>
        <td class="${record.balance > 0 ? 'text-danger' : 'text-success'}">
          R ${formatCurrency(record.balance)}
        </td>
        <td><span class="finance-status-badge ${statusClass}">${statusText}</span></td>
        <td>${lastPayment}</td>
        <td>
          <div class="action-buttons-cell">
            <button class="btn-icon btn-edit" onclick="editFinance('${record.student_id}')" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" onclick="viewPaymentHistory('${record.student_id}')" title="Payment History">
              <i class="fas fa-history"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateFinanceStats(records) {
  const paidCount = records.filter(r => r.status === 'paid').length;
  const outstandingCount = records.filter(r => r.status === 'outstanding' || r.status === 'partial').length;
  const totalRevenue = records.reduce((sum, r) => sum + (r.amount_paid || 0), 0);

  document.getElementById('paidCount').textContent = paidCount;
  document.getElementById('outstandingCount').textContent = outstandingCount;
  document.getElementById('totalRevenue').textContent = `R ${formatCurrency(totalRevenue)}`;
}

function filterFinanceRecords(searchTerm) {
  const term = searchTerm.toLowerCase();
  const filtered = allFinanceRecords.filter(record => {
    const studentId = (record.student_id || '').toString().toLowerCase();
    const name = `${record.first_name} ${record.last_name}`.toLowerCase();
    return studentId.includes(term) || name.includes(term);
  });
  renderFinanceTable(filtered);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

function calculateBalance() {
  const totalFees = parseFloat(document.getElementById('totalFees').value) || 0;
  const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
  const balance = totalFees - amountPaid;
  
  // You can display this in a read-only field if you add one to the form
  console.log('Balance:', balance);
}

function openAddFinanceModal() {
  const form = document.getElementById('financeForm');
  const title = document.getElementById('financeModalTitle');
  const submitBtn = document.getElementById('financeSubmitBtn');
  
  form.reset();
  document.getElementById('financeId').value = '';
  document.getElementById('studentSelect').disabled = false;
  title.textContent = 'Add Finance Record';
  submitBtn.textContent = 'Save Record';
  
  openModal(financeModal);
}

async function editFinance(studentId) {
  try {
    const record = allFinanceRecords.find(r => r.student_id === studentId);
    if (!record) throw new Error('Record not found');

    // Populate form
    document.getElementById('financeId').value = record.finance_id || '';
    document.getElementById('studentSelect').value = studentId;
    document.getElementById('studentSelect').disabled = true;
    document.getElementById('totalFees').value = record.total_fees || 0;
    document.getElementById('amountPaid').value = record.amount_paid || 0;
    document.getElementById('paymentMethod').value = record.payment_method || '';
    document.getElementById('paymentNotes').value = record.notes || '';

    // Update modal title and button
    document.getElementById('financeModalTitle').textContent = 'Edit Finance Record';
    document.getElementById('financeSubmitBtn').textContent = 'Update Record';

    openModal(financeModal);

  } catch (error) {
    console.error('Error loading finance record:', error);
    showAlert('Failed to load finance record', 'error');
  }
}

async function handleFinanceSubmit(e) {
  e.preventDefault();

  const financeId = document.getElementById('financeId').value;
  const isEdit = !!financeId;

  const studentId = document.getElementById('studentSelect').value;
  const totalFees = parseFloat(document.getElementById('totalFees').value) || 0;
  const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
  const paymentMethod = document.getElementById('paymentMethod').value;
  const notes = document.getElementById('paymentNotes').value.trim();

  const financeData = {
    student_id: studentId,
    total_fees: totalFees,
    amount_paid: amountPaid,
    payment_method: paymentMethod || null,
    notes: notes || null,
    last_payment_date: amountPaid > 0 ? new Date().toISOString() : null
  };

  const submitBtn = document.getElementById('financeSubmitBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;

  try {
    if (isEdit) {
      const { error } = await supabase
        .from('student_finances')
        .update(financeData)
        .eq('id', financeId);

      if (error) throw error;
      showAlert('Finance record updated successfully!', 'success');
    } else {
      const { error } = await supabase
        .from('student_finances')
        .insert([financeData]);

      if (error) throw error;
      showAlert('Finance record created successfully!', 'success');
    }

    closeAllModals();
    financeForm.reset();
    loadFinanceRecords();

  } catch (error) {
    console.error('Error saving finance record:', error);
    showAlert(`Failed to ${isEdit ? 'update' : 'create'} finance record: ${error.message}`, 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

async function viewPaymentHistory(studentId) {
  const content = document.getElementById('paymentHistoryContent');
  content.innerHTML = '<div class="loading">Loading payment history...</div>';
  
  openModal(paymentHistoryModal);

  try {
    const { data: history, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('student_id', studentId)
      .order('payment_date', { ascending: false });

    if (error) throw error;

    if (!history || history.length === 0) {
      content.innerHTML = '<div class="no-data">No payment history found</div>';
      return;
    }

    content.innerHTML = `
      <div class="payment-history-list">
        ${history.map(payment => `
          <div class="payment-history-item">
            <div class="payment-date">
              <i class="fas fa-calendar"></i>
              ${new Date(payment.payment_date).toLocaleDateString()}
            </div>
            <div class="payment-amount">R ${formatCurrency(payment.amount)}</div>
            <div class="payment-method">${payment.payment_method || 'N/A'}</div>
            ${payment.notes ? `<div class="payment-notes">${payment.notes}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;

  } catch (error) {
    console.error('Error loading payment history:', error);
    content.innerHTML = '<div class="error">Failed to load payment history</div>';
  }
}

// Expose functions globally
window.editFinance = editFinance;
window.viewPaymentHistory = viewPaymentHistory;

function handleSignOut() {
  if (confirm('Are you sure you want to sign out?')) {
    if (!DEMO_MODE) {
      supabase.auth.signOut();
    }
    window.location.href = '../index.html';
  }
}

function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('active');
    sidebarOverlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
  }
}

function closeSidebar() {
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('active');
    sidebarOverlay.style.display = 'none';
  }
}

function handleResize() {
  if (window.innerWidth <= 768) {
    sidebar.classList.add('collapsed');
    sidebar.classList.remove('active');
    sidebarOverlay.style.display = 'none';
  }
}

function openModal(modal) {
  closeAllModals();
  modal.style.display = 'flex';
}

function closeAllModals() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });
}

function showAlert(message, type = 'info') {
  const container = document.getElementById('alertContainer');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;

  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle';

  alert.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
    <button class="alert-close"><i class="fas fa-times"></i></button>
  `;

  container.appendChild(alert);
  setTimeout(() => alert.classList.add('show'), 10);

  alert.querySelector('.alert-close').addEventListener('click', () => {
    alert.classList.remove('show');
    setTimeout(() => alert.remove(), 300);
  });

  setTimeout(() => {
    if (alert.parentNode) {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 300);
    }
  }, 5000);
}
