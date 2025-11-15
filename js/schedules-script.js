const SUPABASE_URL = 'https://qnroaigdrpoceasbqtmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucm9haWdkcnBvY2Vhc2JxdG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzIzMzgsImV4cCI6MjA3ODEwODMzOH0.AnySEJv5FLNikQ6aGlpg-p7YSpqINjvbMuuLe4SFKQc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEMO_MODE = true;

const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const greeting = document.getElementById('greeting');
const signOutBtn = document.getElementById('sign-out');
const schedulesList = document.getElementById('schedulesList');
const addScheduleBtn = document.getElementById('addScheduleBtn');
const scheduleModal = document.getElementById('scheduleModal');
const scheduleForm = document.getElementById('scheduleForm');
const closeModalBtns = document.querySelectorAll('.close-modal, .btn-cancel');

document.addEventListener('DOMContentLoaded', () => {
  // Initialize sidebar state for mobile
  if (window.innerWidth <= 768) {
    sidebar.classList.add('collapsed');
  }
  setupEventListeners();
  loadSchedules();
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

  addScheduleBtn.addEventListener('click', openAddScheduleModal);

  closeModalBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) closeAllModals();
  });
  scheduleForm.addEventListener('submit', handleScheduleSubmit);
  signOutBtn.addEventListener('click', handleSignOut);
  window.addEventListener('resize', handleResize);
}

function navigateToPage(page) {
  const pageMap = {
    'dashboard': '../index.html',
    'students': '../index.html',
    'courses': 'courses.html',
    'calendar': 'calendar.html',
    'notifications': 'notifications.html',
    'events': 'events.html',
    'finances': 'finances.html',
    'files': '../index.html'
  };
  if (pageMap[page]) window.location.href = pageMap[page];
}

async function loadSchedules() {
  schedulesList.innerHTML = '<div class="loading">Loading schedules...</div>';

  try {
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .order('course');

    if (error) throw error;

    if (!schedules || schedules.length === 0) {
      schedulesList.innerHTML = '<div class="no-data">No schedules yet. Click "Create Schedule" to add one.</div>';
      return;
    }

    schedulesList.innerHTML = schedules.map(schedule => `
      <div class="schedule-card" data-schedule-id="${schedule.id}">
        <div class="schedule-card-header">
          <div>
            <h3>${schedule.course} - ${schedule.certificate}</h3>
            <span class="year-badge">Year ${schedule.year === 'all' ? 'All' : schedule.year}</span>
          </div>
          <div class="schedule-actions">
            <button class="btn-icon btn-edit" onclick="editSchedule('${schedule.id}')" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-danger" onclick="deleteSchedule('${schedule.id}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="schedule-preview">
          <small>Click edit to view full schedule</small>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading schedules:', error);
    schedulesList.innerHTML = '<div class="error">Failed to load schedules</div>';
    showAlert('Failed to load schedules', 'error');
  }
}


function openAddScheduleModal() {
  scheduleForm.reset();
  document.getElementById('scheduleId').value = '';
  document.getElementById('scheduleModalTitle').textContent = 'Create Schedule';
  document.getElementById('scheduleSubmitBtn').textContent = 'Save Schedule';
  clearScheduleInputs();
  openModal(scheduleModal);
}

function clearScheduleInputs() {
  document.querySelectorAll('.module-input').forEach(input => input.value = '');
}

async function editSchedule(scheduleId) {
  try {
    const { data: schedule, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (error) throw error;

    document.getElementById('scheduleId').value = schedule.id;
    document.getElementById('scheduleCourse').value = schedule.course;
    document.getElementById('scheduleCertificate').value = schedule.certificate;
    document.getElementById('scheduleYear').value = schedule.year;

    const scheduleData = schedule.schedule_data;
    if (scheduleData && scheduleData.TABLE) {
      scheduleData.TABLE.forEach(dayData => {
        const daySchedule = document.querySelector(`[data-day="${dayData.DAY}"]`);
        if (daySchedule) {
          dayData.MODULES.forEach((module, index) => {
            const input = daySchedule.querySelector(`[data-period="${index}"]`);
            if (input) input.value = module || '';
          });
        }
      });
    }

    document.getElementById('scheduleModalTitle').textContent = 'Edit Schedule';
    document.getElementById('scheduleSubmitBtn').textContent = 'Update Schedule';
    openModal(scheduleModal);

  } catch (error) {
    console.error('Error loading schedule:', error);
    showAlert('Failed to load schedule data', 'error');
  }
}

async function handleScheduleSubmit(e) {
  e.preventDefault();

  const scheduleId = document.getElementById('scheduleId').value;
  const isEdit = !!scheduleId;

  const course = document.getElementById('scheduleCourse').value.trim();
  const certificate = document.getElementById('scheduleCertificate').value.trim();
  const year = document.getElementById('scheduleYear').value;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const tableData = days.map(day => {
    const daySchedule = document.querySelector(`[data-day="${day}"]`);
    const modules = Array.from(daySchedule.querySelectorAll('.module-input'))
      .map(input => input.value.trim() || '-');
    return { DAY: day, MODULES: modules };
  });

  const scheduleData = {
    course: course,
    certificate: certificate,
    year: year,
    schedule_data: {
      COURSE: course,
      CERTIFICATE: certificate,
      TABLE: tableData
    }
  };

  const submitBtn = document.getElementById('scheduleSubmitBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;

  try {
    if (isEdit) {
      const { error } = await supabase
        .from('schedules')
        .update(scheduleData)
        .eq('id', scheduleId);
      if (error) throw error;
      showAlert('Schedule updated successfully!', 'success');
    } else {
      const { error } = await supabase
        .from('schedules')
        .insert([scheduleData]);
      if (error) throw error;
      showAlert('Schedule created successfully!', 'success');
    }

    closeAllModals();
    scheduleForm.reset();
    loadSchedules();

  } catch (error) {
    console.error('Error saving schedule:', error);
    showAlert(`Failed to ${isEdit ? 'update' : 'create'} schedule: ${error.message}`, 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}


async function deleteSchedule(scheduleId) {
  if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
    return;
  }

  try {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) throw error;
    showAlert('Schedule deleted successfully', 'success');
    loadSchedules();

  } catch (error) {
    console.error('Error deleting schedule:', error);
    showAlert('Failed to delete schedule', 'error');
  }
}

window.editSchedule = editSchedule;
window.deleteSchedule = deleteSchedule;

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
