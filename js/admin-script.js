// Supabase Configuration
const SUPABASE_URL = 'https://qnroaigdrpoceasbqtmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucm9haWdkcnBvY2Vhc2JxdG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzIzMzgsImV4cCI6MjA3ODEwODMzOH0.AnySEJv5FLNikQ6aGlpg-p7YSpqINjvbMuuLe4SFKQc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const mainContent = document.getElementById('mainContent');
const currentDateEl = document.getElementById('currentDate');
const greeting = document.getElementById('greeting');
const signOutBtn = document.getElementById('sign-out');

// Page elements
const dashboardPage = document.getElementById('dashboardPage');
const studentsPage = document.getElementById('studentsPage');
const filesPage = document.getElementById('filesPage');

// Modal elements
const uploadFileModal = document.getElementById('uploadFileModal');
const uploadFileForm = document.getElementById('uploadFileForm');
const closeModalBtns = document.querySelectorAll('.close-modal, .btn-cancel');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  setupEventListeners();
  loadDashboardStats();
});

function initDashboard() {
  setCurrentDate();
  setGreeting();
  checkAuth();
}

async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    //window.location.href = '../../index.html';
    return;
  }
  
  // Check if user is admin (you can add admin role check here)
  greeting.textContent = `Welcome, Admin`;
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
  
  greeting.textContent = `${greetingText}, Admin`;
}

function setupEventListeners() {
  // Sidebar toggle
  menuToggle.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);
  
  // Navigation
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      if (this.classList.contains('sign-out')) {
        handleSignOut();
      } else {
        const page = this.getAttribute('data-page');
        if (page) {
          switchPage(page);
          navItems.forEach(i => i.classList.remove('active'));
          this.classList.add('active');
          
          if (window.innerWidth <= 768) {
            closeSidebar();
          }
        }
      }
    });
  });
  
  // Quick action buttons
  document.getElementById('viewStudentsBtn')?.addEventListener('click', () => switchPage('students'));
  document.getElementById('manageFilesBtn')?.addEventListener('click', () => switchPage('files'));
  
  // Upload file button
  document.getElementById('uploadFileBtn')?.addEventListener('click', () => openModal(uploadFileModal));
  
  // Modal close
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeAllModals();
    }
  });
  
  // Upload form
  uploadFileForm.addEventListener('submit', handleFileUpload);
  
  // File upload drag and drop
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileUpload = document.getElementById('fileUpload');
  
  fileUploadArea.addEventListener('click', () => fileUpload.click());
  
  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
  });
  
  fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('dragover');
  });
  
  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      fileUpload.files = files;
      showFilePreview(files[0]);
    }
  });
  
  fileUpload.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      showFilePreview(e.target.files[0]);
    }
  });
  
  // Student search
  document.getElementById('studentSearch')?.addEventListener('input', (e) => {
    filterStudents(e.target.value);
  });
  
  // Sign out
  signOutBtn.addEventListener('click', handleSignOut);
  
  window.addEventListener('resize', handleResize);
}

function switchPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show selected page
  const pageMap = {
    'dashboard': dashboardPage,
    'students': studentsPage,
    'files': filesPage
  };
  
  const selectedPage = pageMap[pageName];
  if (selectedPage) {
    selectedPage.classList.add('active');
    
    // Load data for the page
    if (pageName === 'students') {
      loadStudents();
    } else if (pageName === 'files') {
      loadFiles();
    }
  }
}

async function loadDashboardStats() {
  try {
    // Get total students
    const { count: studentCount } = await supabase
      .from('student_info')
      .select('*', { count: 'exact', head: true });
    
    document.getElementById('totalStudents').textContent = studentCount || 0;
    
    // Count files in resources folder (this would need backend support)
    // For now, we'll set a placeholder
    document.getElementById('totalFiles').textContent = '0';
    document.getElementById('activeToday').textContent = '0';
    
  } catch (error) {
    console.error('Error loading stats:', error);
    showAlert('Failed to load dashboard stats', 'error');
  }
}

