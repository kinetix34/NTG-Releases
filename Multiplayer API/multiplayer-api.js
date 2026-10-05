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
            this.peerEngine = (typeof global.NTGPeerEngine === 'function') ? new global.NTGPeerEngine() : null;
            this.serverAdapter = (typeof global.NTGServerAdapter === 'function') ? new global.NTGServerAdapter() : null;
            this.activeEngine = this.peerEngine || this.serverAdapter;
        }

        setMode(mode, customUrl = '') {
            this.mode = mode === 'server' ? 'server' : 'webrtc';
            this.customServerUrl = customUrl;
            if (this.mode === 'server' && this.serverAdapter) {
                this.serverAdapter.setServerUrl(customUrl);
                this.activeEngine = this.serverAdapter;
            } else if (this.peerEngine) {
                this.activeEngine = this.peerEngine;
            }
        }

        getMode() {
            return this.mode;
        }

        getGamesCatalog() {
            return this.activeEngine ? this.activeEngine.getGamesCatalog() : [
                { id: 'school', name: 'School Co-op', description: 'Explore the school and tackle its classes together.' },
                { id: 'skyline', name: 'Skyline Scramble', description: 'A rooftop obstacle course with spring blocks and local powerups.' }
            ];
        }

        async getDirectory() {
            if (this.mode === 'server' && this.serverAdapter) {
                return await this.serverAdapter.getDirectory();
            } else {
                return {
                    games: this.getGamesCatalog(),
                    rooms: []
                };
            }
        }

        async createRoom(options) {
            if (!this.activeEngine) throw new Error('Multiplayer engine loading. Please refresh.');
            return await this.activeEngine.createRoom(options);
        }

        async joinRoom(options) {
            if (!this.activeEngine) throw new Error('Multiplayer engine loading. Please refresh.');
            return await this.activeEngine.joinRoom(options);
        }

        sendState(state) {
            if (this.activeEngine) this.activeEngine.sendState(state);
        }

        leaveRoom() {
            if (this.activeEngine) this.activeEngine.leaveRoom();
        }

        onRoster(callback) {
            if (this.peerEngine) this.peerEngine.onRoster(callback);
            if (this.serverAdapter) this.serverAdapter.onRoster(callback);
        }

        onPlayer(callback) {
            if (this.peerEngine) this.peerEngine.onPlayer(callback);
            if (this.serverAdapter) this.serverAdapter.onPlayer(callback);
        }

        onDisconnect(callback) {
            if (this.peerEngine) this.peerEngine.onDisconnect(callback);
            if (this.serverAdapter) this.serverAdapter.onDisconnect(callback);
        }
    }

    global.NTGMultiplayerAPI = new MultiplayerAPI();
})(typeof window !== 'undefined' ? window : this);
