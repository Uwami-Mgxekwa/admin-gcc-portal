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
const notificationsGrid = document.getElementById('notificationsGrid');
const addNotificationBtn = document.getElementById('addNotificationBtn');
const notificationModal = document.getElementById('notificationModal');
const notificationForm = document.getElementById('notificationForm');
const closeModalBtns = document.querySelectorAll('.close-modal, .btn-cancel');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadNotifications();
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

  // Add notification button
  addNotificationBtn.addEventListener('click', openAddNotificationModal);

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
  notificationForm.addEventListener('submit', handleNotificationSubmit);

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
  } else if (page === 'schedules') {
    window.location.href = 'schedules.html';
  } else if (page === 'events') {
    window.location.href = 'events.html';
  } else if (page === 'finances') {
    window.location.href = 'finances.html';
  } else if (page === 'files') {
    window.location.href = '../index.html';
  }
}

async function loadNotifications() {
  notificationsGrid.innerHTML = '<div class="loading">Loading notifications...</div>';

  try {
    const { data: notifications, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!notifications || notifications.length === 0) {
      notificationsGrid.innerHTML = '<div class="no-data">No notifications yet. Click "Create Notification" to add one.</div>';
      return;
    }

    notificationsGrid.innerHTML = notifications.map(notification => {
      const typeIcon = getTypeIcon(notification.type);
      const typeColor = getTypeColor(notification.type);
      const audienceLabel = getAudienceLabel(notification.target_audience);
      const createdDate = new Date(notification.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });

      return `
        <div class="notification-card ${notification.is_urgent ? 'urgent-card' : ''}" data-notification-id="${notification.id}">
          <div class="notification-card-header" style="background: ${typeColor};">
            <div class="notification-icon-badge">
              <i class="fas fa-${typeIcon}"></i>
            </div>
            <div class="notification-status-badges">
              <span class="notification-type-badge ${notification.type}">${notification.type}</span>
              ${notification.is_urgent ? '<span class="urgent-badge"><i class="fas fa-exclamation-circle"></i> Urgent</span>' : ''}
              <span class="status-badge ${notification.is_active ? 'active' : 'inactive'}">
                ${notification.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div class="notification-card-body">
            <h3>${notification.title}</h3>
            <p class="notification-message">${notification.message}</p>
            <div class="notification-meta">
              <span><i class="fas fa-users"></i> ${audienceLabel}</span>
              <span><i class="fas fa-calendar"></i> ${createdDate}</span>
            </div>
          </div>
          <div class="notification-card-footer">
            <button class="btn-icon btn-edit" onclick="editNotification('${notification.id}')" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon ${notification.is_active ? 'btn-warning' : 'btn-success'}" 
                    onclick="toggleNotificationStatus('${notification.id}', ${!notification.is_active})" 
                    title="${notification.is_active ? 'Deactivate' : 'Activate'}">
              <i class="fas fa-${notification.is_active ? 'eye-slash' : 'eye'}"></i>
            </button>
            <button class="btn-icon btn-danger" onclick="deleteNotification('${notification.id}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading notifications:', error);
    notificationsGrid.innerHTML = '<div class="error">Failed to load notifications</div>';
    showAlert('Failed to load notifications', 'error');
  }
}

function getTypeIcon(type) {
  const icons = {
    urgent: 'exclamation-circle',
    academic: 'graduation-cap',
    financial: 'dollar-sign',
    event: 'calendar-alt',
    general: 'info-circle'
  };
  return icons[type] || 'bell';
}

function getTypeColor(type) {
  const colors = {
    urgent: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    academic: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    financial: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    event: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    general: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
  };
  return colors[type] || colors.general;
}

function getAudienceLabel(audience) {
  const labels = {
    'all': 'All Students',
    'year-1': 'Year 1',
    'year-2': 'Year 2',
    'year-3': 'Year 3'
  };
  return labels[audience] || audience;
}

function openAddNotificationModal() {
  const form = document.getElementById('notificationForm');
  const title = document.getElementById('notificationModalTitle');
  const submitBtn = document.getElementById('notificationSubmitBtn');
  
  form.reset();
  document.getElementById('notificationId').value = '';
  document.getElementById('isActive').checked = true;
  title.textContent = 'Create Notification';
  submitBtn.textContent = 'Create Notification';
  
  openModal(notificationModal);
}

async function editNotification(notificationId) {
  try {
    const { data: notification, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (error) throw error;

    // Populate form
    document.getElementById('notificationId').value = notification.id;
    document.getElementById('notificationTitle').value = notification.title;
    document.getElementById('notificationMessage').value = notification.message;
    document.getElementById('notificationType').value = notification.type;
    document.getElementById('targetAudience').value = notification.target_audience;
    document.getElementById('isUrgent').checked = notification.is_urgent;
    document.getElementById('isActive').checked = notification.is_active;

    // Update modal title and button
    document.getElementById('notificationModalTitle').textContent = 'Edit Notification';
    document.getElementById('notificationSubmitBtn').textContent = 'Update Notification';

    openModal(notificationModal);

  } catch (error) {
    console.error('Error loading notification:', error);
    showAlert('Failed to load notification data', 'error');
  }
}

async function handleNotificationSubmit(e) {
  e.preventDefault();

  const notificationId = document.getElementById('notificationId').value;
  const isEdit = !!notificationId;

  const notificationData = {
    title: document.getElementById('notificationTitle').value.trim(),
    message: document.getElementById('notificationMessage').value.trim(),
    type: document.getElementById('notificationType').value,
    target_audience: document.getElementById('targetAudience').value,
    is_urgent: document.getElementById('isUrgent').checked,
    is_active: document.getElementById('isActive').checked
  };

  const submitBtn = document.getElementById('notificationSubmitBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;

  try {
    if (isEdit) {
      const { error } = await supabase
        .from('announcements')
        .update(notificationData)
        .eq('id', notificationId);

      if (error) throw error;
      showAlert('Notification updated successfully!', 'success');
    } else {
      const { error } = await supabase
        .from('announcements')
        .insert([notificationData]);

      if (error) throw error;
      showAlert('Notification created successfully!', 'success');
    }

    closeAllModals();
    notificationForm.reset();
    loadNotifications();

  } catch (error) {
    console.error('Error saving notification:', error);
    showAlert(`Failed to ${isEdit ? 'update' : 'create'} notification: ${error.message}`, 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

async function toggleNotificationStatus(notificationId, newStatus) {
  try {
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: newStatus })
      .eq('id', notificationId);

    if (error) throw error;

    showAlert(`Notification ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
    loadNotifications();

  } catch (error) {
    console.error('Error toggling notification status:', error);
    showAlert('Failed to update notification status', 'error');
  }
}

async function deleteNotification(notificationId) {
  if (!confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
    return;
  }

  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;

    showAlert('Notification deleted successfully', 'success');
    loadNotifications();

  } catch (error) {
    console.error('Error deleting notification:', error);
    showAlert('Failed to delete notification', 'error');
  }
}

// Expose functions globally
window.editNotification = editNotification;
window.toggleNotificationStatus = toggleNotificationStatus;
window.deleteNotification = deleteNotification;

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