async function loadStudents() {
  const tbody = document.getElementById('studentsTableBody');
  tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading students...</td></tr>';
  
  try {
    const { data: students, error } = await supabase
      .from('student_info')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (!students || students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data">No students found</td></tr>';
      return;
    }
    
    tbody.innerHTML = students.map(student => `
      <tr>
        <td>${student.student_id}</td>
        <td>${student.name}</td>
        <td>${student.surname}</td>
        <td>${student.course || 'N/A'}</td>
        <td>${student.student_id}@gcc.dummy</td>
        <td>${new Date(student.created_at).toLocaleDateString()}</td>
      </tr>
    `).join('');
    
  } catch (error) {
    console.error('Error loading students:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="error">Failed to load students</td></tr>';
    showAlert('Failed to load students', 'error');
  }
}

function filterStudents(searchTerm) {
  const rows = document.querySelectorAll('#studentsTableBody tr');
  const term = searchTerm.toLowerCase();
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

async function loadFiles() {
  const filesGrid = document.getElementById('filesGrid');
  filesGrid.innerHTML = '<div class="loading">Loading files...</div>';
  
  // This is a placeholder - you'll need to implement actual file listing
  // For now, we'll show the files that should be in the resources folder
  const files = [
    { name: 'Exam Timetable 2025', category: 'timetables', path: 'resources/Exam-Timetable-2025.pdf' },
    { name: 'Application Form', category: 'forms', path: 'resources/Application-Form.pdf' },
    { name: 'Student Handbook', category: 'guides', path: 'resources/Student-Handbook.pdf' }
  ];
  
  if (files.length === 0) {
    filesGrid.innerHTML = '<div class="no-data">No files uploaded yet</div>';
    return;
  }
  
  filesGrid.innerHTML = files.map(file => `
    <div class="file-card">
      <div class="file-icon">
        <i class="fas fa-file-pdf"></i>
      </div>
      <div class="file-info">
        <h4>${file.name}</h4>
        <p class="file-category">${file.category}</p>
        <p class="file-path">${file.path}</p>
      </div>
      <div class="file-actions">
        <button class="btn-icon" onclick="downloadFile('${file.path}')" title="Download">
          <i class="fas fa-download"></i>
        </button>
        <button class="btn-icon btn-danger" onclick="deleteFile('${file.name}')" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
  
  // Update file count
  document.getElementById('totalFiles').textContent = files.length;
}

function showFilePreview(file) {
  const preview = document.getElementById('filePreview');
  preview.innerHTML = `
    <div class="file-preview-item">
      <i class="fas fa-file-pdf"></i>
      <span>${file.name}</span>
      <span class="file-size">${(file.size / 1024).toFixed(2)} KB</span>
    </div>
  `;
}

async function handleFileUpload(e) {
  e.preventDefault();
  
  const fileName = document.getElementById('fileName').value;
  const fileCategory = document.getElementById('fileCategory').value;
  const fileInput = document.getElementById('fileUpload');
  const file = fileInput.files[0];
  
  if (!file) {
    showAlert('Please select a file', 'error');
    return;
  }
  
  if (file.type !== 'application/pdf') {
    showAlert('Only PDF files are allowed', 'error');
    return;
  }
  
  // Show loading
  const submitBtn = e.target.querySelector('.btn-submit');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
  submitBtn.disabled = true;
  
  try {
    // In a real implementation, you would upload to Supabase Storage
    // For now, we'll just show a success message
    // The file should be manually placed in the resources folder
    
    showAlert(`File "${fileName}.pdf" uploaded successfully! Please place it in the resources folder.`, 'success');
    
    closeAllModals();
    uploadFileForm.reset();
    document.getElementById('filePreview').innerHTML = '';
    
    // Reload files
    if (filesPage.classList.contains('active')) {
      loadFiles();
    }
    
  } catch (error) {
    console.error('Error uploading file:', error);
    showAlert('Failed to upload file', 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

function downloadFile(path) {
  window.open(`../../${path}`, '_blank');
}

function deleteFile(fileName) {
  if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
    showAlert(`File "${fileName}" deleted. Please remove it from the resources folder.`, 'success');
    loadFiles();
  }
}

window.downloadFile = downloadFile;
window.deleteFile = deleteFile;

async function handleSignOut() {
  if (confirm('Are you sure you want to sign out?')) {
    await supabase.auth.signOut();
    window.location.href = '../../index.html';
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
