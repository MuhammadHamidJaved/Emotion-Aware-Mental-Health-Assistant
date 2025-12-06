# 🔄 Complete Rebranding: Journal → Check-In (Step by Step)

## 🎯 Goal
Eradicate ALL "journal" routes. Replace with "check-in" for emotional assistant.

## 📋 Breakdown into Smaller Parts

### Part 1: Create New Check-In Route Structure ✅
- Create `/check-in` folder
- Copy files from `/journal`
- Update file names

### Part 2: Update Frontend Routes
- Update all `/journal/*` to `/check-in/*`
- Update dashboard links
- Update sidebar navigation

### Part 3: Update Component References
- Update all internal links
- Update API calls
- Update type definitions

### Part 4: Update Backend Routes (Future)
- When API endpoints are created, use `/api/check-in/`
- Keep models as-is (internal naming)

### Part 5: Clean Up
- Delete old `/journal` folder
- Remove unused references

---

Let's start with Part 1!

