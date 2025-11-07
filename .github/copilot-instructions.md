# GitHub Copilot Instructions

## Project Context

Professional portfolio website for Ernesto Cobos - Cloud Architect & Fullstack Developer.

**Tech Stack:**

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm
- **React**: React 19.2 with React Compiler
- **Animations**: Framer Motion (when needed)
- **Icons**: Lucide React or custom SVGs

**Reference Sites:**

- Primary: cobos.io (main portfolio style and structure)
- Secondary: gamon.io (alternative professional presentation)

## Design Philosophy

### Visual Style

- **Dark theme** with high contrast (black background with bright accents)
- **Bold typography** with large headings and clear hierarchy
- **Geometric patterns** and grid layouts for visual interest
- **Orange/red accent colors** (#FF5722, #FF6B35) for CTAs and highlights
- **Smooth animations** and transitions for modern feel
- **Glassmorphism effects** for cards and sections when appropriate
- **Minimalist approach** with purposeful use of whitespace

### UI/UX Principles

- Clean, professional, and modern aesthetic
- Mobile-first responsive design
- Smooth scroll animations and transitions
- Interactive elements with hover states
- Clear call-to-action buttons
- Grid-based layouts with asymmetric sections
- Use of geometric shapes and dotted patterns for visual interest

## Content Sections (Based on cobos.io)

### Hero Section

- Large headline: "IDEAS FOR A DIGITAL RENAISSANCE"
- Subheading about breathing life into cloud and fullstack solutions
- Brief introduction: "Hi! I'm Ernesto Cobos..."
- Primary CTA: "Show my work"
- Tech stack visualization with animated icons

### About/Values Section

- Client collaboration emphasis
- Time zone flexibility highlight
- Continuous improvement mindset
- Interactive cards with icons and descriptions

### Tech Stack Display

- Visual representation of technologies (React, Express, TypeScript, Vue, AWS, GCP, Laravel, Django)
- Animated or interactive tech icons
- Grouped by category (Frontend, Backend, Cloud, etc.)

### Work Experience Section

- Timeline or card-based layout
- Each experience with:
  - Icon/illustration
  - Job title
  - Company type (e.g., "Fortune 500 Company", "Major Bank")
  - Description of achievements
  - Key technologies used

### Approach/Process Section

- Three-phase breakdown:
  1. **Planning & Strategy**: Goals, architecture, integrations
  2. **Development & Progress**: Scalable solutions, regular updates
  3. **Deployment & Launch**: Production deployment, smooth transition
- Visual progression indicators
- Phase-specific illustrations

### Current Projects Section

- "The Inside Scoop" - what you're currently building
- CTA to start projects together

### Contact Section

- Clear email CTA
- Social media links (GitHub, Twitter/X, LinkedIn)
- "Let's get in touch" messaging
- Copy email functionality

### Footer

- Copyright notice
- Navigation links (About, Projects, Contact, Blog)
- Social icons
- Decorative grid pattern

## Code Standards

### Commit Convention

- **MANDATORY**: All commits MUST follow Conventional Commits format
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- Scope examples: hero, about, experience, contact, ui, animation
- Examples:
  - `feat(hero): add animated tech stack section`
  - `fix(contact): resolve email copy functionality`
  - `style(experience): adjust card spacing and shadows`

### Component Architecture

- Create reusable UI components (Button, Card, Section, AnimatedText, etc.)
- Use composition pattern for complex sections
- Implement compound components when appropriate
- Each section should be its own component

### File Structure

```
app/
  page.tsx (main landing page)
  layout.tsx
  globals.css
components/
  ui/ (reusable UI components)
    button.tsx
    card.tsx
    section.tsx
  sections/ (page sections)
    hero.tsx
    about.tsx
    experience.tsx
    approach.tsx
    contact.tsx
  animations/ (animation components)
lib/
  utils.ts (utility functions)
  constants.ts (tech stack, experience data, etc.)
public/
  icons/
  images/
  grid.svg
  footer-grid.svg
types/
  index.ts
```

### TypeScript Standards

- Use TypeScript strict mode
- Define proper interfaces for all data structures
- Create types for:
  - Experience items
  - Tech stack items
  - Social links
  - Section props
- Avoid `any` type
- Use proper typing for event handlers

### Styling Guidelines

- Use Tailwind CSS utility classes
- Create custom utilities in `globals.css` when needed
- Implement dark theme as default
- Use CSS variables for theme colors
- Responsive breakpoints: mobile-first approach
- Animation utilities with Tailwind or Framer Motion

### React Best Practices (react.dev)

- **Components must be pure**: No side effects during render
- **Hooks rules**: Only call at top level, only in React functions
- **useState for state management**: Use for component-local state
- **Prop drilling solution**: Lift state up or use context for shared state
- **Key prop required**: Always provide unique keys in lists
- **Event handlers**: Pass functions, don't call them (onClick={handleClick} not onClick={handleClick()})
- **Controlled components**: Form inputs controlled by React state
- **Conditional rendering**: Use ternary operators or && for conditional JSX
- **JSX rules**: Must return single root element, use fragments <></> when needed
- **Naming conventions**: PascalCase for components, camelCase for functions/variables

### Next.js App Router Best Practices

- **Server Components by default**: Use 'use client' only when necessary (interactivity, hooks, browser APIs)
- **Server vs Client boundaries**:
  - Server: Data fetching, backend operations, large dependencies
  - Client: useState, useEffect, event handlers, browser APIs
- **Data fetching**: Fetch directly in Server Components with async/await
- **Caching**: Leverage automatic request memoization and cache
- **Loading states**: Use loading.tsx for automatic loading UI
- **Error handling**: Use error.tsx for error boundaries
- **Metadata API**: Use generateMetadata for dynamic SEO
- **Route organization**: Use route groups (folders) for logical structure
- **Image optimization**: Always use next/image component
- **Font optimization**: Use next/font for automatic font optimization
- **Dynamic imports**: Use next/dynamic for client component code splitting
- **Parallel routes**: Use @folder notation for simultaneous route rendering

### shadcn/ui Integration

- **Installation**: Use `pnpm dlx shadcn@latest init` to setup
- **Add components**: Use `pnpm dlx shadcn@latest add [component]`
- **Import pattern**: `import { Button } from "@/components/ui/button"`
- **Customization**: Components are copied to your project, fully customizable
- **Theming**: Use CSS variables in globals.css for consistent theming
- **Composition**: Build complex UIs by composing shadcn components
- **Accessibility**: All components follow WAI-ARIA standards
- **Dark mode**: Built-in dark mode support with next-themes

### Performance Optimization

- **Code splitting**: Automatic with App Router, use dynamic() for manual control
- **Lazy loading**: Implement for images, components below fold
- **Bundle analysis**: Monitor with @next/bundle-analyzer
- **Prefetching**: Links automatically prefetch in viewport
- **Static generation**: Use generateStaticParams for dynamic routes
- **ISR**: Implement Incremental Static Regeneration when needed
- **Edge runtime**: Use for globally distributed, fast responses
- **Streaming**: Leverage Suspense boundaries for progressive rendering

### Accessibility Standards

- **Semantic HTML**: Use proper HTML5 elements (nav, main, article, etc.)
- **ARIA labels**: Add when semantic HTML isn't enough
- **Keyboard navigation**: Ensure all interactive elements are keyboard accessible
- **Focus management**: Visible focus indicators, logical tab order
- **Color contrast**: Maintain WCAG AA standards (4.5:1 for normal text)
- **Screen readers**: Test with NVDA/JAWS, provide alt text for images
- **Reduced motion**: Respect prefers-reduced-motion media query

### Animation Guidelines

- Use Framer Motion for complex animations
- Implement scroll-based animations (fade in, slide up)
- Add hover effects to interactive elements
- Keep animations subtle and purposeful (200-400ms duration)
- Use `cubic-bezier` for smooth easing
- Respect `prefers-reduced-motion` for accessibility

### Data Management

- Store content in constants/data files
- Use TypeScript interfaces for data structures
- Make content easily editable
- Structure experience data with:
  - id, title, company, description, icon, tags

## Component Examples to Create

### Reusable Components

- `<Button />` - Primary, secondary, ghost variants
- `<Card />` - With glassmorphism, hover effects
- `<Section />` - Wrapper with grid background
- `<TechBadge />` - Animated tech stack item
- `<ExperienceCard />` - Work experience display
- `<PhaseCard />` - Approach phase display
- `<SocialLink />` - Social media icon link
- `<GridPattern />` - Decorative background grid
- `<AnimatedText />` - Text reveal animations

### Section Components

- `<HeroSection />` - Main hero with CTA
- `<AboutSection />` - Values and highlights
- `<TechStackSection />` - Technologies display
- `<ExperienceSection />` - Work history
- `<ApproachSection />` - Three-phase process
- `<ProjectsSection />` - Current work showcase
- `<ContactSection />` - CTA and contact info
- `<Footer />` - Links and copyright

## Content Guidelines

### Tone of Voice

- Professional yet approachable
- Confident and results-oriented
- Focus on impact and achievements
- Technical but accessible language
- Action-oriented CTAs

### Key Messages

- "Cloud Architect and Fullstack Developer"
- "Transforming raw ideas into thriving digital realities"
- "Partner with clients for strategic solutions"
- Emphasis on Fortune 500 and enterprise experience
- Focus on cloud migrations, modern architectures, DevOps

### Call-to-Actions

- "Show my work"
- "Let's get in touch"
- "Start a project together"
- "Explore my projects"
- "Contact me today"

## SEO & Performance

### Metadata

- Title: "Ernesto Cobos | Cloud Architect & Fullstack Developer"
- Description: Focus on cloud solutions, fullstack development, transforming ideas
- Open Graph images
- Structured data for professional profile

### Performance Targets

- Lighthouse score: 95+ for all metrics
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Cumulative Layout Shift: < 0.1
- Optimized images (WebP format, proper sizing)
- Minimal JavaScript bundle size

## Testing

- Test responsive design on all breakpoints
- Verify animations work smoothly
- Test all interactive elements (hover, click, scroll)
- Validate email copy functionality
- Check accessibility with screen readers
- Test on multiple browsers (Chrome, Firefox, Safari)

## Documentation

- Add JSDoc comments for complex functions
- Document component props with TypeScript interfaces
- Keep README updated with setup instructions
- Document animation implementation
- Note any third-party dependencies and their usage
