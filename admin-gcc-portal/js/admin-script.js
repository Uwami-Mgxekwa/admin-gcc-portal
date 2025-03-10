// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const mainContent = document.getElementById('mainContent');
const currentDateEl = document.getElementById('currentDate');
const greeting = document.getElementById('greeting');
const profileImg = document.getElementById('profile-img');
const miniCalendar = document.getElementById('miniCalendar');
const quickNotes = document.getElementById('quickNotes');
const saveNote = document.getElementById('saveNote');

// Modal elements
const addUserBtn = document.getElementById('addUserBtn');
const addUserModal = document.getElementById('addUserModal');
const addCourseBtn = document.getElementById('addCourseBtn');
const addEventBtn = document.getElementById('addEventBtn');
const uploadResourceBtn = document.getElementById('uploadResourceBtn');
const sendNotificationBtn = document.getElementById('sendNotificationBtn');
const generateReportBtn = document.getElementById('generateReportBtn');
const closeModalBtns = document.querySelectorAll('.close-modal, .btn-cancel');
const addUserForm = document.getElementById('addUserForm');
const signOutBtn = document.getElementById('sign-out');

const adminUser = {
  name: 'John Doe',
  email: 'john.doe@gcc.edu',
  role: 'Admin',
  profileImage: '../assets/profile.jpg',
};

function initDashboard() {
  setCurrentDate();
  setGreeting();
  setupEventListeners();
  loadProfileInfo();
  setupCalendar();
  loadSavedNotes();
}

function setCurrentDate() {
  const date = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDateEl.textContent = date.toLocaleDateString('en-US', options);
}

function setGreeting() {
  const hour = new Date().getHours();
  let greetingText = 'Good ';
  
  if (hour < 12) {
    greetingText += 'Morning';
  } else if (hour < 18) {
    greetingText += 'Afternoon';
  } else {
    greetingText += 'Evening';
  }
  
  greeting.textContent = `${greetingText}, ${adminUser.name}`;
}

function loadProfileInfo() {
  if (adminUser.profileImage) {
    profileImg.src = adminUser.profileImage;
    profileImg.alt = adminUser.name;
  }
}

function setupEventListeners() {
  menuToggle.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);
  
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      if (this.classList.contains('sign-out')) {
        handleSignOut();
      } else {
        navItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        if (window.innerWidth <= 768) {
          closeSidebar();
        }
      }
    });
  });
  
  addUserBtn.addEventListener('click', () => openModal(addUserModal));
  addCourseBtn.addEventListener('click', () => showNotImplemented('Add Course'));
  addEventBtn.addEventListener('click', () => showNotImplemented('Create Event'));
  uploadResourceBtn.addEventListener('click', () => showNotImplemented('Upload Resource'));
  sendNotificationBtn.addEventListener('click', () => showNotImplemented('Send Notification'));
  generateReportBtn.addEventListener('click', () => showNotImplemented('Generate Report'));
  
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeAllModals();
    }
  });
  
  addUserForm.addEventListener('submit', handleAddUser);
  
  saveNote.addEventListener('click', saveUserNotes);
  
  const approveButtons = document.querySelectorAll('.btn-approve');
  const rejectButtons = document.querySelectorAll('.btn-reject');
  
  approveButtons.forEach(btn => {
    btn.addEventListener('click', () => handleApproval(btn, true));
  });
  
  rejectButtons.forEach(btn => {
    btn.addEventListener('click', () => handleApproval(btn, false));
  });
  
  signOutBtn.addEventListener('click', handleSignOut);
  
  window.addEventListener('resize', handleResize);
}

function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
  
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('active');
    sidebarOverlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
  }
  
  adjustMainContent();
}

function closeSidebar() {
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('active');
    sidebarOverlay.style.display = 'none';
  }
}

function adjustMainContent() {
  if (sidebar.classList.contains('collapsed')) {
    mainContent.style.marginLeft = '70px';
    mainContent.style.width = window.innerWidth <= 992 ? 'calc(100% - 70px)' : 'calc(100% - 370px)';
  } else {
    mainContent.style.marginLeft = '250px';
    mainContent.style.width = window.innerWidth <= 992 ? 'calc(100% - 250px)' : 'calc(100% - 550px)';
  }
  
  if (window.innerWidth <= 768) {
    mainContent.style.marginLeft = '0';
    mainContent.style.width = '100%';
  }
}

