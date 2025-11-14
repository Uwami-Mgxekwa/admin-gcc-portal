const SUPABASE_URL = 'https://qnroaigdrpoceasbqtmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucm9haWdkcnBvY2Vhc2JxdG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzIzMzgsImV4cCI6MjA3ODEwODMzOH0.AnySEJv5FLNikQ6aGlpg-p7YSpqINjvbMuuLe4SFKQc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const signOutBtn = document.getElementById('sign-out');
const addEventBtn = document.getElementById('addEventBtn');
const eventModal = document.getElementById('eventModal');
const eventForm = document.getElementById('eventForm');
const closeModalBtns = document.querySelectorAll('.close-modal, .btn-cancel');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  loadEvents();
  setupEventListeners();
});

function initSidebar() {
  const isMobile = () => window.innerWidth <= 768;

  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    if (isMobile()) {
      sidebar.classList.toggle('active');
      sidebarOverlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
    }
  });

  sidebarOverlay.addEventListener('click', () => {
    if (isMobile()) {
      sidebar.classList.remove('active');
      sidebarOverlay.style.display = 'none';
    }
  });

  window.addEventListener('resize', () => {
    if (isMobile()) {
      sidebar.classList.remove('active');
      sidebarOverlay.style.display = 'none';
    }
  });
}

function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      if (this.classList.contains('sign-out')) {
        handleSignOut();
      } else {
        const page = this.getAttribute('data-page');
        if (page === 'dashboard') {
          window.location.href = '../index.html';
        } else if (page === 'students') {
          window.location.href = '../index.html';
        } else if (page === 'courses') {
          window.location.href = 'courses.html';
        } else if (page === 'schedules') {
          window.location.href = 'schedules.html';
        } else if (page === 'notifications') {
          window.location.href = 'notifications.html';
        } else if (page === 'finances') {
          window.location.href = 'finances.html';
        } else if (page === 'files') {
          window.location.href = '../index.html';
        }
        // Only close sidebar on mobile
        if (window.innerWidth <= 768) {
          sidebar.classList.add('collapsed');
          sidebarOverlay.style.display = 'none';
        }
      }
    });
  });

  // Add event button
  addEventBtn.addEventListener('click', () => openAddEventModal());

  // Modal close
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeAllModals();
    }
  });

  // Event form submit
  eventForm.addEventListener('submit', handleEventSubmit);

  // Sign out
  signOutBtn.addEventListener('click', handleSignOut);
}

async function loadEvents() {
  const eventsGrid = document.getElementById('eventsGrid');
  eventsGrid.innerHTML = '<div class="loading">Loading events...</div>';

  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (error) throw error;

    if (!events || events.length === 0) {
      eventsGrid.innerHTML = '<div class="no-data">No events found. Click "Create Event" to add one.</div>';
      return;
    }

    eventsGrid.innerHTML = events.map(event => `
      <div class="event-card ${event.event_type}" data-event-id="${event.id}">
        <div class="event-card-header">
          <div class="event-date-badge">
            <span class="event-month">${formatMonth(event.event_date)}</span>
            <span class="event-day">${formatDay(event.event_date)}</span>
          </div>
          <div class="event-type-badge ${event.event_type}">
            ${event.event_type}
          </div>
        </div>
        <div class="event-card-body">
          <h3>${event.title}</h3>
          <div class="event-meta">
            <span><i class="fas fa-clock"></i> ${event.time}</span>
            <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
            ${event.attendees ? `<span><i class="fas fa-users"></i> ${event.attendees} expected</span>` : ''}
          </div>
          <p class="event-description">${event.description}</p>
        </div>
        <div class="event-card-footer">
          <button class="btn-icon btn-edit" onclick="editEvent('${event.id}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon btn-danger" onclick="deleteEvent('${event.id}', '${event.title}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading events:', error);
    eventsGrid.innerHTML = '<div class="error">Failed to load events</div>';
    showAlert('Error', 'Failed to load events', 'error');
  }
}

function formatMonth(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function formatDay(dateString) {
  const date = new Date(dateString);
  return date.getDate();
}

function openAddEventModal() {
  const modal = document.getElementById('eventModal');
  const form = document.getElementById('eventForm');
  const title = document.getElementById('eventModalTitle');
  const submitBtn = document.getElementById('eventSubmitBtn');
  
  form.reset();
  document.getElementById('eventId').value = '';
  title.textContent = 'Create Event';
  submitBtn.textContent = 'Create Event';
  
  openModal(modal);
}

async function editEvent(eventId) {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) throw error;

    // Populate form
    document.getElementById('eventId').value = event.id;
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDate').value = event.event_date;
    document.getElementById('eventTime').value = event.time;
    document.getElementById('eventLocation').value = event.location;
    document.getElementById('eventDescription').value = event.description;
    document.getElementById('eventType').value = event.event_type;
    document.getElementById('eventAttendees').value = event.attendees || '';

    // Update modal
    document.getElementById('eventModalTitle').textContent = 'Edit Event';
    document.getElementById('eventSubmitBtn').textContent = 'Update Event';

    openModal(document.getElementById('eventModal'));

  } catch (error) {
    console.error('Error loading event:', error);
    showAlert('Error', 'Failed to load event data', 'error');
  }
}

async function handleEventSubmit(e) {
  e.preventDefault();

  const eventId = document.getElementById('eventId').value;
  const isEdit = !!eventId;

  const eventData = {
    title: document.getElementById('eventTitle').value.trim(),
    event_date: document.getElementById('eventDate').value,
    time: document.getElementById('eventTime').value.trim(),
    location: document.getElementById('eventLocation').value.trim(),
    description: document.getElementById('eventDescription').value.trim(),
    event_type: document.getElementById('eventType').value,
    attendees: parseInt(document.getElementById('eventAttendees').value) || null
  };

  // Show loading
  const submitBtn = document.getElementById('eventSubmitBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;

  try {
    if (isEdit) {
      // Update existing event
      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId);

      if (error) throw error;

      showAlert('Success', 'Event updated successfully!', 'success');
    } else {
      // Create new event
      const { error } = await supabase
        .from('events')
        .insert([eventData]);

      if (error) throw error;

      showAlert('Success', 'Event created successfully!', 'success');
    }

    closeAllModals();
    eventForm.reset();
    loadEvents();

  } catch (error) {
    console.error('Error saving event:', error);
    showAlert('Error', `Failed to ${isEdit ? 'update' : 'create'} event: ${error.message}`, 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

async function deleteEvent(eventId, eventTitle) {
  if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;

    showAlert('Success', 'Event deleted successfully', 'success');
    loadEvents();

  } catch (error) {
    console.error('Error deleting event:', error);
    showAlert('Error', `Failed to delete event: ${error.message}`, 'error');
  }
}

// Expose functions globally
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;

function handleSignOut() {
  if (confirm('Are you sure you want to sign out?')) {
    window.location.href = '../index.html';
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

function showAlert(title, message, type = 'info') {
  const container = document.getElementById('alertContainer');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;

  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle';

  alert.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span><strong>${title}:</strong> ${message}</span>
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
