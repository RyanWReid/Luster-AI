# Figma to Code Implementation Guide

## Pixel-Perfect Implementation Standards

### Core Principle
**Every implementation MUST match the Figma design exactly** - no deviations without explicit approval. This includes spacing, colors, typography, shadows, borders, and animations.

## Figma Design Token Extraction

### 1. Typography Specifications
```typescript
// Extract from Figma Text Properties
interface TypographySpec {
  fontFamily: string;      // Exact font-family from Figma
  fontSize: number;        // In px, exactly as specified
  fontWeight: number;      // 100-900, match Figma exactly
  lineHeight: number;      // In px or unitless multiplier
  letterSpacing: number;   // In px or em
  textTransform?: string;  // uppercase, lowercase, capitalize
  textDecoration?: string; // underline, line-through
}

// Implementation Example
const headingLarge: TypographySpec = {
  fontFamily: 'Inter',
  fontSize: 32,          // Figma: 32px
  fontWeight: 600,       // Figma: Semi Bold
  lineHeight: 40,        // Figma: 40px (125%)
  letterSpacing: -0.02,  // Figma: -2%
}
```

### 2. Color Extraction
```typescript
// Match Figma color values exactly
const colors = {
  // Primary Colors (from Figma Variables)
  primary: {
    50: '#EFF6FF',   // Exact hex from Figma
    100: '#DBEAFE',
    500: '#3B82F6',  // Main brand color
    600: '#2563EB',
    700: '#1D4ED8',
  },
  
  // Semantic Colors (from Figma)
  surface: {
    background: '#FFFFFF',     // Light mode
    backgroundDark: '#0F172A', // Dark mode
    card: '#FFFFFF',
    cardDark: '#1E293B',
  },
  
  // Opacity values must match
  overlay: {
    black20: 'rgba(0, 0, 0, 0.2)',   // Figma: Black 20%
    black50: 'rgba(0, 0, 0, 0.5)',   // Figma: Black 50%
    white10: 'rgba(255, 255, 255, 0.1)',
  }
}
```

### 3. Spacing & Layout
```typescript
// Extract exact spacing from Figma
const spacing = {
  // Auto Layout Gap values
  0: 0,
  1: 4,    // Figma: Gap 4
  2: 8,    // Figma: Gap 8
  3: 12,   // Figma: Gap 12
  4: 16,   // Figma: Gap 16
  5: 20,   // Figma: Gap 20
  6: 24,   // Figma: Gap 24
  8: 32,   // Figma: Gap 32
  10: 40,  // Figma: Gap 40
  12: 48,  // Figma: Gap 48
  16: 64,  // Figma: Gap 64
}

// Padding values (from Auto Layout)
const padding = {
  button: {
    x: 16,  // Horizontal padding in Figma
    y: 10,  // Vertical padding in Figma
  },
  card: {
    all: 24,  // Uniform padding
  },
  input: {
    x: 12,
    y: 8,
  }
}
```

### 4. Shadows & Effects
```typescript
// Extract exact shadow values from Figma
const shadows = {
  // Figma: Effect Style name
  sm: '0px 1px 2px rgba(0, 0, 0, 0.05)',
  
  // Figma: X:0 Y:4 Blur:6 Spread:-1 Color:#000000 10%
  md: '0px 4px 6px -1px rgba(0, 0, 0, 0.1)',
  
  // Figma: X:0 Y:10 Blur:15 Spread:-3 Color:#000000 10%
  // + X:0 Y:4 Blur:6 Spread:-2 Color:#000000 5%
  lg: `
    0px 10px 15px -3px rgba(0, 0, 0, 0.1),
    0px 4px 6px -2px rgba(0, 0, 0, 0.05)
  `,
  
  // Elevation shadows for cards
  elevation: {
    1: '0px 2px 4px rgba(0, 0, 0, 0.06)',
    2: '0px 4px 8px rgba(0, 0, 0, 0.08)',
    3: '0px 8px 16px rgba(0, 0, 0, 0.10)',
  }
}
```

### 5. Border Radius
```typescript
// Match Figma corner radius exactly
const borderRadius = {
  none: 0,
  sm: 4,    // Figma: Corner radius 4
  md: 8,    // Figma: Corner radius 8
  lg: 12,   // Figma: Corner radius 12
  xl: 16,   // Figma: Corner radius 16
  full: 9999, // Figma: Corner radius 999
  
  // Component-specific
  button: 8,
  input: 6,
  card: 12,
  modal: 16,
}
```

## Component Implementation Process

### Step 1: Figma Inspection Checklist
```markdown
Before coding any component, extract:

□ Dimensions (width, height, min/max constraints)
□ Auto Layout settings (direction, gap, padding, alignment)
□ Typography (all text properties)
□ Colors (fills, strokes, effects)
□ Shadows and effects
□ Border radius
□ Border width and style
□ Component states (hover, active, disabled, focus)
□ Responsive behavior (constraints, resizing)
□ Animation/transition properties
```

