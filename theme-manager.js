// Theme Manager
// Handles theme switching between dark and bright modes

class ThemeManager {
    constructor() {
        this.currentTheme = null;
        this.init();
    }

    async init() {
        // Load theme from main process (which uses localStorage)
        await this.loadTheme();

        // Apply the saved theme on load
        this.applyTheme(this.currentTheme, false); // Don't broadcast on initial load

        // Set up the toggle button
        this.setupToggleButton();

        // Update the icon based on current theme
        this.updateIcon();

        // Listen for theme changes from other windows
        this.setupThemeListener();
    }

    async loadTheme() {
        // Try to get theme from Electron API first (synced across windows)
        if (window.electronAPI && window.electronAPI.getTheme) {
            try {
                this.currentTheme = await window.electronAPI.getTheme();
            } catch (err) {
                console.warn('Failed to load theme from IPC, using localStorage:', err);
                this.currentTheme = localStorage.getItem('theme') || 'dark';
            }
        } else {
            // Fallback to localStorage if running outside Electron
            this.currentTheme = localStorage.getItem('theme') || 'dark';
        }
        return this.currentTheme;
    }

    saveTheme(theme) {
        // Save to localStorage
        localStorage.setItem('theme', theme);

        // Notify main process to sync with other windows
        if (window.electronAPI && window.electronAPI.setTheme) {
            window.electronAPI.setTheme(theme).catch(err => {
                console.warn('Failed to sync theme via IPC:', err);
            });
        }
    }

    applyTheme(theme, shouldBroadcast = true) {
        if (theme === 'bright') {
            document.documentElement.classList.add('bright-theme');
        } else {
            document.documentElement.classList.remove('bright-theme');
        }
        this.currentTheme = theme;

        if (shouldBroadcast) {
            this.saveTheme(theme);
        } else {
            // Just save to localStorage without broadcasting
            localStorage.setItem('theme', theme);
        }

        // Trigger a custom event for components that need to redraw (like canvas)
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: theme } }));
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'bright' : 'dark';
        this.applyTheme(newTheme, true); // Broadcast to other windows
        this.updateIcon();
    }

    setupThemeListener() {
        // Listen for theme changes from other windows via IPC
        if (window.electronAPI && window.electronAPI.onThemeChanged) {
            window.electronAPI.onThemeChanged((theme) => {
                // Only apply if different from current theme
                if (theme !== this.currentTheme) {
                    this.applyTheme(theme, false); // Don't broadcast back
                    this.updateIcon();
                }
            });
        }
    }

    updateIcon() {
        const moonIcon = document.getElementById('moon-icon');
        const sunIcon = document.getElementById('sun-icon');

        if (!moonIcon || !sunIcon) return;

        if (this.currentTheme === 'dark') {
            // Show moon icon (switch to bright mode)
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        } else {
            // Show sun icon (switch to dark mode)
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        }
    }

    setupToggleButton() {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleTheme();
        });
    }
}

// Initialize theme manager when DOM is loaded
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
}
