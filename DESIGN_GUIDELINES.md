# Luster AI Design Guidelines

## Core Design Principles

### 1. Professional & Trustworthy
- **Clean, minimal interface** that doesn't compete with photo content
- **Neutral color palette** to ensure photos are the focus
- **Professional typography** that conveys reliability
- **Consistent spacing** using 8px grid system

### 2. Photo-First Design
- **Large preview areas** with minimal UI chrome
- **Dark mode by default** to reduce eye strain during photo editing
- **High contrast controls** for visibility against varied photo backgrounds
- **Floating UI elements** that can be minimized or moved

### 3. Real Estate Industry Alignment
- **Fast workflows** - agents need quick turnarounds
- **Batch operations** - handle multiple photos efficiently
- **Mobile-optimized** - agents work from phones on-site
- **Export presets** - MLS-ready dimensions and formats

## Visual Design System

### Color Palette
```scss
// Primary Colors
$primary-blue: #0066CC;      // Trust, professionalism
$primary-hover: #0052A3;     // Hover state
$primary-light: #E6F0FF;     // Light backgrounds

// Neutral Colors
$gray-900: #111827;          // Primary text
$gray-800: #1F2937;          // Dark backgrounds
$gray-700: #374151;          // Secondary text
$gray-600: #4B5563;          // Muted text
$gray-500: #6B7280;          // Borders
$gray-400: #9CA3AF;          // Disabled
$gray-300: #D1D5DB;          // Light borders
$gray-200: #E5E7EB;          // Light backgrounds
$gray-100: #F3F4F6;          // Subtle backgrounds
$gray-50: #F9FAFB;           // Off-white

// Semantic Colors
$success-green: #10B981;     // Success states
$warning-amber: #F59E0B;     // Warnings, low credits
$error-red: #EF4444;         // Errors
$info-blue: #3B82F6;         // Information

// Dark Mode Specific
$dark-bg: #0F172A;           // Main background
$dark-surface: #1E293B;      // Card backgrounds
$dark-surface-hover: #334155; // Interactive surfaces
```

### Typography
```scss
// Font Stack
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

// Font Sizes (Mobile First)
$text-xs: 0.75rem;    // 12px - captions, labels
$text-sm: 0.875rem;   // 14px - body small
$text-base: 1rem;     // 16px - body default
$text-lg: 1.125rem;   // 18px - body large
$text-xl: 1.25rem;    // 20px - h4
$text-2xl: 1.5rem;    // 24px - h3
$text-3xl: 1.875rem;  // 30px - h2
$text-4xl: 2.25rem;   // 36px - h1

// Font Weights
$font-normal: 400;    // Body text
$font-medium: 500;    // Emphasized text
$font-semibold: 600;  // Headings
$font-bold: 700;      // CTAs

// Line Heights
$leading-tight: 1.25;
$leading-normal: 1.5;
$leading-relaxed: 1.625;
```

### Spacing System
```scss
// 8px Grid System
$space-0: 0;
$space-1: 0.25rem;  // 4px
$space-2: 0.5rem;   // 8px
$space-3: 0.75rem;  // 12px
$space-4: 1rem;     // 16px
$space-5: 1.25rem;  // 20px
$space-6: 1.5rem;   // 24px
$space-8: 2rem;     // 32px
$space-10: 2.5rem;  // 40px
$space-12: 3rem;    // 48px
$space-16: 4rem;    // 64px
$space-20: 5rem;    // 80px
$space-24: 6rem;    // 96px
```

## Component Patterns

### 1. Upload Interface
```tsx
// Design Requirements
- Drag-and-drop zone with clear visual feedback
- Support for multiple file selection
- Real-time upload progress per file
- Thumbnail previews during upload
- Clear error states for invalid files

// Visual Specifications
- Drop zone: Dashed border, subtle background
- Active drop: Blue border, light blue background
- File cards: White/dark surface with shadow
- Progress bar: Thin, positioned at bottom of card
```

### 2. Photo Grid Gallery
```tsx
// Design Requirements
- Responsive grid (1-2 cols mobile, 3-4 cols tablet, 5-6 cols desktop)
- Lazy loading with skeleton screens
- Hover states showing quick actions
- Selection mode for batch operations
- Smooth transitions between states

// Visual Specifications
- Grid gap: 16px (mobile) / 24px (desktop)
- Aspect ratio: 4:3 maintained
- Border radius: 8px
- Hover overlay: Dark gradient with icons
```

