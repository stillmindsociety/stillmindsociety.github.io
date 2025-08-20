/**
 * Still Mind Society - JavaScript Utilities
 * Handles HTML includes, navigation highlighting, and mobile menu
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

// Mobile Navigation Toggle
function initMobileNav() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('open');
      navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', !isOpen);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }
}

// Modal System
function initModals() {
  const modalTriggers = document.querySelectorAll('[data-modal]');
  const modals = document.querySelectorAll('.modal');

  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = trigger.getAttribute('data-modal');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('open');
        modal.querySelector('.modal__close')?.focus();
      }
    });
  });

  modals.forEach(modal => {
    const closeBtn = modal.querySelector('.modal__close');

    closeBtn?.addEventListener('click', () => {
      modal.classList.remove('open');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });

    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modal.classList.remove('open');
      }
    });
  });
}

// Lazy Loading for Images
function initLazyLoading() {
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => {
      img.classList.add('lazy-load');
      imageObserver.observe(img);
    });
  } else {
    // Fallback for browsers without IntersectionObserver
    lazyImages.forEach(img => img.classList.add('loaded'));
  }
}

// Form Enhancement
function initForms() {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    // Basic client-side validation
    form.addEventListener('submit', (e) => {
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          field.classList.add('error');
          isValid = false;
        } else {
          field.classList.remove('error');
        }
      });

      // Email validation
      const emailFields = form.querySelectorAll('input[type="email"]');
      emailFields.forEach(field => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (field.value && !emailRegex.test(field.value)) {
          field.classList.add('error');
          isValid = false;
        } else {
          field.classList.remove('error');
        }
      });

      if (!isValid) {
        e.preventDefault();
        // Focus first error field
        const firstError = form.querySelector('.error');
        if (firstError) {
          firstError.focus();
        }
      }
    });
  });
}

// Smooth Scrolling for Internal Links
function initSmoothScrolling() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Load Brand Data
async function loadBrandData() {
  try {
    const response = await fetch('/assets/content/brand.json');
    if (response.ok) {
      const brandData = await response.json();

      // Update dynamic content
      document.querySelectorAll('[data-brand-mission]').forEach(el => {
        el.textContent = brandData.mission;
      });

      document.querySelectorAll('[data-brand-vision]').forEach(el => {
        el.textContent = brandData.vision;
      });

      return brandData;
    }
  } catch (error) {
    console.warn('Brand data not available:', error);
  }
  return null;
}

// Initialize Everything
async function init() {
  // Load includes first
  await loadIncludes();

  // Then initialize other features
  highlightActiveNav();
  initMobileNav();
  initModals();
  initLazyLoading();
  initForms();
  initSmoothScrolling();

  // Load brand data (progressive enhancement)
  await loadBrandData();

  // Add loaded class to body for CSS hooks
  document.body.classList.add('js-loaded');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export functions for potential external use
window.StillMind = {
  loadIncludes,
  highlightActiveNav,
  initMobileNav,
  initModals,
  loadBrandData
};
