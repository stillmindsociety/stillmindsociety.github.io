# Still Mind Society Website

A production-ready static website for Still Mind Society, built with semantic HTML5, modern CSS, and minimal vanilla JavaScript. This site embodies our mission to restore balance in a world of constant stimulation through thoughtful design and intentional user experiences.

## 🎯 Project Overview

**Brand:** Still Mind Society  
**Mission:** Calmness, deliberately disrupted  
**Tech Stack:** HTML5 + CSS + Vanilla JS (no framework or build process)  
**Deployment:** GitHub Pages ready

## 📁 Project Structure

```
stillmindsociety.github.io/
├── index.html              # Homepage with hero, mission, and values
├── about.html              # Full brand story and philosophy
├── team.html               # Team member profiles
├── initiatives.html        # Current projects with interactive modals
├── contact.html            # Contact form and communication philosophy
├── 404.html                # Mindful error page
├── sitemap.xml             # SEO sitemap
├── robots.txt              # Search engine guidelines
├── README.md               # This file
├── assets/
│   ├── css/
│   │   └── style.css       # Complete design system with CSS variables
│   ├── js/
│   │   └── includes.js     # HTML partials, navigation, and utilities
│   ├── images/
│   │   ├── logo/           # Brand logo files (placeholder)
│   │   └── team/           # Team avatar images (placeholder)
│   ├── fonts/
│   │   └── geist/          # Geist font files (to be added)
│   ├── reusables/
│   │   ├── header.html     # Site header with navigation
│   │   └── footer.html     # Site footer with color palette
│   └── content/
│       └── brand.json      # Brand data for dynamic content
```

## 🚀 Quick Start

### 1. Local Development Server

Choose one of these options to run the site locally:

**Option A: Node.js (recommended)**
```bash
npx http-server . -p 8080 -o
```

**Option B: Python 3**
```bash
python3 -m http.server 8080
```

**Option C: PHP**
```bash
php -S localhost:8080
```

The site will be available at `http://localhost:8080`

### 2. GitHub Pages Deployment

1. Push all files to your GitHub repository
2. Go to repository Settings → Pages
3. Set source to "Deploy from a branch"
4. Select "main" branch and "/ (root)" folder
5. Save and wait for deployment

Your site will be available at `https://[username].github.io/[repository-name]/`

## 🎨 Design System

### Brand Colors
```css
--color-cyber-purple: #9D00FF  /* Futuristic creativity */
--color-neon-lime: #C6FF00     /* Shock of energy */
--color-bone-white: #F3F1ED    /* Clarity and calm */
--color-charcoal: #1A1A1A      /* Grounding stillness */
```

### Typography
- **Primary:** Geist (self-hosted variable font)
- **Fallbacks:** Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif
- **Fluid scales:** Uses `clamp()` for responsive typography

### Layout System
- **Container:** Max-width 1200px with responsive padding
- **Grid utilities:** `.grid-2`, `.grid-3`, `.grid-4` for responsive layouts
- **Spacing:** Fluid scale using CSS custom properties
- **Accessibility:** WCAG AA+ contrast, focus indicators, semantic HTML

## 📝 Content Management

### Editing Brand Data

Update `assets/content/brand.json` to change:
- Mission and vision statements
- Team member information
- Initiative details
- Contact information

The JavaScript will automatically load this data where marked with `data-brand-*` attributes.

### Adding New Pages

1. Create new HTML file in root directory
2. Copy structure from existing page
3. Update navigation in `assets/reusables/header.html`
4. Add to `sitemap.xml`

### Updating Team Members

Edit the `team` array in `assets/content/brand.json`:
```json
{
  "name": "New Member",
  "role": "Their Role",
  "bio": "Brief description of their work and philosophy.",
  "avatar": "N"
}
```

## 🔧 Customization Guide

### Changing Colors

Update CSS variables in `assets/css/style.css`:
```css
:root {
  --color-cyber-purple: #YOUR_COLOR;
  --color-neon-lime: #YOUR_COLOR;
  /* etc. */
}
```

### Replacing Fonts

