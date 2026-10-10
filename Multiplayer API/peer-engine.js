/**
 * Multiplayer API - PeerJS WebRTC Engine
 * Pure client-side WebRTC multiplayer for GitHub Pages (no server required).
 */
(function (global) {
    'use strict';

    const MAX_PLAYERS = 5;
    const PEER_PREFIX = 'ntg-room-v1-';
    const COLOR_PALETTE = ['#ff5d73', '#3b82f6', '#22a06b', '#f59e0b', '#a855f7'];
    const GAMES_CATALOG = [
        { id: 'school', name: 'School Co-op', description: 'Explore the school and tackle its classes together.' },
        { id: 'skyline', name: 'Skyline Scramble', description: 'A rooftop obstacle course with spring blocks and local powerups.' }
    ];

    function generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    function cleanName(val) {
        return String(val || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 16) || 'Player';
    }

    function cleanChatMessage(val) {
        return String(val || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 240);
    }

    class PeerEngine {
        constructor() {
            this.peer = null;
            this.role = null; // 'host' | 'guest'
            this.code = null;
            this.playerId = null;
            this.playerName = '';
            this.room = null; // Host state
            this.hostConn = null; // Guest connection to host
            this.guestConns = new Map(); // Host connections to guests (playerId => DataConnection)
            this.onRosterCallback = null;
            this.onPlayerCallback = null;
            this.onChatCallback = null;
            this.onDisconnectCallback = null;
        }

        getGamesCatalog() {
            return GAMES_CATALOG;
        }

        async createRoom(options) {
            this.destroy();
            const name = cleanName(options.name);
            const gameId = GAMES_CATALOG.some(g => g.id === options.gameId) ? options.gameId : 'school';
            const level = Math.max(1, Math.min(10, Number(options.level) || 1));
            const difficulty = ['Easy', 'Normal', 'Hard', 'Extreme'].includes(options.difficulty) ? options.difficulty : 'Normal';
            const worldSeed = Math.floor(Math.random() * 0xFFFFFFFF);

            let attempts = 0;
            let code = options.code ? String(options.code).toUpperCase() : generateCode();

            while (attempts < 5) {
                try {
                    const peerId = PEER_PREFIX + code;
                    this.peer = new Peer(peerId, {
                        debug: 1,
                        config: {
                            iceServers: [
                                { urls: 'stun:stun.l.google.com:19302' },
                                { urls: 'stun:stun1.l.google.com:19302' }
                            ]
                        }
                    });
                    await this._waitForOpen(this.peer);
                    break;
                } catch (err) {
                    attempts++;
                    code = generateCode();
                    if (attempts >= 5) throw new Error('Could not reserve a room code. Please try again.');
                }
            }

            this.role = 'host';
            this.code = code;
            this.playerId = 'host_' + Math.random().toString(36).substring(2, 9);
            this.playerName = name;

            const hostPlayer = {
                id: this.playerId,
                name,
                color: COLOR_PALETTE[0],
                state: null
            };

            this.room = {
                code,
                gameId,
                gameName: GAMES_CATALOG.find(g => g.id === gameId)?.name || 'Multiplayer Game',
                level,
                difficulty,
                worldSeed,
                players: new Map([[this.playerId, hostPlayer]])
            };

            this.peer.on('connection', conn => this._handleIncomingConnection(conn));
            this.peer.on('error', err => console.warn('Peer host error:', err));

            return {
                code,
                gameId: this.room.gameId,
                gameName: this.room.gameName,
                playerId: this.playerId,
                level: this.room.level,
                difficulty: this.room.difficulty,
                worldSeed: this.room.worldSeed,
                players: this._getPublicPlayers(),
                maxPlayers: MAX_PLAYERS
            };
        }

        async joinRoom(options) {
            this.destroy();
            const name = cleanName(options.name);
            const code = String(options.code || '').trim().toUpperCase();
            if (!code || code.length < 4) throw new Error('Invalid room code.');

            this.peer = new Peer({
                debug: 1,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });

            await this._waitForOpen(this.peer);

            const peerId = PEER_PREFIX + code;
            const conn = this.peer.connect(peerId, { reliable: true });
            this.hostConn = conn;

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.destroy();
                    reject(new Error('Room connection timed out. Check the room code.'));
                }, 8000);

                conn.on('open', () => {
                    conn.send({ type: 'join', name });
                });

                conn.on('data', data => {
                    if (data.type === 'welcome') {
                        clearTimeout(timeout);
                        this.role = 'guest';
                        this.code = code;
                        this.playerId = data.playerId;
                        this.playerName = name;
                        this._setupGuestListeners(conn);
                        resolve(data);
                    } else if (data.type === 'error') {
                        clearTimeout(timeout);
                        this.destroy();
                        reject(new Error(data.error || 'Failed to join room.'));
                    }
                });

                conn.on('error', err => {
                    clearTimeout(timeout);
                    this.destroy();
                    reject(new Error('Could not connect to room host. Room may be closed.'));
                });

                conn.on('close', () => {
                    if (this.onDisconnectCallback) this.onDisconnectCallback('Room closed by host.');
                });
            });
        }

        sendState(state) {
            if (this.role === 'host' && this.room) {
                const player = this.room.players.get(this.playerId);
                if (player) {
                    player.state = state;
                    this._broadcastToGuests({
                        type: 'player',
                        player: { id: player.id, name: player.name, color: player.color, state }
                    });
                }
            } else if (this.role === 'guest' && this.hostConn && this.hostConn.open) {
                this.hostConn.send({ type: 'state', state });
            }
        }

        sendChat(text) {
            const message = cleanChatMessage(text);
            if (!message) throw new Error('Type a message before sending.');
            const chat = {
                type: 'chat',
                playerId: this.playerId,
                name: this.playerName,
                text: message
            };
            if (this.role === 'host' && this.room) {
                this._broadcastToGuests(chat);
            } else if (this.role === 'guest' && this.hostConn && this.hostConn.open) {
                this.hostConn.send(chat);
            } else {
                throw new Error('Chat is unavailable because you are not connected to a room.');
            }
        }

        leaveRoom() {
            if (this.role === 'guest' && this.hostConn && this.hostConn.open) {
                this.hostConn.send({ type: 'leave' });
            }
            this.destroy();
        }

        destroy() {
            if (this.guestConns) {
                for (const conn of this.guestConns.values()) conn.close();
                this.guestConns.clear();
            }
            if (this.hostConn) {
                this.hostConn.close();
                this.hostConn = null;
            }
            if (this.peer) {
                this.peer.destroy();
                this.peer = null;
            }
            this.role = null;
            this.code = null;
            this.playerId = null;
            this.room = null;
        }

        onRoster(cb) { this.onRosterCallback = cb; }
        onPlayer(cb) { this.onPlayerCallback = cb; }
        onChat(cb) { this.onChatCallback = cb; }
        onDisconnect(cb) { this.onDisconnectCallback = cb; }

        _waitForOpen(peer) {
            return new Promise((resolve, reject) => {
                if (peer.id) return resolve();
                peer.on('open', () => resolve());
                peer.on('error', err => reject(err));
            });
        }

        _getPublicPlayers() {
            if (!this.room) return [];
            return Array.from(this.room.players.values()).map(p => ({
                id: p.id,
                name: p.name,
                color: p.color,
                state: p.state
            }));
        }

        _handleIncomingConnection(conn) {
            if (!this.room || this.room.players.size >= MAX_PLAYERS) {
                conn.on('open', () => {
                    conn.send({ type: 'error', error: 'Room is full (5/5 players).' });
                    setTimeout(() => conn.close(), 500);
                });
                return;
            }

            conn.on('data', data => {
                if (data.type === 'join') {
                    const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
                    const color = COLOR_PALETTE[this.room.players.size % COLOR_PALETTE.length];
                    const newPlayer = { id: guestId, name: cleanName(data.name), color, state: null };

                    this.room.players.set(guestId, newPlayer);
                    this.guestConns.set(guestId, conn);

                    conn.send({
                        type: 'welcome',
                        code: this.code,
                        gameId: this.room.gameId,
                        gameName: this.room.gameName,
                        playerId: guestId,
                        level: this.room.level,
                        difficulty: this.room.difficulty,
                        worldSeed: this.room.worldSeed,
                        players: this._getPublicPlayers(),
                        maxPlayers: MAX_PLAYERS
                    });

                    this._broadcastRoster();

                    conn.on('data', msg => this._handleGuestMessage(guestId, msg));
                    conn.on('close', () => this._removeGuest(guestId));
                    conn.on('error', () => this._removeGuest(guestId));
                }
            });
        }

        _handleGuestMessage(guestId, msg) {
            if (!this.room) return;
            if (msg.type === 'state') {
                const player = this.room.players.get(guestId);
                if (player) {
                    player.state = msg.state;
                    this._broadcastToGuests({
                        type: 'player',
                        player: { id: player.id, name: player.name, color: player.color, state: player.state }
                    }, guestId);
                    if (this.onPlayerCallback) {
                        this.onPlayerCallback({ id: player.id, name: player.name, color: player.color, state: player.state });
                    }
                }
            } else if (msg.type === 'chat') {
                const player = this.room.players.get(guestId);
                const text = cleanChatMessage(msg.text);
                if (!player || !text) return;
                const chat = { type: 'chat', playerId: player.id, name: player.name, text };
                this._broadcastToGuests(chat, guestId);
                if (this.onChatCallback) this.onChatCallback(chat);
            } else if (msg.type === 'leave') {
                this._removeGuest(guestId);
            }
        }

        _removeGuest(guestId) {
            if (this.room && this.room.players.has(guestId)) {
                this.room.players.delete(guestId);
                this.guestConns.delete(guestId);
                this._broadcastRoster();
            }
        }

        _broadcastRoster() {
            const roster = this._getPublicPlayers();
            this._broadcastToGuests({ type: 'roster', players: roster });
            if (this.onRosterCallback) this.onRosterCallback(roster);
        }

        _broadcastToGuests(payload, excludeGuestId = null) {
            for (const [id, conn] of this.guestConns.entries()) {
                if (id === excludeGuestId) continue;
                if (conn && conn.open) conn.send(payload);
            }
        }

        _setupGuestListeners(conn) {
            conn.on('data', data => {
                if (data.type === 'roster' && this.onRosterCallback) {
                    this.onRosterCallback(data.players);
                } else if (data.type === 'player' && this.onPlayerCallback) {
                    this.onPlayerCallback(data.player);
                } else if (data.type === 'chat' && this.onChatCallback) {
                    this.onChatCallback(data);
                }
            });
        }
    }

    global.NTGPeerEngine = PeerEngine;
})(typeof window !== 'undefined' ? window : this);
