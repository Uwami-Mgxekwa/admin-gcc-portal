# Admin Portal — Back4App Migration Plan
**GCC Student Portal | Admin Panel**
**Document Version:** 1.0  
**Date:** May 2026

---

## Overview

The admin portal (`admin-gcc-portal/`) currently uses **Supabase** as its backend. The student portal has already been fully migrated to **Back4App (Parse)**. This document outlines every step required to migrate the admin portal to Back4App so both portals share the same database and data flows correctly between them.

---

## Back4App Credentials

Keep these secure. Do not commit them to a public repository.

| Key | Value |
|-----|-------|
| **Application ID** | `SxhMBsTSB2BasoZQecw9KyixCwyDMK8cyQwx9T7f` |
| **JavaScript Key** | `oFVQJKq96RoamUqC6EfbPdnIJBlA5V4ii6ZF6riF` |
| **REST API Key** | `06EPenV9Yn39SoxeJ06EbZxikBVl98NId12REFhI` |
| **Master Key** | `Knuw0tIWxjvgHEUljnB5TVzkeyBa36RP12NuJ0AK` |
| **Client Key** | `s7cPCGuR8nOksoVPMg4ClH0ImWZd9YmohjVG6J9a` |
| **File Key** | `e6987d32-7252-45ff-b875-8d2133dea1a7` |
| **Webhook Key** | `s6iAwi2flr3tL9gVbR6nS1HcNIOHpfUXLnP7TN7R` |
| **Server URL** | `https://parseapi.back4app.com/` |
| **Parse CDN** | `https://unpkg.com/parse/dist/parse.min.js` |

> **Master Key Warning:** The Master Key bypasses all security rules. Never expose it in client-side code. It is listed here for reference only — use it only in server-side environments or the Back4App dashboard.

---

## How the Admin Portal Connects to Back4App

### Architecture

```
Student Portal (pages/)          Admin Portal (admin-gcc-portal/)
        |                                    |
        |                                    |
        +-----------> Back4App <-------------+
                    (Parse Server)
                  parseapi.back4app.com
                         |
                    Shared Classes:
                    - _User (students)
                    - StudentInfo
                    - Schedules
                    - announcements
                    - assignments
                    - courses
                    - events
                    - important_dates
                    - resources
                    - student_finances
                    - payment_history
                    - support_tickets
```

Both portals talk to the **same Back4App application** using the same App ID and JavaScript Key. The admin portal reads and writes data that students see in real time.

### Authentication Model

- **Students** log in using `Parse.User.logIn()` with their Student ID as username.
- **Admins** currently run in `DEMO_MODE = true` (no authentication). When you are ready to add real admin auth, create a separate Parse class called `AdminUser` or use Parse roles.
- The admin portal uses the **JavaScript Key** (not the Master Key) for all client-side operations.

---

## Current State of the Admin Portal

Every JS file in `admin-gcc-portal/js/` currently has this at the top:

```javascript
const SUPABASE_URL = 'https://qnroaigdrpoceasbqtmh.supabase.co';
const SUPABASE_ANON_KEY = '...';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

And every HTML file loads the Supabase CDN:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

All of this needs to be replaced with Parse.

---

## Migration Steps

### Step 1 — Create the Admin Back4App Config File

**File to create:** `admin-gcc-portal/config/back4app.js`

Replace the existing `admin-gcc-portal/config/supabase-config.js` with a new file that:
1. Reads the globally loaded `Parse` object (loaded via script tag)
2. Initializes Parse with the App ID and JavaScript Key
3. Exports a **Supabase-compatible wrapper** (`supabase.from().select()` etc.) so all existing admin JS code works without rewriting every query

This is the same pattern already used in the student portal at `config/back4app.js`. Copy that file into `admin-gcc-portal/config/back4app.js` and adjust the export path references.

**Key difference for admin:** The admin uses `window.supabase.createClient()` (the Supabase CDN global), while the student portal uses ES module imports. The admin scripts are **not ES modules** — they use plain `<script>` tags and global variables. The wrapper must therefore be a plain script, not an ES module.

---

### Step 2 — Update Every HTML Page

**Files to update:**
- `admin-gcc-portal/index.html`
- `admin-gcc-portal/pages/assignments.html`
- `admin-gcc-portal/pages/calendar.html`
- `admin-gcc-portal/pages/courses.html`
- `admin-gcc-portal/pages/events.html`
- `admin-gcc-portal/pages/finances.html`
- `admin-gcc-portal/pages/notifications.html`
- `admin-gcc-portal/pages/schedules.html`

**In each file:**

Remove:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Add (before any other scripts):
```html
<script src="https://unpkg.com/parse/dist/parse.min.js"></script>
<script src="../config/back4app.js"></script>
```

> Note: `index.html` uses `config/back4app.js` (no `../`), pages use `../config/back4app.js`.

---

### Step 3 — Update Every Admin JS File

**Files to update:**
- `admin-gcc-portal/js/admin-script.js`
- `admin-gcc-portal/js/assignments-script.js`
- `admin-gcc-portal/js/calendar-script.js`
- `admin-gcc-portal/js/courses-script.js`
- `admin-gcc-portal/js/events-script.js`
- `admin-gcc-portal/js/finances-script.js`
- `admin-gcc-portal/js/notifications-script.js`
- `admin-gcc-portal/js/schedules-script.js`

**In each file, remove these lines:**
```javascript
const SUPABASE_URL = 'https://qnroaigdrpoceasbqtmh.supabase.co';
const SUPABASE_ANON_KEY = '...';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**Replace with:**
```javascript
// supabase is now provided globally by config/back4app.js
// No changes needed to any .from().select().eq() etc. calls below
```