### Step 2: Component Specification Template
```typescript
// PhotoCard Component Specification (from Figma)
const PhotoCardSpec = {
  // Container
  container: {
    width: 'fill', // Figma: Fill container
    minHeight: 280,
    borderRadius: 12,
    padding: 0,
    background: '#FFFFFF',
    shadow: shadows.md,
  },
  
  // Image Area
  image: {
    width: '100%',
    height: 200,
    objectFit: 'cover' as const,
    borderRadius: '12px 12px 0 0', // Top corners only
  },
  
  // Content Area
  content: {
    padding: 16,
    gap: 8, // Space between elements
  },
  
  // Title Text
  title: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 24,
    color: '#111827',
  },
  
  // States (from Figma variants)
  states: {
    hover: {
      shadow: shadows.lg,
      transform: 'translateY(-2px)',
      transition: 'all 200ms ease',
    },
    selected: {
      borderWidth: 2,
      borderColor: '#3B82F6',
    }
  }
}
```

### Step 3: Implementation with Tailwind
```tsx
// Translate Figma specs to Tailwind classes
const PhotoCard = ({ image, title, selected, onClick }) => {
  return (
    <div
      className={`
        // Container (from Figma)
        w-full min-h-[280px] 
        rounded-xl p-0 bg-white
        shadow-md hover:shadow-lg
        hover:-translate-y-0.5
        transition-all duration-200
        
        // Selected state (from Figma variant)
        ${selected ? 'ring-2 ring-blue-500' : ''}
      `}
      onClick={onClick}
    >
      {/* Image - exact dimensions from Figma */}
      <img
        src={image}
        alt={title}
        className="w-full h-[200px] object-cover rounded-t-xl"
      />
      
      {/* Content - exact padding/gap from Figma */}
      <div className="p-4 space-y-2">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          {title}
        </h3>
      </div>
    </div>
  );
};
```

### Step 4: Custom CSS When Needed
```css
/* When Tailwind can't match Figma exactly */
.photo-card {
  /* Exact shadow from Figma */
  box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1);
  
  /* Exact transition timing from Figma prototype */
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.photo-card:hover {
  /* Exact hover shadow from Figma */
  box-shadow: 
    0px 10px 15px -3px rgba(0, 0, 0, 0.1),
    0px 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Exact typography from Figma */
.heading-large {
  font-family: 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 600;
  line-height: 40px;
  letter-spacing: -0.02em;
}
```

## Figma Dev Mode Integration

### 1. CSS Properties Extraction
```css
/* Copy directly from Figma Dev Mode */
.button-primary {
  /* Layout */
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  gap: 8px;
  
  /* Style */
  background: #3B82F6;
  border-radius: 8px;
  
  /* Typography */
  font-family: 'Inter';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  
  /* Effects */
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
}
```

### 2. Auto Layout to Flexbox
```typescript
// Figma Auto Layout → CSS Flexbox
const autoLayoutToFlex = {
  // Direction
  'Horizontal': 'flex-row',
  'Vertical': 'flex-col',
  
  // Alignment (Main Axis)
  'Top/Left': 'justify-start',
  'Center': 'justify-center',
  'Bottom/Right': 'justify-end',
  'Space Between': 'justify-between',
  
  // Alignment (Cross Axis)
  'Top/Left (Cross)': 'items-start',
  'Center (Cross)': 'items-center',
  'Bottom/Right (Cross)': 'items-end',
  
  // Gap
  'Gap: 16': 'gap-4', // 16px = gap-4 in Tailwind
}
```

## Responsive Implementation

### Figma Breakpoints to Code
```typescript
// Match Figma's responsive variants exactly
const breakpoints = {
  mobile: 375,    // iPhone viewport in Figma
  tablet: 768,    // iPad viewport in Figma
  desktop: 1440,  // Desktop frame in Figma
}

// Component with Figma responsive specs
const ResponsiveGrid = () => (
  <div className={`
    // Mobile (Figma: 375px frame)
    grid grid-cols-1 gap-4 px-4
    
    // Tablet (Figma: 768px frame)
    md:grid-cols-2 md:gap-6 md:px-6
    
    // Desktop (Figma: 1440px frame)
    lg:grid-cols-3 lg:gap-8 lg:px-8
    xl:grid-cols-4
  `}>
    {children}
  </div>
)
```

### Constraints to CSS
```css
/* Figma Constraints → CSS */
.component {
  /* Left & Right → Width stretches */
  width: 100%;
  
  /* Top & Bottom → Height stretches */
  height: 100%;
  
  /* Center → Margin auto */
  margin: 0 auto;
  
  /* Scale → Aspect ratio maintained */
  aspect-ratio: 16 / 9;
  
  /* Fixed → Absolute dimensions */
  width: 320px;
  height: 200px;
}
```

## Quality Assurance Checklist

### Visual Comparison
```markdown
□ Take screenshot of Figma design
□ Take screenshot of implementation
□ Overlay at 50% opacity to check alignment
□ Check all states (default, hover, active, disabled)
□ Verify on all breakpoints
□ Test with real content (long text, missing images)
```

