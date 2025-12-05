# Admin Dashboard Documentation

## Overview
The admin dashboard is accessible at `http://localhost:3003/admin` and provides comprehensive management capabilities for the MTI application's master data and reporting.

## ✅ Status: COMPLETED & WORKING
- Admin page is fully functional
- All CRUD operations tested and working
- Reports dashboard displaying real-time data

## Access Control
- **Role Required**: `admin`
- **Authentication**: Users must be logged in with admin role to access this page
- **Redirect**: Non-admin users are automatically redirected to the dashboard

## Features

### 1. Overview Tab
Displays key statistics at a glance:
- Total Batches
- Total Programs
- Total Halaqah
- Total Thalibah (students)
- Total Mentors (ustadzah & musyrifah)
- Pending Registrations

### 2. Batches Management
Full CRUD operations for batch management:
- **Create**: Add new batches with name, description, dates, and status
- **Read**: View all batches in a sortable table
- **Update**: Edit existing batch information
- **Delete**: Not implemented (can be added if needed)

**Fields**:
- Name (required)
- Description
- Start Date (required)
- End Date (required)
- Registration Start Date
- Registration End Date
- Status: draft | open | closed | archived

### 3. Programs Management
Full CRUD operations for program management:
- **Create**: Add new programs linked to batches
- **Read**: View all programs with batch information
- **Update**: Edit existing programs
- **Delete**: Not implemented (can be added if needed)

**Fields**:
- Batch (required, dropdown from existing batches)
- Name (required)
- Description
- Target Level
- Duration (weeks)
- Max Thalibah (maximum students)
- Status: draft | open | ongoing | completed | cancelled

### 4. Halaqah Management
Full CRUD operations for halaqah (study circle) management:
- **Create**: Add new halaqah linked to programs
- **Read**: View all halaqah with program and schedule information
- **Update**: Edit existing halaqah
- **Delete**: Not implemented (can be added if needed)

**Fields**:
- Program (required, dropdown from existing programs)
- Name (required)
- Description
- Day of Week (1-7: Monday-Sunday)
- Start Time
- End Time
- Location
- Max Students (default: 20)
- Status: active | inactive | suspended

### 5. Reports & Analytics
Comprehensive reporting dashboard with:

#### Summary Statistics
- **Users by Role**: Breakdown of all users by their roles
- **Registration Status**: Count of registrations by status (pending, approved, rejected, etc.)
- **Tikrar Tahfidz Applications**: Status breakdown of Tikrar Tahfidz submissions
- **Attendance Summary**: Recent attendance patterns (last 100 records)

#### Detailed Reports
- **Recent Registrations**: Last 10 registrations with thalibah, program, batch, status, and date
- **Halaqah Students Assignment**: Current student assignments to halaqah with status

## Database Tables Managed

### Core Tables
1. **batches**: Batch/cohort management
2. **programs**: Program offerings within batches
3. **halaqah**: Study circles within programs

### Related Tables (Read-only in reports)
4. **pendaftaran**: Registration records
5. **halaqah_students**: Student-halaqah assignments
6. **halaqah_mentors**: Mentor-halaqah assignments
7. **presensi**: Attendance records
8. **tikrar_tahfidz**: Tikrar Tahfidz application forms
9. **users**: User management

## Technical Implementation

### File Location
- Main page: `app/admin/page.tsx`

### Components
- `AdminPage`: Main container with tab navigation
- `OverviewTab`: Statistics dashboard
- `BatchesTab`: Batch management interface
- `BatchForm`: Form for creating/editing batches
- `ProgramsTab`: Program management interface
- `ProgramForm`: Form for creating/editing programs
- `HalaqahTab`: Halaqah management interface
- `HalaqahForm`: Form for creating/editing halaqah
- `ReportsTab`: Comprehensive reports and analytics

### Data Loading
- Uses Supabase client for all database operations
- Implements parallel data fetching for optimal performance
- Real-time updates after create/update operations

### Security
- Client-side role check on mount
- Redirects non-admin users to dashboard
- Uses Supabase Row Level Security (RLS) policies on the backend

## Usage Instructions

### Creating a Batch
1. Navigate to Admin Dashboard → Batches tab
2. Click "Add Batch" button
3. Fill in required fields (name, start date, end date)
4. Optionally add description and registration dates
5. Set appropriate status (usually 'draft' for new batches)
6. Click "Save"

### Creating a Program
1. Navigate to Admin Dashboard → Programs tab
2. Click "Add Program" button
3. Select parent batch from dropdown
4. Fill in program details
5. Set duration, max students, and status
6. Click "Save"

### Creating a Halaqah
1. Navigate to Admin Dashboard → Halaqah tab
2. Click "Add Halaqah" button
3. Select parent program from dropdown
4. Fill in halaqah details (name, schedule, location)
5. Set max students and status
6. Click "Save"

### Viewing Reports
1. Navigate to Admin Dashboard → Reports tab
2. View summary statistics cards
3. Scroll down for detailed reports
4. All data is automatically loaded and refreshed

## Future Enhancements (Not Yet Implemented)
- Delete functionality for batches, programs, and halaqah
- Export reports to CSV/PDF
- Advanced filtering and search
- User management interface
- Mentor assignment interface
- Student assignment interface
- Attendance management interface
- Payment tracking interface

## Troubleshooting

### Cannot Access Admin Page
- Verify user has 'admin' role in the users table
- Check authentication status
- Clear browser cache and cookies

### Data Not Loading
- Check Supabase connection
- Verify RLS policies are configured correctly
- Check browser console for errors

### Form Submission Fails
- Verify all required fields are filled
- Check for foreign key constraints
- Ensure valid data types (dates, numbers, etc.)
