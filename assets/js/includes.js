/**
 * Still Mind Society - Enhanced JavaScript with Content Management System
 * Handles HTML includes, navigation, and inline content editing
 */

// Global state
let isEditMode = false;
let editedContent = {};

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

// Content Management System
function initContentManagement() {
  createCMSInterface();
  makeContentEditable();
  setupAutoSave();
}

function createCMSInterface() {
  // Create CMS toggle button
  const cmsToggle = document.createElement('button');
  cmsToggle.className = 'cms-toggle';
  cmsToggle.innerHTML = '✏️';
  cmsToggle.title = 'Toggle Edit Mode';
  cmsToggle.setAttribute('aria-label', 'Toggle content editing mode');

  cmsToggle.addEventListener('click', toggleEditMode);
  document.body.appendChild(cmsToggle);

  // Create CMS toolbar
  const cmsToolbar = document.createElement('div');
  cmsToolbar.className = 'cms-toolbar';
  cmsToolbar.innerHTML = `
    <div class="stack-sm">
      <h3 style="margin: 0; color: var(--accent);">Content Editor</h3>
      <div class="cluster--center" style="gap: var(--space-sm);">
        <button class="btn btn--ghost" onclick="saveAllChanges()">💾 Save</button>
        <button class="btn btn--ghost" onclick="exportContent()">📤 Export</button>
        <button class="btn btn--ghost" onclick="resetContent()">🔄 Reset</button>
      </div>
      <p style="font-size: var(--font-size-sm); opacity: 0.8; margin: 0;">
        Click any text to edit. Changes save automatically.
      </p>
    </div>
  `;

  document.body.appendChild(cmsToolbar);
}

function makeContentEditable() {
  // Add editable class to key content areas
  const editableSelectors = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p:not(.btn):not([class*="meta"])',
    '.hero__subtitle',
    '.card h3',
    '.card p',
    '.team-card__name',
    '.team-card__role',
    '.color-chip__label',
    '.form-label',
    'blockquote',
    'li:not(.nav-links li)'
  ];

  editableSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      // Skip elements that are already interactive or shouldn't be edited
      if (element.closest('.btn') ||
          element.closest('.nav-links') ||
          element.closest('.cms-toolbar') ||
          element.closest('.modal__close') ||
          element.querySelector('button') ||
          element.querySelector('input') ||
          element.querySelector('select') ||
          element.querySelector('textarea')) {
        return;
      }

      element.classList.add('editable');
      element.setAttribute('data-original', element.innerHTML);

      // Add edit indicator
      const indicator = document.createElement('span');
      indicator.className = 'edit-indicator';
      indicator.innerHTML = '✏️';
      element.style.position = 'relative';
      element.appendChild(indicator);
    });
  });
}

function toggleEditMode() {
  isEditMode = !isEditMode;
  const toolbar = document.querySelector('.cms-toolbar');
  const toggle = document.querySelector('.cms-toggle');

  if (isEditMode) {
    document.body.classList.add('cms-mode-active');
    toolbar.classList.add('active');
    toggle.innerHTML = '👁️';
    toggle.title = 'Exit Edit Mode';
    enableEditing();
  } else {
    document.body.classList.remove('cms-mode-active');
    toolbar.classList.remove('active');
    toggle.innerHTML = '✏️';
    toggle.title = 'Toggle Edit Mode';
    disableEditing();
  }
}

function enableEditing() {
  document.querySelectorAll('.editable').forEach(element => {
    element.contentEditable = true;
    element.addEventListener('input', handleContentChange);
    element.addEventListener('blur', saveContentChange);
    element.addEventListener('keydown', handleEditKeydown);
  });
}

function disableEditing() {
  document.querySelectorAll('.editable').forEach(element => {
    element.contentEditable = false;
    element.removeEventListener('input', handleContentChange);
    element.removeEventListener('blur', saveContentChange);
    element.removeEventListener('keydown', handleEditKeydown);
  });
}

function handleContentChange(e) {
  const element = e.target;
  const key = generateElementKey(element);
  editedContent[key] = element.innerHTML;

  // Mark as changed
  element.style.borderColor = 'var(--accent-2)';
}