### Measurement Verification
```javascript
// Browser DevTools verification
const element = document.querySelector('.photo-card');
const styles = window.getComputedStyle(element);

console.log({
  // Must match Figma exactly
  fontSize: styles.fontSize,        // "16px"
  lineHeight: styles.lineHeight,    // "24px"
  padding: styles.padding,          // "16px"
  borderRadius: styles.borderRadius // "12px"
});
```

### Figma Plugin Tools
```markdown
Recommended Figma plugins for accurate specs:
1. Figma to Code - Generates CSS/Tailwind
2. Design Tokens - Exports design system
3. Figma Measure - Precise measurements
4. Able - Accessibility checking
```

## Common Pitfalls to Avoid

### 1. Line Height Differences
```css
/* WRONG - Browser default */
.text {
  font-size: 16px;
  /* line-height defaults to ~1.2 */
}

/* CORRECT - Match Figma exactly */
.text {
  font-size: 16px;
  line-height: 24px; /* Figma: 150% = 24px */
}
```

### 2. Shadow Stacking
```css
/* Figma often uses multiple shadows */
.card {
  /* Don't simplify - use exact Figma shadows */
  box-shadow: 
    0px 10px 15px -3px rgba(0, 0, 0, 0.1),
    0px 4px 6px -2px rgba(0, 0, 0, 0.05);
}
```

### 3. Color Space Differences
```typescript
// Always use exact color values from Figma
const colors = {
  // Use Figma's hex/rgba values directly
  primary: '#3B82F6',  // Not 'blue-500'
  
  // Opacity must match exactly
  overlay: 'rgba(0, 0, 0, 0.5)', // Not 'black/50'
}
```

## Implementation Workflow

### 1. Designer Handoff
```markdown
Designer provides:
□ Figma file with Dev Mode access
□ Component states and variants
□ Interaction prototypes
□ Responsive layouts
□ Export assets (icons, images)
```

### 2. Developer Process
```markdown
1. Open component in Figma Dev Mode
2. Copy all specifications to code
3. Implement with exact values
4. Compare side-by-side with Figma
5. Get designer approval before proceeding
```

### 3. Validation Script
```javascript
// Automated Figma spec validation
const validateComponent = (componentName, figmaSpecs, element) => {
  const computed = window.getComputedStyle(element);
  const errors = [];
  
  // Check each property
  Object.entries(figmaSpecs).forEach(([prop, expectedValue]) => {
    const actualValue = computed[prop];
    if (actualValue !== expectedValue) {
      errors.push({
        property: prop,
        expected: expectedValue,
        actual: actualValue
      });
    }
  });
  
  if (errors.length > 0) {
    console.error(`❌ ${componentName} doesn't match Figma:`, errors);
  } else {
    console.log(`✅ ${componentName} matches Figma perfectly!`);
  }
};

// Usage
validateComponent('PhotoCard', {
  width: '320px',
  height: '280px',
  borderRadius: '12px',
  padding: '16px'
}, document.querySelector('.photo-card'));
```

## Figma Variables to CSS Variables
```css
:root {
  /* Color Primitives (from Figma Variables) */
  --color-blue-500: #3B82F6;
  --color-gray-900: #111827;
  
  /* Semantic Tokens (from Figma Variables) */
  --color-primary: var(--color-blue-500);
  --color-text-primary: var(--color-gray-900);
  
  /* Spacing Tokens (from Figma) */
  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  
  /* Typography Tokens (from Figma) */
  --font-size-base: 16px;
  --font-weight-semibold: 600;
  --line-height-base: 24px;
}

/* Dark mode (from Figma's dark variant) */
[data-theme="dark"] {
  --color-primary: #60A5FA;
  --color-text-primary: #F3F4F6;
}
```

## Export Assets from Figma

### Image Export Settings
```json
{
  "format": "PNG/JPG/WebP",
  "scale": ["1x", "2x", "3x"], // For retina displays
  "suffix": ["", "@2x", "@3x"],
  "optimization": {
    "jpg": { "quality": 85 },
    "png": { "compress": true },
    "webp": { "quality": 85 }
  }
}
```

### Icon Export
```json
{
  "format": "SVG",
  "optimization": "SVGO",
  "naming": "kebab-case",
  "size": "24x24", // Consistent icon size
  "strokeWidth": 1.5 // Match Figma exactly
}
```

## Maintenance & Updates

### Version Control Integration
```markdown
1. Tag Figma file versions
2. Reference Figma version in commits
3. Document design changes in PR
4. Include before/after screenshots
```

### Design System Sync
```javascript
// Auto-generate from Figma API
const syncFigmaTokens = async () => {
  const figmaFile = await getFigmaFile(FIGMA_FILE_KEY);
  const tokens = extractDesignTokens(figmaFile);
  
  // Generate CSS variables
  generateCSSVariables(tokens);
  
  // Generate Tailwind config
  generateTailwindConfig(tokens);
  
  // Generate TypeScript types
  generateTypeDefinitions(tokens);
};
```

## Remember: Pixel Perfect is Non-Negotiable
Every pixel, every shadow, every animation timing must match Figma exactly. When in doubt, measure twice, code once.