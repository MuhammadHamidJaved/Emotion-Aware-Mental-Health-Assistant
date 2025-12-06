# 🧠 Emotion-Aware Mental Health Journaling System

> **FYP-1 Project | Semester 7**  
> Complete web application frontend built with Next.js 14, TypeScript, and Tailwind CSS

## 🎯 Project Overview

An emotion-aware journaling system that uses multimodal emotion detection (text, voice, video) to provide personalized mental health insights and wellness recommendations through AI-powered analysis.

**Current Implementation**: Complete frontend with 18+ pages using dummy data for visualization and demonstration purposes.

---

## ✅ Project Status

| Category | Status | Pages |
|----------|--------|-------|
| **Marketing** | ✅ Complete | 1 (Landing) |
| **Authentication** | ✅ Complete | 2 (Login, Signup) |
| **Journal Management** | ✅ Complete | 4 (List, Create, View, Edit) |
| **Analytics** | ✅ Complete | 1 (Insights Dashboard) |
| **AI Features** | ✅ Complete | 1 (Chat Interface) |
| **Wellness** | ✅ Complete | 1 (Recommendations) |
| **Organization** | ✅ Complete | 3 (Calendar, Tags, Profile) |
| **Settings** | ✅ Complete | 1 (7 tabs) |
| **Dashboard** | ✅ Complete | 1 (Main Dashboard) |

**Total**: ✅ **18+ Pages Fully Implemented**

---

## 🚀 Quick Start

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Run development server
npm run dev

# Open in browser
# http://localhost:3001 (or 3000 if available)
```

**Dev Server Status**: ✅ Running on port 3001  
**Build Status**: ✅ No errors  
**TypeScript**: ✅ All types validated

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                              # Next.js App Router (18+ pages)
│   │   ├── page.tsx                     # ✅ Landing/Marketing page
│   │   ├── layout.tsx                   # Root layout with fonts
│   │   ├── login/page.tsx               # ✅ Login with social auth
│   │   ├── signup/page.tsx              # ✅ Signup with validation
│   │   ├── dashboard/page.tsx           # ✅ Main dashboard
│   │   ├── journal/
│   │   │   ├── page.tsx                # ✅ Entries list with filters
│   │   │   ├── new/page.tsx            # ✅ Create entry (3 modes)
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # ✅ Entry detail view
│   │   │       └── edit/page.tsx       # ✅ Edit entry
│   │   ├── insights/page.tsx            # ✅ Analytics dashboard
│   │   ├── chat/page.tsx                # ✅ AI companion chat
│   │   ├── recommendations/page.tsx     # ✅ Wellness hub
│   │   ├── calendar/page.tsx            # ✅ Mood calendar
│   │   ├── tags/page.tsx                # ✅ Tag manager
│   │   ├── profile/page.tsx             # ✅ User profile
│   │   └── settings/page.tsx            # ✅ Settings (7 tabs)
│   │
│   ├── components/
│   │   ├── ui/                          # Reusable components
│   │   │   ├── button.tsx              # 6 variants
│   │   │   ├── card.tsx                # With header/content/footer
│   │   │   ├── input.tsx               # Text input
│   │   │   ├── badge.tsx               # 6 color variants
│   │   │   └── avatar.tsx              # 4 sizes (sm/md/lg/xl)
│   │   └── layout/
│   │       ├── sidebar.tsx             # Nav with 9 items
│   │       ├── header.tsx              # Search & notifications
│   │       └── dashboard-layout.tsx    # Main wrapper
│   │
│   ├── lib/
│   │   └── utils.ts                     # Utilities (date, text, etc.)
│   │
│   ├── data/
│   │   ├── emotions.ts                  # 14 emotions + helpers
│   │   └── dummy-data.ts                # 200+ lines mock data
│   │
│   └── types/
│       └── index.ts                     # 15+ TypeScript interfaces
│
├── public/                               # Static assets
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config
├── tailwind.config.ts                    # Tailwind CSS v4
├── next.config.ts                        # Next.js config
└── README.md                             # This file
```

---

## 📄 Complete Page Inventory

### 1️⃣ **Landing Page** (`/`)
- **Features**: Hero, features grid, how-it-works, security badges, footer
- **Purpose**: Marketing and public-facing entry point
- **Components**: 7 sections, responsive design

### 2️⃣ **Login Page** (`/login`)
- **Features**: Email/password form, remember me, social auth (Google/GitHub)
- **Validation**: Real-time error messages
- **Flow**: Demo mode → redirects to /dashboard

