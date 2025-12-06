# 🎯 Rebranding Next Steps - Quick Reference

## ✅ Completed
1. ✅ Created `/check-in/page.tsx` (History)
2. ✅ Created `/check-in/new/page.tsx` (Create new)
3. ✅ Updated Sidebar navigation
4. ✅ Updated Dashboard links
5. ✅ Updated Header routes

## 🔄 In Progress / Remaining

### Step 1: Copy Detail & Edit Pages
Need to copy from `/journal/[id]/` to `/check-in/[id]/` with updated routes:
- `/check-in/[id]/page.tsx` 
- `/check-in/[id]/edit/page.tsx`

### Step 2: Update Remaining References
Files still containing `/journal` references:
- `frontend/src/app/calendar/page.tsx` - Update entry links
- `frontend/src/app/journal/[id]/*` - Will be replaced
- `frontend/src/app/journal/page.tsx` - Will be replaced
- Other files with text references (profile, settings, etc.)

### Step 3: Delete Old Routes
Once all references updated:
- Delete `/frontend/src/app/journal/` folder

### Step 4: Backend (Future)
When API endpoints are created:
- Use `/api/check-in/entries/` instead of `/api/journal/entries/`
- Models can stay as `JournalEntry` (internal naming)

---

**Current Status:** Frontend routes are being updated. Sidebar, Dashboard, and Header are complete!