function handleResize() {
  if (window.innerWidth <= 768) {
    sidebar.classList.add('collapsed');
    sidebar.classList.remove('active');
    sidebarOverlay.style.display = 'none';
    mainContent.style.marginLeft = '0';
    mainContent.style.width = '100%';
  } else {
    adjustMainContent();
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

function showNotImplemented(feature) {
  alert(`${feature} feature is not implemented yet.`);
}

function handleAddUser(e) {
  e.preventDefault();
  
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const email = document.getElementById('email').value;
  const userType = document.getElementById('userType').value;
  const department = document.getElementById('department').value;
  
  console.log('Adding new user:', {
    firstName,
    lastName,
    email,
    userType,
    department
  });
  
  addNewActivity({
    icon: 'user-plus',
    desc: 'New user added',
    subject: `${firstName} ${lastName}`,
    time: 'Just now'
  });
  
  closeAllModals();
  e.target.reset();
  
  alert(`User ${firstName} ${lastName} added successfully!`);
}

function addNewActivity(activity) {
  const activityList = document.querySelector('.activity-list');
  const activityItem = document.createElement('div');
  activityItem.className = 'activity-item';
  
  activityItem.innerHTML = `
    <div class="activity-icon">
      <i class="fas fa-${activity.icon}"></i>
    </div>
    <div class="activity-details">
      <p class="activity-desc">${activity.desc}</p>
      <p class="activity-subject">${activity.subject}</p>
      <p class="activity-time">${activity.time}</p>
    </div>
  `;
  
  activityList.insertBefore(activityItem, activityList.firstChild);
  
  if (activityList.children.length > 5) {
    activityList.removeChild(activityList.lastChild);
  }
}

function handleApproval(button, isApproved) {
  const pendingItem = button.closest('.pending-item');
  const itemDetails = pendingItem.querySelector('.pending-details h4').textContent;
  
  addNewActivity({
    icon: isApproved ? 'check' : 'times',
    desc: isApproved ? 'Item approved' : 'Item rejected',
    subject: itemDetails,
    time: 'Just now'
  });
  
  pendingItem.style.backgroundColor = isApproved ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';
  setTimeout(() => {
    pendingItem.style.transition = 'opacity 0.3s ease';
    pendingItem.style.opacity = '0';
    
    setTimeout(() => {
      pendingItem.remove();
      
      const pendingList = document.querySelector('.pending-list');
      if (pendingList && pendingList.children.length === 0) {
        pendingList.innerHTML = '<p class="no-items">No pending approvals at this time.</p>';
      }
    }, 300);
  }, 500);
}



function handleSignOut() {
  if (confirm('Are you sure you want to sign out?')) {
    console.log('Signing out...');
    window.location.href = '../index.html';
  }
}

function setupCalendar() {
    const date = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    let calendarHTML = `
      <div class="calendar-header">
        <button class="month-nav prev"><i class="fas fa-chevron-left"></i></button>
        <h4>${monthNames[currentMonth]} ${currentYear}</h4>
        <button class="month-nav next"><i class="fas fa-chevron-right"></i></button>
      </div>
      <div class="calendar-days">
        <div class="day-name">Su</div>
        <div class="day-name">Mo</div>
        <div class="day-name">Tu</div>
        <div class="day-name">We</div>
        <div class="day-name">Th</div>
        <div class="day-name">Fr</div>
        <div class="day-name">Sa</div>
    `;
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarHTML += '<div class="day empty"></div>';
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = i === date.getDate();
      const hasEvent = [5, 12, 20, 25].includes(i);
      
      calendarHTML += `<div class="day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}">${i}</div>`;
    }
    
    const totalCells = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;
    const remainingCells = totalCells - (daysInMonth + firstDayOfMonth);
    
    for (let i = 0; i < remainingCells; i++) {
      calendarHTML += '<div class="day empty"></div>';
    }
    
    calendarHTML += '</div>';

    miniCalendar.innerHTML = calendarHTML;
    
    const prevMonthBtn = miniCalendar.querySelector('.month-nav.prev');
    const nextMonthBtn = miniCalendar.querySelector('.month-nav.next');
    
    prevMonthBtn.addEventListener('click', () => {
      showNotImplemented('Previous Month Navigation');
    });
    
    nextMonthBtn.addEventListener('click', () => {
      showNotImplemented('Next Month Navigation');
    });
    
    const eventDays = miniCalendar.querySelectorAll('.day.has-event');
    eventDays.forEach(day => {
      day.addEventListener('click', () => {
        showNotImplemented(`View Events for ${monthNames[currentMonth]} ${day.textContent}, ${currentYear}`);
      });
    });
  }

function saveUserNotes() {
  const notes = quickNotes.value.trim();
  if (notes) {
    localStorage.setItem('adminNotes', notes);
    alert('Note saved successfully!');
  } else {
    alert('Please enter some text to save a note.');
  }
}

function loadSavedNotes() {
  const savedNotes = localStorage.getItem('adminNotes');
  if (savedNotes) {
    quickNotes.value = savedNotes;
  }
}

function showToast(message, type = 'info') {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  });
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, 5000);
}

function setupThemeToggle() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  let themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) {
    themeToggle = document.createElement('button');
    themeToggle.id = 'themeToggle';
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = `<i class="fas ${savedTheme === 'light' ? 'fa-moon' : 'fa-sun'}"></i>`;
    document.querySelector('.greeting-wrapper').appendChild(themeToggle);
  }
  
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    themeToggle.innerHTML = `<i class="fas ${newTheme === 'light' ? 'fa-moon' : 'fa-sun'}"></i>`;
    
    showToast(`Switched to ${newTheme} theme`, 'success');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  setupThemeToggle();
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('new') && urlParams.get('new') === 'true') {
    showToast('Welcome to your dashboard!', 'success');
  }
});

document.getElementById("toggleCalendar").addEventListener("click", function() {
  var calendar = document.getElementById("miniCalendar");
  calendar.classList.toggle("collapsed");
});
