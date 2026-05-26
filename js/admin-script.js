// Back4App config loaded via <script> tag in HTML — supabase global is available
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
  handleHashNavigation();
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
  if (pageName === 'assignments') {
    window.location.href = 'pages/assignments.html';
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

function handleHashNavigation() {
  const hash = window.location.hash.substring(1); // Remove the # symbol
  if (hash) {
    switchPage(hash);
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-page') === hash) {
        item.classList.add('active');
      }
    });
  }
}

async function loadDashboardStats() {
  try {
    // Get total students from Parse _User class
    const userQuery = new Parse.Query(Parse.User);
    userQuery.exists('student_id'); // Only count actual students
    const studentCount = await userQuery.count();
    document.getElementById('totalStudents').textContent = studentCount || 0;

    // Get total files from resources class
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
    // Query Parse _User class for students (users with a student_id field)
    const query = new Parse.Query(Parse.User);
    query.exists('student_id');
    query.descending('createdAt');
    query.limit(1000);
    const users = await query.find({ useMasterKey: false });

    if (!users || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="no-data">No students found</td></tr>';
      return;
    }

    // For each user, try to get their StudentInfo record
    const studentInfoQuery = new Parse.Query('StudentInfo');
    studentInfoQuery.limit(1000);
    const allInfoRecords = await studentInfoQuery.find();
    const infoMap = {};
    allInfoRecords.forEach(info => {
      infoMap[info.get('student_id')] = info;
    });

    tbody.innerHTML = users.map(user => {
      const studentId = user.get('student_id') || '-';
      const firstName = user.get('first_name') || '-';
      const lastName = user.get('last_name') || '-';
      const email = user.get('email') || '-';
      const info = infoMap[studentId];
      const year = info ? info.get('year') : (user.get('year') || '-');
      const course = info ? info.get('course') : (user.get('course') || 'Information Technology');
      const createdAt = user.get('createdAt') ? new Date(user.get('createdAt')).toLocaleDateString() : '-';

      return `
      <tr data-student-id="${user.id}">
        <td>${studentId}</td>
        <td>${firstName}</td>
        <td>${lastName}</td>
        <td>${year}</td>
        <td>${course}</td>
        <td>${email}</td>
        <td>${createdAt}</td>
        <td>
          <div class="action-buttons-cell">
            <button class="btn-icon btn-edit" onclick="editStudent('${user.id}')" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-danger" onclick="deleteStudent('${user.id}', '${studentId}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
      `;
    }).join('');

    document.getElementById('totalStudents').textContent = users.length;

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

  if (!file) { showAlert('Please select a file', 'error'); return; }
  if (file.type !== 'application/pdf') { showAlert('Only PDF files are allowed', 'error'); return; }
  if (file.size > 10 * 1024 * 1024) { showAlert('File size must be less than 10MB', 'error'); return; }

  const submitBtn = e.target.querySelector('.btn-submit');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
  submitBtn.disabled = true;

  try {
    // Upload file using Parse Files
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const parseFileName = `${sanitizedName}-${timestamp}.pdf`;

    const parseFile = new Parse.File(parseFileName, file, 'application/pdf');
    await parseFile.save();
    const publicUrl = parseFile.url();

    // Save record to resources class
    const { error: dbError } = await supabase
      .from('resources')
      .insert([{
        title: fileName,
        description: fileDescription,
        file_name: file.name,
        storage_path: parseFileName,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        category: fileCategory,
        course: 'Information Technology',
        year: fileYear,
        is_active: true
      }]);

    if (dbError) throw dbError;

    showAlert(`File "${fileName}" uploaded successfully!`, 'success');
    closeAllModals();
    uploadFileForm.reset();
    document.getElementById('filePreview').innerHTML = '';

    if (filesPage.classList.contains('active')) loadFiles();
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
    // Delete the database record (Parse File deletion requires the file object — skip storage delete)
    const { error: dbError } = await supabase
      .from('resources')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;

    showAlert('File deleted successfully', 'success');
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

async function editStudent(userId) {
  try {
    const query = new Parse.Query(Parse.User);
    const user = await query.get(userId);

    // Get StudentInfo
    const infoQuery = new Parse.Query('StudentInfo');
    infoQuery.equalTo('student_id', user.get('student_id'));
    const info = await infoQuery.first();

    document.getElementById('studentId').value = user.id;
    document.getElementById('studentNumber').value = user.get('student_id') || '';
    document.getElementById('firstName').value = user.get('first_name') || '';
    document.getElementById('lastName').value = user.get('last_name') || '';
    document.getElementById('studentEmail').value = user.get('email') || '';
    document.getElementById('studentYear').value = info ? info.get('year') : '';
    document.getElementById('studentCourse').value = info ? info.get('course') : 'Information Technology';
    document.getElementById('profileImage').value = user.get('profile_image') || '';
    document.getElementById('studentPassword').value = '';
    document.getElementById('studentPassword').required = false;
    document.getElementById('studentPassword').placeholder = 'Leave blank to keep current password';

    document.getElementById('studentModalTitle').textContent = 'Edit Student';
    document.getElementById('studentSubmitBtn').textContent = 'Update Student';
    openModal(document.getElementById('studentModal'));

  } catch (error) {
    console.error('Error loading student:', error);
    showAlert('Failed to load student data', 'error');
  }
}

async function handleStudentSubmit(e) {
  e.preventDefault();

  const userId = document.getElementById('studentId').value;
  const isEdit = !!userId;
  const password = document.getElementById('studentPassword').value;

  const submitBtn = document.getElementById('studentSubmitBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;

  try {
    if (isEdit) {
      // Update existing Parse User
      const query = new Parse.Query(Parse.User);
      const user = await query.get(userId);

      user.set('first_name', document.getElementById('firstName').value.trim());
      user.set('last_name', document.getElementById('lastName').value.trim());
      user.set('email', document.getElementById('studentEmail').value.trim());
      if (document.getElementById('profileImage').value.trim()) {
        user.set('profile_image', document.getElementById('profileImage').value.trim());
      }
      if (password && password.length >= 6) {
        user.setPassword(password);
      }
      await user.save(null, { useMasterKey: false });

      // Update StudentInfo
      const infoQuery = new Parse.Query('StudentInfo');
      infoQuery.equalTo('student_id', user.get('student_id'));
      let info = await infoQuery.first();
      if (!info) {
        const StudentInfo = Parse.Object.extend('StudentInfo');
        info = new StudentInfo();
        info.set('student_id', user.get('student_id'));
      }
      info.set('year', parseInt(document.getElementById('studentYear').value));
      info.set('course', document.getElementById('studentCourse').value);
      await info.save();

      showAlert('Student updated successfully!', 'success');

    } else {
      // Create new student via Parse.User.signUp
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const studentNumber = document.getElementById('studentNumber').value.trim();
      const newUser = new Parse.User();
      newUser.set('username', studentNumber);
      newUser.set('password', password);
      newUser.set('email', document.getElementById('studentEmail').value.trim());
      newUser.set('student_id', studentNumber);
      newUser.set('first_name', document.getElementById('firstName').value.trim());
      newUser.set('last_name', document.getElementById('lastName').value.trim());
      await newUser.signUp();

      // Create StudentInfo record
      const StudentInfo = Parse.Object.extend('StudentInfo');
      const info = new StudentInfo();
      info.set('student_id', studentNumber);
      info.set('year', parseInt(document.getElementById('studentYear').value));
      info.set('course', document.getElementById('studentCourse').value);
      info.set('campus', 'Main Campus');
      await info.save();

      showAlert('Student added successfully!', 'success');
    }

    closeAllModals();
    document.getElementById('studentForm').reset();
    if (studentsPage.classList.contains('active')) loadStudents();
    loadDashboardStats();

  } catch (error) {
    console.error('Error saving student:', error);
    showAlert(`Failed to ${isEdit ? 'update' : 'add'} student: ${error.message}`, 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

async function deleteStudent(userId, studentNumber) {
  if (!confirm(`Are you sure you want to delete student ${studentNumber}? This action cannot be undone.`)) {
    return;
  }

  try {
    // Get the user
    const query = new Parse.Query(Parse.User);
    const user = await query.get(userId);
    const studentId = user.get('student_id');

    // Delete StudentInfo record
    try {
      const infoQuery = new Parse.Query('StudentInfo');
      infoQuery.equalTo('student_id', studentId);
      const info = await infoQuery.first();
      if (info) await info.destroy();
    } catch (e) {
      console.log('No StudentInfo to delete');
    }

    // Delete student_finances record
    try {
      const finQuery = new Parse.Query('student_finances');
      finQuery.equalTo('student_id', studentId);
      const fin = await finQuery.first();
      if (fin) await fin.destroy();
    } catch (e) {
      console.log('No finance record to delete');
    }

    // Delete the Parse User
    await user.destroy();

    showAlert('Student deleted successfully', 'success');
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