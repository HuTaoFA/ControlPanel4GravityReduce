/**
 * Power Switches Manager
 * Handles driver power and servo module toggle switches
 * Eliminates code duplication with generic switch handler
 */

import stateManager from '../core/state-manager.js';
import eventBus, { Events } from '../core/event-bus.js';
import logger from '../core/logger.js';

class PowerSwitchesManager {
    constructor() {
        this.driverSwitch = null;
        this.servoSwitch = null;
        this.driverGroup = null;
        this.servoGroup = null;
        this.loadingIcon = null;
        this.commandInput = null;
        this.cmdDisplay = null;
    }

    /**
     * Initialize power switches
     */
    init() {
        this.driverSwitch = document.getElementById('driver-power-switch');
        this.servoSwitch = document.getElementById('servo-module-switch');
        this.driverGroup = document.getElementById('driver-power-switch-group');
        this.servoGroup = document.getElementById('servo-module-switch-group');
        this.loadingIcon = document.getElementById('cmd-loading-icon');
        this.commandInput = document.getElementById('int-9');
        this.cmdDisplay = document.getElementById('current-cmd-display');

        // Only initialize if switches exist (may not exist in settings window)
        if (!this.driverSwitch || !this.servoSwitch) {
            return;
        }

        this.attachEventListeners();

        // Listen for enable/disable events from other components
        eventBus.on('power-switches:enable', () => this.enableAll());
        eventBus.on('power-switches:disable', () => this.disableAll());
    }

    /**
     * Attach event listeners to switches
     */
    attachEventListeners() {
        // Driver Power Switch handler
        this.driverSwitch.addEventListener('change', (e) => {
            this.handleSwitchChange(e, 'driver', this.driverSwitch, this.servoSwitch, this.driverGroup, this.servoGroup);
        });

        // Servo Module Switch handler
        this.servoSwitch.addEventListener('change', (e) => {
            this.handleSwitchChange(e, 'servo', this.servoSwitch, this.driverSwitch, this.servoGroup, this.driverGroup);
        });
    }

    /**
     * Generic switch change handler (eliminates duplication)
     * @param {Event} e - Change event
     * @param {string} switchName - Name of the switch ('driver' or 'servo')
     * @param {HTMLElement} thisSwitch - The switch that was toggled
     * @param {HTMLElement} otherSwitch - The other switch to disable
     * @param {HTMLElement} thisGroup - This switch's container group
     * @param {HTMLElement} otherGroup - Other switch's container group
     */
    handleSwitchChange(e, switchName, thisSwitch, otherSwitch, thisGroup, otherGroup) {
        if (!stateManager.get('isConnected')) {
            logger.error('Not connected to server');
            // Revert the switch
            e.target.checked = !e.target.checked;
            return;
        }

        const isOn = e.target.checked;
        const commandId = parseInt(isOn ? e.target.dataset.cmdOn : e.target.dataset.cmdOff);
        const commandName = `${e.target.dataset.name} ${isOn ? 'ON' : 'OFF'}`;

        // Disable all command buttons while waiting for acknowledgment
        this.disableCommandButtons();

        // Disable the other switch
        if (otherSwitch) {
            otherSwitch.disabled = true;
            if (otherGroup) {
                otherGroup.classList.add('disabled');
            }
        }

        // Mark this switch group as waiting for acknowledgment
        if (thisGroup) {
            thisGroup.classList.add('waiting-ack');
        }

        // Set waiting state
        this.setWaitingForAcknowledgment(true);

        // Update command
        this.setCommand(commandId, commandName);

        logger.success(`Command set: ${commandName} (ID: ${commandId}) - waiting for acknowledgment...`);
        eventBus.emit(Events.COMMAND_SET, { commandId, commandName, source: `${switchName}-switch` });
    }

    /**
     * Disable all command buttons
     */
    disableCommandButtons() {
        const commandButtons = document.querySelectorAll('.btn-command');
        commandButtons.forEach(btn => btn.disabled = true);
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
     * Disable all power switches
     */
    disableAll() {
        if (this.driverSwitch) {
            this.driverSwitch.disabled = true;
            if (this.driverGroup) this.driverGroup.classList.add('disabled');
        }
        if (this.servoSwitch) {
            this.servoSwitch.disabled = true;
            if (this.servoGroup) this.servoGroup.classList.add('disabled');
        }
    }

    /**
     * Enable all power switches (only if connected)
     */
    enableAll() {
        const isConnected = stateManager.get('isConnected');

        if (this.driverSwitch && isConnected) {
            this.driverSwitch.disabled = false;
            if (this.driverGroup) {
                this.driverGroup.classList.remove('disabled');
                this.driverGroup.classList.remove('waiting-ack');
            }
        }
        if (this.servoSwitch && isConnected) {
            this.servoSwitch.disabled = false;
            if (this.servoGroup) {
                this.servoGroup.classList.remove('disabled');
                this.servoGroup.classList.remove('waiting-ack');
            }
        }
    }

    /**
     * Handle connection status change
     * @param {boolean} connected - Connection status
     */
    handleConnectionStatus(connected) {
        if (connected) {
            this.enableAll();
        } else {
            this.disableAll();
        }
    }
}

// Export singleton instance
const powerSwitchesManager = new PowerSwitchesManager();

// For debugging in browser console
if (typeof window !== 'undefined') {
    window.__powerSwitchesManager = powerSwitchesManager;
}

export default powerSwitchesManager;
