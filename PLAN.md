---
Vocab Management Feature - Implementation Plan
Overview
A new Vocab tab in the main navigation (bottom tabs on mobile, sidebar on desktop) providing a comprehensive vocabulary management experience with:
- iPad-first split-view: list on left, word details panel on right
- iPhone/small screens: full-screen list with bottom sheet for word details
- Search, filter by status, sort options, language tabs
- Basic bulk operations: multi-select and batch status change
---
1. Route & Navigation Structure
New routes:
app/(app)/vocab/_layout.tsx     # Stack layout for vocab section
app/(app)/vocab/index.tsx       # Main vocab list screen
Navigation updates:
- Add "Vocab" tab to bottom tabs (app/(app)/_layout.tsx)
- Add "Vocab" item to sidebar (src/components/Sidebar.tsx)
- Use book-outline / book icon (or reader-outline) to differentiate from Library
---
2. UI Architecture
2.1 Main Screen Layout (VocabScreen)
Desktop/iPad (≥768px):
┌─────────────────────────────────────────────────────────────┐
│  Vocab                                    [Language Tabs]   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┬───────────────────────────┐ │
│ │  [Search]                   │   Word Details Panel      │ │
│ │  [Status Filter Pills]      │   ─────────────────────── │ │
│ │  [Sort dropdown]            │   "Bonjour"               │ │
│ │  ─────────────────────────  │   Status: Known           │ │
│ │  □ bonjour        Known     │   ─────────────────────── │ │
│ │  □ aujourd'hui    Learning  │   [Definition section]    │ │
│ │  □ maison         New       │   ─────────────────────── │ │
│ │  □ parler         Familiar  │   Notes: ...              │ │
│ │  ...                        │   [Status buttons]        │ │
│ │  [Load more]                │   [Delete]                │ │
│ └─────────────────────────────┴───────────────────────────┘ │
│                          [Bulk Action Bar - when selected]  │
└─────────────────────────────────────────────────────────────┘
Mobile/iPhone (<768px):
┌─────────────────────────────────┐
│  Vocab           [Lang Toggle]  │
├─────────────────────────────────┤
│  [Search]                       │
│  [Filter pills]  [Sort ▼]       │
├─────────────────────────────────┤
│  □ bonjour              Known   │
│  □ aujourd'hui       Learning   │
│  □ maison                New    │
│  ...                            │
│  [Load more]                    │
├─────────────────────────────────┤
│  [Bulk Action Bar if selected]  │
└─────────────────────────────────┘
(Tap word → Bottom Sheet with details)
2.2 Component Breakdown
New components:
- src/features/vocab/VocabScreen.tsx - Main orchestrator
- src/features/vocab/VocabList.tsx - Scrollable list with pagination
- src/features/vocab/VocabRow.tsx - Individual word row (selectable)
- src/features/vocab/VocabDetailPanel.tsx - Right panel on iPad / bottom sheet content
- src/features/vocab/VocabFilters.tsx - Search + filter pills + sort
- src/features/vocab/LanguageTabs.tsx - FR/DE/JA switcher
- src/features/vocab/BulkActionBar.tsx - Appears when items selected
- src/features/vocab/StatusBadge.tsx - Color-coded status indicator
---
3. Data & State Management
3.1 Convex Queries (existing convex/vocab.ts)
The existing backend already provides:
- listVocab - Paginated query with search, status filter, sorting ✅
- getVocabCounts - Counts per status for filter badges ✅
- updateVocabStatus - Single word status update ✅
- bulkUpdateStatus - Batch status updates ✅
- updateVocabMeta - Update meaning/notes ✅
- deleteVocab - Delete single word ✅
Minor enhancements needed:
- Add bulkDelete mutation for deleting multiple selected words
3.2 Client State
Using React state (no external state library):
- selectedLanguage: 'de' | 'fr' | 'ja'
- searchQuery: string
- statusFilter: number[]
- sortBy: 'dateAdded' | 'alphabetical' | 'status'
- sortOrder: 'asc' | 'desc'
- selectedIds: Set<Id<"vocab">>
- selectedWord: Id<"vocab"> | null (for detail panel)
---
4. Detailed Component Specifications
4.1 VocabRow
interface VocabRowProps {
  vocab: VocabItem;
  isSelected: boolean;
  isActive: boolean;  // Highlighted in detail panel
  onToggleSelect: () => void;
  onPress: () => void;
  selectionMode: boolean;
}
Visual design:
- Checkbox on left (visible when selectionMode or on hover/desktop)
- Word term in serif font (display field)
- Status badge (color-coded pill: New/Recognized/Learning/Familiar/Known)
- Subtle meaning preview if available
- Active state: left border accent
4.2 VocabDetailPanel
Reuse styling patterns from WordDetails.tsx:
- Large word header (display + normalized if different)
- Dictionary lookup integration (existing lookupDefinition action)
- Editable meaning field
- Editable notes field (TextArea)
- Status selection grid (same design as WordDetails)
- Delete button (destructive variant)
- Last reviewed / next review date if applicable
4.3 VocabFilters
- Search input (debounced, 300ms)
- Status filter pills: All | New | Recognized | Learning | Familiar | Known
  - Show counts in each pill (from getVocabCounts)