### 3️⃣ **Signup Page** (`/signup`)
- **Features**: Full registration form, password confirmation, terms checkbox
- **Validation**: Name, email, password strength, terms agreement
- **Flow**: Demo mode → redirects to /dashboard

### 4️⃣ **Dashboard** (`/dashboard`)
- **Features**:
  - Time-based personalized greeting
  - Quick emotion check-in (10 emotion buttons)
  - 4 metric cards: Total Entries (127), Current Streak (7 days), Dominant Emotion (Happy), Weekly Entries (5)
  - 4 quick actions: Text/Voice/Video Entry, AI Chat
  - Recent entries list (last 5 with emotions, tags, timestamps)
  - Empty state handling

### 5️⃣ **Journal List** (`/journal`)
- **Features**:
  - Search bar with live filtering
  - 3 filter dropdowns: Emotion (14 options), Type (text/voice/video), Tag (10 tags)
  - Entry cards with: title, date, type badge, emotions (up to 3), content preview (200 chars), tags
  - Clear filters button
  - Results count display
  - Empty state with CTA
- **Data**: Shows all 5 dummy entries (filterable)

### 6️⃣ **New Journal Entry** (`/journal/new`)
- **Features**:
  - 3 entry type selectors (visual cards)
  - Title input (optional)
  - Content editor:
    - **Text**: Textarea with live word count
    - **Voice**: Recording UI with start/stop, duration display
    - **Video**: Recording UI with camera preview
  - Emotion selector grid (14 emotions, multi-select)
  - Tag selector (10 tags + create new)
  - Save & Cancel buttons
- **Query Params**: Accepts `?type=text|voice|video` to pre-select mode

### 7️⃣ **Journal Entry Detail** (`/journal/[id]`)
- **Features**:
  - Full entry display with title, date, duration, type badge
  - Detected emotions with confidence scores
  - Media players (audio/video) with download buttons
  - Transcription display
  - Tags with color coding
  - Media attachment gallery
  - Actions: Edit, Delete, Favorite toggle
  - Privacy status badge (therapist sharing)
  - Word count & location (if available)

### 8️⃣ **Edit Journal Entry** (`/journal/[id]/edit`)
- **Features**:
  - Pre-filled form with existing data
  - Editable: title, content (text only), emotions, tags
  - Read-only notice for voice/video content
  - Save changes & cancel buttons
  - Back navigation to detail view

### 9️⃣ **Insights & Analytics** (`/insights`)
- **Features**:
  - 4 key metrics: Total Entries (127), Avg Words (250), Top Emotion (Happy 35%), Weekly Activity (3)
  - Emotion distribution bar chart (14 emotions sorted by frequency)
  - Weekly activity pattern (7-day bar chart)
  - Time of day breakdown (6 time slots with emojis)
  - Overall mood trend indicator (improving/stable/declining)
  - Average mood score with progress bar (60%)
  - Quick links to detailed emotion/pattern/trend pages
  - Date range selector (last 30 days)
  - Export report button

### 🔟 **AI Chat Interface** (`/chat`)
- **Features**:
  - AI companion avatar and branding
  - Message history (5 sample messages)
  - User vs AI message bubbles (styled differently)
  - Typing indicator animation (3 dots)
  - Quick response chips (4 suggestions)
  - Message input with emoji button
  - Send button (Enter to send)
  - Auto-scroll to latest message
  - Disclaimer notice
  - Welcome screen for first-time users

### 1️⃣1️⃣ **Recommendations Hub** (`/recommendations`)
- **Features**:
  - Category filter buttons: All, Exercise, Music, Article, Video
  - 3 stat cards: Completed (2), Bookmarked (1), Avg Rating (4.6)
  - Show completed toggle
  - Recommendation cards (3-column grid):
    - Thumbnail image
    - Category icon + badge
    - Title & description
    - Duration, rating, difficulty
    - Bookmark toggle
    - Completion status
    - Times completed counter
  - 4 sample recommendations (breathing, music, article, yoga)
  - Empty state for no results

### 1️⃣2️⃣ **Calendar View** (`/calendar`)
- **Features**:
  - Month grid (7x5) with week day headers
  - Previous/Next month navigation
  - Today button (jumps to current date)
  - Each day shows:
    - Day number
    - Emotion emojis (up to 2) if entry exists
    - Today highlight (indigo border)
    - Entry indicator (colored background)
  - Legend (3 items: today, has entry, no entry)
  - 3 monthly stat cards: Entries This Month (12), Active Days (18), Completion Rate (60%)
  - Hover effects on calendar days