1. Add font files to `assets/fonts/geist/`
2. Update `@font-face` declarations in `style.css`
3. Recommended files:
   - `GeistVF.woff2` (variable font)
   - `Geist-Regular.woff2` (fallback)

### Adding Logo

1. Replace SVG code in `assets/reusables/header.html`
2. Add logo files to `assets/images/logo/`
3. Update favicon references in HTML files

### Customizing Navigation

Edit `assets/reusables/header.html` to:
- Add/remove navigation links
- Update logo and branding
- Modify mobile menu structure

## 🧪 Features & Functionality

### HTML Includes System
- Automatically loads header and footer partials
- Maintains DRY principle for shared components
- Falls back gracefully if JavaScript is disabled

### Responsive Navigation
- Mobile-first hamburger menu
- Keyboard accessible
- Active page highlighting
- Progressive enhancement

### Modal System
- Initiative detail modals on initiatives page
- Keyboard accessible (Escape to close)
- Click outside to close
- Focus management

### Form Handling
- Client-side validation
- Accessible error states
- Email fallback for contact form
- Ready for backend integration

### Performance Optimizations
- Font preloading
- Lazy loading for images
- CSS `content-visibility` for performance
- Minimal JavaScript footprint

## 🌐 Browser Support

- **Modern browsers:** Full functionality
- **Legacy browsers:** Graceful degradation
- **JavaScript disabled:** Core content remains accessible
- **Accessibility:** WCAG AA+ compliant

## 📊 SEO & Meta

### Included Features
- Open Graph tags for social sharing
- Twitter Card meta tags
- JSON-LD structured data
- Semantic HTML structure
- Optimized meta descriptions
- Canonical URLs

### Performance Targets
- **Lighthouse scores:** 90+ in all categories
- **Core Web Vitals:** Optimized for LCP, FID, CLS
- **Image optimization:** Lazy loading with placeholders

## 🔍 Development Notes

### File Organization
- **No build process required** - works with any static hosting
- **Progressive enhancement** - JavaScript adds features but isn't required
- **Semantic HTML** - Screen reader and SEO friendly
- **CSS-first** - Utility classes supplement semantic styles

### Accessibility Features
- Skip navigation link
- Proper heading hierarchy
- ARIA labels where needed
- Keyboard focus indicators
- Sufficient color contrast
- Reduced motion support

### Code Quality
- **HTML:** Valid HTML5, semantic elements
- **CSS:** Custom properties, logical property names
- **JavaScript:** ES6+, error handling, progressive enhancement

## 🚀 Deployment Options

### GitHub Pages (Recommended)
- Free hosting for public repositories
- Automatic SSL certificate
- Custom domain support
- No configuration required

### Netlify
1. Connect GitHub repository
2. Build settings: Leave empty (static site)
3. Publish directory: `/` (root)
4. Enable form handling for contact form

### Other Static Hosts
- Vercel
- Surge.sh
- Firebase Hosting
- Any web server with static file serving

## 📋 TODO / Next Steps

### Immediate Tasks
1. **Add actual font files** to `assets/fonts/geist/`
2. **Create team avatar images** for `assets/images/team/`
3. **Design and add logo files** to `assets/images/logo/`
4. **Add favicon.ico** to root directory
5. **Take screenshots** for social media meta images

### Future Enhancements
- Newsletter signup integration
- Blog/articles section
- Multilingual support
- Advanced analytics (privacy-focused)
- Contact form backend integration
- A11y testing with real users

## 🤝 Contributing

This website embodies Still Mind Society's values:
- **Intentional design** over attention-grabbing patterns
- **Accessibility first** approach to inclusive design
- **Performance consciousness** respecting user bandwidth and devices
- **Semantic markup** for machines and humans alike
- **Progressive enhancement** ensuring core functionality always works

## 📄 License

This website serves as the digital home for Still Mind Society. Feel free to use the design patterns and accessibility approaches as inspiration for your own projects that prioritize human wellbeing over engagement metrics.

---

**Built with intention, not just attention.**  
*Still Mind Society - Calmness, deliberately disrupted.*
