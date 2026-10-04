const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, randomUUID } = require('node:crypto');

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';
const maxPlayers = 5;
const playerTimeout = 90000;
const rooms = new Map();
const root = path.resolve(__dirname, '..');
const multiplayerGames = [
    { id: 'school', name: 'School Co-op', description: 'Explore the school and tackle its classes together.' },
    { id: 'skyline', name: 'Skyline Scramble', description: 'A rooftop obstacle course with spring blocks and local powerups.' }
];

function sendJson(response, status, data) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(data));
}

function readJson(request) {
    return new Promise((resolve, reject) => {
        let body = '';
        request.on('data', chunk => {
            body += chunk;
            if (body.length > 16000) {
                reject(new Error('Request is too large.'));
                request.destroy();
            }
        });
        request.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch {
                reject(new Error('Invalid JSON.'));
            }
        });
        request.on('error', reject);
    });
}

function cleanName(value) {
    return String(value || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 16);
}

function makeCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do {
        code = Array.from(randomBytes(5), byte => alphabet[byte % alphabet.length]).join('');
    } while (rooms.has(code) || !/[A-Z]/.test(code) || !/[0-9]/.test(code));
    return code;
}

function publicPlayers(room) {
    return [...room.players.values()].map(player => ({
        id: player.id,
        name: player.name,
        color: player.color,
        state: player.state
    }));
}

function sendRoomEvent(room, event, excludedPlayerId = null) {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const [playerId, response] of room.streams) {
        if (playerId === excludedPlayerId) continue;
        if (response.writableEnded || !response.writable) continue;
        if (response.writableLength > 262144) {
            response.end();
            continue;
        }
        response.write(payload);
    }
}

function sendRoomRoster(room) {
    sendRoomEvent(room, { type: 'roster', players: publicPlayers(room) });
}

function findPlayer(code, playerId) {
    const room = rooms.get(String(code || '').toUpperCase());
    const player = room?.players.get(String(playerId || ''));
    if (!room || !player) return null;
    player.lastSeen = Date.now();
    return { room, player };
}