function handleEditKeydown(e) {
  // Save on Ctrl+S or Cmd+S
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveContentChange(e);
  }

  // Exit editing on Escape
  if (e.key === 'Escape') {
    e.target.blur();
  }
}

function saveContentChange(e) {
  const element = e.target;
  const key = generateElementKey(element);

  // Save to localStorage
  const savedContent = JSON.parse(localStorage.getItem('stillmind-content') || '{}');
  savedContent[key] = element.innerHTML;
  localStorage.setItem('stillmind-content', JSON.stringify(savedContent));

  // Visual feedback
  element.style.borderColor = 'var(--accent)';
  setTimeout(() => {
    element.style.borderColor = '';
  }, 1000);

  showNotification('Content saved!', 'success');
}

function generateElementKey(element) {
  // Generate a unique key for the element based on its position and content
  const tagName = element.tagName.toLowerCase();
  const textContent = element.textContent.trim().substring(0, 20);
  const parent = element.parentElement?.tagName.toLowerCase() || 'body';
  const index = Array.from(element.parentElement?.children || []).indexOf(element);

  return `${parent}-${tagName}-${index}-${textContent.replace(/\s+/g, '-')}`;
}

function loadSavedContent() {
  const savedContent = JSON.parse(localStorage.getItem('stillmind-content') || '{}');

  Object.entries(savedContent).forEach(([key, content]) => {
    // Try to find the element and restore its content
    document.querySelectorAll('.editable').forEach(element => {
      if (generateElementKey(element) === key) {
        element.innerHTML = content;
      }
    });
  });
}

function saveAllChanges() {
  const allContent = {};

  document.querySelectorAll('.editable').forEach(element => {
    const key = generateElementKey(element);
    allContent[key] = element.innerHTML;
  });

  localStorage.setItem('stillmind-content', JSON.stringify(allContent));
  showNotification('All changes saved!', 'success');
}

function exportContent() {
  const allContent = {};

  document.querySelectorAll('.editable').forEach(element => {
    const key = generateElementKey(element);
    allContent[key] = {
      content: element.innerHTML,
      original: element.getAttribute('data-original'),
      selector: generateElementSelector(element)
    };
  });

  const dataStr = JSON.stringify(allContent, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});

  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = 'stillmind-content-export.json';
  link.click();

  showNotification('Content exported!', 'success');
}

