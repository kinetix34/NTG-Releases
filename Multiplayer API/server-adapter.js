/**
 * Multiplayer API - Server Adapter
 * Connects to a custom Node.js backend (Multiplayer/server.js) when a custom server URL is set.
 */
(function (global) {
    'use strict';

    class ServerAdapter {
        constructor() {
            this.serverUrl = '';
            this.session = null;
            this.events = null;
            this.onRosterCallback = null;
            this.onPlayerCallback = null;
            this.onDisconnectCallback = null;
        }

        setServerUrl(url) {
            this.serverUrl = String(url || '').replace(/\/+$/, '');
        }

        getGamesCatalog() {
            return [
                { id: 'school', name: 'School Co-op', description: 'Explore the school and tackle its classes together.' },
                { id: 'skyline', name: 'Skyline Scramble', description: 'A rooftop obstacle course with spring blocks and local powerups.' }
            ];
        }

        async getDirectory() {
            const url = `${this.serverUrl}/api/directory`;
            const response = await fetch(url);
            return this._readJson(response, 'Could not fetch room directory.');
        }

        async createRoom(options) {
            const url = `${this.serverUrl}/api/rooms`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: options.name,
                    gameId: options.gameId,
                    level: options.level,
                    difficulty: options.difficulty
                })
            });
            const data = await this._readJson(response, 'Could not create room on server.');
            this.session = { code: data.code, playerId: data.playerId };
            this._connectEvents();
            return data;
        }

        async joinRoom(options) {
            const url = `${this.serverUrl}/api/rooms/join`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: options.name,
                    code: String(options.code || '').toUpperCase()
                })
            });
            const data = await this._readJson(response, 'Could not join room on server.');
            this.session = { code: data.code, playerId: data.playerId };
            this._connectEvents();
            return data;
        }

        sendState(state) {
            if (!this.session) return;
            const url = `${this.serverUrl}/api/state`;
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: this.session.code,
                    playerId: this.session.playerId,
                    state
                })
            }).catch(err => console.warn('Server state send error:', err));
        }

        leaveRoom() {
            if (!this.session) return;
            const url = `${this.serverUrl}/api/leave`;
            const body = JSON.stringify({ code: this.session.code, playerId: this.session.playerId });
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
            } else {
                fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body,
                    keepalive: true
                }).catch(() => {});
            }
            this.destroy();
        }

        destroy() {
            if (this.events) {
                this.events.close();
                this.events = null;
            }
            this.session = null;
        }

        onRoster(cb) { this.onRosterCallback = cb; }
        onPlayer(cb) { this.onPlayerCallback = cb; }
        onDisconnect(cb) { this.onDisconnectCallback = cb; }

        _connectEvents() {
            if (!this.session) return;
            const query = new URLSearchParams({ code: this.session.code, playerId: this.session.playerId });
            const url = `${this.serverUrl}/api/room/events?${query}`;
            this.events = new EventSource(url);
            this.events.onmessage = event => {
                try {
                    const update = JSON.parse(event.data);
                    if (update.type === 'roster' && this.onRosterCallback) {
                        this.onRosterCallback(update.players);
                    } else if (update.type === 'player' && this.onPlayerCallback) {
                        this.onPlayerCallback(update.player);
                    }
                } catch (e) {}
            };
            this.events.onerror = () => {
                if (this.onDisconnectCallback) this.onDisconnectCallback('Connection to room lost.');
            };
        }

        async _readJson(response, fallbackMsg) {
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error('Server returned HTML instead of API response. Verify backend URL.');
            }
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || fallbackMsg);
            return data;
        }
    }

    global.NTGServerAdapter = ServerAdapter;
})(typeof window !== 'undefined' ? window : this);