The `supabase` variable will be available globally from `config/back4app.js` which is loaded via script tag in the HTML. All existing query syntax stays the same.

---

### Step 4 — Back4App Class Name Mapping

The admin portal uses Supabase table names. Back4App uses "Class" names. The wrapper handles this automatically — the class names must match exactly what was created in Back4App.

| Admin Portal Uses (Supabase table) | Back4App Class Name | Notes |
|------------------------------------|---------------------|-------|
| `announcements` | `announcements` | Must match exactly |
| `assignments` | `assignments` | Must match exactly |
| `courses` | `courses` | Must match exactly |
| `events` | `events` | Must match exactly |
| `important_dates` | `important_dates` | Must match exactly |
| `resources` | `resources` | File uploads |
| `student_finances` | `student_finances` | Finance records |
| `payment_history` | `payment_history` | Payment records |
| `schedules` | `Schedules` | **Capital S** — check this |
| `students` | `_User` | Students are Parse Users |
| `support_tickets` | `support_tickets` | FAQ form submissions |

> **Important:** Check the Back4App dashboard to confirm exact class names. Class names are case-sensitive in Parse. The student portal uses `Schedules` (capital S) — the admin portal must use the same.

---

### Step 5 — Handle the Students/Users Table

The admin portal has a students management section that reads from a `students` table. In Back4App, students are stored in the `_User` class (Parse's built-in user class).

**What this means for the admin:**
- Queries like `supabase.from('students').select('*')` need to query `_User` instead
- The wrapper's `from('students')` call should be mapped to `_User` in the config
- Student fields (`first_name`, `last_name`, `student_id`, `email`, `phone`, `gender`, `address`, `profile_image`) are all stored directly on the `_User` object
- Academic info (`course`, `year`, `certificate`, `faculty`, `campus`) is in the `StudentInfo` class, linked by `student_id`

**Add this mapping to the config:**
```javascript
// Map 'students' table to Parse _User class
const CLASS_MAP = {
  'students': '_User',
  // all others map to themselves
};
```

---

### Step 6 — File Uploads (Resources)

The admin currently uploads files to Supabase Storage. Back4App uses **Parse Files**.

**Current admin upload code pattern:**
```javascript
const { data, error } = await supabase.storage
  .from('resources')
  .upload(filePath, file);
```

**Replace with:**
```javascript
const parseFile = new Parse.File(fileName, file);
await parseFile.save();
const fileUrl = parseFile.url();
```

Then save the URL to the `resources` class as `file_url`.

The `config/back4app.js` wrapper already has a storage compatibility stub — but for the admin's file upload (which is more complex with progress tracking), direct Parse File usage is recommended.

---

### Step 7 — Admin Authentication (Future)

Currently `DEMO_MODE = true` in all admin scripts, which bypasses authentication entirely. When you are ready to add real admin login:

**Option A — Parse Roles (Recommended)**
1. Create an `Admin` role in the Back4App dashboard
2. Create admin user accounts and assign them the `Admin` role
3. On admin login, use `Parse.User.logIn()` then check `Parse.User.current().get('role') === 'Admin'`

**Option B — Separate AdminUser Class**
1. Create an `AdminUser` class in Back4App
2. Store admin credentials there
3. Verify on login using a Cloud Function (to keep Master Key server-side)

**Login flow when implemented:**
```javascript
async function adminLogin(username, password) {
  const user = await Parse.User.logIn(username, password);
  const query = new Parse.Query(Parse.Role);
  query.equalTo('name', 'Admin');
  query.equalTo('users', user);
  const role = await query.first();
  if (!role) {
    await Parse.User.logOut();
    throw new Error('Not authorized as admin');
  }
  return user;
}
```

---

### Step 8 — Back4App Dashboard Setup

Before the admin portal can read/write data, the following must be set up in the Back4App dashboard at `https://www.back4app.com`:

1. **Verify all classes exist** — Go to Database > Browser and confirm all class names from Step 4 are present
2. **Set Class-Level Permissions (CLPs)** for each class:
   - `_User`: Public Read (for admin to list students), Authenticated Write
   - `announcements`: Public Read/Write (admin needs full access)
   - `assignments`: Public Read/Write
   - `courses`: Public Read/Write
   - `events`: Public Read/Write
   - `important_dates`: Public Read/Write
   - `resources`: Public Read/Write
   - `student_finances`: Public Read/Write
   - `payment_history`: Public Read/Write
   - `Schedules`: Public Read/Write
   - `support_tickets`: Public Read/Write
3. **Enable File Uploads** — Go to App Settings > Security and ensure file uploads are allowed
4. **CORS Settings** — Go to App Settings > Security > CORS and add your admin portal domain (and `http://127.0.0.1:5500` for local development)

---

### Step 9 — Test Each Admin Page

After migration, test each page in this order:

| Page | What to Test |
|------|-------------|
| `index.html` (Dashboard) | Stats load, student count shows, files list works |
| `pages/notifications.html` | Announcements load, create/edit/delete works, toggle visibility works |
| `pages/assignments.html` | Assignments load, CRUD operations work |
| `pages/courses.html` | Courses load, add/edit/delete works |
| `pages/schedules.html` | Schedules load, upload timetable works |
| `pages/calendar.html` | Important dates load, add/edit/delete works |
| `pages/events.html` | Events load, CRUD works |
| `pages/finances.html` | Student finance records load, payment history works |

---

## File Structure After Migration

```
admin-gcc-portal/
├── config/
│   ├── back4app.js          ← NEW: replaces supabase-config.js
│   └── supabase-config.js   ← DELETE after migration
├── js/
│   ├── admin-script.js      ← UPDATE: remove Supabase init
│   ├── assignments-script.js ← UPDATE: remove Supabase init
│   ├── calendar-script.js   ← UPDATE: remove Supabase init
│   ├── courses-script.js    ← UPDATE: remove Supabase init
│   ├── events-script.js     ← UPDATE: remove Supabase init
│   ├── finances-script.js   ← UPDATE: remove Supabase init
│   ├── notifications-script.js ← UPDATE: remove Supabase init
│   └── schedules-script.js  ← UPDATE: remove Supabase init
├── pages/
│   ├── assignments.html     ← UPDATE: swap CDN scripts
│   ├── calendar.html        ← UPDATE: swap CDN scripts
│   ├── courses.html         ← UPDATE: swap CDN scripts
│   ├── events.html          ← UPDATE: swap CDN scripts
│   ├── finances.html        ← UPDATE: swap CDN scripts
│   ├── notifications.html   ← UPDATE: swap CDN scripts
│   └── schedules.html       ← UPDATE: swap CDN scripts
└── index.html               ← UPDATE: swap CDN scripts
```

---

## Quick Reference — Parse vs Supabase Syntax

The wrapper handles this automatically, but for reference:

| Operation | Supabase (current) | Parse (direct) |
|-----------|-------------------|----------------|
| Select all | `supabase.from('X').select('*')` | `new Parse.Query('X').find()` |
| Filter | `.eq('field', value)` | `query.equalTo('field', value)` |
| Order | `.order('field', {ascending: true})` | `query.ascending('field')` |
| Limit | `.limit(10)` | `query.limit(10)` |
| Insert | `supabase.from('X').insert([data])` | `new ParseClass().set(...).save()` |
| Update | `supabase.from('X').update(data).eq('id', id)` | `query.get(id).then(obj => obj.set(...).save())` |
| Delete | `supabase.from('X').delete().eq('id', id)` | `query.get(id).then(obj => obj.destroy())` |

---

## Notes on the `id` Field

Supabase uses `id` (UUID). Parse uses `objectId`. The wrapper in `config/back4app.js` automatically maps `objectId` → `id` when returning results, so all existing code that reads `item.id` will continue to work.

---

## Priority Order

When you are ready to implement, do it in this order:

1. Create `admin-gcc-portal/config/back4app.js` (non-module version of the wrapper)
2. Update `index.html` and all page HTML files (swap CDN scripts)
3. Update all JS files (remove Supabase init lines)
4. Test dashboard stats and student listing
5. Test notifications CRUD
6. Test assignments CRUD
7. Test remaining pages
8. Verify student portal still reads admin-created data correctly

---

*This document was prepared to guide the Back4App migration of the GCC Admin Portal.*
*Student portal migration reference: `config/back4app.js` in the root project.*