async function handleApi(request, response, url) {
    if (request.method === 'GET' && url.pathname === '/api/directory') {
        const openRooms = [...rooms.values()]
            .filter(room => room.players.size > 0 && room.players.size < maxPlayers)
            .sort((first, second) => second.createdAt - first.createdAt)
            .map(room => ({
                code: room.code,
                gameId: room.gameId,
                gameName: multiplayerGames.find(game => game.id === room.gameId)?.name || 'Multiplayer Game',
                hostName: room.players.values().next().value?.name || 'Host',
                playerCount: room.players.size,
                maxPlayers,
                createdAt: room.createdAt
            }));
        return sendJson(response, 200, { games: multiplayerGames, rooms: openRooms });
    }

    if (request.method === 'POST' && url.pathname === '/api/rooms') {
        const data = await readJson(request);
        const name = cleanName(data.name);
        if (!name) return sendJson(response, 400, { error: 'Enter a player name.' });
        const gameId = multiplayerGames.some(game => game.id === data.gameId) ? data.gameId : 'school';
        const game = multiplayerGames.find(item => item.id === gameId);
        const room = {
            code: makeCode(),
            gameId,
            createdAt: Date.now(),
            level: Math.max(1, Math.min(10, Number(data.level) || 1)),
            difficulty: ['Easy', 'Normal', 'Hard', 'Extreme'].includes(data.difficulty) ? data.difficulty : 'Normal',
            worldSeed: randomBytes(4).readUInt32BE(0),
            players: new Map(),
            streams: new Map()
        };
        const player = { id: randomUUID(), name, color: '#ff5d73', state: null, lastSeen: Date.now() };
        room.players.set(player.id, player);
        rooms.set(room.code, room);
        return sendJson(response, 201, { code: room.code, gameId: room.gameId, gameName: game.name, playerId: player.id, level: room.level, difficulty: room.difficulty, worldSeed: room.worldSeed, players: publicPlayers(room), maxPlayers });
    }

    if (request.method === 'POST' && url.pathname === '/api/rooms/join') {
        const data = await readJson(request);
        const name = cleanName(data.name);
        const code = String(data.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!name) return sendJson(response, 400, { error: 'Enter a player name.' });
        if (!room) return sendJson(response, 404, { error: 'Room not found. Check the code and try again.' });
        if (room.players.size >= maxPlayers) return sendJson(response, 409, { error: 'This room is full (5/5 players).' });
        const color = ['#ff5d73', '#3b82f6', '#22a06b', '#f59e0b', '#a855f7'][room.players.size];
        const player = { id: randomUUID(), name, color, state: null, lastSeen: Date.now() };
        room.players.set(player.id, player);
        sendRoomRoster(room);
        return sendJson(response, 201, { code, gameId: room.gameId, gameName: multiplayerGames.find(game => game.id === room.gameId)?.name || 'Multiplayer Game', playerId: player.id, level: room.level, difficulty: room.difficulty, worldSeed: room.worldSeed, players: publicPlayers(room), maxPlayers });
    }

    if (request.method === 'GET' && url.pathname === '/api/room/events') {
        const session = findPlayer(url.searchParams.get('code'), url.searchParams.get('playerId'));
        if (!session) return sendJson(response, 404, { error: 'Your room session has ended.' });
        response.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });
        response.write(`data: ${JSON.stringify({ type: 'roster', players: publicPlayers(session.room) })}\n\n`);
        const previousStream = session.room.streams.get(session.player.id);
        if (previousStream && previousStream !== response) previousStream.end();
        session.room.streams.set(session.player.id, response);
        response.on('close', () => {
            if (session.room.streams.get(session.player.id) === response) session.room.streams.delete(session.player.id);
        });
        return;
    }

    if (request.method === 'GET' && url.pathname === '/api/room') {
        const session = findPlayer(url.searchParams.get('code'), url.searchParams.get('playerId'));
        if (!session) return sendJson(response, 404, { error: 'Your room session has ended.' });
        return sendJson(response, 200, {
            code: session.room.code,
            players: publicPlayers(session.room),
            maxPlayers
        });
    }

    if (request.method === 'POST' && url.pathname === '/api/state') {
        const data = await readJson(request);
        const session = findPlayer(data.code, data.playerId);
        if (!session) return sendJson(response, 404, { error: 'Your room session has ended.' });
        const state = data.state || {};
        session.player.state = {
            x: Number.isFinite(state.x) ? Math.max(0, Math.min(20000, state.x)) : 100,
            y: Number.isFinite(state.y) ? Math.max(-1000, Math.min(1000, state.y)) : 300,
            room: String(state.room || 'Math').slice(0, 80),
            level: Math.max(1, Math.min(10, Number(state.level) || session.room.level)),
            moving: Boolean(state.moving),
            updatedAt: Date.now()
        };
        sendRoomEvent(session.room, {
            type: 'player',
            player: {
                id: session.player.id,
                name: session.player.name,
                color: session.player.color,
                state: session.player.state
            }
        }, session.player.id);
        return sendJson(response, 200, { ok: true });
    }

    if (request.method === 'POST' && url.pathname === '/api/leave') {
        const data = await readJson(request);
        const code = String(data.code || '').toUpperCase();
        const room = rooms.get(code);
        const playerId = String(data.playerId || '');
        room?.streams.get(playerId)?.end();
        room?.streams.delete(playerId);
        room?.players.delete(playerId);
        if (room && room.players.size === 0) rooms.delete(code);
        else if (room) sendRoomRoster(room);
        return sendJson(response, 200, { ok: true });
    }

    sendJson(response, 404, { error: 'Not found.' });
}

const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    try {
        if (url.pathname.startsWith('/api/')) {
            await handleApi(request, response, url);
            return;
        }

        if (request.method !== 'GET' && request.method !== 'HEAD') {
            sendJson(response, 405, { error: 'Method not allowed.' });
            return;
        }

        const requestedPath = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
        const filePath = path.resolve(root, requestedPath);
        if (!filePath.startsWith(`${root}${path.sep}`) && filePath !== path.join(root, 'index.html')) {
            sendJson(response, 403, { error: 'Forbidden.' });
            return;
        }
        fs.stat(filePath, (error, stats) => {
            if (error || !stats.isFile()) return sendJson(response, 404, { error: 'Not found.' });
            const types = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
            response.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
            if (request.method === 'HEAD') return response.end();
            fs.createReadStream(filePath).pipe(response);
        });
    } catch (error) {
        if (!response.headersSent) sendJson(response, 400, { error: error.message || 'Request failed.' });
    }
});

setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
        let rosterChanged = false;
        for (const [playerId, player] of room.players) {
            const stream = room.streams.get(playerId);
            if (stream && !stream.writableEnded) player.lastSeen = now;
            if (now - player.lastSeen > playerTimeout) {
                room.streams.get(playerId)?.end();
                room.streams.delete(playerId);
                room.players.delete(playerId);
                rosterChanged = true;
            }
        }
        if (room.players.size === 0) rooms.delete(code);
        else if (rosterChanged) sendRoomRoster(room);
    }
}, 5000).unref();

setInterval(() => {
    for (const room of rooms.values()) {
        for (const response of room.streams.values()) {
            if (!response.writableEnded && response.writable) response.write(': keepalive\n\n');
        }
    }
}, 15000).unref();

server.listen(port, host, () => {
    console.log(`NTG multiplayer server running at http://localhost:${port}`);
    console.log('Other players on your network can use this computer’s local IP address.');
});