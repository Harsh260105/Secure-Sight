# SecureSight Database Troubleshooting Guide

## Common Database Connection Issues

### 1. Prisma Seed Connection Error (P1017)

**Error**: `Server has closed the connection`

**Causes & Solutions**:

#### A. Check Environment Variables
\`\`\`bash
# Verify your .env.local file exists and has correct format
cat .env.local

# Should look like:
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
\`\`\`

#### B. Test Database Connection
\`\`\`bash
# Test connection with Prisma
npx prisma db pull

# If this fails, your connection string is incorrect
\`\`\`

#### C. Supabase Project Status
1. Go to [supabase.com](https://supabase.com)
2. Check if your project is **active** (not paused)
3. Verify your project hasn't exceeded free tier limits

#### D. Connection String Format
Make sure your connection strings follow this exact format:

**For DATABASE_URL** (with connection pooling):
\`\`\`
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
\`\`\`

**For DIRECT_URL** (direct connection):
\`\`\`
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
\`\`\`

### 2. Getting Your Supabase Credentials

1. **Go to Supabase Dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project**
3. **Go to Settings → Database**
4. **Copy the connection string** from "Connection string" section
5. **Replace `[YOUR-PASSWORD]` with your actual database password**

### 3. Step-by-Step Database Setup

\`\`\`bash
# 1. Ensure environment variables are set
cp .env.example .env.local
# Edit .env.local with your actual Supabase credentials

# 2. Generate Prisma client
npm run db:generate

# 3. Push schema to database
npm run db:push

# 4. Test connection
npx prisma studio
# This should open Prisma Studio in your browser

# 5. Run seed script
npm run db:seed
\`\`\`

### 4. Alternative Seeding Method

If the seed script continues to fail, you can manually create the schema:

\`\`\`bash
# Reset everything and start fresh
npm run db:reset

# Or manually push schema
npm run db:push

# Then try seeding again
npm run db:seed
\`\`\`

### 5. Check Supabase Logs

1. Go to your Supabase project dashboard
2. Navigate to **Logs** → **Database**
3. Look for connection errors or query failures
4. Check if there are any IP restrictions

### 6. Network Issues

If you're behind a corporate firewall:

\`\`\`bash
# Try with different connection parameters
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
\`\`\`

### 7. Manual Database Verification

Connect directly to verify your database:

\`\`\`bash
# Install PostgreSQL client (if not already installed)
# Windows: Download from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql-client

# Connect directly
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Once connected, check if tables exist:
\dt

# If no tables, run:
\q
npm run db:push
\`\`\`

### 8. Common Error Codes

- **P1017**: Server closed connection - Check connection string and Supabase status
- **P1001**: Can't reach database - Network/firewall issue
- **P1002**: Database timeout - Database overloaded or connection limit reached
- **P2002**: Unique constraint violation - Data already exists, run `npm run db:reset`

### 9. Production Checklist

Before deploying:
- [ ] Environment variables are set correctly
- [ ] Database connection works locally
- [ ] Seed script runs successfully
- [ ] Prisma Studio can connect
- [ ] All API routes return data

### 10. Getting Help

If issues persist:
1. Check Supabase status page: [status.supabase.com](https://status.supabase.com)
2. Verify your Supabase project billing status
3. Check Supabase community: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
4. Review Prisma docs: [prisma.io/docs](https://prisma.io/docs)
