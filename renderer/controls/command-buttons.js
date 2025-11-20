/**
 * Command Buttons Manager
 * Handles command button clicks and acknowledgment logic
 */

import stateManager from '../core/state-manager.js';
import eventBus, { Events } from '../core/event-bus.js';
import logger from '../core/logger.js';

class CommandButtonsManager {
    constructor() {
        this.commandButtons = null;
        this.loadingIcon = null;
        this.commandInput = null;
        this.cmdDisplay = null;
    }

    /**
     * Initialize command buttons
     */
    init() {
        this.commandButtons = document.querySelectorAll('.btn-command');
        this.loadingIcon = document.getElementById('cmd-loading-icon');
        this.commandInput = document.getElementById('int-9');
        this.cmdDisplay = document.getElementById('current-cmd-display');

        // Only initialize if command buttons exist (may not exist in settings window)
        if (this.commandButtons.length === 0) {
            return;
        }

        this.attachEventListeners();
    }

    /**
     * Attach click event listeners to all command buttons
     */
    attachEventListeners() {
        this.commandButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleCommandClick(btn));
        });
    }

    /**
     * Handle command button click
     * @param {HTMLElement} btn - The clicked button element
     */
    handleCommandClick(btn) {
        if (!stateManager.get('isConnected')) {
            logger.error('Not connected to server');
            return;
        }

        const commandId = parseInt(btn.dataset.cmd);
        const commandName = btn.dataset.name || btn.textContent;

        // Update UI state
        this.setActiveButton(btn);
        this.disableAllButtonsExcept(btn);

        // Disable power switches while waiting for acknowledgment
        eventBus.emit('power-switches:disable');

        // Set waiting state
        this.setWaitingForAcknowledgment(true);

        // Update command
        this.setCommand(commandId, commandName);

        logger.success(`Command set: ${commandName} (ID: ${commandId}) - waiting for acknowledgment...`);
        eventBus.emit(Events.COMMAND_SET, { commandId, commandName });
    }

    /**
     * Set active state for clicked button
     * @param {HTMLElement} activeBtn - The button to activate
     */
    setActiveButton(activeBtn) {
        // Remove active class from all buttons
        this.commandButtons.forEach(btn => btn.classList.remove('active-command'));

        // Add active class to clicked button
        activeBtn.classList.add('active-command');
    }

    /**
     * Disable all buttons except the specified one
     * @param {HTMLElement} exceptBtn - The button to keep enabled
     */
    disableAllButtonsExcept(exceptBtn) {
        this.commandButtons.forEach(btn => {
            if (btn !== exceptBtn) {
                btn.disabled = true;
            }
        });
    }

    /**
     * Enable all command buttons
     */
    enableAllButtons() {
        if (!this.commandButtons) return;

        this.commandButtons.forEach(btn => {
            btn.disabled = false;
        });
    }

    /**
     * Disable all command buttons
     */
    disableAllButtons() {
        if (!this.commandButtons) return;

        this.commandButtons.forEach(btn => {
            btn.disabled = true;
        });
    }

    /**
     * Remove active class from all buttons
     */
    clearActiveButtons() {
        if (!this.commandButtons) return;

        this.commandButtons.forEach(btn => {
            btn.classList.remove('active-command');
        });
    }

    /**
     * Set waiting for acknowledgment state
     * @param {boolean} waiting - Whether waiting for acknowledgment
     */
    setWaitingForAcknowledgment(waiting) {
        stateManager.set('waitingForAcknowledgment', waiting);

        // Show/hide loading icon
        if (this.loadingIcon) {
            this.loadingIcon.style.display = waiting ? 'inline-block' : 'none';
        }
    }

    /**
     * Set current command
     * @param {number} commandId - The command ID
     * @param {string} commandName - The command name
     */
    setCommand(commandId, commandName) {
        stateManager.set('currentCommand', commandId);

        // Update int-9 display immediately
        if (this.commandInput) {
            this.commandInput.value = commandId;
        }

        // Update current command display
        if (this.cmdDisplay) {
            this.cmdDisplay.textContent = `${commandId} - ${commandName}`;
        }
    }

    /**
     * Clear current command
     */
    clearCommand() {
        this.setCommand(0, 'None');
    }

    /**
     * Handle command acknowledgment from PLC
     * This is called when PLC echoes the command back
     */
    handleAcknowledgment() {
        // Clear active state
        this.clearActiveButtons();

        // Re-enable all buttons
        this.enableAllButtons();

        // Re-enable power switches
        eventBus.emit('power-switches:enable');

        // Clear waiting state
        this.setWaitingForAcknowledgment(false);

        // Reset command to zero
        this.clearCommand();

        logger.success('Command acknowledged and completed by PLC');
    }
}

// Export singleton instance
const commandButtonsManager = new CommandButtonsManager();

// For debugging in browser console
if (typeof window !== 'undefined') {
    window.__commandButtonsManager = commandButtonsManager;
}

export default commandButtonsManager;
