// frontend/src/styles/studentTheme.js
// Shared design tokens for student-facing pages (Notion/Figma aesthetic)

/**
 * Typography Scale
 * Compact, professional sizing - whitespace creates hierarchy, not large text
 */
export const typography = {
  // Page-level headers
  pageHeadline: 'text-2xl font-semibold leading-tight',
  pageSubtitle: 'text-sm mt-1',
  
  // Section headers
  sectionHeader: 'text-sm font-medium',
  
  // Stats and numbers
  statNumber: 'text-2xl font-semibold',
  statLabel: 'text-xs font-medium uppercase tracking-wide',
  
  // Content text
  body: 'text-sm',
  bodyMuted: 'text-xs',
  
  // Labels and metadata
  label: 'text-xs uppercase tracking-wide',
  metadata: 'text-xs',
}

/**
 * Card Styling
 * Compact, clean, minimal shadows - Notion-style cards
 */
export const card = {
  // Padding options
  padding: {
    compact: 'p-4',
    standard: 'p-5',
    comfortable: 'p-6',
  },
  
  // Border radius (moderate, not extreme)
  radius: {
    small: 'rounded-lg',
    standard: 'rounded-xl',
  },
  
  // Shadows (minimal, hairline)
  shadow: {
    none: '',
    hairline: 'shadow-sm',
    subtle: 'shadow-md',
  },
}

/**
 * Spacing Rhythm
 * Tighter vertical rhythm - no large gaps
 */
export const spacing = {
  // Between major sections
  section: 'mb-6 space-y-6',
  
  // Grid gaps
  gridTight: 'gap-3',
  gridStandard: 'gap-4',
  gridComfortable: 'gap-6',
  
  // Stack spacing
  stackTight: 'space-y-2',
  stackStandard: 'space-y-4',
  stackComfortable: 'space-y-6',
}

/**
 * Icon Sizing
 * Small, precise - never oversized
 */
export const icons = {
  // Inline with text
  inline: 'size-14 w-3.5 h-3.5', // 14px
  small: 'size-16 w-4 h-4',      // 16px
  
  // In cards/buttons
  card: 'size-18 w-[18px] h-[18px]',
  
  // Badge/avatar icons
  badge: 'w-6 h-6',              // 24px
  
  // Never use larger than this for new UI
  max: 'w-8 h-8',                // 32px
}

/**
 * Circular Progress Rings
 * Small, thin, precise - indicator not gauge
 */
export const progressRing = {
  size: 44,         // px
  strokeWidth: 2.5, // px
}

/**
 * Theme-aware styling helper
 * Generates light/dark theme variants
 */
export function getThemeStyles(theme) {
  const isDark = theme === 'dark'
  
  return {
    // Backgrounds
    bg: isDark ? 'bg-[#0F0F10]' : 'bg-[#FAFAFA]',
    
    // Text colors
    text: isDark ? 'text-[#EDEDED]' : 'text-[#171717]',
    textMuted: isDark ? 'text-[#A1A1A3]' : 'text-[#737373]',
    textSubtle: isDark ? 'text-[#737373]' : 'text-[#A3A3A3]',
    
    // Card backgrounds (glassmorphic)
    cardBg: isDark ? 'rgba(26, 26, 29, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    cardBgSolid: isDark ? 'bg-[#1A1A1D]' : 'bg-white',
    
    // Borders (hairline)
    border: isDark ? 'border-white/10' : 'border-[#E5E5E5]',
    borderSubtle: isDark ? 'border-white/5' : 'border-gray-200/50',
    
    // Dividers
    divider: isDark ? 'border-white/10' : 'border-gray-200',
    
    // Hover states
    hoverBg: isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100',
    activeBg: isDark ? 'bg-white/10' : 'bg-gray-100',
    
    // Accent colors (muted, used sparingly)
    accent: {
      amber: isDark ? '#f59e0b' : '#d97706',
      violet: isDark ? '#8b5cf6' : '#7c3aed',
      indigo: isDark ? '#6366f1' : '#4f46e5',
      green: isDark ? '#22c55e' : '#16a34a',
      red: isDark ? '#ef4444' : '#dc2626',
      blue: isDark ? '#3b82f6' : '#2563eb',
    },
    
    // Status badge colors
    status: {
      active: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200',
      complete: isDark ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-green-50 text-green-700 border-green-200',
      pending: isDark ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : 'bg-yellow-50 text-yellow-700 border-yellow-200',
      error: isDark ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200',
    },
  }
}

/**
 * Badge/Pill Styling
 * Small, compact, precise
 */
export const badge = {
  // Size variants
  size: {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  },
  
  // Border radius
  radius: 'rounded-md',
  
  // With border
  bordered: 'border',
}

/**
 * Button Styling
 * Compact, professional
 */
export const button = {
  size: {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  },
  
  radius: 'rounded-lg',
  
  // Hover lift (subtle)
  hover: 'hover:-translate-y-0.5 transition-all duration-300',
}

/**
 * Usage Guidelines
 * 
 * 1. Import: import { typography, card, spacing, getThemeStyles } from '../../styles/studentTheme'
 * 2. Get theme: const t = getThemeStyles(theme)
 * 3. Apply: className={`${typography.pageHeadline} ${t.text}`}
 * 4. Accent colors: Use t.accent.amber/violet/indigo as fill/stroke, never as backgrounds
 * 5. Borders: Always use t.border or t.borderSubtle - never colored borders except status badges
 * 6. Icons: Use icons.inline (14px) or icons.small (16px) for section headers
 * 7. Cards: Use card.padding.compact + card.radius.small + card.shadow.hairline
 * 8. Spacing: Use spacing.section for major sections, spacing.gridStandard for grids
 */