### 3. Enhancement Controls
```tsx
// Design Requirements
- Clear style preset cards with examples
- Before/after comparison slider
- Real-time preview updates
- Credit cost clearly displayed
- One-click enhancement application

// Visual Specifications
- Preset cards: 120px height with thumbnail
- Active preset: Blue border, elevated shadow
- Slider handle: Large touch target (44px minimum)
- Credit badge: Positioned top-right, high contrast
```

### 4. Status Indicators
```tsx
// Design Requirements
- Clear processing states (queued, processing, complete)
- Estimated time remaining
- Error recovery options
- Success confirmations

// Visual Specifications
- Status dots: 8px diameter, semantic colors
- Progress rings: 2px stroke, animated
- Toast notifications: Slide in from top-right
- Error alerts: Red border, icon, clear message
```

## Mobile-First Responsive Rules

### Breakpoints
```scss
$mobile: 320px;     // Minimum supported
$tablet: 768px;     // iPad portrait
$desktop: 1024px;   // Small laptop
$wide: 1440px;      // Desktop
$ultrawide: 1920px; // Large monitors
```

### Mobile Optimization
1. **Touch Targets**: Minimum 44x44px for all interactive elements
2. **Thumb-Friendly**: Primary actions in bottom 1/3 of screen
3. **Gestures**: Swipe for before/after, pinch to zoom
4. **Bottom Sheets**: Use for controls and menus
5. **Fixed Headers**: Minimal height (56px), hide on scroll down
6. **Full-Width Elements**: Buttons and cards extend edge-to-edge

### Progressive Enhancement
```scss
// Mobile Base
.photo-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  
  @media (min-width: $tablet) {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  @media (min-width: $desktop) {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  
  @media (min-width: $wide) {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

## Accessibility Standards

### WCAG 2.1 AA Compliance
1. **Color Contrast**
   - Normal text: 4.5:1 minimum
   - Large text: 3:1 minimum
   - Interactive elements: 3:1 minimum

2. **Keyboard Navigation**
   - All interactive elements keyboard accessible
   - Visible focus indicators (2px outline minimum)
   - Logical tab order
   - Skip links for main content

3. **Screen Reader Support**
   - Semantic HTML structure
   - ARIA labels for icons and images
   - Live regions for status updates
   - Alternative text for all photos

4. **Motion & Animation**
   - Respect prefers-reduced-motion
   - Provide pause controls for auto-advancing content
   - Smooth but not distracting transitions (200-300ms)

### Implementation Examples
```tsx
// Accessible Button Component
<button
  className="btn-primary"
  aria-label="Enhance photo with sunset style"
  aria-busy={isProcessing}
  disabled={!hasCredits}
>
  {isProcessing ? <Spinner aria-label="Processing" /> : 'Enhance Photo'}
</button>

// Accessible Image Preview
<img
  src={photo.url}
  alt={`Real estate photo ${index + 1}: ${photo.description || 'Exterior view'}`}
  loading="lazy"
/>
```

## Performance Guidelines

### Image Optimization
1. **Responsive Images**: Serve different sizes based on viewport
2. **Lazy Loading**: Load images as they enter viewport
3. **Progressive JPEGs**: Show low-quality placeholder first
4. **WebP Format**: Use for 25-35% smaller file sizes
5. **Thumbnail Generation**: Create 200x150 thumbs for grids

### Loading States
```tsx
// Skeleton Screens
- Match exact layout of content
- Subtle shimmer animation
- Progressive content reveal

// Optimistic Updates
- Show success immediately
- Rollback on error
- Queue visual feedback
```

### Bundle Optimization
1. **Code Splitting**: Route-based chunks
2. **Tree Shaking**: Remove unused code
3. **CSS Purging**: Remove unused styles
4. **Font Subsetting**: Load only used characters
5. **CDN Assets**: Serve static assets from edge

## Animation & Micro-interactions

### Transition Timing
```scss
$transition-fast: 150ms;     // Hover states
$transition-normal: 250ms;   // Most transitions
$transition-slow: 350ms;     // Page transitions
$transition-slower: 500ms;   // Complex animations

// Easing Functions
$ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
$ease-out: cubic-bezier(0, 0, 0.2, 1);
$ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### Interaction Feedback
1. **Hover States**: Subtle elevation or color change
2. **Active States**: Scale down slightly (0.98)
3. **Loading States**: Pulse or spinner animation
4. **Success States**: Checkmark with subtle bounce
5. **Error States**: Shake animation with red highlight

