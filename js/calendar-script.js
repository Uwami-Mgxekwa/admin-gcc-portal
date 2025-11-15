const SUPABASE_URL = 'https://qnroaigdrpoceasbqtmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucm9haWdkcnBvY2Vhc2JxdG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzIzMzgsImV4cCI6MjA3ODEwODMzOH0.AnySEJv5FLNikQ6aGlpg-p7YSpqINjvbMuuLe4SFKQc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEMO_MODE = true;

const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const greeting = document.getElementById('greeting');
const signOutBtn = document.getElementById('sign-out');
const importantDatesList = document.getElementById('importantDatesList');
const addDateBtn = document.getElementById('addDateBtn');
const dateModal = document.getElementById('dateModal');
const dateForm = document.getElementById('dateForm');
const closeModalBtns = document.querySelectorAll('.close-modal, .btn-cancel');

document.addEventListener('DOMContentLoaded', () => {
  // Initialize sidebar state for mobile
  if (window.innerWidth <= 768) {
    sidebar.classList.add('collapsed');
  }
  setupEventListeners();
  loadImportantDates();
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
  menuToggle.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function () {
      if (this.classList.contains('sign-out')) {
        handleSignOut();
      } else {
        const page = this.getAttribute('data-page');
        if (page) {
          navigateToPage(page);
          if (window.innerWidth <= 768) closeSidebar();
        }
      }
    });
  });

  addDateBtn.addEventListener('click', openAddDateModal);
  closeModalBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) closeAllModals();
  });
  dateForm.addEventListener('submit', handleDateSubmit);
  signOutBtn.addEventListener('click', handleSignOut);
  window.addEventListener('resize', handleResize);
}


function navigateToPage(page) {
  const pageMap = {
    'dashboard': '../index.html',
    'students': '../index.html#students',
    'courses': 'courses.html',
    'assignments': 'assignments.html',
    'schedules': 'schedules.html',
    'notifications': 'notifications.html',
    'events': 'events.html',
    'finances': 'finances.html',
    'files': '../index.html#files'
  };
  if (pageMap[page]) window.location.href = pageMap[page];
}

async function loadImportantDates() {
  importantDatesList.innerHTML = '<div class="loading">Loading important dates...</div>';

  try {
    const { data: dates, error } = await supabase
      .from('important_dates')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) throw error;

    if (!dates || dates.length === 0) {
      importantDatesList.innerHTML = '<div class="no-data">No important dates marked yet. Click "Mark Important Date" to add one.</div>';
      return;
    }

    importantDatesList.innerHTML = dates.map(date => {
      const typeColors = {
        test: '#10b981',
        exam: '#ef4444',
        deadline: '#f59e0b',
        holiday: '#3b82f6'
      };
      const color = typeColors[date.date_type] || '#6b7280';
      const startDate = new Date(date.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const endDate = date.end_date ? new Date(date.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

      return `
        <div class="date-card" style="border-left: 4px solid ${color};">
          <div class="date-card-header">
            <div>
              <h3>${date.title}</h3>
              <span class="date-type-badge" style="background: ${color};">${date.date_type}</span>
              ${date.target_year !== 'all' ? `<span class="year-badge">Year ${date.target_year}</span>` : '<span class="year-badge">All Years</span>'}
            </div>
            <div class="date-actions">
              <button class="btn-icon btn-edit" onclick="editDate('${date.id}')" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon btn-danger" onclick="deleteDate('${date.id}')" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="date-card-body">
            <p class="date-range">
              <i class="fas fa-calendar"></i>
              ${startDate}${endDate ? ` - ${endDate}` : ''}
            </p>
            ${date.description ? `<p class="date-description">${date.description}</p>` : ''}
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading dates:', error);
    importantDatesList.innerHTML = '<div class="error">Failed to load important dates</div>';
    showAlert('Failed to load important dates', 'error');
  }
}

function openAddDateModal() {
  dateForm.reset();
  document.getElementById('dateId').value = '';
  document.getElementById('dateYear').value = 'all';
  document.getElementById('dateModalTitle').textContent = 'Mark Important Date';
  document.getElementById('dateSubmitBtn').textContent = 'Save Date';
  openModal(dateModal);
}


async function editDate(dateId) {
  try {
    const { data: date, error } = await supabase
      .from('important_dates')
      .select('*')
      .eq('id', dateId)
      .single();

    if (error) throw error;

    document.getElementById('dateId').value = date.id;
    document.getElementById('dateTitle').value = date.title;
    document.getElementById('dateDescription').value = date.description || '';
    document.getElementById('dateStart').value = date.start_date;
    document.getElementById('dateEnd').value = date.end_date || '';
    document.getElementById('dateType').value = date.date_type;
    document.getElementById('dateYear').value = date.target_year || 'all';

    document.getElementById('dateModalTitle').textContent = 'Edit Important Date';
    document.getElementById('dateSubmitBtn').textContent = 'Update Date';
    openModal(dateModal);

  } catch (error) {
    console.error('Error loading date:', error);
    showAlert('Failed to load date data', 'error');
  }
}

async function handleDateSubmit(e) {
  e.preventDefault();

  const dateId = document.getElementById('dateId').value;
  const isEdit = !!dateId;

  const dateData = {
    title: document.getElementById('dateTitle').value.trim(),
    description: document.getElementById('dateDescription').value.trim() || null,
    start_date: document.getElementById('dateStart').value,
    end_date: document.getElementById('dateEnd').value || null,
    date_type: document.getElementById('dateType').value,
    target_year: document.getElementById('dateYear').value
  };

  const submitBtn = document.getElementById('dateSubmitBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;

  try {
    if (isEdit) {
      const { error } = await supabase
        .from('important_dates')
        .update(dateData)
        .eq('id', dateId);
      if (error) throw error;
      showAlert('Important date updated successfully!', 'success');
    } else {
      const { error } = await supabase
        .from('important_dates')
        .insert([dateData]);
      if (error) throw error;
      showAlert('Important date added successfully!', 'success');
    }

    closeAllModals();
    dateForm.reset();
    loadImportantDates();

  } catch (error) {
    console.error('Error saving date:', error);
    showAlert(`Failed to ${isEdit ? 'update' : 'add'} date: ${error.message}`, 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

async function deleteDate(dateId) {
  if (!confirm('Are you sure you want to delete this important date?')) {
    return;
  }

  try {
    const { error } = await supabase
      .from('important_dates')
      .delete()
      .eq('id', dateId);

    if (error) throw error;
    showAlert('Important date deleted successfully', 'success');
    loadImportantDates();

  } catch (error) {
    console.error('Error deleting date:', error);
    showAlert('Failed to delete date', 'error');
  }
}

window.editDate = editDate;
window.deleteDate = deleteDate;

function handleSignOut() {
  if (confirm('Are you sure you want to sign out?')) {
    if (!DEMO_MODE) supabase.auth.signOut();
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
  document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
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
