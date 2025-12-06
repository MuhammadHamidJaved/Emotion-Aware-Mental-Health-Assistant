# 🔄 Complete Rebranding Plan: Journal → Check-In

## 🎯 Goal
Eradicate ALL "journal" references and routes. Replace with "check-in" terminology throughout frontend AND backend.

## 📋 Current State Analysis

### Frontend Routes (Journal):
- `/journal` → Check-In History page
- `/journal/new` → Create new check-in
- `/journal/[id]` → View check-in details
- `/journal/[id]/edit` → Edit check-in

### Backend Routes (Journal):
- Need to check backend journal app routes
- API endpoints likely use "journal" terminology

### Files to Change:
1. Frontend routes (`/journal/*`)
2. Backend API routes
3. Component names
4. Variable names
5. All links and references

## 🎯 New Structure

### Frontend Routes (Check-In):
- `/check-in` → Check-In History (read-only, from database)
- `/check-in/new` → Express Yourself (create new)
- `/check-in/[id]` → Check-In Details
- `/check-in/[id]/edit` → Edit Check-In

### Backend Routes (Check-In):
- `/api/check-in/entries/` → CRUD operations
- Keep model name as `JournalEntry` (internal, not exposed)

## 📝 Implementation Plan

### Phase 1: Frontend Route Structure
1. Create new `/check-in` folder structure
2. Copy files from `/journal` to `/check-in`
3. Update all internal links

### Phase 2: Backend API Routes
1. Update URL patterns
2. Update API endpoints
3. Keep models same (internal only)

### Phase 3: Update All References
1. Sidebar navigation
2. All component links
3. API calls
4. Type definitions

### Phase 4: Remove Old Routes
1. Delete `/journal` folder
2. Clean up unused files

## 🚀 Let's Start Phase 1