## Form Design

### Input Fields
```scss
.input {
  height: 44px;                    // Touch-friendly
  padding: 0 16px;                  // Comfortable padding
  border: 1px solid $gray-300;     // Clear boundaries
  border-radius: 8px;               // Modern rounded corners
  font-size: 16px;                 // Prevent zoom on iOS
  transition: all $transition-fast;
  
  &:focus {
    border-color: $primary-blue;
    outline: 2px solid rgba($primary-blue, 0.2);
    outline-offset: 2px;
  }
  
  &:invalid {
    border-color: $error-red;
  }
}
```

### Validation Feedback
1. **Inline Validation**: Show errors below fields
2. **Real-time Feedback**: Validate on blur, not on type
3. **Success Indicators**: Green checkmark when valid
4. **Error Messages**: Specific, actionable guidance
5. **Required Fields**: Clear asterisk or "required" label

## Icon System

### Icon Guidelines
1. **Consistent Style**: Use single icon library (Lucide, Heroicons)
2. **Standard Sizes**: 16px (small), 20px (default), 24px (large)
3. **Stroke Width**: 1.5-2px for consistency
4. **Color Usage**: Inherit from parent text color
5. **Accessibility**: Always pair with text or aria-label

### Common Icons
```tsx
// Action Icons
Upload, Download, Edit, Delete, Share, Copy

// Status Icons
Check, X, Alert, Info, Clock, Loader

// Navigation Icons
ChevronLeft, ChevronRight, Menu, Close, Home

// Feature Icons
Image, Sparkles, CreditCard, Settings, User
```

## Error Handling UI

### Error States
1. **Network Errors**: Full-screen with retry button
2. **Upload Failures**: Inline with file, retry option
3. **Processing Errors**: Clear message, support link
4. **Payment Errors**: Specific issue, alternative actions
5. **Permission Errors**: What's needed, how to fix

### Error Message Guidelines
```tsx
// Good Error Message
"Your photo couldn't be enhanced because you're out of credits. 
Purchase more credits to continue."
[Purchase Credits] [Cancel]

// Bad Error Message
"Error: INSUFFICIENT_CREDITS"
[OK]
```

## Empty States

### Design Principles
1. **Informative**: Explain what's supposed to be here
2. **Actionable**: Provide clear next steps
3. **Visually Appealing**: Use illustrations or icons
4. **Encouraging**: Positive, helpful tone
5. **Contextual**: Different messages for different scenarios

### Implementation
```tsx
<EmptyState
  icon={<UploadIcon />}
  title="No photos yet"
  description="Upload your first real estate photo to get started"
  action={
    <Button onClick={openUpload}>
      Upload Photos
    </Button>
  }
/>
```

## Platform-Specific Considerations

### iOS Safari
- Account for safe areas (notch, home indicator)
- Prevent bounce scrolling on fixed elements
- Handle viewport height changes
- Test on actual devices

### Android Chrome
- Handle back button navigation
- Support pull-to-refresh
- Test on various screen densities
- Optimize for slower devices

### Desktop Browsers
- Support drag-and-drop from desktop
- Keyboard shortcuts for power users
- Multi-window workflows
- Right-click context menus

## Testing Checklist

### Visual Testing
- [ ] All breakpoints (320px to 1920px)
- [ ] Dark and light modes
- [ ] High contrast mode
- [ ] Different photo types (day, night, interior, exterior)
- [ ] Loading and error states

### Device Testing
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)
- [ ] Desktop (Chrome, Firefox, Safari, Edge)
- [ ] Slow 3G network simulation

### Accessibility Testing
- [ ] Keyboard-only navigation
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Color contrast analyzer
- [ ] Focus management
- [ ] ARIA implementation

## Implementation Notes

### CSS Architecture
```scss
// BEM Naming Convention
.photo-card {}
.photo-card__image {}
.photo-card__title {}
.photo-card--enhanced {}

// Utility Classes (Tailwind-inspired)
.text-sm {}
.font-semibold {}
.bg-primary {}
.rounded-lg {}
```

### Component Structure
```tsx
// Consistent component patterns
components/
  PhotoCard/
    PhotoCard.tsx       // Logic
    PhotoCard.module.css // Styles
    PhotoCard.test.tsx  // Tests
    index.ts           // Export
```

### Performance Metrics
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1
- Largest Contentful Paint: < 2.5s
- Bundle size: < 200KB gzipped