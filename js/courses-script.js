const SUPABASE_URL = 'https://qnroaigdrpoceasbqtmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucm9haWdkcnBvY2Vhc2JxdG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzIzMzgsImV4cCI6MjA3ODEwODMzOH0.AnySEJv5FLNikQ6aGlpg-p7YSpqINjvbMuuLe4SFKQc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEMO_MODE = true;

const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const greeting = document.getElementById('greeting');
const signOutBtn = document.getElementById('sign-out');
const coursesGrid = document.getElementById('coursesGrid');
const addCourseBtn = document.getElementById('addCourseBtn');
const courseModal = document.getElementById('courseModal');
const courseForm = document.getElementById('courseForm');
const closeModalBtns = document.querySelectorAll('.close-modal, .btn-cancel');

document.addEventListener('DOMContentLoaded', () => {
  // Initialize sidebar state for mobile
  if (window.innerWidth <= 768) {
    sidebar.classList.add('collapsed');
  }
  setupEventListeners();
  loadCourses();
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

  addCourseBtn.addEventListener('click', openAddCourseModal);

  closeModalBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) closeAllModals();
  });
  courseForm.addEventListener('submit', handleCourseSubmit);
  signOutBtn.addEventListener('click', handleSignOut);
  window.addEventListener('resize', handleResize);
}

function navigateToPage(page) {
  const pageMap = {
    'dashboard': '../index.html',
    'students': '../index.html#students',
    'schedules': 'schedules.html',
    'assignments': 'assignments.html',
    'calendar': 'calendar.html',
    'notifications': 'notifications.html',
    'events': 'events.html',
    'finances': 'finances.html',
    'files': '../index.html#files'
  };
  if (pageMap[page]) window.location.href = pageMap[page];
}

async function loadCourses() {
  coursesGrid.innerHTML = '<div class="loading">Loading courses...</div>';

  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .order('course_name');

    if (error) throw error;

    if (!courses || courses.length === 0) {
      coursesGrid.innerHTML = '<div class="no-data">No courses yet. Click "Add Course" to create one.</div>';
      return;
    }

    coursesGrid.innerHTML = courses.map(course => `
      <div class="course-card" data-course-id="${course.id}">
        <div class="course-card-header">
          <div class="course-icon">
            <i class="fas fa-graduation-cap"></i>
          </div>
          <span class="course-code">${course.course_code || 'N/A'}</span>
        </div>
        <div class="course-card-body">
          <h3>${course.course_name}</h3>
          <p class="course-description">${course.description || 'No description'}</p>
          <div class="course-meta">
            <span><i class="fas fa-certificate"></i> ${course.certificate_type}</span>
            <span><i class="fas fa-clock"></i> ${course.duration} Years</span>
          </div>
          <div class="course-years">
            <span class="year-badge">Years: ${course.available_years || '1,2,3'}</span>
          </div>
        </div>
        <div class="course-card-footer">
          <button class="btn-icon btn-edit" onclick="editCourse('${course.id}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon btn-danger" onclick="deleteCourse('${course.id}', '${course.course_name}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading courses:', error);
    coursesGrid.innerHTML = '<div class="error">Failed to load courses</div>';
    showAlert('Failed to load courses', 'error');
  }
}


function openAddCourseModal() {
  courseForm.reset();
  document.getElementById('courseId').value = '';
  document.getElementById('courseModalTitle').textContent = 'Add Course';
  document.getElementById('courseSubmitBtn').textContent = 'Save Course';
  document.querySelectorAll('input[name="year"]').forEach(cb => cb.checked = true);
  openModal(courseModal);
}

async function editCourse(courseId) {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) throw error;

    document.getElementById('courseId').value = course.id;
    document.getElementById('courseName').value = course.course_name;
    document.getElementById('courseCode').value = course.course_code || '';
    document.getElementById('courseDescription').value = course.description || '';
    document.getElementById('courseCertificate').value = course.certificate_type;
    document.getElementById('courseDuration').value = course.duration || 3;

    const years = (course.available_years || '1,2,3').split(',');
    document.querySelectorAll('input[name="year"]').forEach(cb => {
      cb.checked = years.includes(cb.value);
    });

    document.getElementById('courseModalTitle').textContent = 'Edit Course';
    document.getElementById('courseSubmitBtn').textContent = 'Update Course';
    openModal(courseModal);

  } catch (error) {
    console.error('Error loading course:', error);
    showAlert('Failed to load course data', 'error');
  }
}

async function handleCourseSubmit(e) {
  e.preventDefault();

  const courseId = document.getElementById('courseId').value;
  const isEdit = !!courseId;

  const selectedYears = Array.from(document.querySelectorAll('input[name="year"]:checked'))
    .map(cb => cb.value)
    .join(',');

  const courseData = {
    course_name: document.getElementById('courseName').value.trim(),
    course_code: document.getElementById('courseCode').value.trim(),
    description: document.getElementById('courseDescription').value.trim(),
    certificate_type: document.getElementById('courseCertificate').value,
    duration: parseInt(document.getElementById('courseDuration').value),
    available_years: selectedYears
  };

  const submitBtn = document.getElementById('courseSubmitBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;

  try {
    if (isEdit) {
      const { error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', courseId);
      if (error) throw error;
      showAlert('Course updated successfully!', 'success');
    } else {
      const { error } = await supabase
        .from('courses')
        .insert([courseData]);
      if (error) throw error;
      showAlert('Course created successfully!', 'success');
    }

    closeAllModals();
    courseForm.reset();
    loadCourses();

  } catch (error) {
    console.error('Error saving course:', error);
    showAlert(`Failed to ${isEdit ? 'update' : 'create'} course: ${error.message}`, 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}


async function deleteCourse(courseId, courseName) {
  if (!confirm(`Are you sure you want to delete "${courseName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) throw error;
    showAlert('Course deleted successfully', 'success');
    loadCourses();

  } catch (error) {
    console.error('Error deleting course:', error);
    showAlert('Failed to delete course', 'error');
  }
}

window.editCourse = editCourse;
window.deleteCourse = deleteCourse;

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