- Sort dropdown: Date added | Alphabetical | Status
  - Toggle asc/desc
4.4 LanguageTabs
- Horizontal tabs: French | German | Japanese
- Only show languages that have vocabulary
- Badge with total count per language
4.5 BulkActionBar
Fixed bar at bottom when selectedIds.size > 0:
- "{N} selected"
- Status dropdown: "Set status to..." → New, Recognized, Learning, Familiar, Known
- "Deselect all" button
- Animate in/out
---
5. Loading & Empty States
Loading states:
- Skeleton rows (3-5) while initial load
- "Loading more..." indicator at bottom during pagination
- Detail panel loading spinner while fetching dictionary
Empty states:
- No vocab yet: "Start reading to build your vocabulary"
- No search results: "No words match your search"
- Filtered empty: "No words with this status"
---
6. Responsive Breakpoints
| Breakpoint | Layout | Detail View |
|------------|--------|-------------|
| < 768px | Single column list | Bottom sheet |
| ≥ 768px | Split view (40/60) | Right panel |
| ≥ 1024px | Split view (35/65) | Right panel, wider |
---
7. File Structure
app/
├── (app)/
│   ├── vocab/
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   └── _layout.tsx (update)
src/
├── features/
│   └── vocab/
│       ├── VocabScreen.tsx
│       ├── VocabList.tsx
│       ├── VocabRow.tsx
│       ├── VocabDetailPanel.tsx
│       ├── VocabFilters.tsx
│       ├── LanguageTabs.tsx
│       ├── BulkActionBar.tsx
│       └── StatusBadge.tsx
├── components/
│   └── Sidebar.tsx (update)
convex/
└── vocab.ts (minor additions)
---
8. Implementation Order
1. Navigation setup - Add Vocab tab and routes
2. VocabScreen scaffold - Basic layout with responsive split-view
3. LanguageTabs - Language switching
4. VocabFilters - Search, status filters, sort
5. VocabList + VocabRow - Paginated list with selection
6. VocabDetailPanel - Word details and editing
7. BulkActionBar - Multi-select actions
8. Polish - Loading states, animations, edge cases
---
9. Design Principles (per AGENTS.md)
- Restrained UI: Use existing color palette, borders over shadows
- NativeWind classes: Consistent with existing components
- No AI slop: Clean, functional design without gimmicks
- iPad-first: Split-view default, adapts gracefully to smaller screens
- Accessibility: Proper labels, touch targets ≥44px
- Performance: Memoized rows, virtualized list (FlatList), debounced search
---
