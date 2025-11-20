/**
 * Connection Manager
 * Handles TCP and UDP connection lifecycle
 */

import stateManager from '../core/state-manager.js';
import eventBus, { Events } from '../core/event-bus.js';
import logger from '../core/logger.js';

class ConnectionManager {
    constructor() {
        this.electronAPI = null;
    }

    /**
     * Initialize the connection manager
     * @param {Object} electronAPI - The Electron API from preload
     */
    init(electronAPI) {
        this.electronAPI = electronAPI;

        // Listen for connection status updates from main process
        this.electronAPI.onConnectionStatus((data) => {
            this.handleConnectionStatusUpdate(data);
        });
    }

    /**
     * Connect to server (TCP or UDP based on current protocol)
     * @param {Object} settings - Connection settings with protocol-specific params
     * @returns {Promise<Object>} Connection result
     */
    async connect(settings) {
        const protocol = stateManager.get('currentProtocol');

        try {
            let result;

            if (protocol === 'tcp') {
                result = await this.connectTCP(settings);
            } else {
                result = await this.connectUDP(settings);
            }

            if (result.success) {
                eventBus.emit(Events.CONNECTION_STATUS, { connected: true });
            } else {
                logger.error(`Connection failed: ${result.message}`);
                eventBus.emit(Events.CONNECTION_ERROR, { error: result.message });
            }

            return result;
        } catch (error) {
            const errorMsg = error.message || 'Unknown error';
            logger.error(`Connection error: ${errorMsg}`);
            eventBus.emit(Events.CONNECTION_ERROR, { error: errorMsg });
            return { success: false, message: errorMsg };
        }
    }

    /**
     * Connect via TCP
     * @param {Object} settings - TCP settings (host, port, clientPort)
     * @returns {Promise<Object>} Connection result
     */
    async connectTCP(settings) {
        const { host, port, clientPort } = settings;

        if (!host || !port) {
            throw new Error('Invalid TCP host or port');
        }

        const clientPortMsg = clientPort > 0 ? ` (client port: ${clientPort})` : '';
        logger.info(`Connecting to TCP ${host}:${port}${clientPortMsg}...`);

        const result = await this.electronAPI.tcpConnect(host, port, clientPort);

        if (result.success) {
            logger.success(`Connected to TCP ${host}:${port}`);
        }

        return result;
    }

    /**
     * Connect via UDP
     * @param {Object} settings - UDP settings (listeningPort, targetHost, targetPort)
     * @returns {Promise<Object>} Connection result
     */
    async connectUDP(settings) {
        const { listeningPort, targetHost, targetPort } = settings;

        if (!listeningPort || !targetHost || !targetPort) {
            throw new Error('Invalid UDP settings');
        }

        logger.info(`Starting UDP: Listen on port ${listeningPort}, Target ${targetHost}:${targetPort}...`);

        const result = await this.electronAPI.udpConnect(listeningPort, targetHost, targetPort);

        if (result.success) {
            logger.success(`UDP started: Listening on ${listeningPort}, Target ${targetHost}:${targetPort}`);
        }

        return result;
    }

    /**
     * Disconnect from server (TCP or UDP)
     * @returns {Promise<void>}
     */
    async disconnect() {
        const protocol = stateManager.get('currentProtocol');

        try {
            if (protocol === 'tcp') {
                await this.electronAPI.tcpDisconnect();
            } else {
                await this.electronAPI.udpDisconnect();
            }

            eventBus.emit(Events.CONNECTION_STATUS, { connected: false });
            logger.info('Disconnected from server');
        } catch (error) {
            logger.error(`Disconnect error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Handle connection status update from main process
     * @param {Object} data - Connection status data
     */
    handleConnectionStatusUpdate(data) {
        if (data.connected) {
            stateManager.set('isConnected', true);
            eventBus.emit(Events.CONNECTION_STATUS, { connected: true });
        } else {
            stateManager.set('isConnected', false);
            eventBus.emit(Events.CONNECTION_STATUS, { connected: false });

            if (data.error) {
                logger.error(`Connection error: ${data.error}`);
                eventBus.emit(Events.CONNECTION_ERROR, { error: data.error });
            }
        }
    }

    /**
     * Get connection settings from DOM inputs or localStorage
     * Uses localStorage fallback pattern for cross-window compatibility
     * @param {Object} elements - DOM input elements
     * @returns {Object} Connection settings
     */
    getConnectionSettings(elements) {
        const protocol = stateManager.get('currentProtocol');

        if (protocol === 'tcp') {
            return this.getTCPSettings(elements);
        } else {
            return this.getUDPSettings(elements);
        }
    }

    /**
     * Get TCP settings from inputs or localStorage
     * @param {Object} elements - DOM input elements
     * @returns {Object} TCP settings
     */
    getTCPSettings(elements) {
        const { tcpHostInput, tcpPortInput, tcpClientPortInput } = elements;

        // Use localStorage fallback pattern for cross-window compatibility
        const host = tcpHostInput
            ? tcpHostInput.value.trim()
            : (localStorage.getItem('tcp-host') || 'localhost');

        const port = tcpPortInput
            ? parseInt(tcpPortInput.value)
            : (parseInt(localStorage.getItem('tcp-port')) || 8080);

        const clientPort = tcpClientPortInput
            ? parseInt(tcpClientPortInput.value) || 0
            : (parseInt(localStorage.getItem('tcp-client-port')) || 0);

        return { host, port, clientPort };
    }

    /**
     * Get UDP settings from inputs or localStorage
     * @param {Object} elements - DOM input elements
     * @returns {Object} UDP settings
     */
    getUDPSettings(elements) {
        const { udpListeningPortInput, udpTargetHostInput, udpTargetPortInput } = elements;

        // Use localStorage fallback pattern for cross-window compatibility
        const listeningPort = udpListeningPortInput
            ? parseInt(udpListeningPortInput.value)
            : (parseInt(localStorage.getItem('udp-listening-port')) || 8081);

        const targetHost = udpTargetHostInput
            ? udpTargetHostInput.value.trim()
            : (localStorage.getItem('udp-target-host') || 'localhost');

        const targetPort = udpTargetPortInput
            ? parseInt(udpTargetPortInput.value)
            : (parseInt(localStorage.getItem('udp-target-port')) || 8080);

        return { listeningPort, targetHost, targetPort };
    }

    /**
     * Check if currently connected
     * @returns {boolean} Connection status
     */
    isConnected() {
        return stateManager.get('isConnected');
    }

    /**
     * Get current protocol
     * @returns {string} Current protocol ('tcp' or 'udp')
     */
    getProtocol() {
        return stateManager.get('currentProtocol');
    }
}

// Export singleton instance
const connectionManager = new ConnectionManager();

// For debugging in browser console
if (typeof window !== 'undefined') {
    window.__connectionManager = connectionManager;
}

export default connectionManager;