### 1️⃣3️⃣ **Tags Manager** (`/tags`)
- **Features**:
  - Create new tag form (expandable)
  - 3 stat cards: Total Tags (10), Total Usage (sum), Most Used tag
  - Tags grid (3 columns):
    - Tag badge with custom color
    - Usage count
    - Edit & delete buttons
    - Usage visualization bar (relative to max)
  - 10 sample tags: work, family, stress, gratitude, anxiety, therapy, self-care, relationships, goals, mindfulness
  - Each tag has color, name, usage count

### 1️⃣4️⃣ **Profile Page** (`/profile`)
- **Features**:
  - User avatar (XL size) with fallback
  - Name, username, email, member since
  - Bio text display
  - Edit profile button → links to /settings
  - 4 stat cards: Total Entries (127), Day Streak (7), Longest Streak (25), Avg Words (250)
  - Mental Health Focus Areas (badges from profile)
  - Journaling Goals list (checkmarks)
  - Recent Activity timeline (4 items)
  - Total time spent (3450 minutes)

### 1️⃣5️⃣ **Settings - General Tab** (`/settings`)
- **Features**:
  - Tabbed interface (7 tabs in sidebar)
  - General tab inputs:
    - First & last name (2 columns)
    - Email address
    - Bio (textarea, 4 rows)
    - Time zone (dropdown with 4 options)
  - Save changes button
  - Pre-filled with current user data

### 1️⃣6️⃣ **Settings - Notifications Tab**
- **Features**:
  - 5 toggle switches:
    - Daily reminders (ON)
    - Mood check-in reminders (ON)
    - Recommendations (ON)
    - Weekly insights (OFF)
    - Email notifications (OFF)
  - Each toggle has title + description
  - Styled toggle cards with hover
  - Save preferences button

### 1️⃣7️⃣ **Settings - Privacy & Security Tab**
- **Features**:
  - Security section:
    - Two-factor authentication toggle
    - Biometric authentication toggle (ON)
  - Privacy section:
    - Default entry privacy dropdown (Private/Therapist)
    - Location data toggle
  - Change password button (outlined, red text)
  - Save settings button

### 1️⃣8️⃣ **Settings - Additional Tabs**
- **Data & Storage**:
  - Storage usage bar (4.5/10 GB)
  - Export all data button
  - Download journal entries button
  - Delete all data button (red warning)
  
- **Integrations**:
  - 3 integration cards: Google Calendar, Apple Health, Spotify
  - Each with icon, description, Connect button
  
- **Subscription**:
  - Current plan card (Premium, $9.99/month)
  - Active badge
  - Manage subscription button
  - 6 premium features list with checkmarks
  
- **Help & Support**:
  - 4 help links: Help Center, Contact Support, Privacy Policy, Terms
  - App version display (1.0.0)

---

## 🎨 Tech Stack

