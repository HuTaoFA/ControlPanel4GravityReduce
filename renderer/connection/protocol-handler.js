/**
 * Protocol Handler
 * Manages protocol switching between TCP and UDP
 */

import stateManager from '../core/state-manager.js';
import eventBus, { Events } from '../core/event-bus.js';
import logger from '../core/logger.js';

class ProtocolHandler {
    constructor() {
        this.electronAPI = null;
    }

    /**
     * Initialize the protocol handler
     * @param {Object} electronAPI - The Electron API from preload
     */
    init(electronAPI) {
        this.electronAPI = electronAPI;
    }

    /**
     * Switch protocol between TCP and UDP
     * @param {string} newProtocol - The new protocol ('tcp' or 'udp')
     * @returns {Promise<Object>} Result of protocol switch
     */
    async switchProtocol(newProtocol) {
        const currentProtocol = stateManager.get('currentProtocol');

        // No change needed
        if (newProtocol === currentProtocol) {
            return { success: true, message: 'Already using this protocol' };
        }

        // Validate protocol
        if (newProtocol !== 'tcp' && newProtocol !== 'udp') {
            return { success: false, message: 'Invalid protocol. Must be "tcp" or "udp"' };
        }

        try {
            // Notify main process to switch protocol (auto-disconnects if connected)
            const result = await this.electronAPI.setProtocol(newProtocol);

            if (result.success) {
                // Update state
                stateManager.set('currentProtocol', newProtocol);

                // Emit protocol changed event
                eventBus.emit(Events.PROTOCOL_CHANGED, { protocol: newProtocol });

                logger.success(`Switched to ${newProtocol.toUpperCase()} protocol`);
            } else {
                logger.error(`Failed to switch protocol: ${result.message}`);
            }

            return result;
        } catch (error) {
            const errorMsg = `Error switching protocol: ${error.message}`;
            logger.error(errorMsg);
            return { success: false, message: errorMsg };
        }
    }

    /**
     * Get current protocol
     * @returns {string} Current protocol ('tcp' or 'udp')
     */
    getCurrentProtocol() {
        return stateManager.get('currentProtocol');
    }

    /**
     * Update protocol UI elements
     * @param {Object} elements - DOM elements for protocol selection
     */
    updateProtocolUI(elements) {
        const { tcpSettingsSection, udpSettingsSection, protocolTcpRadio, protocolUdpRadio } = elements;

        if (!tcpSettingsSection || !udpSettingsSection) {
            return;
        }

        const currentProtocol = stateManager.get('currentProtocol');

        if (currentProtocol === 'tcp') {
            tcpSettingsSection.style.display = 'block';
            udpSettingsSection.style.display = 'none';

            if (protocolTcpRadio) protocolTcpRadio.checked = true;
        } else {
            tcpSettingsSection.style.display = 'none';
            udpSettingsSection.style.display = 'block';

            if (protocolUdpRadio) protocolUdpRadio.checked = true;
        }
    }

    /**
     * Set protocol from saved settings
     * @param {string} protocol - Saved protocol value
     */
    setProtocolFromSettings(protocol) {
        if (protocol === 'tcp' || protocol === 'udp') {
            stateManager.set('currentProtocol', protocol);
        }
    }
}

// Export singleton instance
const protocolHandler = new ProtocolHandler();

// For debugging in browser console
if (typeof window !== 'undefined') {
    window.__protocolHandler = protocolHandler;
}

export default protocolHandler;
