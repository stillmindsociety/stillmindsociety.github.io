// Still Mind Society - Real-time Content Management System with Authentication
// This provides real-time synchronization of editable content across all users
// Only authenticated admins can access edit mode

class RealTimeCMS {
  constructor() {
    this.db = null;
    this.currentPage = this.getCurrentPageId();
    this.cmsMode = false;
    this.originalContent = {};
    this.listeners = new Map();
    this.isAuthenticated = false;
    this.initFirebase();
  }

  getCurrentPageId() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page.replace('.html', '');
  }

  async initFirebase() {
    try {
      // Check localStorage for authentication state
      this.checkAuthState();

      // Initialize Firebase with real configuration
      await this.setupFirebaseAuth();

      // Setup real-time content sync
      this.setupContentSync();

    } catch (error) {
      console.warn('Firebase not available, falling back to localStorage', error);
      this.fallbackToLocalStorage();
    }
  }

  checkAuthState() {
    const authState = localStorage.getItem('sms-admin-auth');
    const adminEmail = localStorage.getItem('sms-admin-email');

    this.isAuthenticated = authState === 'true' && adminEmail;

    if (this.isAuthenticated) {
      this.showAuthenticatedUI();
    } else {
      this.hideAuthenticatedUI();
    }
  }

  async setupFirebaseAuth() {
    // Import Firebase modules dynamically
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const { getFirestore, doc, setDoc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyDgmFs7cZamd_Jhm6rxqGyWtMm93FtXGac",
      authDomain: "stillmindsociety-demo.firebaseapp.com",
      projectId: "stillmindsociety-demo",
      storageBucket: "stillmindsociety-demo.firebasestorage.app",
      messagingSenderId: "245043767644",
      appId: "1:245043767644:web:3c13e23ae967e25357b999",
      measurementId: "G-62LBBFJQS1"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);
    this.db = getFirestore(app);

    // Listen for auth state changes
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.isAuthenticated = true;
        localStorage.setItem('sms-admin-auth', 'true');
        localStorage.setItem('sms-admin-email', user.email);
        this.showAuthenticatedUI();
      } else {
        this.isAuthenticated = false;
        localStorage.removeItem('sms-admin-auth');
        localStorage.removeItem('sms-admin-email');
        this.hideAuthenticatedUI();
        // Exit edit mode if user signs out
        if (this.cmsMode) {
          this.toggleCMSMode();
        }
      }
    });
  }

  setupContentSync() {
    // Setup real-time content sync for ALL users (not just admins)
    if (this.db) {
      this.setupFirebaseSync();
    } else {
      this.setupDemoAPI();
    }

    // Always load initial content for all users
    this.loadSavedContent();
  }

  async setupFirebaseSync() {
    try {
      const { onSnapshot, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const docRef = doc(this.db, 'content', this.currentPage);

      // Listen for real-time updates - this works for ALL users
      onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const content = data.content || {};

          // Only apply updates if they're newer than our last save
          const lastModified = data.timestamp || 0;
          const ourLastSave = parseInt(localStorage.getItem(`sms-${this.currentPage}-lastSave`) || '0');

          if (lastModified > ourLastSave) {
            this.handleRemoteUpdate(content);
            localStorage.setItem(`sms-${this.currentPage}-lastSave`, lastModified.toString());
          }
        }
      }, (error) => {
        console.error('Firebase sync error:', error);
        this.setupDemoAPI(); // Fallback to BroadcastChannel
      });

    } catch (error) {
      console.warn('Firebase real-time sync not available, using fallback');
      this.setupDemoAPI();
    }
  }

  setupDemoAPI() {
    // Simulates a real-time database using localStorage + BroadcastChannel
    // This works for ALL users in the same browser session
    this.channel = new BroadcastChannel('sms-content-sync');
    this.channel.addEventListener('message', (event) => {
      if (event.data.type === 'content-update' && event.data.page === this.currentPage) {
        this.handleRemoteUpdate(event.data.changes);

        // Show update notification to all users
        this.showUpdateIndicator();
      }

      if (event.data.type === 'content-reset' && event.data.page === this.currentPage) {
        // Reload page content when admin resets
        location.reload();
      }
    });
  }

  fallbackToLocalStorage() {
    // Fallback to localStorage only
    this.loadSavedContent();
  }

  showAuthenticatedUI() {
    // Show CMS toggle button only to authenticated users
    const cmsToggle = document.querySelector('.cms-toggle');
    if (cmsToggle) {
      cmsToggle.style.display = 'block';
      cmsToggle.title = 'Toggle Edit Mode (Admin)';
    }

    // Show admin indicator in toolbar
    const toolbar = document.getElementById('cms-toolbar');
    if (toolbar && !toolbar.querySelector('.admin-indicator')) {
      const adminEmail = localStorage.getItem('sms-admin-email');
      const indicator = document.createElement('div');
      indicator.className = 'admin-indicator';
      indicator.innerHTML = `<small>👤 ${adminEmail}</small>`;
      indicator.style.cssText = 'margin-bottom: 10px; color: var(--accent-2);';
      toolbar.insertBefore(indicator, toolbar.firstChild);
    }
  }

  hideAuthenticatedUI() {
    // Hide CMS toggle button from non-authenticated users
    const cmsToggle = document.querySelector('.cms-toggle');
    if (cmsToggle) {
      cmsToggle.style.display = 'none';
    }

    // Hide CMS toolbar
    const toolbar = document.getElementById('cms-toolbar');
    if (toolbar) {
      toolbar.classList.remove('active');
    }

    // Remove admin indicator
    const adminIndicator = document.querySelector('.admin-indicator');
    if (adminIndicator) {
      adminIndicator.remove();
    }
  }

  toggleCMSMode() {
    // Check authentication before allowing edit mode
    if (!this.isAuthenticated) {
      this.showLoginPrompt();
      return;
    }

    this.cmsMode = !this.cmsMode;
    const body = document.body;
    const toolbar = document.getElementById('cms-toolbar');
    const editables = document.querySelectorAll('.editable');

    if (this.cmsMode) {
      body.classList.add('cms-mode-active');
      toolbar.classList.add('active');

      // Store original content and enable editing
      editables.forEach(el => {
        const field = el.dataset.field;
        this.originalContent[field] = el.innerHTML;
        el.contentEditable = true;
        el.classList.add('editable-active');
      });

      // Show edit indicators
      this.showEditIndicators(editables);
      this.showSuccessMessage('Edit mode activated! Make your changes and click "Save Changes" to save.');
    } else {
      body.classList.remove('cms-mode-active');
      toolbar.classList.remove('active');

      editables.forEach(el => {
        el.contentEditable = false;
        el.classList.remove('editable-active');
      });

      this.hideEditIndicators(editables);
      this.showSuccessMessage('Edit mode deactivated.');
    }
  }

  showLoginPrompt() {
    const loginModal = document.createElement('div');
    loginModal.className = 'modal open';
    loginModal.innerHTML = `
      <div class="modal__content">
        <button class="modal__close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        <h2>Authentication Required</h2>
        <p>You need to be signed in as an admin to access edit mode.</p>
        <div class="cluster cluster--center mt-xl">
          <a href="login.html" class="btn btn--primary">Sign In</a>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn btn--subtle">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(loginModal);
  }

  addInputListener(element) {
    // Remove auto-save functionality - no longer adding input listeners
    // Content will only save when user clicks "Save Changes" button
  }

  removeInputListener(element) {
    // Remove auto-save functionality - no longer removing input listeners
    // since we're not adding them in the first place
  }

  async saveField(field, content) {
    try {
      const timestamp = Date.now();
      localStorage.setItem(`sms-${this.currentPage}-lastSave`, timestamp.toString());

      // Save to remote database
      await this.saveToRemote(field, content);

      // Broadcast change to other tabs/users
      if (this.channel) {
        this.channel.postMessage({
          type: 'content-update',
          page: this.currentPage,
          changes: { [field]: content },
          timestamp: timestamp,
          author: localStorage.getItem('sms-admin-email')
        });
      }

      // Visual feedback
      this.showSaveIndicator(field);

    } catch (error) {
      console.error('Failed to save field:', error);
      this.showErrorIndicator(field);
    }
  }

  async saveToRemote(field, content) {
    const key = `sms-${this.currentPage}-content`;

    try {
      // Get existing content
      const existingContent = JSON.parse(localStorage.getItem(key) || '{}');
      existingContent[field] = content;

      // Save to localStorage first (immediate backup)
      localStorage.setItem(key, JSON.stringify(existingContent));

      // If Firebase is available, save to Firestore
      if (this.db && this.isAuthenticated) {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const docRef = doc(this.db, 'content', this.currentPage);

        await setDoc(docRef, {
          content: existingContent,
          lastModified: new Date().toISOString(),
          modifiedBy: localStorage.getItem('sms-admin-email'),
          timestamp: Date.now()
        }, { merge: true });

        console.log('Content saved to Firebase successfully');
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error('Failed to save content:', error);
      throw error;
    }
  }

  async savePage() {
    const editables = document.querySelectorAll('.editable');
    const changes = {};

    editables.forEach(el => {
      const field = el.dataset.field;
      changes[field] = el.innerHTML;
    });

    try {
      await this.saveAllChanges(changes);
      this.showSuccessMessage('All changes saved successfully!');
    } catch (error) {
      console.error('Failed to save page:', error);
      this.showErrorMessage('Failed to save changes. Please try again.');
    }
  }

  async saveAllChanges(changes) {
    const key = `sms-${this.currentPage}-content`;
    localStorage.setItem(key, JSON.stringify(changes));

    // Broadcast to other users
    if (this.channel) {
      this.channel.postMessage({
        type: 'content-update',
        page: this.currentPage,
        changes: changes,
        timestamp: Date.now()
      });
    }
  }

  resetPage() {
    if (confirm('Reset all changes to original content? This will affect all users.')) {
      const editables = document.querySelectorAll('.editable');

      editables.forEach(el => {
        const field = el.dataset.field;
        if (this.originalContent[field]) {
          el.innerHTML = this.originalContent[field];
        }
      });

      // Clear remote storage
      const key = `sms-${this.currentPage}-content`;
      localStorage.removeItem(key);

      // Broadcast reset to other users
      if (this.channel) {
        this.channel.postMessage({
          type: 'content-reset',
          page: this.currentPage,
          timestamp: Date.now()
        });
      }

      this.showSuccessMessage('Page reset to original content');
    }
  }

  loadSavedContent() {
    const key = `sms-${this.currentPage}-content`;
    const saved = localStorage.getItem(key);

    if (saved) {
      try {
        const changes = JSON.parse(saved);
        this.applyChanges(changes);
      } catch (error) {
        console.error('Failed to load saved content:', error);
      }
    }
  }

  applyChanges(changes) {
    Object.keys(changes).forEach(field => {
      const element = document.querySelector(`[data-field="${field}"]`);
      if (element && changes[field] !== undefined) {
        element.innerHTML = changes[field];
      }
    });
  }

  handleRemoteUpdate(changes) {
    // Don't apply changes if we're currently in edit mode to prevent conflicts
    if (this.cmsMode) {
      return;
    }

    // Apply changes from other users
    this.applyChanges(changes);

    // Only show update notification to non-admin users
    if (!this.isAuthenticated) {
      this.showUpdateIndicator();
    }
  }

  showEditIndicators(editables) {
    editables.forEach(el => {
      if (!el.querySelector('.edit-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'edit-indicator';
        indicator.innerHTML = '✏️';
        el.appendChild(indicator);
      }
    });
  }

  hideEditIndicators(editables) {
    editables.forEach(el => {
      const indicator = el.querySelector('.edit-indicator');
      if (indicator) {
        indicator.remove();
      }
    });
  }

  showSaveIndicator(field) {
    const element = document.querySelector(`[data-field="${field}"]`);
    if (element) {
      this.showTemporaryIndicator(element, '💾', 'Saved');
    }
  }

  showErrorIndicator(field) {
    const element = document.querySelector(`[data-field="${field}"]`);
    if (element) {
      this.showTemporaryIndicator(element, '❌', 'Save failed');
    }
  }

  showUpdateIndicator() {
    this.showTemporaryMessage('🔄 Content updated by another user', 'info');
  }

  showTemporaryIndicator(element, icon, message) {
    const indicator = document.createElement('div');
    indicator.className = 'temp-indicator';
    indicator.innerHTML = `${icon} ${message}`;
    indicator.style.cssText = `
      position: absolute;
      top: -30px;
      right: 0;
      background: var(--accent);
      color: var(--bg);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1001;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    element.style.position = 'relative';
    element.appendChild(indicator);

    // Animate in
    setTimeout(() => indicator.style.opacity = '1', 10);

    // Remove after delay
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.opacity = '0';
        setTimeout(() => {
          if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
          }
        }, 300);
      }
    }, 2000);
  }

  showSuccessMessage(message) {
    this.showTemporaryMessage(message, 'success');
  }

  showErrorMessage(message) {
    this.showTemporaryMessage(message, 'error');
  }

  showTemporaryMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100%);
      background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : 'var(--accent)'};
      color: ${type === 'error' || type === 'success' ? '#000' : 'var(--bg)'};
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      opacity: 0;
      transition: all 0.3s ease;
      white-space: nowrap;
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    // Remove after delay
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(100%)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }, 4000);
  }

  // Utility method for debouncing
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize CMS when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.cms = new RealTimeCMS();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RealTimeCMS;
}