### Core
- **Framework**: Next.js 15.5.4 (App Router, Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.0.0
- **Runtime**: Node.js

### UI Components
- **Radix UI**: Dialogs, Dropdowns, Tabs, Select, Toast, Avatar, Checkbox, Slider
- **Custom Components**: Button (6 variants), Card, Input, Badge (6 variants), Avatar (4 sizes)
- **Charts**: Recharts (for analytics visualizations - ready to integrate)
- **Icons**: Lucide React (100+ icons used)

### Utilities
- **Date Handling**: date-fns
- **Styling**: clsx, tailwind-merge (for conditional classes)
- **State**: React hooks (useState, useEffect, useRef)
- **Routing**: Next.js App Router with dynamic routes

### Development
- **Package Manager**: npm
- **Linting**: ESLint (Next.js config)
- **Hot Reload**: Turbopack (super fast)
- **TypeScript**: Strict mode enabled

---

## 🎭 Dummy Data Structure

All features use comprehensive mock data located in `src/data/dummy-data.ts`:

### Available Data Sets

1. **CURRENT_USER** - Sample user (Sarah Jones)
   - 127 total entries, 7-day streak
   - Profile picture, bio, mental health concerns
   - Journaling goals

2. **DUMMY_ENTRIES** (5 entries)
   - Mix of text/voice entries
   - Various emotions (happy, anxious, excited, sad, neutral)
   - Tags (work, stress, gratitude, etc.)
   - Timestamps, word counts, durations

3. **DUMMY_TAGS** (10 tags)
   - Color-coded: work (blue), family (green), stress (red), etc.
   - Usage counts: 23, 18, 15, 12, etc.

4. **DUMMY_EMOTIONS** (14 emotion types)
   - happy, sad, angry, anxious, neutral, surprised, disgusted, fearful
   - excited, loved, tired, frustrated, confident, disappointed
   - Each with emoji, label, color

5. **DUMMY_RECOMMENDATIONS** (4 items)
   - Breathing exercise, calm music, anxiety article, yoga video
   - Categories: exercise, music, article, video
   - Ratings (4.5-4.8), durations (5-60 min)

6. **DUMMY_CHAT_MESSAGES** (5 messages)
   - Conversation between user and AI
   - Timestamps, sender indicators

7. **DUMMY_ANALYTICS**
   - Emotion distribution (happy: 35, anxious: 25, sad: 15, etc.)
   - Weekly pattern (Mon-Sun activity)
   - Time of day pattern (6 time slots)
   - Mood trend: 'improving'
   - Average mood: 0.6 (60%)

8. **DUMMY_STATS**
   - Total entries: 127
   - Current streak: 7 days
   - Longest streak: 25 days
   - Average word count: 250
   - Total time: 3450 minutes
   - Entries this week: 5
   - Entries this month: 22

---

## 🧩 Component Library

### UI Components (src/components/ui/)

**Button** - 6 variants
- `default` - Gray background
- `primary` - Indigo (main CTA)
- `secondary` - Light gray
- `success` - Green
- `warning` - Yellow
- `danger` - Red
- `ghost` - Transparent
- Sizes: `sm`, `md`, `lg`

**Card** - Flexible container
- `Card` - Main wrapper
- `CardHeader` - Optional header
- `CardContent` - Main content area
- `CardFooter` - Optional footer
- Shadow & border styling

**Input** - Text field
- Consistent styling across app
- Focus ring (indigo)
- Error states
- Icon support (left/right)

**Badge** - Status indicators
- 6 color variants matching buttons
- Small & large sizes
- Rounded pill shape

**Avatar** - User images
- 4 sizes: `sm` (32px), `md` (40px), `lg` (48px), `xl` (96px)
- Fallback to initials
- Circular shape

### Layout Components (src/components/layout/)

**Sidebar**
- 9 navigation items with icons
- Active state detection (usePathname)
- User profile card at top
- "New Entry" quick action button
- Logout button at bottom
- Responsive: collapsible on mobile

**Header**
- Search input (global)
- Notification bell with badge
- User avatar dropdown menu
- Responsive padding

**DashboardLayout**
- Wrapper combining Sidebar + Header
- Main content area with padding
- Responsive grid system
- Used by all authenticated pages

---

## 🔧 Development Guidelines

### Adding New Pages

```typescript
// 1. Create file in src/app/[page-name]/page.tsx

'use client'; // If using hooks/state

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';

export default function NewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Your content */}
      </div>
    </DashboardLayout>
  );
}
```

### Creating Components

```typescript
// 2. Place in appropriate directory
// - components/ui/ for reusable UI elements
// - components/[feature]/ for feature-specific components

// 3. Use TypeScript with proper typing
interface Props {
  title: string;
  onClick?: () => void;
}

export function MyComponent({ title, onClick }: Props) {
  return <div onClick={onClick}>{title}</div>;
}
```

### Styling Best Practices

- Use Tailwind utility classes
- Leverage `cn()` utility for conditional classes
- Follow mobile-first responsive design
- Use consistent spacing scale (4, 6, 8, 12, 16, 24, etc.)
- Maintain color consistency (indigo primary, gray neutrals)

### Type Safety

- Import types from `@/types`
- Use strict TypeScript
- Avoid `any` type
- Prefer interfaces over types for objects

---

## 📱 Responsive Design

The application is fully responsive with breakpoints:

| Breakpoint | Width | Target Device |
|------------|-------|---------------|
| **Mobile** | < 768px | Phones |
| **Tablet** | 768px - 1024px | Tablets |
| **Desktop** | 1024px - 1440px | Laptops |
| **Large** | 1440px+ | Monitors |

**Responsive Features**:
- Collapsible sidebar on mobile
- Grid layouts adapt (1 → 2 → 3 columns)
- Touch-friendly tap targets (44x44px minimum)
- Readable font sizes (16px base)

---

## 🔗 API Integration (Future)

When ready to connect to Django backend:

### 1. Environment Setup
```bash
# Create .env.local file
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. API Client
```typescript
// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchEntries() {
  const res = await fetch(`${API_URL}/api/entries/`);
  return res.json();
}
```

### 3. Replace Dummy Data
- Update pages to fetch from API
- Add loading states (`isLoading`)
- Handle errors gracefully
- Implement authentication context
- Add JWT token storage & refresh

---

## 🎯 Features by Category

### ✅ Implemented Features

**Authentication**
- ✅ Login with email/password
- ✅ Signup with validation
- ✅ Social auth UI (Google, GitHub)
- ✅ Remember me functionality
- ⏳ Actual JWT auth (backend integration needed)

**Journal Management**
- ✅ Create entries (text/voice/video modes)
- ✅ View entry list with filters
- ✅ Search entries
- ✅ View entry details
- ✅ Edit existing entries
- ✅ Delete entries
- ✅ Tag entries
- ✅ Emotion tagging
- ⏳ Actual file uploads (voice/video)
- ⏳ Real-time emotion detection

**Analytics**
- ✅ Emotion distribution chart
- ✅ Weekly activity pattern
- ✅ Time of day analysis
- ✅ Mood trend indicator
- ✅ Key metrics dashboard
- ⏳ Advanced charts with Recharts
- ⏳ Export reports

**AI Features**
- ✅ Chat interface
- ✅ Message history
- ✅ Typing indicators
- ⏳ Actual AI responses (OpenAI integration)
- ⏳ Context-aware conversations

**Wellness**
- ✅ Recommendations hub
- ✅ Category filtering
- ✅ Activity tracking
- ✅ Bookmarking
- ⏳ Personalized recommendations
- ⏳ Activity completion tracking

**Organization**
- ✅ Calendar view with mood colors
- ✅ Tag manager with CRUD
- ✅ Search functionality
- ⏳ Advanced search filters

**User Management**
- ✅ Profile page
- ✅ Settings (7 tabs)
- ✅ Preferences management
- ⏳ Account deletion
- ⏳ Data export

---

## 🐛 Known Limitations (Current Demo)

1. **Authentication**: Demo mode only - any credentials work
2. **Data Persistence**: No backend - data resets on refresh
3. **File Uploads**: Voice/video recording UI only - no actual recording
4. **Emotion Detection**: Manual selection - no ML models yet
5. **AI Chat**: Static responses - no actual AI
6. **Recommendations**: Static list - no personalization algorithm
7. **Real-time**: No websockets - no live updates
8. **Notifications**: UI only - no actual push notifications
9. **Export**: Buttons present - no actual file generation
10. **Integrations**: Connect buttons - no OAuth flows

These are expected for the current frontend-only demo phase. Backend integration will enable full functionality.

---

## 📚 Resources & Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Radix UI](https://www.radix-ui.com/docs/primitives)
- [Lucide Icons](https://lucide.dev/)

---

## 🚀 Deployment Guide

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts to link project
```

