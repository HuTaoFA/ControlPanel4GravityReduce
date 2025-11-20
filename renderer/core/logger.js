/**
 * Logger
 * Centralized logging system with DOM output and event integration
 */

import eventBus, { Events } from './event-bus.js';

class Logger {
    constructor() {
        this.logContainer = null;
        this.maxLogEntries = 100;
        this.consoleEnabled = true;
    }

    /**
     * Initialize logger with DOM container
     * @param {HTMLElement} container - The log container element
     */
    init(container) {
        this.logContainer = container;
    }

    /**
     * Set maximum number of log entries to keep
     * @param {number} max - Maximum entries
     */
    setMaxEntries(max) {
        this.maxLogEntries = max;
    }

    /**
     * Enable or disable console logging
     * @param {boolean} enabled - Whether to enable console logging
     */
    setConsoleEnabled(enabled) {
        this.consoleEnabled = enabled;
    }

    /**
     * Add a log message
     * @param {string} message - The log message
     * @param {string} type - The log type: 'info', 'success', 'error', 'warning'
     */
    log(message, type = 'info') {
        // Emit log event for other components to listen
        eventBus.emit(Events.LOG_MESSAGE, { message, type });

        // Console logging
        if (this.consoleEnabled) {
            const consoleMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
            console[consoleMethod](`[${type}] ${message}`);
        }

        // DOM logging (only if container exists)
        if (!this.logContainer) {
            return;
        }

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        const timestamp = new Date().toLocaleTimeString();
        logEntry.textContent = `[${timestamp}] ${message}`;

        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;

        // Keep only last N log entries
        this.trimLogEntries();
    }

    /**
     * Log an info message
     * @param {string} message - The log message
     */
    info(message) {
        this.log(message, 'info');
    }

    /**
     * Log a success message
     * @param {string} message - The log message
     */
    success(message) {
        this.log(message, 'success');
    }

    /**
     * Log an error message
     * @param {string} message - The log message
     */
    error(message) {
        this.log(message, 'error');
    }

    /**
     * Log a warning message
     * @param {string} message - The log message
     */
    warning(message) {
        this.log(message, 'warning');
    }

    /**
     * Clear all log entries
     */
    clear() {
        if (this.logContainer) {
            this.logContainer.innerHTML = '';
        }
    }

    /**
     * Trim log entries to max limit
     */
    trimLogEntries() {
        if (!this.logContainer) return;

        while (this.logContainer.children.length > this.maxLogEntries) {
            this.logContainer.removeChild(this.logContainer.firstChild);
        }
    }

    /**
     * Get all log entries as text
     * @returns {string[]} Array of log messages
     */
    getLogs() {
        if (!this.logContainer) return [];

        return Array.from(this.logContainer.children).map(entry => entry.textContent);
    }

    /**
     * Export logs to a string
     * @returns {string} All logs as a single string
     */
    exportLogs() {
        return this.getLogs().join('\n');
    }
}

// Export singleton instance
const logger = new Logger();

// For debugging in browser console
if (typeof window !== 'undefined') {
    window.__logger = logger;
}

export default logger;
