# SecureSight CCTV Dashboard

A comprehensive CCTV monitoring dashboard built with **Next.js 15** and **Prisma ORM** connected to **Supabase PostgreSQL**.

> **Note**: This application uses **Prisma exclusively** for all database operations. Supabase is used only as the PostgreSQL database provider.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- A Supabase account and project (for PostgreSQL database)
- Git

### 1. Supabase Database Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **Database** 
3. Copy your **Connection string** (this will be your `DATABASE_URL`)
4. Note: We only use Supabase as a PostgreSQL provider - all operations go through Prisma

### 2. Environment Configuration

1. Copy `.env.example` to `.env.local`:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. Update the environment variables with your Supabase PostgreSQL connection:
   \`\`\`env
   # Replace [YOUR-PASSWORD] and [YOUR-PROJECT-REF] with actual values
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   \`\`\`

### 3. Prisma Database Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Generate Prisma client:
   \`\`\`bash
   npx prisma generate
   \`\`\`

3. Push the Prisma schema to your database:
   \`\`\`bash
   npx prisma db push
   \`\`\`

4. Seed the database with sample data:
   \`\`\`bash
   npx prisma db seed
   \`\`\`

### 4. Development

Start the development server:
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## 🏗️ Architecture Overview

This application follows a **Prisma-first architecture**:

\`\`\`
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Next.js App  │───▶│ Prisma ORM   │───▶│ Supabase        │
│   (Frontend)    │    │ (Data Layer) │    │ (PostgreSQL DB) │
└─────────────────┘    └──────────────┘    └─────────────────┘
\`\`\`

- **Frontend**: Next.js 15 with React components
- **API Layer**: Next.js API routes using Prisma client
- **Data Layer**: Prisma ORM with type-safe database operations
- **Database**: Supabase PostgreSQL (accessed only through Prisma)

## 📊 Features

### **🎯 Core Functionality**
- **Real-time Incident Monitoring** - Live dashboard with incident tracking and resolution
- **Interactive Timeline** - 24-hour incident timeline with zoom, pan, and playback controls
- **Incident Player** - Video player interface with incident details and camera feeds
- **Camera Management** - Multi-camera feed monitoring with status tracking
- **Incident Resolution** - Mark incidents as resolved with optimistic UI updates

### **📈 Advanced Features**
- **Timeline Synchronization** - Bidirectional sync between incident list and timeline
- **Date Navigation** - Navigate through different dates with incident filtering
- **Zoom & Pan Controls** - Multiple zoom levels (24h, 12h, 6h, 3h, 1h, 30m) with smooth panning
- **Incident Selection** - Click incidents on timeline or list for detailed view
- **Auto-focus** - Automatically center timeline on selected incidents
- **Playback Controls** - Play, pause, speed control, and timeline scrubbing

### **🔧 Technical Features**
- **Type-Safe Database Operations** - All database interactions through Prisma
- **Severity Classification** - Critical, High, Medium, Low priority levels
- **Enum-based Data Model** - Strongly typed incident types and camera statuses
- **Optimistic Updates** - Instant UI feedback with server reconciliation
- **Error Handling** - Robust error handling and validation

## 🛠️ Prisma Commands

All database operations use Prisma directly:

\`\`\`bash
# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes to database (development)
npx prisma db push

# Seed database with sample data
npx prisma db seed

# Open Prisma Studio (visual database editor)
npx prisma studio

# Reset database and re-run migrations (⚠️ destructive)
npx prisma migrate reset --force

# Pull database schema (sync from database to schema)
npx prisma db pull

# Validate schema
npx prisma validate

# Format schema file
npx prisma format
\`\`\`

## 📁 Project Structure

\`\`\`
├── prisma/
│   ├── schema.prisma      # Complete database schema with enums
│   └── seed.ts           # Comprehensive seeding script
├── lib/
│   └── prisma.ts         # Prisma client & DatabaseService class
├── app/
│   ├── api/              # Next.js API routes (Prisma-only)
│   │   ├── incidents/    # Incident CRUD operations
│   │   │   ├── all/      # Fetch all incidents
│   │   │   └── [id]/resolve/ # Toggle incident resolution
│   │   ├── cameras/      # Camera management
│   │   │   └── [id]/status/  # Update camera status
│   │   ├── timeline/     # Timeline data fetching
│   │   ├── stats/        # Dashboard statistics
│   │   ├── health/       # Database health check
│   │   └── debug/        # Debug endpoints
│   └── page.tsx          # Main dashboard page
├── components/           # React components
│   ├── navbar.tsx        # Navigation with live camera status
│   ├── incident-player.tsx # Video player component
│   ├── incident-list.tsx   # Incident management list (all incidents)
│   └── incident-timeline.tsx # Interactive timeline with controls
└── .env.local           # Prisma database configuration
\`\`\`

## 🗄️ Database Schema (Prisma-Managed)

### Models

\`\`\`prisma
model Camera {
  id        Int          @id @default(autoincrement())
  name      String
  location  String
  status    CameraStatus @default(ONLINE)
  incidents Incident[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}

model Incident {
  id           Int          @id @default(autoincrement())
  cameraId     Int
  type         IncidentType
  tsStart      DateTime
  tsEnd        DateTime
  thumbnailUrl String
  resolved     Boolean      @default(false)
  severity     Severity     @default(MEDIUM)
  description  String?
  camera       Camera       @relation(fields: [cameraId], references: [id])
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}
\`\`\`

### Enums

- **CameraStatus**: `ONLINE`, `OFFLINE`, `MAINTENANCE`
- **IncidentType**: `GUN_THREAT`, `UNAUTHORISED_ACCESS`, `FACE_RECOGNISED`, `SUSPICIOUS_ACTIVITY`, `MOTION_DETECTION`, `EQUIPMENT_TAMPERING`
- **Severity**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

## 🔌 API Routes (Prisma-Powered)

All API routes use the `DatabaseService` class from `lib/prisma.ts`:

### **Incident Management**
- `GET /api/incidents/all` - Fetch all incidents with camera information
- `GET /api/incidents?resolved=true/false` - Fetch incidents by resolution status
- `PATCH /api/incidents/[id]/resolve` - Toggle incident resolution status

### **Camera Management**
- `GET /api/cameras` - Fetch all cameras with incident counts
- `PATCH /api/cameras/[id]/status` - Update camera status

### **Timeline & Analytics**
- `GET /api/timeline` - Fetch timeline data for 24-hour view
- `GET /api/stats` - Get dashboard statistics and analytics

### **System Health**
- `GET /api/health` - Database connection health check
- `GET /api/debug/incidents` - Debug endpoint for incident data

## 🎮 User Interface Guide

### **📋 Incident List**
- **All Incidents View**: Shows all incidents regardless of date
- **Active/Resolved Tabs**: Filter by resolution status
- **Incident Cards**: Display full date, time, duration, and camera info
- **Resolution Actions**: Mark incidents as resolved or reopen them
- **Timeline Sync**: Selected incidents are highlighted and synchronized

### **🎬 Incident Player**
- **Video Display**: Shows incident thumbnails and details
- **Camera Info**: Displays camera name, location, and status
- **Incident Details**: Type, severity, description, and timestamps
- **Multi-camera View**: Thumbnail strip of related cameras

### **⏱️ Interactive Timeline**
- **Date Navigation**: Select specific dates to view incidents
- **Zoom Controls**: 6 zoom levels from 24 hours to 30 minutes
- **Pan Controls**: Navigate left/right within the selected date
- **Playback**: Play/pause with speed controls (0.5x to 4x)
- **Incident Blocks**: Click incidents to select and view details
- **Time Scrubber**: Drag to navigate to specific times

### **🎯 Synchronization Features**
- **Bidirectional Sync**: Selecting incidents in list updates timeline and vice versa
- **Auto-focus**: Timeline automatically centers on selected incidents
- **Date Sync**: Timeline date changes affect incident filtering
- **Visual Indicators**: Selected incidents are highlighted across all components

## 🔧 Customization

### Adding New Incident Types

1. Update the `IncidentType` enum in `prisma/schema.prisma`:
   \`\`\`prisma
   enum IncidentType {
     GUN_THREAT
     UNAUTHORISED_ACCESS
     FACE_RECOGNISED
     SUSPICIOUS_ACTIVITY
     MOTION_DETECTION
     EQUIPMENT_TAMPERING
     NEW_INCIDENT_TYPE  // Add here
   }
   \`\`\`

2. Push schema changes:
   \`\`\`bash
   npx prisma db push
   \`\`\`

3. Update frontend components to handle the new type in:
   - `components/incident-list.tsx` (icon and color mapping)
   - `components/incident-timeline.tsx` (color mapping)

### Extending the Database Schema

1. Modify `prisma/schema.prisma`
2. Run `npx prisma db push` to apply changes
3. Update the `DatabaseService` class if needed
4. Regenerate Prisma client: `npx prisma generate`

## 🚨 Troubleshooting

### Prisma Connection Issues
\`\`\`bash
# Check if Prisma can connect to your database
npx prisma db pull

# Verify your DATABASE_URL format
echo $DATABASE_URL
\`\`\`

### Schema Sync Issues
\`\`\`bash
# Reset and re-sync everything (⚠️ destructive)
npx prisma migrate reset --force

# Or push current schema
npx prisma db push
\`\`\`

### Type Generation Issues
\`\`\`bash
# Regenerate Prisma client
npx prisma generate

# Clear Next.js cache
rm -rf .next
npm run dev
\`\`\`

### Common Errors
- **P1017**: Server closed connection - Check connection string and Supabase status
- **P1001**: Can't reach database - Network/firewall issue
- **P2002**: Unique constraint violation - Data already exists, run reset
- **Invalid time value**: Date parsing error - Check date format validation

## 📈 Production Deployment

### Environment Variables for Production

Set these in your deployment platform (Vercel, Railway, etc.):

\`\`\`env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
\`\`\`

### Deployment Steps

1. **Vercel Deployment**:
   \`\`\`bash
   # Vercel automatically runs these during build
   npx prisma generate  # Generate Prisma client
   npm run build        # Build Next.js app
   \`\`\`

2. **Database Setup**:
   \`\`\`bash
   # After deployment, seed your production database
   npx prisma db seed
   \`\`\`

## 🔐 Security Best Practices

### Current Implementation
- Uses Prisma's built-in SQL injection protection
- Type-safe database operations
- Server-side API routes only
- Input validation and error handling

### Production Recommendations
1. **Add Authentication**: Implement NextAuth.js or similar
2. **API Rate Limiting**: Add rate limiting middleware
3. **Input Validation**: Validate all API inputs with Zod
4. **Database Security**: Use connection pooling for high traffic
5. **Environment Security**: Secure environment variables

## 📚 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Database ORM**: Prisma (exclusive database layer)
- **Database**: Supabase PostgreSQL (via Prisma only)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Type Safety**: Full TypeScript with Prisma-generated types
- **State Management**: React hooks and context
- **API**: Next.js API routes with RESTful endpoints

## ✅ Data Integrity & Performance

The application ensures data integrity and performance through:

1. **Prisma Schema Validation**: All data conforms to defined schema
2. **TypeScript Types**: Compile-time type checking with Prisma-generated types
3. **Database Constraints**: Foreign keys, enums, and required fields
4. **Transaction Support**: Prisma handles database transactions automatically
5. **Optimistic Updates**: UI updates immediately with server reconciliation
6. **Connection Pooling**: Efficient database connection management
7. **Query Optimization**: Prisma generates optimized SQL queries

## 🎯 Development Workflow

1. **Schema Changes**:
   \`\`\`bash
   # 1. Edit prisma/schema.prisma
   # 2. Push changes
   npx prisma db push
   # 3. Regenerate client
   npx prisma generate
   \`\`\`

2. **Adding Features**:
   \`\`\`bash
   # 1. Update schema if needed
   # 2. Update DatabaseService in lib/prisma.ts
   # 3. Create/update API routes
   # 4. Update frontend components
   \`\`\`

3. **Testing & Debugging**:
   \`\`\`bash
   # Use Prisma Studio to inspect data
   npx prisma studio
   
   # Reset database for testing
   npx prisma migrate reset --force
   
   # Check API health
   curl http://localhost:3000/api/health
   \`\`\`

## 🚀 Performance Features

- **Optimistic UI Updates**: Instant feedback for user actions
- **Efficient Data Fetching**: Single API calls for comprehensive data
- **Timeline Virtualization**: Smooth rendering of large datasets
- **Memoized Components**: Optimized re-rendering with React.memo
- **Debounced Interactions**: Smooth user experience with rate limiting
- **Lazy Loading**: Components load as needed

## 📄 License

This project is for assessment purposes. Please refer to your organization's policies for usage and distribution.

---

**Note**: This application demonstrates a complete CCTV monitoring solution using modern web technologies. It uses Prisma exclusively for all database operations, ensuring consistent, type-safe, and maintainable data access patterns throughout the application. The interactive timeline and synchronized incident management provide a comprehensive security monitoring experience.
