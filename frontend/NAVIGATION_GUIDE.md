# Navigation System Documentation

## Overview
The EmotionAI application features a comprehensive navigation system with a persistent sidebar and header across all protected pages. The navigation is fully responsive with mobile support.

## Components

### 1. Sidebar Component (`src/components/Sidebar.tsx`)

**Purpose:** Main navigation sidebar for the application

**Features:**
- Fixed left sidebar (width: 256px / 64 in Tailwind units)
- 12 navigation menu items
- Active route highlighting (black background)
- Mobile responsive with hamburger menu
- User profile section with logout
- Conditional rendering (hides on public pages)

**Navigation Items:**
1. **Dashboard** (`/dashboard`) - LayoutDashboard icon
2. **Journal** (`/journal`) - BookOpen icon
3. **Detect Emotion** (`/detect`) - Brain icon
4. **Analytics** (`/analytics`) - LineChart icon
5. **AI Chat** (`/chat`) - MessageSquare icon
6. **Coping Strategies** (`/recommendations`) - Lightbulb icon
7. **Music Therapy** (`/music`) - Music icon
8. **Exercises** (`/exercises`) - Dumbbell icon
9. **Daily Quotes** (`/quotes`) - Quote icon
10. **Calendar** (`/calendar`) - Calendar icon
11. **ML Models** (`/models`) - Activity icon
12. **Settings** (`/settings`) - Settings icon

**Mobile Behavior:**
- Hidden by default on mobile (< 1024px)
- Hamburger menu button in top-left
- Overlay backdrop when open
- Slide-in animation from left
- Closes when clicking outside

**Active State Detection:**
```typescript
const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
```

**Public Pages (No Sidebar):**
- `/` - Landing page
- `/login` - Login page
- `/signup` - Signup page
- `/onboarding` - Onboarding flow

---

### 2. Header Component (`src/components/Header.tsx`)

**Purpose:** Fixed header bar with page context and actions

**Features:**
- Fixed top header (height: 64px / 16 in Tailwind units)
- Dynamic page title based on current route
- Search button
- Notifications bell with badge indicator
- Current mood display
- Responsive positioning (adjusts for sidebar)

**Page Title Mapping:**
```typescript
'/dashboard' → 'Dashboard'
'/journal' → 'My Journal'
'/journal/new' → 'New Journal Entry'
'/journal/[id]/edit' → 'Edit Journal Entry'
'/detect' → 'Detect Emotion'
'/analytics' → 'Mood Analytics'
'/chat' → 'AI Chat'
'/recommendations' → 'Coping Strategies'
'/music' → 'Music Therapy'
'/exercises' → 'Wellness Exercises'
'/quotes' → 'Daily Quotes'
'/calendar' → 'Mood Calendar'
'/models' → 'ML Models'
'/settings' → 'Settings'
```

**Header Actions:**
1. **Search Button** - Quick search functionality
2. **Notifications** - Bell icon with red dot badge
3. **Mood Indicator** - Shows current mood (e.g., 😊 Happy)

**Positioning:**
- Desktop: `left-0 lg:left-64` (adjusts for sidebar)
- Mobile: Full width from left edge

---

### 3. Layout Integration (`src/app/layout.tsx`)

**Purpose:** Root layout wrapper that applies navigation to all pages

**Structure:**
```tsx
<body>
  <Sidebar />
  <Header />
  <main className="lg:ml-64 pt-16">
    {children}
  </main>
</body>
```

**Spacing:**
- **Left Margin:** `lg:ml-64` (256px on desktop for sidebar)
- **Top Padding:** `pt-16` (64px for header)

**Conditional Rendering:**
Both Sidebar and Header components check if current pathname is in public pages array and return null if true.

---

## New Feature Pages

### 1. Music Therapy (`/music`)

**Purpose:** Emotion-based music playlists for therapeutic listening

**Key Features:**
- 5 emotion categories (Calm, Happy, Anxious, Sad, Energetic)
- 17 curated tracks with metadata (BPM, genre, duration)
- Play/Pause functionality
- Favorite tracks system
- Now Playing sidebar with:
  - Album art
  - Progress bar
  - Playback controls (Volume, Play/Pause, Skip)