### Manual Build

```bash
# Build for production
npm run build

# Start production server
npm start

# Output in .next/ directory
```

### Environment Variables

For production, set these in your hosting platform:

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 💡 Development Tips

1. **Hot Reload**: Changes auto-refresh in development
2. **TypeScript Errors**: Fix all before building
3. **Tailwind IntelliSense**: Install VS Code extension
4. **Component Preview**: Test components in isolation
5. **Dummy Data**: Modify `dummy-data.ts` to test scenarios
6. **Route Testing**: Use Next.js Link for navigation
7. **Mobile Testing**: Use Chrome DevTools device emulation
8. **Performance**: Use Next.js Image component for images

---

## 📝 Changelog

### Version 1.0.0 (Current)

**Added**:
- ✅ Complete frontend with 18+ pages
- ✅ Comprehensive dummy data
- ✅ TypeScript type system
- ✅ Responsive design
- ✅ Component library
- ✅ Layout system
- ✅ Emotion system (14 types)
- ✅ Navigation sidebar
- ✅ Settings (7 tabs)
- ✅ Calendar view
- ✅ Tags manager
- ✅ Profile page
- ✅ Insights dashboard
- ✅ AI chat interface
- ✅ Recommendations hub
- ✅ Journal CRUD
- ✅ Authentication UI

**Next Steps** (Future versions):
- 🔄 Backend API integration
- 🔄 Real authentication (JWT)
- 🔄 Database connection
- 🔄 File upload handling
- 🔄 ML emotion detection
- 🔄 AI chat (OpenAI/Anthropic)
- 🔄 Push notifications
- 🔄 Data export
- 🔄 Real-time features
- 🔄 Unit tests
- 🔄 E2E tests

---

## 👥 Credits

**Developed for**: FYP-1 Project, Semester 7  
**Tech Stack**: Next.js 15, TypeScript 5, Tailwind CSS 4  
**UI Components**: Radix UI, Lucide Icons  
**Data**: Comprehensive dummy data for demonstration

---

## 📞 Support

For questions or issues:
1. Check TypeScript errors in VS Code
2. Verify all dependencies installed (`npm install`)
3. Ensure development server is running (`npm run dev`)
4. Check browser console for errors

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
