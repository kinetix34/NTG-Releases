/**
 * Multiplayer API - Unified Entry Point
 * High-level multiplayer controller for Nicholas The Game.
 * Automatically switches between WebRTC P2P (for GitHub Pages / static sites)
 * and custom Node.js servers (if configured).
 */
(function (global) {
    'use strict';

    class MultiplayerAPI {
        constructor() {
            this.mode = 'webrtc'; // 'webrtc' | 'server'
            this.customServerUrl = '';
            this.peerEngine = new global.NTGPeerEngine();
            this.serverAdapter = new global.NTGServerAdapter();
            this.activeEngine = this.peerEngine;
        }

        setMode(mode, customUrl = '') {
            this.mode = mode === 'server' ? 'server' : 'webrtc';
            this.customServerUrl = customUrl;
            if (this.mode === 'server') {
                this.serverAdapter.setServerUrl(customUrl);
                this.activeEngine = this.serverAdapter;
            } else {
                this.activeEngine = this.peerEngine;
            }
        }

        getMode() {
            return this.mode;
        }

        getGamesCatalog() {
            return this.activeEngine.getGamesCatalog();
        }

        async getDirectory() {
            if (this.mode === 'server') {
                return await this.serverAdapter.getDirectory();
            } else {
                // In WebRTC mode, games catalog is local, and direct room joining is done via 5-letter code.
                return {
                    games: this.peerEngine.getGamesCatalog(),
                    rooms: []
                };
            }
        }

        async createRoom(options) {
            return await this.activeEngine.createRoom(options);
        }

        async joinRoom(options) {
            return await this.activeEngine.joinRoom(options);
        }

        sendState(state) {
            this.activeEngine.sendState(state);
        }

        leaveRoom() {
            this.activeEngine.leaveRoom();
        }

        onRoster(callback) {
            this.peerEngine.onRoster(callback);
            this.serverAdapter.onRoster(callback);
        }

        onPlayer(callback) {
            this.peerEngine.onPlayer(callback);
            this.serverAdapter.onPlayer(callback);
        }

        onDisconnect(callback) {
            this.peerEngine.onDisconnect(callback);
            this.serverAdapter.onDisconnect(callback);
        }
    }

    global.NTGMultiplayerAPI = new MultiplayerAPI();
})(typeof window !== 'undefined' ? window : this);