function generateElementSelector(element) {
  const path = [];
  let current = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className) {
      const classes = current.className.split(' ').filter(c => c && !c.startsWith('editable'));
      if (classes.length) {
        selector += `.${classes.join('.')}`;
      }
    }

    const siblings = Array.from(current.parentElement?.children || [])
      .filter(el => el.tagName === current.tagName);

    if (siblings.length > 1) {
      const index = siblings.indexOf(current) + 1;
      selector += `:nth-of-type(${index})`;
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

function resetContent() {
  if (confirm('Reset all content to original? This cannot be undone.')) {
    document.querySelectorAll('.editable').forEach(element => {
      element.innerHTML = element.getAttribute('data-original');
    });

    localStorage.removeItem('stillmind-content');
    showNotification('Content reset to original!', 'info');
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.innerHTML = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface-elevated);
    border: 2px solid var(--border);
    color: var(--text);
    padding: var(--space-md) var(--space-lg);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-xl);
    z-index: 1001;
    transition: all var(--transition-smooth);
  `;

  if (type === 'success') {
    notification.style.borderColor = 'var(--accent-2)';
  } else if (type === 'error') {
    notification.style.borderColor = '#ff4444';
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function setupAutoSave() {
  // Auto-save every 30 seconds when in edit mode
  setInterval(() => {
    if (isEditMode && Object.keys(editedContent).length > 0) {
      saveAllChanges();
      editedContent = {};
    }
  }, 30000);
}

// Enhanced Modal System
function initModals() {
  const modalTriggers = document.querySelectorAll('[data-modal]');
  const modals = document.querySelectorAll('.modal');

  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = trigger.getAttribute('data-modal');
      const modal = document.getElementById(modalId);
      if (modal) {
        openModal(modal);
      }
    });
  });

  modals.forEach(modal => {
    const closeBtn = modal.querySelector('.modal__close');

    closeBtn?.addEventListener('click', () => closeModal(modal));

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });

    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal(modal);
      }
    });
  });
}

function openModal(modal) {
  modal.classList.add('open');
  modal.querySelector('.modal__close')?.focus();
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

// Enhanced Form Handling
function initForms() {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          field.classList.add('error');
          field.style.borderColor = '#ff4444';
          isValid = false;
        } else {
          field.classList.remove('error');
          field.style.borderColor = '';
        }
      });

      // Enhanced email validation
      const emailFields = form.querySelectorAll('input[type="email"]');
      emailFields.forEach(field => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (field.value && !emailRegex.test(field.value)) {
          field.classList.add('error');
          field.style.borderColor = '#ff4444';
          isValid = false;
        } else {
          field.classList.remove('error');
          field.style.borderColor = '';
        }
      });

      if (!isValid) {
        e.preventDefault();
        const firstError = form.querySelector('.error');
        if (firstError) {
          firstError.focus();
          showNotification('Please correct the highlighted fields', 'error');
        }
      } else {
        showNotification('Form submitted successfully!', 'success');
      }
    });

    // Real-time validation
    form.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('blur', () => {
        if (field.hasAttribute('required') && !field.value.trim()) {
          field.style.borderColor = '#ff4444';
        } else if (field.type === 'email' && field.value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          field.style.borderColor = emailRegex.test(field.value) ? 'var(--accent)' : '#ff4444';
        } else if (field.value) {
          field.style.borderColor = 'var(--accent)';
        } else {
          field.style.borderColor = '';
        }
      });
    });
  });
}

// Enhanced Lazy Loading
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
    }, { rootMargin: '50px' });

    lazyImages.forEach(img => {
      img.classList.add('lazy-load');
      imageObserver.observe(img);
    });
  } else {
    lazyImages.forEach(img => img.classList.add('loaded'));
  }
}

// Smooth Scrolling Enhancement
function initSmoothScrolling() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        e.preventDefault();
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const offsetTop = targetElement.offsetTop - headerHeight - 20;

        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
}

// Load Brand Data with Enhanced Error Handling
async function loadBrandData() {
  try {
    const response = await fetch('/assets/content/brand.json');
    if (response.ok) {
      const brandData = await response.json();

      // Update dynamic content
      document.querySelectorAll('[data-brand-mission]').forEach(el => {
        if (el.classList.contains('editable')) {
          el.setAttribute('data-original', brandData.mission);
        }
        el.textContent = brandData.mission;
      });

      document.querySelectorAll('[data-brand-vision]').forEach(el => {
        if (el.classList.contains('editable')) {
          el.setAttribute('data-original', brandData.vision);
        }
        el.textContent = brandData.vision;
      });

      return brandData;
    }
  } catch (error) {
    console.warn('Brand data not available:', error);
  }
  return null;
}

// Enhanced Initialization
async function init() {
  // Load includes first
  await loadIncludes();

  // Initialize core features
  highlightActiveNav();
  initMobileNav();
  initHeaderScroll();
  initModals();
  initLazyLoading();
  initForms();
  initSmoothScrolling();

  // Load brand data
  await loadBrandData();

  // Initialize content management system
  initContentManagement();

  // Load any saved content
  loadSavedContent();

  // Add loaded class for CSS hooks
  document.body.classList.add('js-loaded');

  // Show welcome message for first-time visitors
  if (!localStorage.getItem('stillmind-visited')) {
    setTimeout(() => {
      showNotification('Welcome to Still Mind Society! Click the edit button to customize content.', 'info');
      localStorage.setItem('stillmind-visited', 'true');
    }, 2000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export functions for external use
window.StillMind = {
  loadIncludes,
  highlightActiveNav,
  initMobileNav,
  initModals,
  loadBrandData,
  toggleEditMode,
  saveAllChanges,
  exportContent,
  resetContent,
  showNotification
};
