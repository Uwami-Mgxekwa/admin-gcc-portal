const SUPABASE_URL = 'https://qnroaigdrpoceasbqtmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucm9haWdkcnBvY2Vhc2JxdG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzIzMzgsImV4cCI6MjA3ODEwODMzOH0.AnySEJv5FLNikQ6aGlpg-p7YSpqINjvbMuuLe4SFKQc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEMO_MODE = true;

const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const greeting = document.getElementById('greeting');
const signOutBtn = document.getElementById('sign-out');
const assignmentsGrid = document.getElementById('assignmentsGrid');
const addAssignmentBtn = document.getElementById('addAssignmentBtn');
const assignmentModal = document.getElementById('assignmentModal');
const assignmentForm = document.getElementById('assignmentForm');
const closeModalBtns = document.querySelectorAll('.close-modal, .btn-cancel');

document.addEventListener('DOMContentLoaded', () => {
  if (window.innerWidth <= 768) {
    sidebar.classList.add('collapsed');
  }
  setupEventListeners();
  loadAssignments();
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

  addAssignmentBtn.addEventListener('click', openAddAssignmentModal);
  closeModalBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) closeAllModals();
  });
  assignmentForm.addEventListener('submit', handleAssignmentSubmit);
  signOutBtn.addEventListener('click', handleSignOut);
  window.addEventListener('resize', handleResize);
}

function navigateToPage(page) {
  const pageMap = {
    'dashboard': '../index.html',
    'students': '../index.html#students',
    'courses': 'courses.html',
    'schedules': 'schedules.html',
    'calendar': 'calendar.html',
    'notifications': 'notifications.html',
    'events': 'events.html',
    'finances': 'finances.html',
    'files': '../index.html#files'
  };
  if (pageMap[page]) window.location.href = pageMap[page];
}

async function loadAssignments() {
  assignmentsGrid.innerHTML = '<div class="loading">Loading assignments...</div>';

  try {
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) throw error;

    if (!assignments || assignments.length === 0) {
      assignmentsGrid.innerHTML = '<div class="no-data">No assignments yet. Click "Add Assignment" to create one.</div>';
      return;
    }

    assignmentsGrid.innerHTML = assignments.map(assignment => {
      const priorityColors = {
        high: '#ef4444',
        medium: '#f59e0b',
        low: '#10b981'
      };
      const color = priorityColors[assignment.priority] || '#6b7280';
      const dueDate = new Date(assignment.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const today = new Date();
      const due = new Date(assignment.due_date);
      const daysUntil = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      
      let dueDateClass = '';
      if (daysUntil < 0) dueDateClass = 'overdue';
      else if (daysUntil <= 3) dueDateClass = 'due-soon';

      return `
        <div class="assignment-card" style="border-left: 4px solid ${color};">
          <div class="assignment-card-header">
            <div>
              <h3>${assignment.title}</h3>
              <span class="priority-badge" style="background: ${color};">${assignment.priority}</span>
              ${assignment.target_year !== 'all' ? `<span class="year-badge">Year ${assignment.target_year}</span>` : '<span class="year-badge">All Years</span>'}
              ${!assignment.is_active ? '<span class="inactive-badge">Inactive</span>' : ''}
            </div>
            <div class="assignment-actions">
              <button class="btn-icon btn-edit" onclick="editAssignment('${assignment.id}')" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon ${assignment.is_active ? 'btn-warning' : 'btn-success'}" 
                      onclick="toggleAssignmentStatus('${assignment.id}', ${!assignment.is_active})" 
                      title="${assignment.is_active ? 'Deactivate' : 'Activate'}">
                <i class="fas fa-${assignment.is_active ? 'eye-slash' : 'eye'}"></i>
              </button>
              <button class="btn-icon btn-danger" onclick="deleteAssignment('${assignment.id}')" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="assignment-card-body">
            <p class="assignment-course">
              <i class="fas fa-book"></i>
              ${assignment.course}
            </p>
            <p class="assignment-due ${dueDateClass}">
              <i class="fas fa-calendar"></i>
              Due: ${dueDate} ${daysUntil >= 0 ? `(${daysUntil} days)` : '(Overdue)'}
            </p>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading assignments:', error);
    assignmentsGrid.innerHTML = '<div class="error">Failed to load assignments</div>';
    showAlert('Failed to load assignments', 'error');
  }
}

function openAddAssignmentModal() {
  assignmentForm.reset();
  document.getElementById('assignmentId').value = '';
  document.getElementById('assignmentYear').value = 'all';
  document.getElementById('assignmentModalTitle').textContent = 'Add Assignment';
  document.getElementById('assignmentSubmitBtn').textContent = 'Save Assignment';
  openModal(assignmentModal);
}

async function editAssignment(assignmentId) {
  try {
    const { data: assignment, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (error) throw error;

    document.getElementById('assignmentId').value = assignment.id;
    document.getElementById('assignmentTitle').value = assignment.title;
    document.getElementById('assignmentCourse').value = assignment.course;
    document.getElementById('assignmentDueDate').value = assignment.due_date;
    document.getElementById('assignmentPriority').value = assignment.priority;
    document.getElementById('assignmentYear').value = assignment.target_year || 'all';

    document.getElementById('assignmentModalTitle').textContent = 'Edit Assignment';
    document.getElementById('assignmentSubmitBtn').textContent = 'Update Assignment';
    openModal(assignmentModal);

  } catch (error) {
    console.error('Error loading assignment:', error);
    showAlert('Failed to load assignment data', 'error');
  }
}

async function handleAssignmentSubmit(e) {
  e.preventDefault();

  const assignmentId = document.getElementById('assignmentId').value;
  const isEdit = !!assignmentId;

  const assignmentData = {
    title: document.getElementById('assignmentTitle').value.trim(),
    course: document.getElementById('assignmentCourse').value.trim(),
    due_date: document.getElementById('assignmentDueDate').value,
    priority: document.getElementById('assignmentPriority').value,
    target_year: document.getElementById('assignmentYear').value
  };

  const submitBtn = document.getElementById('assignmentSubmitBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;

  try {
    if (isEdit) {
      const { error } = await supabase
        .from('assignments')
        .update(assignmentData)
        .eq('id', assignmentId);
      if (error) throw error;
      showAlert('Assignment updated successfully!', 'success');
    } else {
      const { error } = await supabase
        .from('assignments')
        .insert([assignmentData]);
      if (error) throw error;
      showAlert('Assignment created successfully!', 'success');
    }

    closeAllModals();
    assignmentForm.reset();
    loadAssignments();

  } catch (error) {
    console.error('Error saving assignment:', error);
    showAlert(`Failed to ${isEdit ? 'update' : 'create'} assignment: ${error.message}`, 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

async function toggleAssignmentStatus(assignmentId, newStatus) {
  try {
    const { error } = await supabase
      .from('assignments')
      .update({ is_active: newStatus })
      .eq('id', assignmentId);

    if (error) throw error;
    showAlert(`Assignment ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
    loadAssignments();

  } catch (error) {
    console.error('Error toggling assignment status:', error);
    showAlert('Failed to update assignment status', 'error');
  }
}

async function deleteAssignment(assignmentId) {
  if (!confirm('Are you sure you want to delete this assignment?')) {
    return;
  }

  try {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) throw error;
    showAlert('Assignment deleted successfully', 'success');
    loadAssignments();

  } catch (error) {
    console.error('Error deleting assignment:', error);
    showAlert('Failed to delete assignment', 'error');
  }
}

window.editAssignment = editAssignment;
window.toggleAssignmentStatus = toggleAssignmentStatus;
window.deleteAssignment = deleteAssignment;

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
