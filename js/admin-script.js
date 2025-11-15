const SUPABASE_URL = 'https://qnroaigdrpoceasbqtmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucm9haWdkcnBvY2Vhc2JxdG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzIzMzgsImV4cCI6MjA3ODEwODMzOH0.AnySEJv5FLNikQ6aGlpg-p7YSpqINjvbMuuLe4SFKQc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage bucket name - CHANGE THIS to match your Supabase bucket name
const STORAGE_BUCKET = 'resources';

// Demo mode - set to true to bypass authentication
const DEMO_MODE = true;

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
  try {
    console.log('DEMO_MODE:', DEMO_MODE);
    
    // In demo mode, skip authentication
    if (DEMO_MODE) {
      console.log('Running in DEMO MODE - authentication bypassed');
      greeting.textContent = `Welcome, Admin (Demo)`;
      return;
    }

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Auth error:', error);
      showAlert('Authentication error. Running in demo mode.', 'warning');
      return;
    }

    if (!session) {
      console.log('No active session - redirecting to login');
      // Prevent redirect loop - don't redirect if already on login page
      if (!window.location.pathname.includes('index.html')) {
        setTimeout(() => {
          window.location.href = '../index.html';
        }, 100);
      }
      return;
    }

    greeting.textContent = `Welcome, Admin`;
  } catch (error) {
    console.error('Auth check failed:', error);
    showAlert('Authentication check failed. Running in demo mode.', 'error');
  }
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
    item.addEventListener('click', function () {
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

  // Add student button
  document.getElementById('addStudentBtn')?.addEventListener('click', () => openAddStudentModal());

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

  // Student form
  const studentForm = document.getElementById('studentForm');
  studentForm.addEventListener('submit', handleStudentSubmit);

  // File upload drag and drop
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileUpload = document.getElementById('fileUpload');

  fileUploadArea.addEventListener('click', (e) => {
    // Only trigger if not clicking the input itself
    if (e.target !== fileUpload) {
      fileUpload.click();
    }
  });

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
  // Navigate to separate pages
  if (pageName === 'courses') {
    window.location.href = 'pages/courses.html';
    return;
  }
  if (pageName === 'schedules') {
    window.location.href = 'pages/schedules.html';
    return;
  }
  if (pageName === 'calendar') {
    window.location.href = 'pages/calendar.html';
    return;
  }
  if (pageName === 'events') {
    window.location.href = 'pages/events.html';
    return;
  }
  if (pageName === 'notifications') {
    window.location.href = 'pages/notifications.html';
    return;
  }
  if (pageName === 'finances') {
    window.location.href = 'pages/finances.html';
    return;
  }

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
    const { count: studentCount, error: studentError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (studentError) throw studentError;

    document.getElementById('totalStudents').textContent = studentCount || 0;

    // Get total files from resources table
    const { count: fileCount, error: fileError } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (fileError) throw fileError;

    document.getElementById('totalFiles').textContent = fileCount || 0;

    // Active today (placeholder)
    document.getElementById('activeToday').textContent = '0';

  } catch (error) {
    console.error('Error loading stats:', error);
    showAlert('Failed to load dashboard stats', 'error');
  }
}

async function loadStudents() {
  const tbody = document.getElementById('studentsTableBody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading students...</td></tr>';

  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!students || students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="no-data">No students found</td></tr>';
      return;
    }

    // Debug: log first student to see column names
    if (students.length > 0) {
      console.log('Sample student data:', students[0]);
      console.log('Available columns:', Object.keys(students[0]));
      console.log('First name value:', students[0].first_name);
      console.log('Last name value:', students[0].last_name);
    }

    tbody.innerHTML = students.map(student => {
      // Try multiple possible column names for first name
      const firstName = student.first_name || student.name || student.firstName || '-';
      // Try multiple possible column names for last name
      const lastName = student.last_name || student.surname || student.lastName || '-';
      
      console.log(`Student ${student.student_id}: firstName="${firstName}", lastName="${lastName}"`);
      
      return `
      <tr data-student-id="${student.id}">
        <td>${student.student_id || '-'}</td>
        <td>${firstName}</td>
        <td>${lastName}</td>
        <td>${student.year || '-'}</td>
        <td>${student.course || 'Information Technology'}</td>
        <td>${student.email || (student.student_id ? student.student_id + '@gcc.edu' : '-')}</td>
        <td>${student.created_at ? new Date(student.created_at).toLocaleDateString() : '-'}</td>
        <td>
          <div class="action-buttons-cell">
            <button class="btn-icon btn-edit" onclick="editStudent('${student.id}')" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-danger" onclick="deleteStudent('${student.id}', '${student.student_id || 'this student'}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
      `;
    }).join('');

    // Update student count
    document.getElementById('totalStudents').textContent = students.length;

  } catch (error) {
    console.error('Error loading students:', error);
    tbody.innerHTML = '<tr><td colspan="8" class="error">Failed to load students</td></tr>';
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

  try {
    const { data: files, error } = await supabase
      .from('resources')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!files || files.length === 0) {
      filesGrid.innerHTML = '<div class="no-data">No files uploaded yet. Click "Upload File" to add resources.</div>';
      return;
    }

    filesGrid.innerHTML = files.map(file => `
      <div class="file-card" data-file-id="${file.id}">
        <div class="file-icon">
          <i class="fas fa-file-pdf"></i>
        </div>
        <div class="file-info">
          <h4>${file.title}</h4>
          <p class="file-category">${file.category}</p>
          <p class="file-meta">Year ${file.year === 'all' ? 'All' : file.year} • ${formatFileSize(file.file_size)}</p>
          <p class="file-downloads">${file.download_count || 0} downloads</p>
        </div>
        <div class="file-actions">
          <button class="btn-icon" onclick="downloadFile('${file.file_url}')" title="Download">
            <i class="fas fa-download"></i>
          </button>
          <button class="btn-icon btn-danger" onclick="deleteFile('${file.id}', '${file.storage_path}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');

    // Update file count
    document.getElementById('totalFiles').textContent = files.length;

  } catch (error) {
    console.error('Error loading files:', error);
    filesGrid.innerHTML = '<div class="error">Failed to load files</div>';
    showAlert('Failed to load files', 'error');
  }
}

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function showFilePreview(file) {
  const preview = document.getElementById('filePreview');
  preview.innerHTML = `
    <div class="file-preview-item">
      <i class="fas fa-file-pdf"></i>
      <span>${file.name}</span>
      <span class="file-size">${formatFileSize(file.size)}</span>
    </div>
  `;
}

async function handleFileUpload(e) {
  e.preventDefault();

  const fileName = document.getElementById('fileName').value.trim();
  const fileCategory = document.getElementById('fileCategory').value;
  const fileYear = document.getElementById('fileYear').value;
  const fileDescription = document.getElementById('fileDescription')?.value.trim() || '';
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

  if (file.size > 10 * 1024 * 1024) {
    showAlert('File size must be less than 10MB', 'error');
    return;
  }

  // Show loading
  const submitBtn = e.target.querySelector('.btn-submit');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
  submitBtn.disabled = true;

  try {
    // Create storage path based on year
    const yearFolder = fileYear === 'all' ? 'all-years' : `year-${fileYear}`;
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const storagePath = `${yearFolder}/${sanitizedFileName}-${timestamp}.pdf`;

    // Upload file to Supabase Storage
    console.log('Uploading to:', STORAGE_BUCKET, storagePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }
    
    console.log('Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Insert record into resources table
    const { error: dbError } = await supabase
      .from('resources')
      .insert([{
        title: fileName,
        description: fileDescription,
        file_name: file.name,
        storage_path: storagePath,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        category: fileCategory,
        course: 'Information Technology',
        year: fileYear,
        is_active: true
      }])
      .select();

    if (dbError) throw dbError;

    showAlert(`File "${fileName}" uploaded successfully!`, 'success');

    closeAllModals();
    uploadFileForm.reset();
    document.getElementById('filePreview').innerHTML = '';

    // Reload files if on files page
    if (filesPage.classList.contains('active')) {
      loadFiles();
    }

    // Update dashboard stats
    loadDashboardStats();

  } catch (error) {
    console.error('Error uploading file:', error);
    showAlert(`Failed to upload file: ${error.message}`, 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

function downloadFile(fileUrl) {
  window.open(fileUrl, '_blank');
}

async function deleteFile(fileId, storagePath) {
  if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
    return;
  }

  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('resources')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;

    showAlert('File deleted successfully', 'success');

    // Reload files
    loadFiles();
    loadDashboardStats();

  } catch (error) {
    console.error('Error deleting file:', error);
    showAlert(`Failed to delete file: ${error.message}`, 'error');
  }
}

// Student Management Functions
function openAddStudentModal() {
  const modal = document.getElementById('studentModal');
  const form = document.getElementById('studentForm');
  const title = document.getElementById('studentModalTitle');
  const submitBtn = document.getElementById('studentSubmitBtn');
  
  form.reset();
  document.getElementById('studentId').value = '';
  title.textContent = 'Add Student';
  submitBtn.textContent = 'Add Student';
  
  openModal(modal);
}

async function editStudent(studentId) {
  try {
    // Fetch student data
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) throw error;

    // Populate form
    document.getElementById('studentId').value = student.id;
    document.getElementById('studentNumber').value = student.student_id;
    document.getElementById('firstName').value = student.first_name || student.name || '';
    document.getElementById('lastName').value = student.last_name || student.surname || '';
    document.getElementById('studentEmail').value = student.email || '';
    document.getElementById('studentYear').value = student.year || '';
    document.getElementById('studentCourse').value = student.course || 'Information Technology';
    document.getElementById('profileImage').value = student.profile_image || '';
    
    // Password is not populated for security
    document.getElementById('studentPassword').value = '';
    document.getElementById('studentPassword').required = false;
    document.getElementById('studentPassword').placeholder = 'Leave blank to keep current password';

    // Update modal title and button
    document.getElementById('studentModalTitle').textContent = 'Edit Student';
    document.getElementById('studentSubmitBtn').textContent = 'Update Student';

    // Open modal
    openModal(document.getElementById('studentModal'));

  } catch (error) {
    console.error('Error loading student:', error);
    showAlert('Failed to load student data', 'error');
  }
}

async function handleStudentSubmit(e) {
  e.preventDefault();

  const studentId = document.getElementById('studentId').value;
  const isEdit = !!studentId;

  const studentData = {
    student_id: document.getElementById('studentNumber').value.trim(),
    first_name: document.getElementById('firstName').value.trim(),
    last_name: document.getElementById('lastName').value.trim(),
    email: document.getElementById('studentEmail').value.trim(),
    year: document.getElementById('studentYear').value,
    course: document.getElementById('studentCourse').value,
    profile_image: document.getElementById('profileImage').value.trim() || null
  };

  const password = document.getElementById('studentPassword').value;

  // Show loading
  const submitBtn = document.getElementById('studentSubmitBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;

  try {
    if (isEdit) {
      // Update existing student
      const { error: updateError } = await supabase
        .from('student_info')
        .update(studentData)
        .eq('id', studentId);

      if (updateError) throw updateError;

      // Update password if provided
      if (password) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          studentId,
          { password: password }
        );
        
        if (authError) {
          console.warn('Password update failed:', authError);
          showAlert('Student updated but password change failed', 'warning');
        }
      }

      showAlert('Student updated successfully!', 'success');

    } else {
      // Create new student
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: studentData.email,
        password: password,
        options: {
          data: {
            first_name: studentData.first_name,
            last_name: studentData.last_name,
            role: 'student'
          }
        }
      });

      if (authError) throw authError;

      // Then create student record
      const { error: insertError } = await supabase
        .from('student_info')
        .insert([{
          ...studentData,
          user_id: authData.user?.id
        }]);

      if (insertError) throw insertError;

      showAlert('Student added successfully!', 'success');
    }

    // Close modal and reload students
    closeAllModals();
    document.getElementById('studentForm').reset();
    
    if (studentsPage.classList.contains('active')) {
      loadStudents();
    }
    
    loadDashboardStats();

  } catch (error) {
    console.error('Error saving student:', error);
    showAlert(`Failed to ${isEdit ? 'update' : 'add'} student: ${error.message}`, 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

async function deleteStudent(studentId, studentNumber) {
  if (!confirm(`Are you sure you want to delete student ${studentNumber}? This action cannot be undone.`)) {
    return;
  }

  try {
    // First, get the student to find their student_id
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('student_id')
      .eq('id', studentId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from student_info first (child table) using student_id
    try {
      await supabase
        .from('student_info')
        .delete()
        .eq('student_id', student.student_id);
    } catch (infoError) {
      console.log('No student_info record to delete or already deleted');
    }

    // Delete from student_finances if exists
    try {
      await supabase
        .from('student_finances')
        .delete()
        .eq('student_id', student.student_id);
    } catch (financeError) {
      console.log('No finance record to delete');
    }

    // Finally, delete from students table (parent table)
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);

    if (error) throw error;

    showAlert('Student deleted successfully', 'success');

    // Reload students
    loadStudents();
    loadDashboardStats();

  } catch (error) {
    console.error('Error deleting student:', error);
    showAlert(`Failed to delete student: ${error.message}`, 'error');
  }
}

// Expose functions globally for onclick handlers
window.downloadFile = downloadFile;
window.deleteFile = deleteFile;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;

async function handleSignOut() {
  if (confirm('Are you sure you want to sign out?')) {
    if (!DEMO_MODE) {
      await supabase.auth.signOut();
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