- Music benefits section
- Listening statistics

**Data Structure:**
```typescript
interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  emotion: string;
  genre: string;
  bpm: number;
  coverColor: string;
}
```

**Sample Tracks:**
- **Calm:** Weightless (Marconi Union, 60 BPM), Clair de Lune (Debussy, 70 BPM)
- **Happy:** Walking on Sunshine (120 BPM), Happy (Pharrell, 160 BPM)
- **Anxious:** Ocean Waves (60 BPM), Deep Breathing (58 BPM)

---

### 2. Wellness Exercises (`/exercises`)

**Purpose:** Physical activities to improve mental health

**Key Features:**
- 8 exercises across 4 categories (Yoga, Cardio, Strength, Meditation)
- Difficulty levels (Beginner, Intermediate, Advanced)
- Step-by-step instructions (expandable)
- Benefits listing
- Completion tracking
- Calorie counter
- Progress sidebar with:
  - Exercises completed today
  - Calories burned
  - Weekly stats

**Data Structure:**
```typescript
interface Exercise {
  id: string;
  name: string;
  category: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  benefits: string[];
  steps: string[];
  calories: number;
  icon: string;
}
```

**Sample Exercises:**
- **Yoga:** Morning Yoga Flow (15 min, Beginner, 80 cal)
- **Cardio:** Mindful Walking (20 min, Beginner, 100 cal)
- **Meditation:** Breathing Exercises (10 min, Beginner, 20 cal)
- **Strength:** Strength Training (30 min, Intermediate, 200 cal)

**Exercise Tips:**
- Start slow and gradually increase intensity
- Stay hydrated before, during, and after
- Listen to your body and rest when needed
- Consistency matters more than intensity

---

### 3. Daily Quotes (`/quotes`)

**Purpose:** Inspirational quotes for motivation and emotional support

**Key Features:**
- Quote of the Day with random generator
- 28 quotes across 7 categories
- Category filter
- Favorites system
- Share functionality
- Reading statistics
- Daily notification option

**Categories:**
1. **Motivation** (4 quotes) - Orange theme
2. **Happiness** (4 quotes) - Yellow theme
3. **Calm** (4 quotes) - Blue theme
4. **Resilience** (4 quotes) - Purple theme
5. **Gratitude** (4 quotes) - Green theme
6. **Confidence** (4 quotes) - Pink theme
7. **Comfort** (4 quotes) - Teal theme (for sad/anxious moods)

**Data Structure:**
```typescript
interface QuoteData {
  id: string;
  text: string;
  author: string;
  category: string;
  emotion: string;
}
```

**Sample Quotes:**
- "The only way to do great work is to love what you do." - Steve Jobs (Motivation)
- "Peace comes from within. Do not seek it without." - Buddha (Calm)
- "This too shall pass." - Persian Proverb (Comfort)

**Stats Tracked:**
- Days active
- Quotes read
- Favorite category
- Current reading streak

---

## Technical Implementation

### Dependencies
- **Next.js 14** - App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Pure CSS (no custom styles)
- **Lucide React** - Icon library

### Hooks Used
- `useState` - Local state management
- `usePathname` - Route detection (from 'next/navigation')

### Responsive Breakpoints
- **Mobile:** < 1024px (Sidebar hidden, hamburger menu)
- **Desktop:** ≥ 1024px (Sidebar visible, full layout)

### Color System
All pages follow the black/white minimalist theme with accent colors:
- **Music:** Purple/Pink gradient
- **Exercises:** Orange/Red gradient
- **Quotes:** Pink/Purple gradient

### Transitions
- Sidebar slide: `transition-transform duration-300`
- Button hovers: `transition-colors`
- Card shadows: `transition-shadow`

---

## Navigation Flow

### User Journey:
1. **Public Access:** Landing → Login/Signup → Onboarding
2. **Protected Access:** Dashboard (with sidebar + header)
3. **Main Features:**
   - Journal management (list, new with LIVE detection, detail, edit)
   - Real-time emotion detection
   - Analytics with 5 chart types
   - AI chat assistant
   - Coping strategies recommendations
