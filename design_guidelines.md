# Design Guidelines: Sistema di Gestione MBO Aziendale

## Design Approach

**Selected Framework**: Carbon Design System with Fluent Design influences
**Rationale**: Enterprise productivity application requiring data-dense layouts, clear hierarchy, and professional aesthetics suitable for corporate environments.

## Core Design Principles

1. **Clarity & Efficiency**: Information-first design with minimal decoration
2. **Professional Restraint**: Clean, trustworthy interface befitting corporate use
3. **Structured Hierarchy**: Clear visual organization for complex data
4. **Accessible Workflows**: Intuitive navigation between personal views and admin functions

---

## Typography

**Font Family**: 
- Primary: 'Inter' (via Google Fonts CDN)
- Monospace: 'IBM Plex Mono' for data/metrics

**Type Scale**:
- Page Headers: text-3xl font-semibold (employee names, section titles)
- Section Headers: text-xl font-semibold
- Subsection Headers: text-lg font-medium
- Body Text: text-base font-normal
- Small Text: text-sm (metadata, timestamps)
- Labels: text-sm font-medium uppercase tracking-wide

**Line Height**: Use leading-relaxed for body content, leading-tight for headers

---

## Layout System

**Spacing Units**: Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: space-y-8, space-y-12
- Card gaps: gap-6
- Tight spacing for related items: space-y-2

**Container Strategy**:
- Admin Dashboard: Full-width with sidebar (max-w-none)
- Content areas: max-w-7xl mx-auto px-6
- Forms and documents: max-w-4xl
- Sidebar width: w-64 (256px)

**Grid Layouts**:
- Objective cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Document list: Single column with dividers
- Dashboard metrics: grid-cols-2 md:grid-cols-4 gap-4

---

## Component Library

### Navigation
**Top Navigation Bar**:
- Fixed header: h-16, shadow-sm
- Logo left, user profile/settings right
- Language toggle (IT/EN)
- Layout: flex justify-between items-center

**Sidebar Navigation** (Admin):
- Vertical menu: w-64, sticky positioning
- Menu items: px-4 py-3 with hover states
- Active state: font-semibold with subtle indicator
- Sections: Obiettivi, Utenti, Documenti, Impostazioni

### Cards & Containers

**Scheda MBO (Employee Card)**:
- Rounded borders: rounded-lg
- Elevation: shadow-md on hover
- Internal padding: p-6
- Header section with employee name and ID
- Metrics grid showing objective completion
- Progress bars for each cluster

**Objective Cluster Cards**:
- Compact design: p-4, rounded-md
- Cluster name badge: inline-flex items-center px-3 py-1 rounded-full text-sm
- Objective list with checkboxes
- Assignment status indicator
- Action menu (three dots) top-right

**Document Cards**:
- List view with icon left
- Document name, date, status
- Download/view actions right-aligned
- Acceptance checkbox for regulatory docs
- Border-b divider between items

### Forms & Inputs

**Text Inputs**:
- Height: h-10
- Padding: px-3
- Border: border rounded-md
- Focus: ring-2 ring-offset-2
- Labels: block mb-2 text-sm font-medium

**Select Dropdowns**:
- Consistent with text inputs
- Use Heroicons chevron-down for indicator
- Multi-select for assigning objectives

**Buttons**:
- Primary: px-4 py-2 rounded-md font-medium
- Secondary: border variant with transparent background
- Icon buttons: w-10 h-10 rounded-full for actions
- Button groups: -space-x-px with first/last rounded

**Checkboxes & Toggles**:
- Size: h-5 w-5 for checkboxes
- Toggle switches for settings
- Labels aligned vertically center

### Data Display

**Tables** (Admin backend):
- Minimal borders: border-b on rows only
- Header row: font-medium with bottom border
- Row height: py-4
- Hover state on rows
- Sticky header for long lists

**Status Badges**:
- Inline-flex rounded-full px-3 py-1 text-xs
- States: Assegnato, In Corso, Completato, Da Approvare
- Icon + text combination

**Progress Indicators**:
- Horizontal bars: h-2 rounded-full
- Percentage text above/beside
- Multi-segment for cluster breakdown

**Empty States**:
- Centered content: text-center with illustration placeholder
- Icon from Heroicons (document-text, chart-bar)
- Descriptive text: "Nessun obiettivo assegnato ancora"
- Call-to-action button if applicable

### Modal & Overlays

**Modal Dialogs**:
- Centered overlay with backdrop blur
- Modal width: max-w-2xl
- Padding: p-6
- Header with close button (X icon)
- Footer with action buttons

**Tooltips**:
- Small: text-xs px-2 py-1 rounded
- Arrow indicator pointing to trigger
- Appear on hover with minimal delay

---

## Page Layouts

### Dashboard Personale (Employee View)
- Single column on mobile, two-column on desktop
- Left: Scheda MBO with summary metrics
- Right: Recent activity, upcoming deadlines
- Full-width document section below
- Breadcrumb navigation: text-sm with chevron separators

### Regolamento Section
- Single-column layout: max-w-4xl
- Document viewer/reader interface
- Table of contents sidebar on desktop
- Download button top-right
- Acceptance form at bottom with checkbox + signature

### Backend Amministrativo
- Two-column layout: Sidebar + main content
- Main content header with page title + actions
- Search and filter controls: sticky below header
- Results in card grid or table format
- Pagination controls at bottom

### Assegnazione Obiettivi
- Split view: Objective library (left) | User assignment (right)
- Drag-and-drop functionality visual indicators
- Filter by cluster with chip navigation
- Bulk actions toolbar when items selected

---

## Icons

**Library**: Heroicons (via CDN)
**Usage**:
- Navigation: user-circle, document-text, clipboard-list, cog
- Actions: plus, trash, pencil, check, x-mark
- Status: check-circle, exclamation-circle, clock
- Consistent size: h-5 w-5 for inline, h-6 w-6 for standalone

---

## Images

**Strategic Use**:
- Profile photos: w-10 h-10 rounded-full in headers/lists
- Empty state illustrations: max-w-xs in center of empty views
- Company logo: h-8 in top navigation
- Document type icons: inline with file listings

**No Hero Image**: This is a dashboard application - focus on data density and workflow efficiency rather than marketing visuals.

---

## Animation Guidelines

**Minimal Motion**:
- Transitions: transition-colors duration-200 for hover states
- Loading states: Simple spinner, no elaborate animations
- No scroll-triggered effects
- Modal appearance: fade-in only (duration-300)

---

## Accessibility

- Form inputs maintain consistent 44px minimum touch target
- Focus indicators visible on all interactive elements
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels for icon-only buttons
- Skip navigation link for keyboard users
- Status messages announced to screen readers