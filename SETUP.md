# Admin Portal Setup

## Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Located in: ../databaseScripts/events-table.sql
```

This will create the `events` table needed for Events Management.

## Features

### ✅ Current Features:
- **Dashboard** - Overview stats
- **Student Management** - Add, edit, delete students
- **Events Management** - Create, edit, delete campus events
- **File Manager** - Upload and manage PDF resources

### 📁 Pages Structure:
- `index.html` - Main dashboard with Students & Files
- `pages/events.html` - Events management page

## Navigation

The admin portal uses a hybrid approach:
- Dashboard, Students, and Files are on the main page (index.html)
- Events has its own dedicated page (pages/events.html)

## Usage

1. Open `index.html` in your browser
2. Navigate using the sidebar
3. Events will open in a separate page
4. All data syncs with Supabase in real-time
