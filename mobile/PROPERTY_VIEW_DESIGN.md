# Swipeable Property View Design

## Overview
Transform the current GalleryScreen into a swipeable three-screen experience with Gallery, Info, and Tools views. Users can naturally swipe between screens with circular indicators showing current position.

## Architecture

### Screen Structure
```
ProjectScreen (Container)
├── PageIndicators (3 circles at top)
├── SwipeableView
│   ├── Screen 1: Gallery (Photo Mosaic)
│   ├── Screen 2: Info (Property Details)
│   └── Screen 3: Tools (MLS Generator & Actions)
```

## Screen Designs

### Screen 1: Gallery View
- **Purpose**: Immersive photo viewing
- **Layout**:
  - Full-screen masonry photo grid
  - Tap any photo for full-screen viewer
  - Photo count badge (e.g., "24 photos")
- **Header**: Property address only
- **No bottom clutter** - Pure photo experience

### Screen 2: Info View
- **Purpose**: Property details at a glance
- **Layout**:
  ```
  ┌─────────────────────────┐
  │     $750,000           │ <- Large price
  │  4 bd • 3 ba • 2,450 sf│ <- Key stats
  ├─────────────────────────┤
  │  Property Details       │
  │  ┌──────────────────┐  │
  │  │ Type: Single Fam │  │
  │  │ Year: 2018       │  │
  │  │ Lot: 0.25 acres  │  │
  │  │ MLS: #123456     │  │
  │  └──────────────────┘  │
  ├─────────────────────────┤
  │  Description            │
  │  ┌──────────────────┐  │
  │  │ Beautiful modern  │  │
  │  │ home with...      │  │
  │  └──────────────────┘  │
  ├─────────────────────────┤
  │  Location               │
  │  ┌──────────────────┐  │
  │  │ [Map Preview]     │  │
  │  └──────────────────┘  │
  └─────────────────────────┘
  ```
- **Scrollable** if content exceeds screen height
- **Edit button** in header for updating info

### Screen 3: Tools View
- **Purpose**: Actions and AI features
- **Layout**:
  ```
  ┌─────────────────────────┐
  │   Listing Tools         │
  ├─────────────────────────┤
  │ ┌─────────────────────┐ │
  │ │ 🤖 Generate MLS     │ │ <- Primary action
  │ │    Description      │ │
  │ └─────────────────────┘ │
  │ ┌─────────────────────┐ │
  │ │ 📥 Download All     │ │
  │ │    Photos           │ │
  │ └─────────────────────┘ │
  │ ┌─────────────────────┐ │
  │ │ 🔗 Share Listing    │ │
  │ └─────────────────────┘ │
  │ ┌─────────────────────┐ │
  │ │ 📋 Copy Info        │ │
  │ └─────────────────────┘ │
  │ ┌─────────────────────┐ │
  │ │ 🗑️ Delete Project   │ │ <- Danger zone
  │ └─────────────────────┘ │
  └─────────────────────────┘
  ```
- **Large touch targets** for each action
- **Clear icons** and descriptions

## UI Components

### PageIndicators Component
```jsx
<View style={styles.indicatorContainer}>
  <Circle active={currentPage === 0} />
  <Circle active={currentPage === 1} />
  <Circle active={currentPage === 2} />
</View>
```
- Position: Fixed at top, below header
- Style: 8px circles, 12px spacing
- Active: Filled with #FFBF35
- Inactive: Border only, #E5E7EB

### SwipeableView Component
- Uses `react-native-pager-view` for native performance
- Horizontal pagination
- Page snapping
- Overscroll bounce effect
- Velocity-based swiping

## Data Model

```typescript
interface ExtendedPropertyData {
  // Core (existing)
  id: string
  address: string
  price: string
  beds: number
  baths: number
  images: any[]
  
  // Extended (new)
  squareFeet?: number
  propertyType?: 'Single Family' | 'Condo' | 'Townhouse' | 'Multi-Family'
  yearBuilt?: number
  lotSize?: string
  mlsNumber?: string
  listingStatus?: 'Active' | 'Pending' | 'Sold'
  description?: string
  
  // Location
  city?: string
  state?: string
  zipCode?: string
  neighborhood?: string
  
  // AI Generated
  generatedDescriptions?: {
    id: string
    tone: 'professional' | 'friendly' | 'luxury'
    text: string
    createdAt: Date
  }[]
}
```

## MLS Description Generator

### Modal Design
```
┌──────────────────────────┐
│ Generate MLS Description │
├──────────────────────────┤
│ Tone:                    │
│ [Professional][Friendly] │
│ [Luxury]                 │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ Generating...        │ │
│ │ [Loading animation]  │ │
│ └──────────────────────┘ │
│           OR             │
│ ┌──────────────────────┐ │
│ │ This stunning 4-bed  │ │
│ │ home features...     │ │
│ │                      │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ [Copy] [Regenerate]      │
└──────────────────────────┘
```

### AI Integration
- Analyzes property data + photos
- Generates professional MLS-ready descriptions
- Multiple tone options
- Includes key selling points
- Highlights unique features from photos

## Animations

### Page Transitions
- **Duration**: 300ms
- **Easing**: Spring physics
- **Haptic feedback**: Light impact on page change
- **Indicator animation**: Smooth scale + color transition

### Interactive Elements
- **Buttons**: Scale 0.95 on press
- **Cards**: Subtle shadow elevation on press
- **Modals**: Slide up from bottom

## Color Palette
- **Primary**: #FFBF35 (Luster gold)
- **Background**: #FFFFFF
- **Card background**: #F9FAFB
- **Text primary**: #111827
- **Text secondary**: #6B7280
- **Borders**: #E5E7EB
- **Danger**: #EF4444

## Implementation Priority
1. ✅ Create swipeable container structure
2. ⏳ Migrate existing gallery to Screen 1
3. ⏳ Build property info Screen 2
4. ⏳ Build tools Screen 3
5. ⏳ Add page indicators
6. ⏳ Implement MLS generator
7. ⏳ Add animations and polish

## Dependencies
```json
{
  "react-native-pager-view": "^6.2.0",
  "react-native-haptic-feedback": "^2.2.0",
  "@react-native-clipboard/clipboard": "^1.13.0"
}
```

## Success Metrics
- Swipe gesture feels natural and responsive
- Each screen has clear purpose
- MLS descriptions save time for agents
- Property info is scannable at a glance
- Tools are easily discoverable