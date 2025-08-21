/**
 * Still Mind Society - Enhanced JavaScript
 * Handles HTML includes, navigation, and basic functionality
 */

// HTML Includes System
async function loadIncludes() {
  const includeElements = document.querySelectorAll('[data-include]');

  for (const element of includeElements) {
    const src = element.getAttribute('data-include');
    try {
      const response = await fetch(src);
      if (response.ok) {
        const html = await response.text();
        element.innerHTML = html;
      } else {
        console.warn(`Failed to load include: ${src}`);
      }
    } catch (error) {
      console.warn(`Error loading include ${src}:`, error);
    }
  }
}

// Navigation Active State
function highlightActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-links a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage ||
        (currentPage === '' && href === 'index.html') ||
        (currentPage === 'index.html' && href === '/')) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

// Enhanced Mobile Navigation
function initMobileNav() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('open');
      navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', !isOpen);

      // Update hamburger icon
      navToggle.innerHTML = isOpen ? '☰' : '✕';
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.innerHTML = '☰';
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.innerHTML = '☰';
        navToggle.focus();
      }
    });
  }
}

// Enhanced Header Scroll Effect
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 50) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }

    lastScrollY = currentScrollY;
  });
}

// Performance Optimization
function initLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy-load');
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for older browsers
    images.forEach(img => {
      img.src = img.dataset.src;
      img.classList.remove('lazy-load');
      img.classList.add('loaded');
    });
  }
}

// Smooth Scroll for Anchor Links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Form Enhancement
function initFormEnhancements() {
  // Check if we're on the contact page and show success message if needed
  if (window.location.pathname.includes('contact.html') && window.location.search.includes('sent=true')) {
    const successMessage = document.getElementById('form-success');
    const contactForm = document.getElementById('contact-form');
    if (successMessage) {
      successMessage.style.display = 'block';
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (contactForm) {
      contactForm.style.display = 'none';
    }
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    // Add loading states to submit buttons
    form.addEventListener('submit', function() {
      const submitBtn = this.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';

        // Reset after 3 seconds in case form doesn't redirect
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }, 3000);
      }
    });

    // Enhanced validation feedback
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('invalid', function() {
        this.classList.add('error');
      });

      input.addEventListener('input', function() {
        if (this.checkValidity()) {
          this.classList.remove('error');
        }
      });
    });
  });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Load includes first
  await loadIncludes();

  // Then initialize other features
  highlightActiveNav();
  initMobileNav();
  initHeaderScroll();
  initLazyLoading();
  initSmoothScroll();
  initFormEnhancements();

  // Dispatch custom event to signal includes are loaded
  document.dispatchEvent(new CustomEvent('includesLoaded'));
});

// Export functions for external use
window.loadIncludes = loadIncludes;
window.highlightActiveNav = highlightActiveNav;
