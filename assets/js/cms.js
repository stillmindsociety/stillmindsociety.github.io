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
    this.githubToken = null;
    this.githubConfig = {
      owner: 'stillmindsociety',
      repo: 'stillmindsociety.github.io',
      branch: 'main'
    };
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
      // Setup GitHub integration for authenticated users
      setTimeout(() => this.setupGitHubIntegration(), 1000);
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

        // Setup GitHub integration when user authenticates
        setTimeout(() => this.setupGitHubIntegration(), 1000);
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

    // Save to Firebase/Firestore
    if (this.db && this.isAuthenticated) {
      try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const docRef = doc(this.db, 'content', this.currentPage);

        await setDoc(docRef, {
          content: changes,
          lastModified: new Date().toISOString(),
          modifiedBy: localStorage.getItem('sms-admin-email'),
          timestamp: Date.now()
        }, { merge: true });
      } catch (error) {
        console.error('Failed to save to Firestore:', error);
      }
    }

    // Commit changes to GitHub
    await this.commitToGitHub(changes);

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

  // GitHub Integration Methods
  async setupGitHubIntegration() {
    // Check if GitHub token is stored
    this.githubToken = localStorage.getItem('sms-github-token');

    if (!this.githubToken && this.isAuthenticated) {
      this.promptForGitHubToken();
    }
  }

  promptForGitHubToken() {
    const modal = document.createElement('div');
    modal.className = 'modal open';
    modal.innerHTML = `
      <div class="modal__content">
        <h2>GitHub Integration Setup</h2>
        <p>To enable automatic commits, please provide a GitHub Personal Access Token:</p>
        
        <div class="form-group">
          <label for="github-token">GitHub Personal Access Token:</label>
          <input type="password" id="github-token" class="form-input" placeholder="ghp_...">
          <small>Token needs 'Contents' write permission for your repository</small>
        </div>
        
        <div class="cluster cluster--center mt-lg">
          <button onclick="window.cms.saveGitHubToken()" class="btn btn--primary">Save Token</button>
          <button onclick="window.cms.skipGitHubSetup()" class="btn btn--subtle">Skip for Now</button>
        </div>
        
        <div class="mt-lg">
          <details>
            <summary>How to create a GitHub token</summary>
            <ol class="mt-sm">
              <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
              <li>Generate new token (classic)</li>
              <li>Select "Contents" permission</li>
              <li>Copy the token and paste it above</li>
            </ol>
          </details>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  saveGitHubToken() {
    const tokenInput = document.getElementById('github-token');
    const token = tokenInput.value.trim();

    if (token) {
      this.githubToken = token;
      localStorage.setItem('sms-github-token', token);
      this.showSuccessMessage('GitHub token saved! Automatic commits enabled.');
      document.querySelector('.modal').remove();
    } else {
      this.showErrorMessage('Please enter a valid GitHub token');
    }
  }

  skipGitHubSetup() {
    document.querySelector('.modal').remove();
    this.showSuccessMessage('GitHub integration skipped. You can set it up later in settings.');
  }

  showGitHubSettings() {
    const hasToken = !!this.githubToken;
    const displayToken = this.githubToken || '';
    const modal = document.createElement('div');
    modal.className = 'modal open';
    modal.innerHTML = `
      <div class="modal__content">
        <button class="modal__close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        <h2>GitHub Integration Settings</h2>
        
        <div class="stack-lg">
          <div class="form-group">
            <label>Repository:</label>
            <p><strong>${this.githubConfig.owner}/${this.githubConfig.repo}</strong></p>
          </div>
          
          <div class="form-group">
            <label>Branch:</label>
            <p><strong>${this.githubConfig.branch}</strong></p>
          </div>
          
          <div class="form-group">
            <label>Status:</label>
            <p><strong>${hasToken ? '✅ Connected' : '❌ Not configured'}</strong></p>
          </div>
          
          <div class="form-group">
            <label for="github-token-settings">Current GitHub Personal Access Token:</label>
            <input type="text" id="github-token-settings" class="form-input" 
                   value="${displayToken}" 
                   placeholder="ghp_..." readonly>
            <small>This token has 'Contents' write permission for your repository</small>
          </div>
          
          <div class="form-group">
            <label for="github-token-new">Update Token:</label>
            <input type="password" id="github-token-new" class="form-input" 
                   placeholder="Enter new token to update">
            <small>Leave empty to keep current token</small>
          </div>
        </div>
        
        <div class="cluster cluster--center mt-lg">
          <button onclick="window.cms.updateGitHubToken()" class="btn btn--primary">
            ${hasToken ? 'Update Token' : 'Save Token'}
          </button>
          ${hasToken ? '<button onclick="window.cms.removeGitHubToken()" class="btn btn--danger">Remove Token</button>' : ''}
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn btn--subtle">Close</button>
        </div>
        
        <div class="mt-lg">
          <details>
            <summary>How to create a GitHub token</summary>
            <ol class="mt-sm">
              <li>Go to <a href="https://github.com/settings/tokens" target="_blank">GitHub Settings → Personal access tokens</a></li>
              <li>Click "Generate new token (classic)"</li>
              <li>Select "repo" scope (includes Contents permission)</li>
              <li>Copy the token and paste it above</li>
            </ol>
          </details>
        </div>
        
        <div class="mt-lg">
          <h3>How it works:</h3>
          <ul class="stack-sm">
            <li>When you save changes, they're committed to GitHub automatically</li>
            <li>Each commit includes details about what was changed and by whom</li>
            <li>Your GitHub Pages site will update automatically</li>
            <li>Full version history is maintained in your repository</li>
          </ul>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  updateGitHubToken() {
    const newTokenInput = document.getElementById('github-token-new');
    const newToken = newTokenInput.value.trim();

    if (newToken) {
      this.githubToken = newToken;
      localStorage.setItem('sms-github-token', newToken);
      this.showSuccessMessage('GitHub token updated! Automatic commits enabled.');
      document.querySelector('.modal').remove();
    } else if (!this.githubToken) {
      this.showErrorMessage('Please enter a GitHub token');
    } else {
      // No new token entered, just close modal
      document.querySelector('.modal').remove();
    }
  }

  removeGitHubToken() {
    if (confirm('Remove GitHub integration? You can always set it up again later.')) {
      this.githubToken = null;
      localStorage.removeItem('sms-github-token');
      this.showSuccessMessage('GitHub integration removed.');
      document.querySelector('.modal').remove();
    }
  }

  async commitToGitHub(changes) {
    if (!this.githubToken) {
      console.log('No GitHub token available, skipping commit');
      return;
    }

    try {
      const adminEmail = localStorage.getItem('sms-admin-email');
      const currentPageFile = this.currentPage === 'index' ? 'index.html' : `${this.currentPage}.html`;

      // Get current file content
      const fileContent = await this.getGitHubFileContent(currentPageFile);
      if (!fileContent) return;

      // Apply changes to HTML content
      const updatedContent = this.applyChangesToHTML(fileContent.content, changes);

      // Create commit
      await this.createGitHubCommit(currentPageFile, updatedContent, fileContent.sha, changes, adminEmail);

      this.showSuccessMessage('✨ Changes committed to GitHub successfully!');

    } catch (error) {
      console.error('GitHub commit failed:', error);
      this.showErrorMessage('Failed to commit to GitHub. Changes saved locally.');
    }
  }

  async getGitHubFileContent(filename) {
    try {
      const response = await fetch(`https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/${filename}`, {
        headers: {
          'Authorization': `Bearer ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: atob(data.content), // Decode base64
        sha: data.sha
      };
    } catch (error) {
      console.error('Failed to get GitHub file content:', error);
      return null;
    }
  }

  applyChangesToHTML(htmlContent, changes) {
    let updatedContent = htmlContent;

    // Apply each change to the HTML content
    Object.keys(changes).forEach(field => {
      const fieldValue = changes[field];

      // Find and replace content in data-field attributes
      const regex = new RegExp(`(<[^>]*data-field="${field}"[^>]*>)(.*?)(<\/[^>]+>)`, 'gms');
      updatedContent = updatedContent.replace(regex, `$1${fieldValue}$3`);
    });

    return updatedContent;
  }

  async createGitHubCommit(filename, content, sha, changes, authorEmail) {
    const changedFields = Object.keys(changes);
    const commitMessage = `Update ${this.currentPage} page content

Modified fields: ${changedFields.join(', ')}
Updated by: ${authorEmail}
Timestamp: ${new Date().toISOString()}

Changes made through CMS interface`;

    const response = await fetch(`https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: btoa(content), // Encode to base64
        sha: sha,
        branch: this.githubConfig.branch,
        committer: {
          name: 'CMS Auto-Commit',
          email: 'cms@stillmindsociety.com'
        },
        author: {
          name: authorEmail.split('@')[0],
          email: authorEmail
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub commit failed: ${error.message}`);
    }

    return await response.json();
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