4. **New Features:**
   - Music therapy with playlists
   - Wellness exercises with tracking
   - Daily motivational quotes
5. **Utilities:**
   - Mood calendar
   - ML models management
   - Settings (4 tabs)

---

## Adding New Menu Items

To add a new navigation item to the sidebar:

1. **Update Sidebar.tsx:**
```typescript
const navItems = [
  // ... existing items
  { 
    href: '/new-page', 
    label: 'New Feature', 
    icon: NewIcon 
  },
];
```

2. **Update Header.tsx:**
```typescript
const getPageTitle = (pathname: string) => {
  // ... existing cases
  if (pathname === '/new-page') return 'New Feature';
  return 'Dashboard';
};
```

3. **Create Page:**
```typescript
// src/app/new-page/page.tsx
export default function NewPage() {
  return (
    <div className="min-h-screen bg-white text-black p-6">
      {/* Content automatically has sidebar + header */}
    </div>
  );
}
```

---

## Mobile UX Best Practices

1. **Sidebar:**
   - Hamburger menu always visible on mobile
   - Overlay backdrop prevents interaction with page content
   - Smooth slide animations
   - Closes automatically when navigating

2. **Header:**
   - Fixed to top for easy access
   - Essential actions remain visible
   - Responsive padding

3. **Content:**
   - Proper spacing for mobile (top padding for header)
   - No left margin on mobile (sidebar hidden)
   - Touch-friendly buttons and links

---

## Testing Checklist

### Sidebar
- ✅ All 12 menu items render correctly
- ✅ Active state highlights current page
- ✅ Mobile menu opens/closes smoothly
- ✅ Overlay backdrop works
- ✅ Hidden on public pages
- ✅ User profile section displays

### Header
- ✅ Correct page titles for all routes
- ✅ Nested routes handled (journal/new, journal/[id]/edit)
- ✅ Search button visible
- ✅ Notifications bell with badge
- ✅ Mood indicator displays
- ✅ Hidden on public pages

### Layout
- ✅ Sidebar + Header persist on all protected pages
- ✅ Content has proper margins (not overlapping)
- ✅ Responsive on mobile/tablet/desktop
- ✅ Public pages don't show navigation

### New Pages
- ✅ Music page: Playlists, playback controls, stats
- ✅ Exercises page: Categories, tracking, instructions
- ✅ Quotes page: Categories, favorites, sharing

---

## Future Enhancements

1. **Sidebar:**
   - Collapsible mode (icons only)
   - Customizable menu order
   - Nested submenus
   - Keyboard shortcuts

2. **Header:**
   - Global search with results
   - Notification center with list
   - Real-time mood detection integration
   - Breadcrumb navigation

3. **New Features:**
   - Music: Spotify integration, custom playlists
   - Exercises: Video tutorials, AR guidance
   - Quotes: User-submitted quotes, quote generator API

---

## Performance Notes

- Components use `'use client'` for interactivity
- Conditional rendering prevents unnecessary renders
- Icons imported from single source (lucide-react)
- No external API calls (all data is local)
- Optimized for fast page transitions

---

## Accessibility

- Semantic HTML (nav, button, main)
- Keyboard navigation supported
- ARIA labels on icon-only buttons
- Focus states on interactive elements
- Color contrast meets WCAG standards

---

## Summary

The navigation system provides:
- **Unified Experience:** Consistent UI across all pages
- **Mobile Responsive:** Optimized for all screen sizes
- **Feature Complete:** All 12 main features accessible
- **User Friendly:** Intuitive navigation with visual feedback
- **Performant:** Fast, no unnecessary re-renders
- **Maintainable:** Easy to extend with new pages

**Total Pages:** 19 (16 original + 3 new feature pages)
**Components:** 2 (Sidebar, Header)
**Navigation Items:** 12
**Lines of Code:** ~700 (Sidebar 178 + Header 60 + Music 295 + Exercises 340 + Quotes 340)
