/**
 * Settings Manager
 * Handles loading and saving application settings to localStorage
 */

import stateManager from '../core/state-manager.js';
import eventBus, { Events } from '../core/event-bus.js';
import logger from '../core/logger.js';

class SettingsManager {
    constructor() {
        this.currentProtocol = 'tcp';
        this.sendLatencyMs = 20;
    }

    /**
     * Load all settings from localStorage
     * @param {Object} elements - DOM elements to populate
     */
    loadSettings(elements) {
        const {
            protocolTcpRadio,
            protocolUdpRadio,
            tcpHostInput,
            tcpPortInput,
            tcpClientPortInput,
            udpListeningPortInput,
            udpTargetHostInput,
            udpTargetPortInput,
            autoSendToggle,
            debugModeToggle,
            sendLatencyInput,
            updateProtocolUI
        } = elements;

        // Load protocol
        const savedProtocol = localStorage.getItem('protocol');
        if (savedProtocol === 'tcp' || savedProtocol === 'udp') {
            this.currentProtocol = savedProtocol;
            stateManager.set('currentProtocol', savedProtocol);
            if (protocolTcpRadio && protocolUdpRadio) {
                if (savedProtocol === 'tcp') {
                    protocolTcpRadio.checked = true;
                } else {
                    protocolUdpRadio.checked = true;
                }
                if (updateProtocolUI) {
                    updateProtocolUI();
                }
            }
        }

        // Load TCP settings
        if (tcpHostInput) {
            const savedHost = localStorage.getItem('tcp-host');
            if (savedHost) tcpHostInput.value = savedHost;
        }

        if (tcpPortInput) {
            const savedPort = localStorage.getItem('tcp-port');
            if (savedPort) tcpPortInput.value = savedPort;
        }

        if (tcpClientPortInput) {
            const savedClientPort = localStorage.getItem('tcp-client-port');
            if (savedClientPort) tcpClientPortInput.value = savedClientPort;
        }

        // Load UDP settings
        if (udpListeningPortInput) {
            const savedListeningPort = localStorage.getItem('udp-listening-port');
            if (savedListeningPort) udpListeningPortInput.value = savedListeningPort;
        }

        if (udpTargetHostInput) {
            const savedTargetHost = localStorage.getItem('udp-target-host');
            if (savedTargetHost) udpTargetHostInput.value = savedTargetHost;
        }

        if (udpTargetPortInput) {
            const savedTargetPort = localStorage.getItem('udp-target-port');
            if (savedTargetPort) udpTargetPortInput.value = savedTargetPort;
        }

        // Load integer parameters (int-0 through int-15)
        for (let i = 0; i < 16; i++) {
            const input = document.getElementById(`int-${i}`);
            if (input && i !== 9) { // Don't load int-9 as it's the command
                const savedValue = localStorage.getItem(`int-${i}`);
                if (savedValue !== null) {
                    input.value = savedValue;
                }
            }
        }

        // Load auto-send toggle state
        if (autoSendToggle) {
            const savedAutoSend = localStorage.getItem('auto-send-enabled');
            if (savedAutoSend !== null) {
                autoSendToggle.checked = savedAutoSend === 'true';
            }
        }

        // Load debug mode toggle state
        if (debugModeToggle) {
            const savedDebugMode = localStorage.getItem('debug-mode-enabled');
            if (savedDebugMode !== null) {
                debugModeToggle.checked = savedDebugMode === 'true';
                stateManager.set('debugModeEnabled', savedDebugMode === 'true');
            }
        }

        // Load send latency setting
        if (sendLatencyInput) {
            const savedLatency = localStorage.getItem('send-latency-ms');
            if (savedLatency !== null) {
                sendLatencyInput.value = savedLatency;
                this.sendLatencyMs = parseInt(savedLatency);
                stateManager.set('sendLatencyMs', parseInt(savedLatency));
            }
        }

        // Emit settings loaded event
        eventBus.emit(Events.SETTINGS_LOADED);
        logger.info('Settings loaded from localStorage');
    }

    /**
     * Save all settings to localStorage
     * @param {Object} elements - DOM elements to read from
     */
    saveSettings(elements) {
        const {
            tcpHostInput,
            tcpPortInput,
            tcpClientPortInput,
            udpListeningPortInput,
            udpTargetHostInput,
            udpTargetPortInput,
            autoSendToggle,
            debugModeToggle,
            sendLatencyInput
        } = elements;

        // Save protocol
        localStorage.setItem('protocol', this.currentProtocol);

        // Save TCP settings
        if (tcpHostInput) {
            localStorage.setItem('tcp-host', tcpHostInput.value);
        }

        if (tcpPortInput) {
            localStorage.setItem('tcp-port', tcpPortInput.value);
        }

        if (tcpClientPortInput) {
            localStorage.setItem('tcp-client-port', tcpClientPortInput.value);
        }

        // Save UDP settings
        if (udpListeningPortInput) {
            localStorage.setItem('udp-listening-port', udpListeningPortInput.value);
        }

        if (udpTargetHostInput) {
            localStorage.setItem('udp-target-host', udpTargetHostInput.value);
        }

        if (udpTargetPortInput) {
            localStorage.setItem('udp-target-port', udpTargetPortInput.value);
        }

        // Save integer parameters (int-0 through int-15)
        for (let i = 0; i < 16; i++) {
            const input = document.getElementById(`int-${i}`);
            if (input && i !== 9) { // Don't save int-9 as it's the command
                localStorage.setItem(`int-${i}`, input.value);
            }
        }

        // Save auto-send toggle state
        if (autoSendToggle) {
            localStorage.setItem('auto-send-enabled', autoSendToggle.checked.toString());
        }

        // Save debug mode toggle state
        if (debugModeToggle) {
            localStorage.setItem('debug-mode-enabled', debugModeToggle.checked.toString());
        }

        // Save send latency setting
        if (sendLatencyInput) {
            localStorage.setItem('send-latency-ms', sendLatencyInput.value);
        }

        // Emit settings saved event
        eventBus.emit(Events.SETTINGS_SAVED);
    }

    /**
     * Get current protocol
     * @returns {string} Current protocol ('tcp' or 'udp')
     */
    getCurrentProtocol() {
        return this.currentProtocol;
    }

    /**
     * Set current protocol
     * @param {string} protocol - Protocol to set ('tcp' or 'udp')
     */
    setCurrentProtocol(protocol) {
        this.currentProtocol = protocol;
        stateManager.set('currentProtocol', protocol);
    }

    /**
     * Get current send latency
     * @returns {number} Send latency in milliseconds
     */
    getSendLatencyMs() {
        return this.sendLatencyMs;
    }

    /**
     * Set send latency
     * @param {number} latencyMs - Latency in milliseconds
     */
    setSendLatencyMs(latencyMs) {
        this.sendLatencyMs = latencyMs;
        stateManager.set('sendLatencyMs', latencyMs);
    }
}

// Export singleton instance
const settingsManager = new SettingsManager();

// For debugging in browser console
if (typeof window !== 'undefined') {
    window.__settingsManager = settingsManager;
}

export default settingsManager;
