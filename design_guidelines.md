# Multi-Agent Monitoring Dashboard Design Guidelines

## Design Approach: Design System Approach
**Selected System:** Carbon Design System approach with enterprise monitoring inspirations
**Justification:** This is a utility-focused, information-dense monitoring application where performance, clarity, and operational efficiency are paramount. The design should prioritize data readability and functional hierarchy over visual flair.

## Core Design Elements

### A. Color Palette
**Dark Mode Primary (recommended for monitoring environments):**
- Background: 220 15% 8% (deep charcoal)
- Surface: 220 12% 12% (elevated cards/panels)
- Border: 220 8% 20% (subtle divisions)
- Text Primary: 220 5% 95% (high contrast)
- Text Secondary: 220 5% 70% (secondary info)

**Light Mode Alternative:**
- Background: 220 5% 98% (clean white)
- Surface: 220 10% 95% (subtle gray cards)
- Border: 220 8% 85% (soft divisions)

**Status Colors:**
- Success: 142 70% 45% (online/healthy)
- Warning: 35 85% 55% (attention needed)
- Error: 0 70% 50% (offline/critical)
- Info: 210 70% 55% (neutral information)

### B. Typography
**Primary Font:** Inter or system font stack for excellent readability
**Hierarchy:**
- Headers: 600 weight, 1.5rem-2rem sizes
- Body: 400 weight, 0.875rem-1rem sizes  
- Data/Metrics: 500 weight, monospace for numerical consistency
- Labels: 500 weight, 0.75rem for form labels and metadata

### C. Layout System
**Spacing Units:** Tailwind units 2, 4, 6, and 8 (8px, 16px, 24px, 32px)
- Tight spacing (p-2, m-2) for dense data tables and metrics
- Standard spacing (p-4, gap-4) for card layouts and main sections
- Generous spacing (p-6, p-8) for main dashboard sections and page headers

### D. Component Library

**Core UI Elements:**
- Status badges with dot indicators for online/offline states
- Data cards with clean borders and subtle shadows
- Metric cards with large numbers and trend indicators
- Progress bars for disk usage, memory consumption

**Navigation:**
- Sidebar navigation with collapsible sections
- Breadcrumb navigation for device drill-down
- Tab navigation for switching between device details

**Data Displays:**
- Clean data tables with alternating row backgrounds
- Expandable rows for detailed system information
- Real-time updating metrics with subtle animations
- Filterable and searchable device lists

**Forms & Controls:**
- Minimal input fields with clear labels
- Dropdown filters for device status and types
- Search bars with instant filtering capabilities

**Overlays:**
- Modal dialogs for detailed device configuration
- Toast notifications for system alerts and updates
- Tooltips for complex technical information

### E. Dashboard-Specific Patterns

**Device List View:**
- Grid or table layout with device cards showing hostname, OS, last heartbeat
- Clear visual hierarchy with status indicators prominently displayed
- Quick actions accessible without navigation

**Device Detail View:**
- Multi-section layout with system info, processes, security, network tabs
- Metrics displayed in organized cards with clear data hierarchy
- Real-time updating capabilities with smooth transitions

**Status Indicators:**
- Consistent dot notation (green=online, red=offline, yellow=warning)
- Last seen timestamps prominently displayed
- Heartbeat indicators with visual pulse animations

**Data Presentation:**
- Tables with proper sorting and filtering capabilities
- Percentage bars for resource utilization
- Clean separation between different data types
- Consistent formatting for technical specifications

The overall aesthetic should feel professional, trustworthy, and optimized for extended monitoring sessions, with excellent readability and efficient information density.