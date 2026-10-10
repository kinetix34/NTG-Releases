        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        let gameState = 'MENU';
        let selectedLevel = 1;
        let difficulty = 'Normal';
        let troubleMeter = 0; // 0, 1, or 2 strikes
        let slackingCaughtCooldown = 0;
        let teacherAlertTimer = 0;
        let adminAuthenticated = false;
        const adminUsername = 'Prayden-admin';
        const adminPassword = 'Pancakes67!?';
        const progressionStorageKey = 'ntg-progression';
        let unlockedLevels = Array(10).fill(false);
        let hardCompletedLevels = Array(10).fill(false);
        let extremeUnlocked = false;
        let questStats = {
            visitedRooms: [],
            homeworks: 0,
            coinsCollected: 0,
            springBounces: 0,
            jumps: 0,
            sprintSeconds: 0,
            levelsCompleted: 0,
            cleanLevels: 0,
            helpersUsed: 0,
            playSeconds: 0,
            doorTransitions: 0,
            slackSeconds: 0
        };
        let completedQuests = [];
        let questProgressDirty = false;
        let questSaveTimer = 0;
        let sprintQuestTimer = 0;
        let playQuestTimer = 0;
        let slackQuestTimer = 0;
        let questRenderTimer = 0;
        let questLogWasPaused = false;
        const questDefinitions = [
            { id: 'campus-explorer', title: 'Campus Explorer', description: 'Visit 8 different rooms.', stat: 'visitedRooms', target: 8, reward: 'Move 8% faster.' },
            { id: 'honor-roll', title: 'Honor Roll', description: 'Complete 5 worksheets.', stat: 'homeworks', target: 5, reward: 'Earn 2 extra coins for each worksheet.' },
            { id: 'pocket-change', title: 'Pocket Change', description: 'Collect 20 coins from the school.', stat: 'coinsCollected', target: 20, reward: 'Earn 1 extra coin from each coin pickup.' },
            { id: 'spring-loaded', title: 'Spring Loaded', description: 'Bounce on spring platforms 10 times.', stat: 'springBounces', target: 10, reward: 'Jump and spring-launch strength +10%.' },
            { id: 'jump-around', title: 'Jump Around', description: 'Successfully jump 40 times.', stat: 'jumps', target: 40, reward: 'Coyote-time jump grace +0.06 seconds.' },
            { id: 'track-star', title: 'Track Star', description: 'Sprint for 90 seconds while moving.', stat: 'sprintSeconds', target: 90, reward: 'Sprint stamina drains 20% slower.' },
            { id: 'door-to-door', title: 'Door-to-Door', description: 'Travel through 20 school doors.', stat: 'doorTransitions', target: 20, reward: 'Room-entry door cooldown is shorter.' },
            { id: 'level-legend', title: 'Level Legend', description: 'Complete 3 levels.', stat: 'levelsCompleted', target: 3, reward: 'Sprint stamina regenerates 20% faster.' },
            { id: 'clean-record', title: 'Clean Record', description: 'Complete 2 levels without a teacher or camera strike.', stat: 'cleanLevels', target: 2, reward: 'Teacher and camera alerts build 20% slower.' },
            { id: 'helper-hand', title: 'Helper Hand', description: 'Use 5 mystery helpers.', stat: 'helpersUsed', target: 5, reward: 'Energy and dash helpers last or restore 25% more.' },
            { id: 'after-school', title: 'After School', description: 'Play for 5 minutes in active school gameplay.', stat: 'playSeconds', target: 300, reward: 'Energy drains 15% slower while active.' },
            { id: 'study-break', title: 'Study Break', description: 'Spend 120 seconds slacking off.', stat: 'slackSeconds', target: 120, reward: 'Slack energy recovery is 20% faster.' }
        ];
        const difficultySettings = {
            Easy: { alertGain: 0.45, alertDecay: 0.9, teacherSpeed: 0.8, enemySpeed: 0.88, platformSpeed: 0.9, label: 'Easy' },
            Normal: { alertGain: 0.7, alertDecay: 0.65, teacherSpeed: 1, enemySpeed: 1, platformSpeed: 1, label: 'Normal' },
            Hard: { alertGain: 1, alertDecay: 0.45, teacherSpeed: 1.2, enemySpeed: 1.12, platformSpeed: 1.08, label: 'Hard' },
            Extreme: { alertGain: 1.35, alertDecay: 0.3, teacherSpeed: 1.45, enemySpeed: 1.24, platformSpeed: 1.16, label: 'Extreme' }
        };
        let energy = 100;
        const maxEnergy = 100;
        let sprintStamina = 100;
        const maxSprintStamina = 100;
        let isSlacking = false;
        let lastTimestamp = 0;
        let isPaused = false;
        let isLevelMapOpen = false;
        let levelMapWasPaused = false;
        let isPhoneOpen = false;
        let phoneUnlocked = false;
        let phoneApp = 'home';
        let phoneTaken = false;
        let phoneBattery = 100;
        const maxPhoneBattery = 100;
        let phoneBatteryDrainTimer = 8;
        const phonePinStorageKey = 'ntg-phone-pin';
        let phonePin = localStorage.getItem(phonePinStorageKey) || '';
        const phoneWallpaperStorageKey = 'ntg-phone-wallpaper';
        const storedPhoneWallpaper = localStorage.getItem(phoneWallpaperStorageKey) || '';
        let phoneWallpaper = /^data:image\/(?:png|jpeg|gif);base64,[A-Za-z0-9+/]+={0,2}$/i.test(storedPhoneWallpaper)
            ? storedPhoneWallpaper
            : '';
        let phoneSignalLevel = Math.floor(Math.random() * 5) + 1;
        let phoneSignalTimer = 3;
        let phoneLoadRequestId = 0;
        let phoneCaughtTime = 0;
        let phoneUnlockSwipeStartY = null;
        let phoneActivePinInput = 'phonePinInput';
        let phoneChatMessages = [];
        let phoneAnimationTimer = 0;
        let phoneToastTimer = 0;
        let soundEnabled = true;
        let audioContext = null;
        let checkpoint = { room: 'Math', x: 100, y: 300 };
        let doorCooldown = 0;
        let gameTime = 0;
        let level = 1;
        let coins = 0;
        let inventory = { food: 0, hallPasses: 0, helpers: [] };
        let sprintTime = 0;
        let roomCoinsInitialized = false;
        let particles = [];
        let roomBanner = { text: '', time: 0 };
        let screenShake = 0;
        let spawnSafeTime = 0;
        let combo = 0;
        // Pop quiz: low-chance required extra assignment gating a level exit.
        let popQuizPending = null;
        let popQuizShownThisLevel = false;
        let isPopQuiz = false;
        // Slack tracking for the end-of-run star rating.
        let slackSeconds = 0;
        let activeSeconds = 0;
        let maxFps = 60;
        let frameInterval = 1000 / maxFps;
        let lastFrameTime = 0;
        let capturingKeybind = null;
        let mobileMoveAxis = 0;
        const mobileActionPointers = new Map();
        let multiplayerSession = null;
        let multiplayerPlayers = [];
        let remotePlayers = [];
        let networkWorldSeed = 0;
        let nextNetworkSend = 0;
        let networkSendBusy = false;
        let lastNetworkStateSent = null;
        let lastNetworkSendTime = 0;
        let buddyNearby = false;
        let lastBuddyRescue = 0;
        let skylinePowerups = { turbo: 0, highJump: 0, shield: 0 };
        let skylineCrystals = 0;
        let skylineScore = 0;
        let skylineLevel = 1;
        let skylineLevelStartScore = 0;
        let skylineHudText = '';
        const optionsStorageKey = 'ntg-options';
        const keybinds = {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            jump: 'KeyW',
            interact: 'KeyE',
            slack: 'Space',
            food: 'KeyF',
            pass: 'KeyH',
            dash: 'KeyQ',
            sprint: 'ShiftLeft',
            groundPound: 'KeyS',
            pause: 'KeyP',
            sound: 'KeyM',
            helper: 'KeyJ',
            phone: 'Tab',
            map: 'KeyG',
            quests: 'KeyT'
        };
        const defaultKeybinds = { ...keybinds };

        // Player Metroidvania Physics & Abilities State
        const player = {
            x: 100,
            y: 300,
            vx: 0,
            vy: 0,
            w: 24,
            h: 40,
            grounded: false,
            doubleJumpsLeft: 0,
            canDoubleJump: false,
            canStealth: false,
            canDash: false,
            hasMasterKey: false,
            dashCooldown: 0,
            dashTime: 0,
            dashDirection: 1,
            sprinting: false,
            sprintLocked: false,
            sprintBoost: false,
            coyoteTimer: 0,
            jumpBufferTimer: 0,
            isWallSliding: false,
            wallDir: 0,
            groundPounding: false,
            isSliding: false,
            slideTimer: 0,
            slideUsedUntilRelease: false,
            slideParticleTimer: 0,
            slidePose: 0,
            slidePoseVelocity: 0,
            landBounce: 0
        };

        let keys = {};

        // Subject Homework Solved Flags
        let homeworkDone = { Math: false, ELA: false, Science: false, Gym: false, Art: false, Computer: false, Cafeteria: false, Music: false, History: false, Chemistry: false, MusicClass: false };
        let activeHomework = [];
        let activeLevelSubjects = ['Math', 'ELA', 'Science', 'Gym'];
        let levelRunSeed = Math.floor(Math.random() * 1000000);
        let doorIntent = false;
        let joystickPointerId = null;

        // Map Rooms (Metroidvania layout)
        let currentRoomKey = 'Math';
        let cameraX = 0;
        const rooms = {
            Math: {
                title: 'Math Classroom', color: '#fff9e6',
                doors: [{ x: 740, y: 280, w: 50, h: 100, targetRoom: 'HallwayCentral', targetX: 70, targetY: 300 }],
                platforms: [
                    { x: 0, y: 380, w: 800, h: 70 },
                    { x: 250, y: 280, w: 150, h: 20 },
                    { x: 450, y: 200, w: 150, h: 20 }
                ],
                desk: { x: 500, y: 150, w: 60, h: 50, subject: 'Math' },
                teacher: { x: 300, y: 330, range: 100, dir: 1, timer: 0, state: 'WRITING' }
            },
            HallwayCentral: {
                title: 'Central Hallway Hub', color: '#f0f0f0', width: 1600,
                doors: [
                    { x: 40, y: 280, w: 40, h: 100, targetRoom: 'Math', targetX: 700, targetY: 300 },
                    { x: 1460, y: 280, w: 40, h: 100, targetRoom: 'ELA', targetX: 70, targetY: 300 },
                    { x: 380, y: 180, w: 80, h: 80, targetRoom: 'Science', targetX: 400, targetY: 300, reqAbility: 'canDoubleJump', label: 'High Vent (Requires Double Jump)' },
                    { x: 680, y: 280, w: 70, h: 100, targetRoom: 'Gym', targetX: 70, targetY: 300, reqAbility: 'canDash', label: 'Gym Lock (Requires Dash)' },
                    { x: 1080, y: 140, w: 90, h: 70, targetRoom: 'Art', targetX: 70, targetY: 300, reqAbility: 'canStealth', label: 'Quiet Art Wing (Requires Stealth)' },
                    { x: 110, y: 150, w: 90, h: 70, targetRoom: 'Computer', targetX: 70, targetY: 300, reqAbility: 'canDoubleJump', label: 'Computer Lab (Requires Double Jump)' },
                    { x: 1240, y: 300, w: 90, h: 80, targetRoom: 'Cafeteria', targetX: 70, targetY: 300, label: 'Cafeteria' },
                    { x: 790, y: 120, w: 60, h: 60, targetRoom: 'Principal', targetX: 400, targetY: 320, reqAbility: 'hasMasterKey', reqCore: true, label: 'Principal Office (Requires all classes)' }
                ],
                platforms: [
                    { x: 0, y: 380, w: 1600, h: 70 },
                    { x: 300, y: 260, w: 200, h: 20 },
                    { x: 720, y: 180, w: 160, h: 20 },
                    { x: 80, y: 220, w: 120, h: 20 },
                    { x: 1080, y: 210, w: 140, h: 20 }
                ],
                desk: null,
                teacher: { x: 800, y: 330, range: 180, dir: -1, timer: 0, state: 'WRITING' },
                reporters: [{ x: 560, startX: 560, y: 330, dir: 1, speed: 60, range: 75, timer: 0, reported: false }, { x: 1180, startX: 1180, y: 330, dir: -1, speed: 55, range: 75, timer: 0, reported: false }]
            },
            ELA: {
                title: 'ELA Library', color: '#e6f2ff',
                doors: [{ x: 20, y: 280, w: 40, h: 100, targetRoom: 'HallwayCentral', targetX: 700, targetY: 300 }],
                platforms: [
                    { x: 0, y: 380, w: 800, h: 70 },
                    { x: 150, y: 270, w: 180, h: 20 },
                    { x: 400, y: 210, w: 200, h: 20 }
                ],
                desk: { x: 480, y: 160, w: 60, h: 50, subject: 'ELA' },
                teacher: { x: 200, y: 330, range: 120, dir: 1, timer: 0, state: 'WRITING' }
            },
            Science: {
                title: 'Science Lab', color: '#e6ffe6',
                doors: [{ x: 400, y: 300, w: 60, h: 80, targetRoom: 'HallwayCentral', targetX: 400, targetY: 200 }],
                platforms: [
                    { x: 0, y: 380, w: 800, h: 70 },
                    { x: 100, y: 280, w: 120, h: 20 },
                    { x: 580, y: 280, w: 120, h: 20 },
                    { x: 320, y: 200, w: 160, h: 20 }
                ],
                desk: { x: 370, y: 150, w: 60, h: 50, subject: 'Science' },
                teacher: { x: 600, y: 330, range: 100, dir: -1, timer: 0, state: 'WRITING' }
            },
            Gym: {
                title: 'Gymnasium', color: '#fff0f0',
                doors: [{ x: 20, y: 280, w: 40, h: 100, targetRoom: 'HallwayCentral', targetX: 300, targetY: 300 }],
                platforms: [
                    { x: 0, y: 380, w: 800, h: 70 },
                    { x: 180, y: 260, w: 440, h: 20 },
                    { x: 310, y: 170, w: 180, h: 20 }
                ],
                desk: { x: 370, y: 110, w: 60, h: 50, subject: 'Gym' },
                teacher: null, balls: []
            },
            Art: {
                title: 'Art Room', color: '#ffe6f7',
                doors: [{ x: 20, y: 280, w: 40, h: 100, targetRoom: 'HallwayCentral', targetX: 550, targetY: 220 }],
                platforms: [
                    { x: 0, y: 380, w: 800, h: 70 },
                    { x: 140, y: 290, w: 160, h: 20 },
                    { x: 420, y: 240, w: 180, h: 20 },
                    { x: 280, y: 150, w: 140, h: 20 }
                ],
                desk: { x: 320, y: 100, w: 60, h: 50, subject: 'Art' },
                teacher: { x: 650, y: 330, range: 130, dir: -1, timer: 0, state: 'WRITING' }
            },
            Computer: {
                title: 'Computer Lab', color: '#e8e6ff',
                doors: [{ x: 20, y: 280, w: 40, h: 100, targetRoom: 'HallwayCentral', targetX: 160, targetY: 220 }],
                platforms: [
                    { x: 0, y: 380, w: 800, h: 70 },
                    { x: 120, y: 300, w: 150, h: 20 },
                    { x: 350, y: 240, w: 150, h: 20 },
                    { x: 580, y: 180, w: 130, h: 20 }
                ],
                desk: { x: 615, y: 120, w: 60, h: 50, subject: 'Computer' },
                teacher: null
            },
            Cafeteria: {
                title: 'Cafeteria', color: '#fff4d6',
                doors: [
                    { x: 20, y: 280, w: 40, h: 100, targetRoom: 'HallwayCentral', targetX: 500, targetY: 300 },
                    { x: 740, y: 280, w: 40, h: 100, targetRoom: 'Music', targetX: 70, targetY: 300 }
                ],
                platforms: [
                    { x: 0, y: 380, w: 800, h: 70 },
                    { x: 180, y: 300, w: 120, h: 20 },
                    { x: 400, y: 250, w: 150, h: 20 }
                ],
                desk: { x: 440, y: 200, w: 60, h: 50, subject: 'Cafeteria' },
                teacher: null
            },
            Music: {
                title: 'Music Room', color: '#f0e6ff',
                doors: [{ x: 20, y: 280, w: 40, h: 100, targetRoom: 'Cafeteria', targetX: 700, targetY: 300 }],
                platforms: [
                    { x: 0, y: 380, w: 800, h: 70 },
                    { x: 120, y: 270, w: 170, h: 20 },
                    { x: 380, y: 210, w: 170, h: 20 },
                    { x: 620, y: 280, w: 100, h: 20 }
                ],
                desk: { x: 430, y: 160, w: 60, h: 50, subject: 'Music' },
                teacher: { x: 650, y: 330, range: 100, dir: -1, timer: 0, state: 'WRITING' }
            },
            Principal: {
                title: 'Principal Office', color: '#fffae6',
                doors: [],
                platforms: [
                    { x: 0, y: 380, w: 800, h: 70 },
                    { x: 250, y: 290, w: 300, h: 20 },
                    { x: 350, y: 200, w: 100, h: 20 }
                ],
                desk: null, teacher: null
            },
            Level2Hall: {
                title: 'LEVEL 2: Detention Block', color: '#d9d9e8',
                doors: [{ x: 740, y: 280, w: 50, h: 100, targetRoom: 'SecondFloor', targetX: 80, targetY: 300 }],
                platforms: [
                    { x: 0, y: 380, w: 800, h: 70 },
                    { x: 150, y: 285, w: 170, h: 20 },
                    { x: 420, y: 225, w: 180, h: 20 },
                    { x: 285, y: 145, w: 160, h: 20 }
                ],
                desk: null, teacher: null,
                enemies: [
                    { x: 230, y: 330, w: 28, h: 38, dir: 1, speed: 85, phase: 0 },
                    { x: 560, y: 330, w: 28, h: 38, dir: -1, speed: 105, phase: 2 },
                    { x: 370, y: 95, w: 28, h: 38, dir: 1, speed: 70, phase: 4, chase: true }
                ]
            },
            SecondFloor: {
                title: 'LEVEL 2: SECOND FLOOR', color: '#d9f0ff', width: 1600,
                doors: [
                    { x: 40, y: 280, w: 50, h: 100, targetRoom: 'WestbridgeHub', targetX: 680, targetY: 300 },
                    { x: 235, y: 200, w: 70, h: 100, targetRoom: 'HistoryClass', targetX: 100, targetY: 300 },
                    { x: 975, y: 210, w: 70, h: 100, targetRoom: 'ChemistryClass', targetX: 100, targetY: 300 },
                    { x: 1370, y: 160, w: 70, h: 100, targetRoom: 'MusicClass', targetX: 100, targetY: 300 },
                    { x: 1510, y: 280, w: 70, h: 100, targetRoom: 'Level2Exit', targetX: 400, targetY: 320, reqCore: true, reqSecondFloor: true, label: 'Rooftop Stairwell' }
                ],
                platforms: [
                    { x: 0, y: 380, w: 1600, h: 70 },
                    { x: 180, y: 300, w: 180, h: 20, surface: 'crumble' },
                    { x: 560, y: 285, w: 180, h: 20, surface: 'boost', direction: 1 },
                    { x: 920, y: 310, w: 180, h: 20 },
                    { x: 1320, y: 260, w: 170, h: 20, surface: 'spring' }
                ],
                desk: null, teacher: { x: 720, y: 330, range: 150, dir: 1, timer: 0, state: 'WRITING' },
                enemies: [{ x: 350, y: 330, w: 28, h: 38, dir: 1, speed: 125, phase: 1 }, { x: 1120, y: 330, w: 28, h: 38, dir: -1, speed: 140, phase: 3 }],
                reporters: [{ x: 500, startX: 500, y: 330, dir: 1, speed: 65, range: 75, timer: 0, reported: false }]
            },
            HistoryClass: {
                title: 'SECOND FLOOR: HISTORY', color: '#fff0c9',
                doors: [{ x: 20, y: 280, w: 50, h: 100, targetRoom: 'SecondFloor', targetX: 330, targetY: 300 }],
                platforms: [{ x: 0, y: 380, w: 800, h: 70 }, { x: 140, y: 290, w: 180, h: 20 }, { x: 430, y: 230, w: 210, h: 20 }],
                desk: { x: 500, y: 180, w: 60, h: 50, subject: 'History' },
                teacher: { x: 620, y: 330, range: 145, dir: -1, timer: 0, state: 'WRITING' }
            },
            ChemistryClass: {
                title: 'SECOND FLOOR: CHEMISTRY', color: '#e6ffe6',
                doors: [{ x: 20, y: 280, w: 50, h: 100, targetRoom: 'SecondFloor', targetX: 1010, targetY: 300 }],
                platforms: [{ x: 0, y: 380, w: 800, h: 70 }, { x: 100, y: 280, w: 170, h: 20 }, { x: 370, y: 210, w: 180, h: 20 }, { x: 630, y: 290, w: 120, h: 20 }],
                desk: { x: 420, y: 160, w: 60, h: 50, subject: 'Chemistry' },
                teacher: { x: 210, y: 330, range: 135, dir: 1, timer: 0, state: 'WRITING' }
            },
            MusicClass: {
                title: 'SECOND FLOOR: MUSIC', color: '#f0e6ff',
                doors: [{ x: 20, y: 280, w: 50, h: 100, targetRoom: 'SecondFloor', targetX: 1390, targetY: 250 }],
                platforms: [{ x: 0, y: 380, w: 800, h: 70 }, { x: 120, y: 280, w: 180, h: 20 }, { x: 400, y: 220, w: 180, h: 20 }, { x: 640, y: 290, w: 120, h: 20 }],
                desk: { x: 440, y: 170, w: 60, h: 50, subject: 'MusicClass' },
                teacher: { x: 650, y: 330, range: 155, dir: -1, timer: 0, state: 'WRITING' }
            },
            WestbridgeHub: {
                title: 'WESTBRIDGE ACADEMY: QUAD', color: '#d9f0ff',
                doors: [
                    { x: 20, y: 280, w: 50, h: 100, targetRoom: 'WestbridgeShop', targetX: 110, targetY: 300 },
                    { x: 740, y: 280, w: 50, h: 100, targetRoom: 'WestbridgeLab', targetX: 100, targetY: 300 },
                    { x: 360, y: 100, w: 80, h: 80, targetRoom: 'SecondFloor', targetX: 80, targetY: 300, label: 'Second Floor' }
                ],
                platforms: [
                    { x: 0, y: 380, w: 800, h: 70 },
                    { x: 100, y: 290, w: 180, h: 20, surface: 'spring' },
                    { x: 500, y: 250, w: 190, h: 20, surface: 'boost', direction: 1 },
                    { x: 300, y: 180, w: 170, h: 20 }
                ],
                desk: null, teacher: null, enemies: [
                    { x: 220, y: 330, w: 28, h: 38, dir: 1, speed: 95, phase: 0 },
                    { x: 600, y: 330, w: 28, h: 38, dir: -1, speed: 110, phase: 2 }
                ],
                reporters: [{ x: 420, startX: 420, y: 330, dir: 1, speed: 60, range: 75, timer: 0, reported: false }]
            },
            WestbridgeShop: {
                title: 'WESTBRIDGE ACADEMY: SUPPLY SHOP', color: '#fff0c9',
                doors: [{ x: 20, y: 280, w: 50, h: 100, targetRoom: 'WestbridgeHub', targetX: 120, targetY: 300 }],
                platforms: [{ x: 0, y: 380, w: 800, h: 70 }, { x: 220, y: 275, w: 360, h: 20 }],
                desk: null, teacher: null, enemies: []
            },
            WestbridgeLab: {
                title: 'WESTBRIDGE ACADEMY: LASER LAB', color: '#e8dcff',
                doors: [{ x: 20, y: 280, w: 50, h: 100, targetRoom: 'WestbridgeHub', targetX: 680, targetY: 300 }],
                platforms: [
                    { x: 0, y: 380, w: 800, h: 70 },
                    { x: 100, y: 300, w: 150, h: 20 },
                    { x: 350, y: 220, w: 130, h: 20 },
                    { x: 580, y: 290, w: 150, h: 20 }
                ],
                desk: null, teacher: null, enemies: [
                    { x: 180, y: 255, w: 28, h: 38, dir: 1, speed: 125, phase: 3, chase: true },
                    { x: 620, y: 330, w: 28, h: 38, dir: -1, speed: 135, phase: 5 }
                ]
            },
            Level2Exit: {
                title: 'WESTBRIDGE ACADEMY: ROOFTOP', color: '#dff5df',
                doors: [{ x: 370, y: 120, w: 60, h: 80, targetRoom: 'FinalExit', targetX: 400, targetY: 320 }],
                platforms: [
                    { x: 0, y: 380, w: 800, h: 70 },
                    { x: 250, y: 290, w: 300, h: 20 },
                    { x: 350, y: 200, w: 100, h: 20 }
                ],
                desk: null, teacher: null, enemies: []
            },
            FinalExit: {
                title: 'FINAL EXIT', color: '#eaffd8', doors: [],
                platforms: [{ x: 0, y: 380, w: 800, h: 70 }, { x: 250, y: 290, w: 300, h: 20 }],
                desk: null, teacher: null, enemies: []
            },
            MultiplayerArena: {
                title: 'SKYLINE SCRAMBLE', color: '#b8edff', width: 2400, doors: [],
                platforms: [
                    { x: 0, y: 380, w: 2400, h: 70, surface: 'floor' },
                    { x: 200, y: 315, w: 150, h: 18, surface: 'spring' },
                    { x: 455, y: 270, w: 160, h: 18, surface: 'boost', direction: 1 },
                    { x: 720, y: 215, w: 145, h: 18, surface: 'crumble' },
                    { x: 960, y: 300, w: 140, h: 18, surface: 'spring' },
                    { x: 1200, y: 245, w: 170, h: 18, surface: 'boost', direction: -1 },
                    { x: 1485, y: 185, w: 150, h: 18, surface: 'crumble' },
                    { x: 1730, y: 275, w: 170, h: 18, surface: 'spring' },
                    { x: 2000, y: 215, w: 150, h: 18, surface: 'boost', direction: 1 }
                ],
                pickups: [
                    { type: 'turbo', x: 485, y: 230, respawn: 0, active: true },
                    { type: 'highJump', x: 1005, y: 260, respawn: 0, active: true },
                    { type: 'shield', x: 1560, y: 145, respawn: 0, active: true }
                ],
                crystals: [
                    { x: 390, y: 295, collected: false },
                    { x: 820, y: 175, collected: false },
                    { x: 1330, y: 205, collected: false },
                    { x: 1810, y: 235, collected: false }
                ],
                hazards: [
                    { x: 640, y: 342, w: 34, h: 28, minX: 590, maxX: 900, speed: 115, direction: 1, phase: 0 },
                    { x: 1510, y: 330, w: 34, h: 28, minX: 1410, maxX: 1740, speed: 135, direction: -1, phase: 2 }
                ],
                goal: { x: 2260, y: 285, w: 54, h: 95 },
                desk: null, teacher: null, enemies: []
            }
        };

        Object.values(rooms).forEach(room => {
            room.width ||= 1600;
            const floor = room.platforms.find(platform => platform.y === 380);
            if (floor) floor.w = Math.max(floor.w, room.width);
            if (room.enemies) room.enemies.forEach(enemy => enemy.startX ??= enemy.x);
        });

        function setMovementChallenges(room, slideGateX, poundTargetX, poundReward = 4, gateWidth = 96) {
            room.slideGates = [{
                x: slideGateX, y: 336, w: gateWidth, h: 20, entered: false, rewarded: false
            }];
            room.poundTargets = [{
                x: poundTargetX, y: 354, w: 38, h: 26, broken: false, reward: poundReward
            }];
        }

        function resetMovementChallenges(room) {
            (room.slideGates || []).forEach(gate => {
                gate.entered = false;
                gate.rewarded = false;
            });
            (room.poundTargets || []).forEach(target => { target.broken = false; });
        }

        setMovementChallenges(rooms.Math, 420, 630);
        setMovementChallenges(rooms.SecondFloor, 790, 1190);
        setMovementChallenges(rooms.WestbridgeHub, 365, 675);
        setMovementChallenges(rooms.Level2Exit, 165, 590);

        const skylineArenaLevelOne = {
            title: rooms.MultiplayerArena.title,
            color: rooms.MultiplayerArena.color,
            width: rooms.MultiplayerArena.width,
            platforms: rooms.MultiplayerArena.platforms,
            pickups: rooms.MultiplayerArena.pickups,
            crystals: rooms.MultiplayerArena.crystals,
            hazards: rooms.MultiplayerArena.hazards,
            goal: rooms.MultiplayerArena.goal
        };
        const skylineArenaLevelTwo = {
            title: 'SKYLINE SCRAMBLE: NIGHT SHIFT',
            color: '#24294d',
            width: 2800,
            platforms: [
                { x: 0, y: 380, w: 2800, h: 70, surface: 'floor' },
                { x: 185, y: 320, w: 125, h: 18, surface: 'spring' },
                { x: 420, y: 270, w: 135, h: 18, surface: 'boost', direction: 1 },
                { x: 680, y: 215, w: 120, h: 18, surface: 'crumble' },
                { x: 895, y: 300, w: 130, h: 18, surface: 'spring' },
                { x: 1135, y: 245, w: 140, h: 18, surface: 'boost', direction: -1 },
                { x: 1390, y: 180, w: 125, h: 18, surface: 'crumble' },
                { x: 1635, y: 275, w: 135, h: 18, surface: 'spring' },
                { x: 1880, y: 215, w: 135, h: 18, surface: 'boost', direction: 1 },
                { x: 2135, y: 155, w: 125, h: 18, surface: 'crumble' },
                { x: 2370, y: 250, w: 145, h: 18, surface: 'spring' },
                { x: 2600, y: 195, w: 130, h: 18, surface: 'boost', direction: -1 }
            ],
            pickups: [
                { type: 'turbo', x: 465, y: 230, respawn: 0, active: true },
                { type: 'highJump', x: 1175, y: 205, respawn: 0, active: true },
                { type: 'shield', x: 2180, y: 115, respawn: 0, active: true }
            ],
            crystals: [
                { x: 350, y: 295, collected: false },
                { x: 745, y: 180, collected: false },
                { x: 1450, y: 145, collected: false },
                { x: 2450, y: 220, collected: false }
            ],
            hazards: [
                { x: 590, y: 342, w: 34, h: 28, minX: 535, maxX: 850, speed: 140, direction: 1, phase: 0 },
                { x: 1300, y: 342, w: 34, h: 28, minX: 1240, maxX: 1580, speed: 155, direction: -1, phase: 2 },
                { x: 2040, y: 342, w: 34, h: 28, minX: 1980, maxX: 2330, speed: 165, direction: 1, phase: 1 }
            ],
            goal: { x: 2735, y: 285, w: 54, h: 95 }
        };

        // Homework Dataset
        const homeworkData = {
            Math: [
                { q: "What is 7 + 5?", options: ["10", "12", "13", "75"], a: "12" },
                { q: "What is 9 - 4?", options: ["3", "4", "5", "6"], a: "5" },
                { q: "What is 3 × 4?", options: ["7", "10", "12", "14"], a: "12" },
                { q: "Which number is even?", options: ["7", "9", "11", "14"], a: "14" },
                { q: "What is 20 ÷ 5?", options: ["2", "4", "5", "10"], a: "4" },
                { q: "What comes next: 2, 4, 6, __?", options: ["7", "8", "9", "10"], a: "8" }
            ],
            ELA: [
                { q: "Which word is spelled correctly?", options: ["Because", "Becaus", "Beacuse", "Becose"], a: "Because" },
                { q: "Which is a noun?", options: ["Run", "Blue", "School", "Quickly"], a: "School" },
                { q: "Choose the best ending: 'The dog wagged __ tail.'", options: ["its", "it's", "it", "its'"], a: "its" },
                { q: "What is the opposite of 'ancient'?", options: ["Old", "Modern", "Dusty", "Tiny"], a: "Modern" },
                { q: "Which sentence is punctuated correctly?", options: ["Wow! That was close.", "Wow That was close", "Wow, That was close", "Wow! that was close."], a: "Wow! That was close." },
                { q: "A story's main character is often called the…", options: ["Setting", "Protagonist", "Paragraph", "Title"], a: "Protagonist" }
            ],
            Science: [
                { q: "What do plants use to make food?", options: ["Sunlight", "Shoes", "Sand", "Plastic"], a: "Sunlight" },
                { q: "What planet do we live on?", options: ["Mars", "Venus", "Earth", "Jupiter"], a: "Earth" },
                { q: "Water freezes at what temperature (°C)?", options: ["0", "10", "32", "100"], a: "0" },
                { q: "Which is a state of matter?", options: ["Solid", "Loud", "Fast", "Bright"], a: "Solid" },
                { q: "What organ pumps blood?", options: ["Lung", "Heart", "Brain", "Stomach"], a: "Heart" },
                { q: "The Moon orbits the…", options: ["Sun only", "Earth", "Mars", "School"], a: "Earth" }
            ],
            Gym: [
                { q: "Which helps you land safely?", options: ["Bend your knees", "Close your eyes", "Stand stiff", "Jump backward"], a: "Bend your knees" },
                { q: "What should you do before exercise?", options: ["Warm up", "Nap", "Eat a pencil", "Run into a wall"], a: "Warm up" },
                { q: "Which is a team sport?", options: ["Basketball", "Solitaire", "Chess alone", "Sleeping"], a: "Basketball" },
                { q: "What should you do if you're thirsty during exercise?", options: ["Drink water", "Ignore it forever", "Drink glue", "Eat chalk"], a: "Drink water" },
                { q: "A healthy cool-down usually involves…", options: ["Gentle movement", "Instantly falling asleep", "Sprinting forever", "Holding your breath"], a: "Gentle movement" },
                { q: "What does cardio mainly train?", options: ["Heart and lungs", "Shoelaces", "Ears", "Hair"], a: "Heart and lungs" }
            ],
            Art: [
                { q: "Which tool is best for drawing a thin line?", options: ["Pencil", "Bucket", "Eraser", "Chair"], a: "Pencil" },
                { q: "Red + blue makes…", options: ["Green", "Purple", "Orange", "Black"], a: "Purple" },
                { q: "What does an eraser do?", options: ["Removes marks", "Adds gravity", "Paints doors", "Makes music"], a: "Removes marks" },
                { q: "Which is a warm color?", options: ["Orange", "Blue", "Cyan", "Violet"], a: "Orange" }
            ],
            Computer: [
                { q: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Paint Utility", "Cool Program User", "Central Pencil Unit"], a: "Central Processing Unit" },
                { q: "Which is used to click things?", options: ["Mouse", "Monitor", "Speaker", "Printer"], a: "Mouse" },
                { q: "What does Ctrl+S usually do?", options: ["Save", "Sleep", "Sprint", "Smile"], a: "Save" },
                { q: "Which is an input device?", options: ["Keyboard", "Monitor", "Speaker", "Projector"], a: "Keyboard" }
            ],
            Cafeteria: [
                { q: "Which is usually a fruit?", options: ["Apple", "Bread", "Cheese", "Rice"], a: "Apple" },
                { q: "What should you do before eating?", options: ["Wash your hands", "Paint your fork", "Hide your lunch", "Run laps"], a: "Wash your hands" },
                { q: "Which drink is best for hydration?", options: ["Water", "Glue", "Paint", "Soda only"], a: "Water" },
                { q: "Where should trash go?", options: ["Trash can", "Floor", "Desk", "Ceiling"], a: "Trash can" }
            ],
            Music: [
                { q: "How many beats are in common 4/4 measure?", options: ["2", "3", "4", "8"], a: "4" },
                { q: "Which is a string instrument?", options: ["Guitar", "Trumpet", "Drum", "Flute"], a: "Guitar" },
                { q: "What symbol raises a note by a semitone?", options: ["Sharp", "Rest", "Clef", "Bar line"], a: "Sharp" },
                { q: "Which instrument has keys?", options: ["Piano", "Violin", "Trumpet", "Drum"], a: "Piano" }
            ]
            ,History: [
                { q: "Which came first?", options: ["The printing press", "The internet", "The moon landing", "The smartphone"], a: "The printing press" },
                { q: "A person who studies the past is a…", options: ["Historian", "Pilot", "Chemist", "Composer"], a: "Historian" },
                { q: "Ancient Egyptians used writing called…", options: ["Hieroglyphics", "Binary", "Morse code", "Braille"], a: "Hieroglyphics" }
            ],
            Chemistry: [
                { q: "Water is made from hydrogen and…", options: ["Oxygen", "Iron", "Carbon", "Gold"], a: "Oxygen" },
                { q: "A pH below 7 is…", options: ["Acidic", "Basic", "Frozen", "Metallic"], a: "Acidic" },
                { q: "Which is a gas?", options: ["Oxygen", "Brick", "Water ice", "Copper wire"], a: "Oxygen" }
            ],
            MusicClass: [
                { q: "What keeps a song's steady pulse?", options: ["Beat", "Canvas", "Paragraph", "Orbit"], a: "Beat" },
                { q: "A group of notes played together is a…", options: ["Chord", "Chapter", "Circuit", "Classroom"], a: "Chord" },
                { q: "Which instrument is played with a bow?", options: ["Violin", "Drum", "Flute", "Piano"], a: "Violin" }
            ]
        };

        const extraQuestionPools = {
            History: [
                { q: 'Which came first?', options: ['The printing press', 'The internet', 'The moon landing', 'The smartphone'], a: 'The printing press' },
                { q: 'A person who studies the past is a...', options: ['Historian', 'Pilot', 'Chemist', 'Composer'], a: 'Historian' },
                { q: 'Ancient Egyptians used writing called...', options: ['Hieroglyphics', 'Binary', 'Morse code', 'Braille'], a: 'Hieroglyphics' }
            ],
            Chemistry: [
                { q: 'Water is made from hydrogen and...', options: ['Oxygen', 'Iron', 'Carbon', 'Gold'], a: 'Oxygen' },
                { q: 'A pH below 7 is...', options: ['Acidic', 'Basic', 'Frozen', 'Metallic'], a: 'Acidic' },
                { q: 'Which is a gas?', options: ['Oxygen', 'Brick', 'Water ice', 'Copper wire'], a: 'Oxygen' }
            ],
            MusicClass: [
                { q: 'What keeps a song\'s steady pulse?', options: ['Beat', 'Canvas', 'Paragraph', 'Orbit'], a: 'Beat' },
                { q: 'A group of notes played together is a...', options: ['Chord', 'Chapter', 'Circuit', 'Classroom'], a: 'Chord' },
                { q: 'Which instrument is played with a bow?', options: ['Violin', 'Drum', 'Flute', 'Piano'], a: 'Violin' }
            ]
        };

        Object.assign(homeworkData, extraQuestionPools);

        window.addEventListener('keydown', (e) => {
            if (capturingKeybind) {
                e.preventDefault();
                const conflict = Object.entries(keybinds).find(([action, code]) => action !== capturingKeybind && code === e.code);
                if (conflict) {
                    document.getElementById('optionsStatus').innerText = `${keyLabel(e.code)} is already assigned to ${keybindLabels[conflict[0]]}. Choose another key.`;
                    return;
                }
                keybinds[capturingKeybind] = e.code;
                updateKeybindLabels();
                document.getElementById('optionsStatus').innerText = `${keybindLabels[capturingKeybind]} assigned to ${keyLabel(e.code)}.`;
                saveOptions();
                capturingKeybind = null;
                return;
            }
            const target = e.target;
            const isTextEntry = target instanceof HTMLElement
                && (target.isContentEditable || target.matches('input, textarea, select'));
            const adminModalOpen = !document.getElementById('adminModal').classList.contains('hidden');
            if (isPhoneOpen && (e.code === 'Escape' || e.code === keybinds.phone)) {
                e.preventDefault();
                togglePhone(false);
                return;
            }
            if (isTextEntry || adminModalOpen) return;
            if ((gameState === 'PLAYING' || gameState === 'PAUSED') && Object.values(keybinds).includes(e.code)) e.preventDefault();
            keys[e.code] = true;
            if (!e.repeat && e.code === keybinds.phone && (gameState === 'PLAYING' || gameState === 'PAUSED')) {
                togglePhone();
                return;
            }
            if (!e.repeat && e.code === keybinds.pause && (gameState === 'PLAYING' || gameState === 'PAUSED') && !isLevelMapOpen) togglePause();
            if (!e.repeat && e.code === keybinds.sound) toggleSound();
            if (!e.repeat && e.code === keybinds.map && (gameState === 'PLAYING' || gameState === 'PAUSED')) toggleLevelMap();
            if (!e.repeat && e.code === keybinds.quests) toggleQuestLog();
            if (!document.getElementById('questModal').classList.contains('hidden')) {
                e.preventDefault();
                return;
            }
            if (e.code === keybinds.food && gameState === 'PLAYING') useFood();
            if (e.code === keybinds.pass && gameState === 'PLAYING') useHallPass();
            if (!e.repeat && e.code === keybinds.helper && gameState === 'PLAYING') useHelper();
            if (e.code === keybinds.slack && !e.repeat) {
                setSlacking(true);
                playTone(180, 0.04);
            }
            if (e.code === keybinds.jump && gameState === 'PLAYING') {
                jumpPlayer();
            }
            if (!e.repeat && e.code === keybinds.interact && gameState === 'PLAYING') {
                interactObject();
            }
            if (e.code === keybinds.sprint && gameState === 'PLAYING') {
                setSprinting(true);
            }
            if (!e.repeat && e.code === keybinds.dash && gameState === 'PLAYING') {
                dashPlayer();
            }
            if (!e.repeat && e.code === keybinds.groundPound && gameState === 'PLAYING' && !player.grounded) {
                player.groundPounding = true;
                player.isSliding = false;
                player.vy = 850;
                player.vx = 0;
                spawnBurst(player.x + player.w / 2, player.y + player.h / 2, '#ef4444', 8);
                playTone(180, 0.05);
            }
        });

        window.addEventListener('keyup', (e) => {
            keys[e.code] = false;
            if (e.code === keybinds.groundPound) player.slideUsedUntilRelease = false;
            if (e.code === keybinds.slack) {
                setSlacking(false);
            }
            if (e.code === keybinds.sprint) setSprinting(false);
            if (e.code === keybinds.jump && gameState === 'PLAYING') {
                if (player.vy < -150) {
                    player.vy *= 0.45;
                }
            }
        });

        function setSlacking(val) {
            if (gameState === 'PLAYING') {
                isSlacking = val;
            }
        }

        function setSprinting(value) {
            if (value && (player.sprintLocked || sprintStamina <= 0)) {
                player.sprinting = false;
                document.getElementById('statusText').innerText = 'Exhausted. Hold Slack while still to refill sprint stamina.';
                return;
            }
            player.sprinting = value;
        }

        function keyLabel(code) {
            const labels = {
                Space: 'Space',
                Tab: 'Tab',
                ShiftLeft: 'Left Shift',
                ShiftRight: 'Right Shift',
                ControlLeft: 'Left Ctrl',
                ControlRight: 'Right Ctrl',
                AltLeft: 'Left Alt',
                AltRight: 'Right Alt',
                Escape: 'Escape',
                Enter: 'Enter',
                Backspace: 'Backspace',
                CapsLock: 'Caps Lock'
            };
            return labels[code] || code.replace(/^Key/, '').replace(/^Arrow/, '');
        }

        function beginKeybindCapture(action) {
            capturingKeybind = action;
            showSettingsTab('controls');
            document.getElementById('optionsStatus').innerText = `Press a key for ${keybindLabels[action]}.`;
        }

        const keybindLabels = {
            left: 'Move left',
            right: 'Move right',
            jump: 'Jump',
            interact: 'Interact',
            slack: 'Slack off',
            food: 'Use food',
            pass: 'Use hall pass',
            sprint: 'Sprint',
            dash: 'Dash',
            groundPound: 'Slide / ground pound',
            pause: 'Pause / resume',
            sound: 'Toggle sound',
            helper: 'Use helper',
            map: 'Level map',
            phone: 'Phone',
            quests: 'Quest log'
        };

        function resetKeybinds() {
            Object.assign(keybinds, defaultKeybinds);
            capturingKeybind = null;
            updateKeybindLabels();
            saveOptions();
            document.getElementById('optionsStatus').innerText = 'All controls restored to defaults.';
        }

        function showSettingsTab(tab) {
            const controlsSelected = tab === 'controls';
            document.getElementById('videoSettingsPanel').classList.toggle('hidden', controlsSelected);
            document.getElementById('controlsSettingsPanel').classList.toggle('hidden', !controlsSelected);
            document.getElementById('settingsVideoTab').classList.toggle('bg-blue-300', !controlsSelected);
            document.getElementById('settingsVideoTab').classList.toggle('bg-gray-200', controlsSelected);
            document.getElementById('settingsControlsTab').classList.toggle('bg-blue-300', controlsSelected);
            document.getElementById('settingsControlsTab').classList.toggle('bg-gray-200', !controlsSelected);
            document.getElementById('settingsVideoTab').setAttribute('aria-selected', String(!controlsSelected));
            document.getElementById('settingsControlsTab').setAttribute('aria-selected', String(controlsSelected));
        }

        function mobileAction(action, pressed = true) {
            if (!pressed) {
                if (action === 'slack') {
                    setSlacking(false);
                    isSlacking = false;
                }
                if (action === 'sprint') setSprinting(false);
                return;
            }
            if (gameState !== 'PLAYING') return;
            if (action === 'jump') jumpPlayer();
            if (action === 'interact') interactObject();
            if (action === 'slack') setSlacking(true);
            if (action === 'sprint') setSprinting(true);
            if (action === 'dash') dashPlayer();
            if (action === 'food') useFood();
            if (action === 'helper') useHelper();
            if (action === 'map') toggleLevelMap();
            if (action === 'phone') togglePhone();
            if (action === 'pause') togglePause();
        }

        function updateJoystick(event) {
            const joystick = document.getElementById('joystick');
            const knob = document.getElementById('joystickKnob');
            const bounds = joystick.getBoundingClientRect();
            const centerX = bounds.left + bounds.width / 2;
            const centerY = bounds.top + bounds.height / 2;
            const maxDistance = bounds.width * 0.34;
            const deltaX = event.clientX - centerX;
            const deltaY = event.clientY - centerY;
            const distance = Math.hypot(deltaX, deltaY);
            const deadZone = 0.12;
            const scale = distance > maxDistance ? maxDistance / distance : 1;
            const knobX = deltaX * scale;
            const knobY = deltaY * scale;
            const rawAxis = Math.max(-1, Math.min(1, deltaX / maxDistance));
            mobileMoveAxis = Math.abs(rawAxis) > deadZone
                ? Math.sign(rawAxis) * (Math.abs(rawAxis) - deadZone) / (1 - deadZone)
                : 0;
            knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
            joystick.dataset.direction = mobileMoveAxis < 0 ? 'left' : (mobileMoveAxis > 0 ? 'right' : 'neutral');
        }

        function resetJoystick() {
            document.getElementById('joystickKnob').style.transform = 'translate(-50%, -50%)';
            document.getElementById('joystick').dataset.direction = 'neutral';
            mobileMoveAxis = 0;
        }

        function releaseMobileAction(pointerId, button) {
            const action = mobileActionPointers.get(pointerId);
            if (!action) return;
            mobileAction(action, false);
            mobileActionPointers.delete(pointerId);
            button.classList.remove('is-pressed');
        }

        function clearMobileInputs() {
            mobileActionPointers.forEach(action => mobileAction(action, false));
            mobileActionPointers.clear();
            document.querySelectorAll('.mobile-action.is-pressed').forEach(button => button.classList.remove('is-pressed'));
            const joystick = document.getElementById('joystick');
            if (joystickPointerId !== null && joystick.hasPointerCapture(joystickPointerId)) {
                joystick.releasePointerCapture(joystickPointerId);
            }
            joystickPointerId = null;
            resetJoystick();
        }

        function setupJoystick() {
            const joystick = document.getElementById('joystick');
            joystick.addEventListener('pointerdown', event => {
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                event.preventDefault();
                if (joystickPointerId !== null) return;
                joystickPointerId = event.pointerId;
                try {
                    joystick.setPointerCapture(event.pointerId);
                } catch (error) {
                    joystickPointerId = null;
                    return;
                }
                updateJoystick(event);
            });
            joystick.addEventListener('pointermove', event => {
                if (event.pointerId === joystickPointerId && joystick.hasPointerCapture(event.pointerId)) updateJoystick(event);
            });
            const releaseJoystick = event => {
                if (event.pointerId !== joystickPointerId) return;
                joystickPointerId = null;
                resetJoystick();
            };
            joystick.addEventListener('pointerup', releaseJoystick);
            joystick.addEventListener('pointercancel', releaseJoystick);
            joystick.addEventListener('lostpointercapture', () => {
                joystickPointerId = null;
                resetJoystick();
            });
            document.querySelectorAll('.mobile-action').forEach(button => {
                const action = button.dataset.mobileAction;
                button.addEventListener('pointerdown', event => {
                    if (event.pointerType === 'mouse' && event.button !== 0) return;
                    event.preventDefault();
                    if (mobileActionPointers.has(event.pointerId)) return;
                    try {
                        button.setPointerCapture(event.pointerId);
                    } catch (error) {
                        return;
                    }
                    mobileActionPointers.set(event.pointerId, action);
                    button.classList.add('is-pressed');
                    mobileAction(action);
                });
                button.addEventListener('click', event => {
                    if (event.detail !== 0 || gameState !== 'PLAYING') return;
                    if (action === 'slack') {
                        isSlacking = !isSlacking;
                        setSlacking(isSlacking);
                    } else if (action === 'sprint') {
                        setSprinting(!player.sprinting);
                    } else {
                        mobileAction(action);
                    }
                });
                ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(eventName => {
                    button.addEventListener(eventName, event => releaseMobileAction(event.pointerId, button));
                });
            });
            window.addEventListener('blur', clearMobileInputs);
            window.addEventListener('blur', () => {
                keys = {};
                if (player.isSliding) {
                    player.y += player.h - 40;
                    player.h = 40;
                    player.isSliding = false;
                    player.slideTimer = 0;
                    player.slideUsedUntilRelease = false;
                }
            });
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    clearMobileInputs();
                    keys = {};
                    if (player.isSliding) {
                        player.y += player.h - 40;
                        player.h = 40;
                        player.isSliding = false;
                        player.slideTimer = 0;
                        player.slideUsedUntilRelease = false;
                    }
                }
            });
        }

        function getDifficultySettings() {
            return difficultySettings[difficulty] || difficultySettings.Normal;
        }

        function saveProgression() {
            localStorage.setItem(progressionStorageKey, JSON.stringify({
                unlockedLevels,
                hardCompletedLevels,
                extremeUnlocked,
                questStats,
                completedQuests
            }));
            questProgressDirty = false;
            questSaveTimer = 0;
        }

        function loadProgression() {
            try {
                const saved = JSON.parse(localStorage.getItem(progressionStorageKey));
                if (saved) {
                    unlockedLevels = Array.from({ length: 10 }, (_, index) => Boolean(saved.unlockedLevels?.[index]));
                    hardCompletedLevels = Array.from({ length: 10 }, (_, index) => Boolean(saved.hardCompletedLevels?.[index]));
                    extremeUnlocked = Boolean(saved.extremeUnlocked);
                    const savedQuestStats = saved.questStats;
                    if (savedQuestStats && typeof savedQuestStats === 'object') {
                        Object.keys(questStats).forEach(stat => {
                            if (stat === 'visitedRooms') {
                                questStats.visitedRooms = Array.isArray(savedQuestStats.visitedRooms)
                                    ? [...new Set(savedQuestStats.visitedRooms.filter(roomKey => typeof roomKey === 'string' && rooms[roomKey]))]
                                    : [];
                            } else {
                                const value = Number(savedQuestStats[stat]);
                                questStats[stat] = Number.isFinite(value) && value > 0 ? value : 0;
                            }
                        });
                    }
                    if (Array.isArray(saved.completedQuests)) {
                        const validQuestIds = new Set(questDefinitions.map(quest => quest.id));
                        completedQuests = [...new Set(saved.completedQuests.filter(id => validQuestIds.has(id)))];
                    }
                }
            } catch (error) {
                localStorage.removeItem(progressionStorageKey);
            }
            unlockedLevels[0] = true;
            if (!extremeUnlocked) document.getElementById('difficultyOption').value = 'Normal';
            updateLevelSelectUI();
            refreshQuestCompletionState(false);
        }

        function getQuestProgress(quest) {
            return quest.stat === 'visitedRooms' ? questStats.visitedRooms.length : questStats[quest.stat];
        }

        function refreshQuestCompletionState(announce = true) {
            let changed = false;
            questDefinitions.forEach(quest => {
                if (completedQuests.includes(quest.id) || getQuestProgress(quest) < quest.target) return;
                completedQuests.push(quest.id);
                changed = true;
                if (announce) {
                    roomBanner = { text: `QUEST COMPLETE: ${quest.title.toUpperCase()}!`, time: 2.4 };
                    document.getElementById('statusText').innerText = `🏆 Quest complete: ${quest.title}! Passive buff unlocked: ${quest.reward}`;
                    playTone(880, 0.18);
                }
            });
            if (changed) saveProgression();
            if (changed && document.getElementById('questModal') && !document.getElementById('questModal').classList.contains('hidden')) renderQuestLog();
        }

        function recordQuestProgress(stat, amount = 1) {
            if (!(stat in questStats) || stat === 'visitedRooms' || !Number.isFinite(amount) || amount <= 0) return;
            questStats[stat] += amount;
            questProgressDirty = true;
            refreshQuestCompletionState();
            if (document.getElementById('questModal') && !document.getElementById('questModal').classList.contains('hidden')) renderQuestLog();
        }

        function registerQuestRoomVisit(roomKey) {
            if (!roomKey || roomKey === 'MultiplayerArena' || questStats.visitedRooms.includes(roomKey)) return;
            questStats.visitedRooms.push(roomKey);
            questProgressDirty = true;
            refreshQuestCompletionState();
            if (document.getElementById('questModal') && !document.getElementById('questModal').classList.contains('hidden')) renderQuestLog();
        }

        function getQuestBuffs() {
            const has = id => completedQuests.includes(id);
            return {
                moveSpeed: has('campus-explorer') ? 1.08 : 1,
                homeworkCoins: has('honor-roll') ? 2 : 0,
                coinBonus: has('pocket-change') ? 1 : 0,
                jumpPower: has('spring-loaded') ? 1.1 : 1,
                coyoteTime: has('jump-around') ? 0.06 : 0,
                sprintDrain: has('track-star') ? 0.8 : 1,
                doorCooldown: has('door-to-door') ? 0.65 : 1,
                staminaRegen: has('level-legend') ? 1.2 : 1,
                alertGain: has('clean-record') ? 0.8 : 1,
                helperStrength: has('helper-hand') ? 1.25 : 1,
                energyDrain: has('after-school') ? 0.85 : 1,
                slackRecovery: has('study-break') ? 1.2 : 1
            };
        }

        function renderQuestLog() {
            const list = document.getElementById('questList');
            if (!list) return;
            list.innerHTML = questDefinitions.map(quest => {
                const progress = Math.min(quest.target, getQuestProgress(quest));
                const complete = completedQuests.includes(quest.id);
                const percent = Math.round(progress / quest.target * 100);
                return `<article class="quest-card ${complete ? 'quest-complete' : ''}">
                    <div class="flex justify-between items-start gap-2">
                        <div><h3 class="font-black">${quest.title}</h3><p class="text-xs font-bold">${quest.description}</p></div>
                        <span class="quest-badge">${complete ? 'COMPLETE' : `${percent}%`}</span>
                    </div>
                    <div class="quest-progress"><span style="width:${percent}%"></span></div>
                    <p class="text-xs font-black">${complete ? 'PASSIVE BUFF ACTIVE' : 'REWARD'}: ${quest.reward}</p>
                    <p class="text-xs font-mono">${Math.floor(progress)} / ${quest.target}</p>
                </article>`;
            }).join('');
            const count = completedQuests.length;
            document.getElementById('questCount').innerText = `${count} / ${questDefinitions.length} completed`;
            const activeBuffs = questDefinitions.filter(quest => completedQuests.includes(quest.id));
            document.getElementById('questBuffSummary').innerText = activeBuffs.length
                ? `Active passive buffs: ${activeBuffs.map(quest => quest.title).join(' • ')}`
                : 'Complete quests to unlock permanent passive buffs.';
        }

        function toggleQuestLog(forceOpen) {
            const modal = document.getElementById('questModal');
            const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : modal.classList.contains('hidden');
            if (shouldOpen === !modal.classList.contains('hidden')) return;
            if (shouldOpen && (isLevelMapOpen || isPhoneOpen)) return;
            if (shouldOpen) {
                questLogWasPaused = isPaused;
                if (gameState === 'PLAYING' || gameState === 'PAUSED') isPaused = true;
                clearMobileInputs();
                keys = {};
                setSlacking(false);
                isSlacking = false;
                setSprinting(false);
                renderQuestLog();
                modal.classList.remove('hidden');
            } else {
                modal.classList.add('hidden');
                if (gameState === 'PLAYING' || gameState === 'PAUSED') isPaused = questLogWasPaused;
                keys = {};
                if (questProgressDirty) saveProgression();
            }
        }

        function updateDynamicThemeColors() {
            const themeSelect = document.getElementById('themeOption');
            if (!themeSelect || themeSelect.value !== 'dynamic') {
                document.body.style.background = '';
                return;
            }
            const levelHue = ((selectedLevel || 1) * 38) % 360;
            const accentHue = (levelHue + 24) % 360;
            document.body.style.background = `radial-gradient(circle at top, hsl(${levelHue} 90% 88%), hsl(${accentHue} 78% 72%) 26%, hsl(${(levelHue + 56) % 360} 70% 68%) 52%, #dfe3e8 100%)`;
            document.body.style.backgroundAttachment = 'fixed';
        }

        function updateLevelSelectUI() {
            const select = document.getElementById('levelOption');
            if (!select) return;
            select.innerHTML = '';
            unlockedLevels.forEach((isUnlocked, index) => {
                const levelNumber = index + 1;
                const option = document.createElement('option');
                option.value = levelNumber;
                option.textContent = isUnlocked ? `Level ${levelNumber}` : `Level ${levelNumber} (Locked)`;
                option.disabled = !isUnlocked;
                select.appendChild(option);
            });
            selectedLevel = unlockedLevels[selectedLevel - 1] ? selectedLevel : unlockedLevels.findIndex(Boolean) + 1;
            select.value = selectedLevel;
            const difficultyOption = document.getElementById('difficultyOption');
            difficultyOption.options[3].disabled = !extremeUnlocked;
            difficultyOption.options[3].textContent = extremeUnlocked ? 'Extreme' : 'Extreme (Locked)';
            difficultyOption.value = difficulty === 'Extreme' && !extremeUnlocked ? 'Normal' : difficulty;
            document.getElementById('progressionStatus').innerText = extremeUnlocked
                ? `Level ${selectedLevel} selected. Extreme difficulty unlocked!`
                : `Level ${selectedLevel} selected. Beat every level on Hard to unlock Extreme.`;
            updateDynamicThemeColors();
        }

        function selectLevel(value) {
            const levelNumber = Number(value);
            if (unlockedLevels[levelNumber - 1]) selectedLevel = levelNumber;
            updateLevelSelectUI();
        }

        function selectDifficulty(value) {
            if (value === 'Extreme' && !extremeUnlocked) {
                difficulty = 'Normal';
                document.getElementById('difficultyOption').value = 'Normal';
                return;
            }
            difficulty = value;
            updateLevelSelectUI();
        }

        function resetTroubleMeter() {
            troubleMeter = 0;
            teacherAlertTimer = 0;
        }

        function registerLevelCompletion() {
            unlockedLevels[Math.min(level, 10) - 1] = true;
            if (level < 10) unlockedLevels[level] = true;
            if (difficulty === 'Hard') hardCompletedLevels[level - 1] = true;
            extremeUnlocked = hardCompletedLevels.every(Boolean);
            recordQuestProgress('levelsCompleted');
            if (troubleMeter === 0) recordQuestProgress('cleanLevels');
            saveProgression();
            updateLevelSelectUI();
        }

        function setupSelectedLevel() {
            resetPhoneForLevel();
            if (multiplayerSession?.gameId === 'skyline') {
                setupSkylineArena();
                return;
            }
            level = selectedLevel;
            resetTroubleMeter();
            if (level === 1) {
                resetLevelObjectives(['Math', 'ELA', 'Science', 'Gym']);
                currentRoomKey = 'Math';
            } else if (level === 2) {
                resetLevel2Platforms();
                resetLevelObjectives(['History', 'Chemistry', 'MusicClass']);
                currentRoomKey = 'WestbridgeHub';
            } else {
                currentRoomKey = setupGeneratedLevel(level);
            }
            initializeLevelSecurityCameras();
            energy = maxEnergy;
            sprintStamina = maxSprintStamina;
            player.canDoubleJump = false;
            player.canStealth = false;
            player.canDash = false;
            player.hasMasterKey = false;
            player.sprintLocked = false;
            player.x = 100;
            player.y = 300;
            player.vx = 0;
            player.vy = 0;
            checkpoint = { room: currentRoomKey, x: 100, y: 300 };
            cameraX = 0;
            doorCooldown = 0.8;
            spawnSafeTime = 1.25;
        }

        function initializeLevelSecurityCameras() {
            const hubKey = level === 1 ? 'HallwayCentral' : (level === 2 ? 'WestbridgeHub' : `Level${level}Hub`);
            getLevelMapRooms().forEach(roomKey => {
                const room = rooms[roomKey];
                if (!room) return;
                room.securityCameras = [];

                const platforms = (room.platforms || []).filter(platform =>
                    platform.y < 360 && !platform.speedX && !platform.speedY && platform.surface !== 'crumble'
                );
                if (!platforms.length) return;

                const roomHash = Array.from(roomKey).reduce((hash, character) => hash + character.charCodeAt(0), level * 17);
                if (roomKey !== hubKey && roomHash % 3 !== 0) return;
                const platform = platforms[roomHash % platforms.length];
                const mountSide = roomHash % 2 ? 1 : -1;
                room.securityCameras.push({
                    x: platform.x + (mountSide > 0 ? platform.w - 12 : 12),
                    platformY: platform.y,
                    platformHeight: platform.h,
                    rangeX: 230,
                    rangeY: 150,
                    phase: (roomHash % 100) / 100 * Math.PI * 2
                });
            });
        }

        function setupSkylineArena(targetLevel = 1, preserveScore = false) {
            const room = rooms.MultiplayerArena;
            skylineLevel = targetLevel === 2 ? 2 : 1;
            const layout = skylineLevel === 2 ? skylineArenaLevelTwo : skylineArenaLevelOne;
            room.title = layout.title;
            room.color = layout.color;
            room.width = layout.width;
            room.platforms = layout.platforms.map(platform => ({
                ...platform, crumbling: false, crumbleTimer: 0, brokenUntil: 0
            }));
            room.pickups = layout.pickups.map(pickup => ({ ...pickup, active: true, respawn: 0 }));
            room.crystals = layout.crystals.map(crystal => ({ ...crystal, collected: false }));
            room.hazards = layout.hazards.map(hazard => ({
                ...hazard, startX: hazard.x, startDirection: hazard.direction, stunned: 0
            }));
            room.goal = { ...layout.goal };
            skylinePowerups = { turbo: 0, highJump: 0, shield: 0 };
            skylineCrystals = 0;
            if (skylineLevel === 1) {
                skylineLevelStartScore = 0;
                skylineScore = 0;
            } else if (preserveScore) {
                skylineLevelStartScore = skylineScore;
            } else {
                skylineScore = skylineLevelStartScore;
            }
            skylineHudText = '';
            resetLevelObjectives([]);
            resetTroubleMeter();
            level = 1;
            currentRoomKey = 'MultiplayerArena';
            energy = maxEnergy;
            sprintStamina = maxSprintStamina;
            player.canDoubleJump = false;
            player.canStealth = false;
            player.canDash = false;
            player.hasMasterKey = false;
            player.sprintLocked = false;
            player.sprinting = false;
            player.x = 90;
            player.y = 300;
            player.vx = 0;
            player.vy = 0;
            player.grounded = false;
            player.doubleJumpsLeft = 0;
            player.dashCooldown = 0;
            player.dashTime = 0;
            cameraX = 0;
            checkpoint = { room: currentRoomKey, x: player.x, y: player.y };
            doorCooldown = 0.8;
            spawnSafeTime = 1.25;
            roomCoinsInitialized = false;
        }

        function startGame() {
            if (gameState === 'MENU') setupSelectedLevel();
            if (player.h !== 40) player.y += player.h - 40;
            player.h = 40;
            player.isSliding = false;
            player.slideTimer = 0;
            player.slideUsedUntilRelease = false;
            player.slideParticleTimer = 0;
            player.groundPounding = false;
            document.getElementById('startOverlay').classList.add('hidden');
            document.getElementById('gameOverOverlay').classList.add('hidden');
            document.getElementById('pauseOverlay').classList.add('hidden');
            const pauseButton = document.getElementById('pauseBtn');
            if (pauseButton) pauseButton.innerHTML = `<span aria-hidden="true">⏸</span> Pause (${keyLabel(keybinds.pause)})`;
            gameState = 'PLAYING';
            isPaused = false;
            lastTimestamp = 0;
            lastFrameTime = 0;
            gameTime = 0;
            resetTroubleMeter();
            initializeRoomCoins();
            updateUI();
            updateMultiplayerHud();
            lockLandscape();
            playTone(440, 0.08);
            requestAnimationFrame(gameLoop);
        }

        function getMultiplayerName() {
            const input = document.getElementById('multiplayerName');
            const name = input.value.trim().slice(0, 16);
            if (!name) {
                input.focus();
                document.getElementById('multiplayerMenuStatus').innerText = 'Choose a player name first.';
                return '';
            }
            localStorage.setItem('ntg-player-name', name);
            return name;
        }

        function getNetworkState() {
            return {
                x: player.x,
                y: player.y,
                room: currentRoomKey,
                level,
                moving: Math.abs(player.vx) > 12
            };
        }

        function getNearbyTeammate(maxDistance = 140) {
            if (!multiplayerSession) return null;
            const now = Date.now();
            return remotePlayers.find(remote => {
                const state = remote.state;
                return state && state.level === level && state.room === currentRoomKey &&
                    now - state.updatedAt < 15000 &&
                    Math.hypot((player.x + player.w / 2) - (state.x + 12), (player.y + player.h / 2) - (state.y + 20)) <= maxDistance;
            }) || null;
        }

        function updateRemoteAnimation(dt) {
            remotePlayers.forEach(remote => {
                if (!remote.state) return;
                const interpolation = Math.min(1, dt * 14);
                remote.renderX += (remote.state.x - remote.renderX) * interpolation;
                remote.renderY += (remote.state.y - remote.renderY) * interpolation;
            });
        }

        function updateRemoteRoster(players) {
            const previousPlayers = new Map(multiplayerPlayers.map(remote => [remote.id, remote]));
            multiplayerPlayers = (Array.isArray(players) ? players : []).map(remote => {
                const previous = previousPlayers.get(remote.id);
                const state = remote.state || previous?.state || null;
                return {
                    ...remote,
                    state,
                    moveDirection: previous?.state && state ? Math.sign(state.x - previous.state.x) || previous.moveDirection : (remote.moveDirection || -1),
                    renderX: previous?.state ? previous.renderX : (state?.x ?? 0),
                    renderY: previous?.state ? previous.renderY : (state?.y ?? 0)
                };
            });
            remotePlayers = multiplayerPlayers.filter(remote => remote.id !== multiplayerSession?.playerId);
            updateMultiplayerHud();
        }

        function updateRemotePlayer(remote) {
            if (!remote?.id || !remote.state) return;
            const index = multiplayerPlayers.findIndex(playerState => playerState.id === remote.id);
            const current = index >= 0 ? multiplayerPlayers[index] : null;
            const nextPlayer = {
                ...remote,
                moveDirection: current?.state ? Math.sign(remote.state.x - current.state.x) || current.moveDirection : (remote.moveDirection || -1),
                renderX: current?.state ? current.renderX : remote.state.x,
                renderY: current?.state ? current.renderY : remote.state.y
            };
            if (index < 0) multiplayerPlayers.push(nextPlayer);
            else multiplayerPlayers[index] = nextPlayer;
            remotePlayers = multiplayerPlayers.filter(playerState => playerState.id !== multiplayerSession?.playerId);
        }

        function rescueNearbyGameOverPlayer() {
            if (gameState === 'GAMEOVER' && multiplayerSession && Date.now() - lastBuddyRescue >= 60000 && getNearbyTeammate()) {
                rescueWithTeammate();
            }
        }

        async function createMultiplayerRoom(gameId = 'school') {
            const name = getMultiplayerName();
            if (!name) return;
            selectedLevel = Number(document.getElementById('levelOption').value) || selectedLevel;
            document.getElementById('multiplayerMenuStatus').innerText = `Making ${gameId === 'skyline' ? 'Skyline Scramble' : 'School Co-op'} room...`;
            try {
                const data = await window.NTGMultiplayerAPI.createRoom({
                    name,
                    gameId,
                    level: selectedLevel,
                    difficulty: document.getElementById('difficultyOption').value
                });
                connectToMultiplayerRoom(data, name, 'host');
                document.getElementById('multiplayerDirectoryModal').classList.add('hidden');
                document.getElementById('multiplayerMenuStatus').innerText = `${data.gameName} room ${data.code} created. Share code: ${data.code}`;
            } catch (error) {
                document.getElementById('multiplayerMenuStatus').innerText = error.message || 'Could not make room.';
            }
        }

        function openMultiplayerDirectory() {
            document.getElementById('multiplayerDirectoryModal').classList.remove('hidden');
            refreshMultiplayerDirectory();
        }

        function closeMultiplayerDirectory() {
            document.getElementById('multiplayerDirectoryModal').classList.add('hidden');
        }

        async function refreshMultiplayerDirectory() {
            const status = document.getElementById('multiplayerDirectoryStatus');
            status.innerText = 'Refreshing games and rooms...';
            try {
                const data = await window.NTGMultiplayerAPI.getDirectory();

                const gameList = document.getElementById('multiplayerGameList');
                gameList.replaceChildren(...data.games.map(game => {
                    const card = document.createElement('section');
                    card.className = 'border-2 border-black bg-white p-3';
                    const title = document.createElement('h4');
                    title.className = 'font-black';
                    title.textContent = game.name;
                    const description = document.createElement('p');
                    description.className = 'text-xs font-bold min-h-8';
                    description.textContent = game.description;
                    const button = document.createElement('button');
                    button.className = 'paint-button mt-2 w-full px-2 py-2 bg-green-300 font-black text-xs';
                    button.textContent = `HOST ${game.name.toUpperCase()}`;
                    button.onclick = () => createMultiplayerRoom(game.id);
                    card.append(title, description, button);
                    return card;
                }));

                const roomList = document.getElementById('multiplayerOpenRooms');
                const openRooms = (data.rooms || []).filter(room => room.playerCount < room.maxPlayers);
                if (openRooms.length === 0) {
                    const empty = document.createElement('li');
                    empty.className = 'border-2 border-dashed border-black bg-white p-3 text-sm font-bold';
                    empty.textContent = window.NTGMultiplayerAPI.getMode() === 'webrtc' 
                        ? 'GitHub Pages P2P Mode Active: Host a game and share your 5-character code with friends!'
                        : 'No open rooms yet. Host a game to start one.';
                    roomList.replaceChildren(empty);
                } else {
                    roomList.replaceChildren(...openRooms.map(room => {
                        const item = document.createElement('li');
                        item.className = 'flex items-center gap-3 border-2 border-black bg-white p-3';
                        const details = document.createElement('div');
                        details.className = 'min-w-0 flex-1';
                        const title = document.createElement('p');
                        title.className = 'font-black';
                        title.textContent = room.gameName;
                        const subtitle = document.createElement('p');
                        subtitle.className = 'text-xs font-bold';
                        subtitle.textContent = `${room.hostName} | ${room.code} | ${room.playerCount}/${room.maxPlayers}`;
                        details.append(title, subtitle);
                        const button = document.createElement('button');
                        button.className = 'paint-button px-3 py-2 bg-blue-300 font-black text-xs';
                        button.textContent = 'JOIN';
                        button.onclick = () => {
                            document.getElementById('multiplayerCode').value = room.code;
                            closeMultiplayerDirectory();
                            joinMultiplayerRoom();
                        };
                        item.append(details, button);
                        return item;
                    }));
                }
                status.innerText = `${data.games.length} games available`;
            } catch (error) {
                status.innerText = error.message || 'Could not load directory.';
            }
        }

        async function joinMultiplayerRoom() {
            const name = getMultiplayerName();
            if (!name) return;
            const status = document.getElementById('multiplayerMenuStatus');
            const code = document.getElementById('multiplayerCode').value.trim().toUpperCase();
            if (!/^[A-Z0-9]{5}$/.test(code)) {
                status.innerText = 'Enter the 5-character room code.';
                document.getElementById('multiplayerCode').focus();
                return;
            }
            status.innerText = 'Joining room...';
            try {
                const data = await window.NTGMultiplayerAPI.joinRoom({ name, code });
                connectToMultiplayerRoom(data, name, 'guest');
                document.getElementById('multiplayerMenuStatus').innerText = `Joined room ${data.code}.`;
            } catch (error) {
                status.innerText = error.message || 'Could not join room.';
            }
        }

        function connectToMultiplayerRoom(data, name, role) {
            multiplayerSession = { role, code: data.code, playerId: data.playerId, name, gameId: data.gameId || 'school', gameName: data.gameName || 'School Co-op' };
            phoneChatMessages = [];
            renderPhoneChat();
            window.NTGMultiplayerAPI.onChat(receivePhoneMessage);
            networkWorldSeed = Number(data.worldSeed) || 0;
            selectedLevel = Number(data.level) || selectedLevel;
            difficulty = data.difficulty || difficulty;
            document.getElementById('levelOption').value = selectedLevel;
            document.getElementById('difficultyOption').value = difficulty;
            document.getElementById('multiplayerCode').value = data.code;
            updateRemoteRoster(data.players || []);
            lastNetworkStateSent = null;
            lastNetworkSendTime = 0;
            startGame();
        }

        function updateMultiplayerHud() {
            const hud = document.getElementById('multiplayerHud');
            if (!multiplayerSession) {
                hud.classList.add('hidden');
                return;
            }
            const count = multiplayerPlayers.length || 1;
            document.getElementById('multiplayerRoomLabel').innerText = `ROOM ${multiplayerSession.code} | ${count}/5`;
            document.getElementById('multiplayerModalRoom').innerText = `ROOM ${multiplayerSession.code} | ${count}/5 players`;
            document.getElementById('multiplayerInviteCode').innerText = multiplayerSession.code;
            document.getElementById('multiplayerArenaStatus').classList.toggle('hidden', multiplayerSession.gameId !== 'skyline');
            document.getElementById('multiplayerInviteBtn').classList.toggle('hidden', multiplayerSession.role !== 'host');
            const list = document.getElementById('multiplayerPlayerList');
            list.replaceChildren(...multiplayerPlayers.map(remote => {
                const item = document.createElement('li');
                item.className = 'py-1';
                item.style.borderLeft = `5px solid ${remote.color || '#3b82f6'}`;
                item.style.paddingLeft = '0.5rem';
                item.textContent = remote.id === multiplayerSession.playerId ? `${remote.name} (you)` : remote.name;
                return item;
            }));
            hud.classList.remove('hidden');
            updateSkylineHud(true);
        }

        function updateSkylineHud(force = false) {
            const status = document.getElementById('multiplayerArenaStatus');
            if (!multiplayerSession || multiplayerSession.gameId !== 'skyline') {
                status.innerText = '';
                return;
            }
            const active = [];
            if (skylinePowerups.turbo > 0) active.push(`TURBO ${Math.ceil(skylinePowerups.turbo)}s`);
            if (skylinePowerups.highJump > 0) active.push(`HOP ${Math.ceil(skylinePowerups.highJump)}s`);
            if (skylinePowerups.shield > 0) active.push(`SHIELD ${Math.ceil(skylinePowerups.shield)}s`);
            const nextText = `LEVEL ${skylineLevel} | PRISMS ${skylineCrystals}/4 | SCORE ${skylineScore}${active.length ? ` | ${active.join(' ')}` : ''}`;
            if (!force && nextText === skylineHudText) return;
            skylineHudText = nextText;
            status.innerText = skylineHudText;
        }

        function clearMultiplayerSession() {
            multiplayerSession = null;
            multiplayerPlayers = [];
            remotePlayers = [];
            lastNetworkStateSent = null;
            updateMultiplayerHud();
        }

        function closeMultiplayerConnections() {
            if (!multiplayerSession) return;
            window.NTGMultiplayerAPI.leaveRoom();
            clearMultiplayerSession();
        }

        function leaveMultiplayer() {
            closeMultiplayerConnections();
            returnToMenu();
        }

        function updateMultiplayer() {
            const session = multiplayerSession;
            if (!session) return;
            const now = Date.now();
            if (now < nextNetworkSend || networkSendBusy) return;
            const state = getNetworkState();
            const previous = lastNetworkStateSent;
            const changed = !previous || Math.abs(state.x - previous.x) > 1 || Math.abs(state.y - previous.y) > 1 ||
                state.room !== previous.room || state.level !== previous.level || state.moving !== previous.moving;
            if (!changed && now - lastNetworkSendTime < 5000) return;

            nextNetworkSend = now + 50;
            lastNetworkStateSent = state;
            lastNetworkSendTime = now;
            window.NTGMultiplayerAPI.sendState(state);
        }

        if (window.NTGMultiplayerAPI) {
            window.NTGMultiplayerAPI.onRoster(players => {
                updateRemoteRoster(players);
                rescueNearbyGameOverPlayer();
            });
            window.NTGMultiplayerAPI.onPlayer(player => {
                updateRemotePlayer(player);
                rescueNearbyGameOverPlayer();
            });
            window.NTGMultiplayerAPI.onDisconnect(msg => {
                if (multiplayerSession) {
                    document.getElementById('multiplayerMenuStatus').innerText = msg || 'Room session ended.';
                    clearMultiplayerSession();
                }
            });
        }

        window.addEventListener('beforeunload', () => {
            closeMultiplayerConnections(true);
        });

        function toggleMultiplayerPanel(show) {
            if (!multiplayerSession) return;
            const modal = document.getElementById('multiplayerModal');
            const shouldShow = typeof show === 'boolean' ? show : modal.classList.contains('hidden');
            updateMultiplayerHud();
            modal.classList.toggle('hidden', !shouldShow);
        }

        async function copyRoomCode() {
            if (!multiplayerSession) return;
            try {
                await navigator.clipboard.writeText(multiplayerSession.code);
            } catch (error) {
                const codeField = document.createElement('textarea');
                codeField.value = multiplayerSession.code;
                document.body.appendChild(codeField);
                codeField.select();
                document.execCommand('copy');
                codeField.remove();
            }
            document.getElementById('multiplayerHostStatus').innerText = 'Room code copied. Send it to your friends.';
        }

        function lockLandscape() {
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {});
            }
        }

        function toggleOptions() {
            document.getElementById('optionsPanel').classList.toggle('hidden');
        }

        function toggleLevelMap(forceOpen) {
            const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !isLevelMapOpen;
            if (shouldOpen === isLevelMapOpen) return;
            if (shouldOpen && gameState !== 'PLAYING' && gameState !== 'PAUSED') return;
            if (shouldOpen && (isPhoneOpen || !document.getElementById('questModal').classList.contains('hidden'))) return;

            const mapModal = document.getElementById('levelMapModal');
            isLevelMapOpen = shouldOpen;
            clearMobileInputs();
            if (shouldOpen) {
                levelMapWasPaused = isPaused;
                isPaused = true;
                keys = {};
                setSlacking(false);
                setSprinting(false);
                mapModal.classList.remove('hidden');
                drawLevelMap();
            } else {
                mapModal.classList.add('hidden');
                isPaused = levelMapWasPaused;
                keys = {};
                setSlacking(false);
                setSprinting(false);
            }
        }

        function resetPhoneForLevel() {
            clearTimeout(phoneAnimationTimer);
            clearTimeout(phoneToastTimer);
            phoneTaken = false;
            phoneBattery = maxPhoneBattery;
            phoneBatteryDrainTimer = 5 + Math.random() * 10;
            phoneCaughtTime = 0;
            phoneChatMessages = [];
            phoneApp = 'home';
            phoneUnlocked = false;
            phoneSignalLevel = Math.floor(Math.random() * 5) + 1;
            phoneSignalTimer = 2 + Math.random() * 4;
            phoneLoadRequestId++;
            isPhoneOpen = false;
            const modal = document.getElementById('phoneModal');
            modal.classList.remove('phone-open', 'phone-closing');
            modal.classList.add('hidden');
            document.getElementById('phoneConfiscatedToast').classList.remove('phone-toast-visible');
            renderPhoneChat();
            updatePhoneStatusBar();
            updatePhoneDetectionMeter();
        }

        function updatePhoneStatusBar() {
            const batteryStatus = document.getElementById('phoneBatteryStatus');
            if (batteryStatus) batteryStatus.innerText = `${Math.round(phoneBattery)}%`;
            const batteryFill = document.getElementById('phoneBatteryFill');
            if (batteryFill) batteryFill.style.width = `${phoneBattery}%`;
            const signalBars = document.getElementById('phoneSignalBars');
            if (signalBars) {
                signalBars.dataset.level = String(phoneSignalLevel);
                signalBars.setAttribute('aria-label', `Signal strength ${phoneSignalLevel} of 5`);
            }
        }

        function updatePhoneDetectionMeter() {
            const percent = Math.min(100, Math.round(phoneCaughtTime / 5 * 100));
            const fill = document.getElementById('phoneDetectionFill');
            const label = document.getElementById('phoneDetectionPercent');
            if (fill) fill.style.width = `${percent}%`;
            if (label) label.innerText = `${percent}%`;
            const meter = document.querySelector('.phone-detection-meter');
            if (meter) meter.classList.toggle('phone-detection-danger', percent >= 60);
        }

        function getPhoneLoadDelay() {
            return [0, 2400, 1700, 1100, 550, 150][phoneSignalLevel];
        }

        function phoneHomeButtonPressed() {
            if (isPhoneOpen && phoneUnlocked) openPhoneApp('home');
        }

        function updatePhoneSignal(dt) {
            phoneSignalTimer -= dt;
            if (phoneSignalTimer <= 0) {
                phoneSignalLevel = Math.floor(Math.random() * 5) + 1;
                phoneSignalTimer = 2 + Math.random() * 4;
                updatePhoneStatusBar();
            }
            if (phoneBattery <= 0) return;
            phoneBatteryDrainTimer -= dt;
            if (phoneBatteryDrainTimer <= 0) {
                phoneBattery = Math.max(0, phoneBattery - (1 + Math.floor(Math.random() * 3)));
                phoneBatteryDrainTimer = 5 + Math.random() * 10;
                updatePhoneStatusBar();
                if (phoneBattery === 0) {
                    phoneUnlocked = false;
                    togglePhone(false);
                    document.getElementById('statusText').innerText = 'Phone battery empty. It recharges at the start of the next level.';
                }
            }
        }

        function preparePhoneLockScreen() {
            const isSetup = !phonePin;
            document.getElementById('phoneLockScreen').classList.remove('hidden');
            document.getElementById('phoneLockGreeting').classList.remove('hidden');
            document.getElementById('phonePasscodeEntry').classList.add('hidden');
            document.getElementById('phoneSwipeUnlock').classList.remove('hidden');
            document.getElementById('phoneHome').classList.add('hidden');
            document.getElementById('phoneAppPanel').classList.add('hidden');
            document.getElementById('phoneLockTitle').innerText = isSetup ? 'Set a Passcode' : 'iPear';
            document.getElementById('phoneLockMessage').innerText = isSetup
                ? 'Create a passcode to protect your phone.'
                : 'Swipe up to unlock.';
            document.getElementById('phoneLockClock').innerText = new Intl.DateTimeFormat(undefined, {
                hour: 'numeric',
                minute: '2-digit'
            }).format(new Date());
            document.getElementById('phoneLockDate').innerText = new Intl.DateTimeFormat(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            }).format(new Date());
            document.getElementById('phonePinConfirmGroup').classList.toggle('hidden', !isSetup);
            const confirmInput = document.getElementById('phonePinConfirm');
            confirmInput.required = isSetup;
            document.getElementById('phoneLockStatus').innerText = '';
            document.getElementById('phonePinInput').value = '';
            confirmInput.value = '';
            phoneActivePinInput = 'phonePinInput';
            updatePhoneStatusBar();
        }

        function beginPhoneUnlockSwipe(event) {
            phoneUnlockSwipeStartY = event.clientY;
            if (event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId);
        }

        function finishPhoneUnlockSwipe(event) {
            if (phoneUnlockSwipeStartY === null) return;
            const swipeDistance = phoneUnlockSwipeStartY - event.clientY;
            phoneUnlockSwipeStartY = null;
            if (swipeDistance >= 45) showPhonePasscodeEntry();
        }

        function cancelPhoneUnlockSwipe() {
            phoneUnlockSwipeStartY = null;
        }

        function handlePhoneUnlockSwipeKey(event) {
            if (['ArrowUp', 'Enter', ' '].includes(event.key)) {
                event.preventDefault();
                showPhonePasscodeEntry();
            }
        }

        function showPhonePasscodeEntry() {
            document.getElementById('phoneLockGreeting').classList.add('hidden');
            document.getElementById('phonePasscodeEntry').classList.remove('hidden');
            document.getElementById('phoneSwipeUnlock').classList.add('hidden');
            const isSetup = !phonePin;
            document.getElementById('phoneLockTitle').innerText = isSetup ? 'Create Passcode' : 'Enter Passcode';
            phoneActivePinInput = isSetup ? 'phonePinInput' : 'phonePinInput';
            document.getElementById(phoneActivePinInput).focus();
        }

        function addPhonePinDigit(digit) {
            if (!/^\d$/.test(digit)) return;
            const input = document.getElementById(phoneActivePinInput);
            if (!input || input.value.length >= Number(input.maxLength)) return;
            input.value += digit;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
        }

        function clearPhonePin() {
            const input = document.getElementById(phoneActivePinInput);
            if (!input) return;
            input.value = input.value.slice(0, -1);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
        }

        function setPhonePinInput(inputId) {
            if (inputId === 'phonePinInput' || inputId === 'phonePinConfirm') {
                phoneActivePinInput = inputId;
            }
        }

        function handlePhoneUnlock(event) {
            event.preventDefault();
            const input = document.getElementById('phonePinInput');
            const confirm = document.getElementById('phonePinConfirm');
            const status = document.getElementById('phoneLockStatus');
            if (phoneBattery <= 0) {
                status.innerText = 'The phone battery is empty. It recharges next level.';
                return;
            }
            if (document.getElementById('phonePasscodeEntry').classList.contains('hidden')) {
                showPhonePasscodeEntry();
                return;
            }
            if (!phonePin) {
                if (input.value !== confirm.value) {
                    status.innerText = 'Passcodes do not match.';
                    confirm.focus();
                    return;
                }
                phonePin = input.value;
                localStorage.setItem(phonePinStorageKey, phonePin);
            } else if (input.value !== phonePin) {
                status.innerText = 'Incorrect passcode.';
                input.value = '';
                input.focus();
                return;
            }
            phoneUnlocked = true;
            document.getElementById('phoneLockScreen').classList.add('hidden');
            document.getElementById('phoneHome').classList.remove('hidden');
            input.value = '';
            confirm.value = '';
        }

        function changePhonePasscode(event) {
            event.preventDefault();
            const current = document.getElementById('phoneCurrentPin').value;
            const next = document.getElementById('phoneNewPin').value;
            const confirm = document.getElementById('phoneNewPinConfirm').value;
            const status = document.getElementById('phoneSettingsStatus');
            if (current !== phonePin) {
                status.innerText = 'Current passcode is incorrect.';
                return;
            }
            if (next !== confirm) {
                status.innerText = 'New passcodes do not match.';
                return;
            }
            phonePin = next;
            localStorage.setItem(phonePinStorageKey, phonePin);
            document.getElementById('phoneSettingsForm').reset();
            status.innerText = 'Passcode updated.';
        }

        function applyPhoneWallpaper() {
            const wallpaperTargets = [
                document.getElementById('phoneLockScreen'),
                document.getElementById('phoneHome')
            ];
            const background = phoneWallpaper
                ? `linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), url("${phoneWallpaper}")`
                : '';
            wallpaperTargets.forEach(target => {
                target.style.backgroundImage = background;
                target.classList.toggle('phone-wallpaper-active', Boolean(phoneWallpaper));
            });
        }

        function setPhoneWallpaper(event) {
            const file = event.target.files?.[0];
            if (!file) return;
            const status = document.getElementById('phoneWallpaperStatus');
            if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
                status.innerText = 'Choose a PNG, JPEG, or GIF image.';
                event.target.value = '';
                return;
            }
            if (file.size > 1.5 * 1024 * 1024) {
                status.innerText = 'Image is too large. Choose a file under 1.5 MB.';
                event.target.value = '';
                return;
            }
            status.innerText = 'Loading wallpaper...';
            const reader = new FileReader();
            reader.onerror = () => {
                status.innerText = 'Could not read that image file.';
                event.target.value = '';
            };
            reader.onload = () => {
                if (typeof reader.result !== 'string') {
                    status.innerText = 'Could not read that image file.';
                    event.target.value = '';
                    return;
                }
                try {
                    localStorage.setItem(phoneWallpaperStorageKey, reader.result);
                } catch (error) {
                    status.innerText = error.name === 'QuotaExceededError'
                        ? 'Not enough browser storage for this wallpaper. Choose a smaller image.'
                        : 'Could not save the wallpaper.';
                    return;
                }
                phoneWallpaper = reader.result;
                applyPhoneWallpaper();
                status.innerText = 'Wallpaper saved for the lock and home screens.';
                event.target.value = '';
            };
            reader.readAsDataURL(file);
        }

        function resetPhoneWallpaper() {
            localStorage.removeItem(phoneWallpaperStorageKey);
            phoneWallpaper = '';
            applyPhoneWallpaper();
            document.getElementById('phoneWallpaperStatus').innerText = 'Default wallpaper restored.';
            document.getElementById('phoneWallpaperInput').value = '';
        }

        function togglePhone(forceOpen) {
            const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !isPhoneOpen;
            if (shouldOpen === isPhoneOpen) return;
            if (shouldOpen && gameState !== 'PLAYING' && gameState !== 'PAUSED') return;
            if (shouldOpen && phoneTaken) return;
            if (shouldOpen && phoneBattery <= 0) {
                document.getElementById('statusText').innerText = 'Phone battery empty. It recharges at the start of the next level.';
                return;
            }
            if (shouldOpen && (isLevelMapOpen || !document.getElementById('questModal').classList.contains('hidden'))) return;
            const modal = document.getElementById('phoneModal');
            clearTimeout(phoneAnimationTimer);
            isPhoneOpen = shouldOpen;
            phoneLoadRequestId++;
            if (shouldOpen) {
                phoneBatteryDrainTimer = 5 + Math.random() * 10;
                clearMobileInputs();
                keys = {};
                setSlacking(false);
                setSprinting(false);
                phoneApp = 'home';
                phoneUnlocked = false;
                preparePhoneLockScreen();
                modal.classList.remove('hidden');
                modal.classList.remove('phone-closing');
                modal.offsetWidth;
                modal.classList.add('phone-open');
                document.getElementById('phoneCallStatus').innerText = 'No active call.';
            } else {
                modal.classList.remove('phone-open');
                modal.classList.add('phone-closing');
                phoneAnimationTimer = setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('phone-closing');
                }, 400);
                phoneUnlocked = false;
                keys = {};
                setSlacking(false);
                setSprinting(false);
            }
        }

        function showPhoneConfiscatedToast() {
            const toast = document.getElementById('phoneConfiscatedToast');
            clearTimeout(phoneToastTimer);
            toast.classList.remove('phone-toast-visible');
            toast.offsetWidth;
            toast.classList.add('phone-toast-visible');
            phoneToastTimer = setTimeout(() => {
                toast.classList.remove('phone-toast-visible');
            }, 6500);
        }

        function openPhoneApp(app) {
            if (phoneTaken || !phoneUnlocked || phoneBattery <= 0) return;
            const requestId = ++phoneLoadRequestId;
            phoneApp = app;
            document.getElementById('phoneHome').classList.toggle('hidden', app !== 'home');
            document.getElementById('phoneAppPanel').classList.toggle('hidden', app === 'home');
            document.querySelectorAll('.phone-app-page').forEach(page => page.classList.add('hidden'));
            if (app === 'home') return;
            if (app === 'settings') {
                document.getElementById('phoneSettingsApp').classList.remove('hidden');
                document.getElementById('phoneSettingsStatus').innerText = '';
                return;
            }
            if (app === 'call') {
                document.getElementById('phoneCallApp').classList.remove('hidden');
                renderPhoneContacts();
            } else if (app === 'text') {
                document.getElementById('phoneTextApp').classList.remove('hidden');
                document.getElementById('phoneTextStatus').innerText = multiplayerSession
                    ? `Room ${multiplayerSession.code} | Messages are shared with your team.`
                    : 'Join a multiplayer room to text teammates.';
                document.getElementById('phoneChatInput').disabled = !multiplayerSession || phoneBattery <= 0;
                document.getElementById('phoneSendButton').disabled = !multiplayerSession || phoneBattery <= 0;
                renderPhoneChat();
            } else {
                const social = {
                    tiktok: {
                        title: '♪ TIKTOK',
                        posts: [
                            'POV: the bell rings and you are still in the cafeteria 😭 #schoolday',
                            'Hallway fit check! Rate the backpack setup 🎒✨',
                            'When the teacher says “one more worksheet” 💀 #relatable'
                        ]
                    },
                    snap: {
                        title: '👻 SNAP',
                        posts: [
                            'Your friends sent a snap from the courtyard 🌤️',
                            'Streaks: 3 days 🔥 Send a quick hello!',
                            'New story: someone found the secret art room 🎨'
                        ]
                    },
                    instagram: {
                        title: '📸 INSTAGRAM',
                        posts: [
                            'ntg_school: Best day to explore campus 📚❤️',
                            'artclub: Fresh paint, fresh ideas 🎨 #creative',
                            'cafeteria_reviews: Today’s mystery lunch rating: 7/10 🍕'
                        ]
                    }
                }[app];
                if (!social) return;
                document.getElementById('phoneSocialTitle').innerText = social.title;
                document.getElementById('phoneSocialContent').dataset.posts = JSON.stringify(social.posts);
                document.getElementById('phoneSocialContent').dataset.postIndex = '0';
                document.getElementById('phoneSocialContent').innerText = 'Loading feed...';
                document.getElementById('phoneSocialStatus').innerText = `Signal ${phoneSignalLevel}/5`;
                const nextButton = document.getElementById('phoneNextPostButton');
                nextButton.disabled = true;
                document.getElementById('phoneSocialApp').classList.remove('hidden');
                document.getElementById('phoneSocialStatus').innerText = `Loading at signal ${phoneSignalLevel}/5...`;
                setTimeout(() => {
                    if (requestId !== phoneLoadRequestId || !isPhoneOpen || !phoneUnlocked || phoneTaken || phoneApp !== app) return;
                    document.getElementById('phoneSocialContent').innerText = social.posts[0];
                    document.getElementById('phoneSocialStatus').innerText = `Feed loaded (signal ${phoneSignalLevel}/5).`;
                    nextButton.disabled = false;
                }, getPhoneLoadDelay());
            }
        }

        async function nextPhonePost() {
            if (!isPhoneOpen || !phoneUnlocked || phoneTaken) return;
            const content = document.getElementById('phoneSocialContent');
            const posts = JSON.parse(content.dataset.posts || '[]');
            if (!posts.length) return;
            const requestId = ++phoneLoadRequestId;
            const nextButton = document.getElementById('phoneNextPostButton');
            nextButton.disabled = true;
            const requestedSignal = phoneSignalLevel;
            document.getElementById('phoneSocialStatus').innerText = `Loading at signal ${requestedSignal}/5...`;
            await new Promise(resolve => setTimeout(resolve, getPhoneLoadDelay()));
            if (requestId !== phoneLoadRequestId || !isPhoneOpen || !phoneUnlocked || phoneTaken || phoneApp !== 'instagram' && phoneApp !== 'snap' && phoneApp !== 'tiktok') return;
            const nextIndex = (Number(content.dataset.postIndex || 0) + 1) % posts.length;
            content.dataset.postIndex = String(nextIndex);
            content.innerText = posts[nextIndex];
            document.getElementById('phoneSocialStatus').innerText = `Post loaded (signal ${requestedSignal}/5).`;
            nextButton.disabled = false;
        }

        function renderPhoneContacts() {
            const list = document.getElementById('phoneContactList');
            if (!multiplayerSession) {
                list.innerHTML = '<li class="text-xs text-slate-300">Join a multiplayer room to call teammates.</li>';
                return;
            }
            const teammates = multiplayerPlayers.filter(remote => remote.id !== multiplayerSession.playerId);
            if (!teammates.length) {
                list.innerHTML = '<li class="text-xs text-slate-300">No teammates are connected yet.</li>';
                return;
            }
            list.replaceChildren(...teammates.map(remote => {
                const item = document.createElement('li');
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'paint-button w-full px-3 py-2 bg-green-300 text-black text-left font-black text-xs';
                button.textContent = `📞 Call ${remote.name}`;
                button.onclick = () => {
                    document.getElementById('phoneCallStatus').innerText = `Calling ${remote.name}... Voice audio is not available yet.`;
                };
                item.append(button);
                return item;
            }));
        }

        function renderPhoneChat() {
            const log = document.getElementById('phoneChatLog');
            if (!log) return;
            log.replaceChildren(...phoneChatMessages.map(message => {
                const item = document.createElement('li');
                item.className = 'phone-chat-message';
                const sender = document.createElement('strong');
                sender.textContent = `${message.name}: `;
                item.append(sender, document.createTextNode(message.text));
                return item;
            }));
            log.scrollTop = log.scrollHeight;
        }

        function addPhoneChatMessage(message) {
            phoneChatMessages.push(message);
            if (phoneChatMessages.length > 100) phoneChatMessages.shift();
            renderPhoneChat();
        }

        function receivePhoneMessage(message) {
            if (!message || message.playerId === multiplayerSession?.playerId ||
                typeof message.name !== 'string' || typeof message.text !== 'string') return;
            addPhoneChatMessage({
                name: message.name.slice(0, 16),
                text: message.text.slice(0, 240)
            });
        }

        async function sendPhoneMessage(event) {
            event.preventDefault();
            const input = document.getElementById('phoneChatInput');
            const text = input.value.trim();
            if (!text || !multiplayerSession || phoneTaken || !phoneUnlocked || phoneBattery <= 0) return;
            const button = document.getElementById('phoneSendButton');
            const status = document.getElementById('phoneTextStatus');
            const requestId = ++phoneLoadRequestId;
            const requestedSignal = phoneSignalLevel;
            button.disabled = true;
            status.innerText = `Sending at signal ${requestedSignal}/5...`;
            try {
                await new Promise(resolve => setTimeout(resolve, getPhoneLoadDelay()));
                if (requestId !== phoneLoadRequestId || !isPhoneOpen || !phoneUnlocked || phoneTaken) return;
                await window.NTGMultiplayerAPI.sendChat(text);
                addPhoneChatMessage({ name: multiplayerSession.name, text });
                input.value = '';
                status.innerText = `Message sent (signal ${requestedSignal}/5).`;
            } catch (error) {
                status.innerText = error.message || 'Could not send message.';
            } finally {
                button.disabled = !multiplayerSession || phoneTaken || !phoneUnlocked;
            }
        }

        function getLevelMapRooms() {
            if (level === 1) {
                return ['Math', 'HallwayCentral', 'ELA', 'Science', 'Gym', 'Art', 'Computer', 'Cafeteria', 'Music', 'Principal'];
            }
            if (level === 2) {
                return ['WestbridgeHub', 'WestbridgeShop', 'WestbridgeLab', 'SecondFloor', 'HistoryClass', 'ChemistryClass', 'MusicClass', 'Level2Exit'];
            }
            const hubKey = `Level${level}Hub`;
            return [hubKey, `${hubKey}Special`, ...Array.from({ length: 6 }, (_, index) => `${hubKey}Class${index + 1}`), 'FinalExit'];
        }

        function getLevelMapPositions() {
            if (level === 1) {
                return {
                    Math: [90, 235], HallwayCentral: [370, 235], ELA: [690, 230],
                    Science: [500, 95], Gym: [680, 390], Art: [325, 390],
                    Computer: [100, 95], Cafeteria: [500, 390], Music: [865, 390], Principal: [825, 95]
                };
            }
            if (level === 2) {
                return {
                    WestbridgeHub: [420, 270], WestbridgeShop: [135, 145], WestbridgeLab: [135, 390],
                    SecondFloor: [420, 100], HistoryClass: [690, 90], ChemistryClass: [690, 250],
                    MusicClass: [690, 410], Level2Exit: [900, 250]
                };
            }
            const hubKey = `Level${level}Hub`;
            const positions = { [hubKey]: [105, 265], [`${hubKey}Special`]: [500, 265], FinalExit: [905, 265] };
            for (let index = 0; index < 6; index++) {
                positions[`${hubKey}Class${index + 1}`] = [390 + (index % 3) * 220, index < 3 ? 110 : 420];
            }
            return positions;
        }

        function drawLevelMap() {
            const mapCanvas = document.getElementById('levelMapCanvas');
            const mapCtx = mapCanvas.getContext('2d');
            const roomKeys = getLevelMapRooms().filter(roomKey => rooms[roomKey]);
            const roomSet = new Set(roomKeys);
            const positions = getLevelMapPositions();
            const nodeWidth = level === 1 ? 150 : 170;
            const nodeHeight = 64;

            document.getElementById('levelMapTitle').innerText = level === 1
                ? 'LEVEL 1: PRISM HIGH MAP'
                : (level === 2 ? 'LEVEL 2: WESTBRIDGE MAP' : `LEVEL ${level}: ACADEMY WING MAP`);

            mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
            mapCtx.fillStyle = '#eff8ff';
            mapCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
            mapCtx.strokeStyle = '#d0e2ef';
            mapCtx.lineWidth = 1;
            for (let x = 0; x <= mapCanvas.width; x += 32) {
                mapCtx.beginPath();
                mapCtx.moveTo(x, 0);
                mapCtx.lineTo(x, mapCanvas.height);
                mapCtx.stroke();
            }
            for (let y = 0; y <= mapCanvas.height; y += 32) {
                mapCtx.beginPath();
                mapCtx.moveTo(0, y);
                mapCtx.lineTo(mapCanvas.width, y);
                mapCtx.stroke();
            }

            const edges = new Set();
            mapCtx.strokeStyle = '#516477';
            mapCtx.lineWidth = 5;
            roomKeys.forEach(roomKey => {
                const room = rooms[roomKey];
                const [x1, y1] = positions[roomKey] || [0, 0];
                (room.doors || []).forEach(door => {
                    if (!roomSet.has(door.targetRoom) || !positions[door.targetRoom]) return;
                    const pair = [roomKey, door.targetRoom].sort();
                    const edgeKey = pair.join('|');
                    if (edges.has(edgeKey)) return;
                    edges.add(edgeKey);
                    const [x2, y2] = positions[door.targetRoom];
                    mapCtx.beginPath();
                    mapCtx.moveTo(x1, y1);
                    mapCtx.lineTo(x2, y2);
                    mapCtx.stroke();
                });
            });

            roomKeys.forEach(roomKey => {
                const room = rooms[roomKey];
                const [centerX, centerY] = positions[roomKey] || [0, 0];
                const x = centerX - nodeWidth / 2;
                const y = centerY - nodeHeight / 2;
                const isCurrent = roomKey === currentRoomKey;
                const subject = room.desk?.subject;
                const isComplete = Boolean(subject && homeworkDone[subject]);
                const isExit = roomKey === 'Principal' || roomKey === 'Level2Exit' || roomKey === 'FinalExit';
                const lines = room.title.toUpperCase().replace(/^LEVEL \d+: /, '').split(/\s+/);
                const wrapped = [];
                let line = '';
                mapCtx.font = 'bold 13px monospace';
                lines.forEach(word => {
                    const next = line ? `${line} ${word}` : word;
                    if (mapCtx.measureText(next).width > nodeWidth - 16 && line) {
                        wrapped.push(line);
                        line = word;
                    } else {
                        line = next;
                    }
                });
                if (line) wrapped.push(line);
                const textLines = wrapped.slice(0, 2);

                mapCtx.fillStyle = isCurrent ? '#ffd84d' : (isComplete ? '#a7f3d0' : (isExit ? '#c4f1c2' : '#ffffff'));
                mapCtx.strokeStyle = isCurrent ? '#8a4b00' : '#111827';
                mapCtx.lineWidth = isCurrent ? 5 : 3;
                mapCtx.fillRect(x, y, nodeWidth, nodeHeight);
                mapCtx.strokeRect(x, y, nodeWidth, nodeHeight);
                mapCtx.fillStyle = '#111827';
                mapCtx.font = 'bold 13px monospace';
                mapCtx.textAlign = 'center';
                mapCtx.textBaseline = 'middle';
                textLines.forEach((text, index) => {
                    mapCtx.fillText(text, centerX, centerY + (index - (textLines.length - 1) / 2) * 17);
                });
            });
            mapCtx.textAlign = 'left';
            mapCtx.textBaseline = 'alphabetic';
        }

        function saveOptions() {
            localStorage.setItem(optionsStorageKey, JSON.stringify({
                resolution: document.getElementById('resolutionOption').value,
                theme: document.getElementById('themeOption').value,
                fps: document.getElementById('fpsOption').value,
                keybinds
            }));
        }

        function loadOptions() {
            try {
                const savedOptions = JSON.parse(localStorage.getItem(optionsStorageKey));
                if (!savedOptions) return;

                ['resolution', 'theme', 'fps'].forEach(option => {
                    const select = document.getElementById(`${option}Option`);
                    if (savedOptions[option] && [...select.options].some(item => item.value === savedOptions[option])) {
                        select.value = savedOptions[option];
                    }
                });

                if (savedOptions.keybinds) {
                    Object.keys(keybinds).forEach(action => {
                        if (typeof savedOptions.keybinds[action] === 'string') keybinds[action] = savedOptions.keybinds[action];
                    });
                    if (savedOptions.keybinds.map === 'Tab' && !savedOptions.keybinds.phone) {
                        keybinds.map = defaultKeybinds.map;
                    }
                    if (keybinds.map === keybinds.phone) keybinds.map = defaultKeybinds.map;
                }
            } catch (error) {
                localStorage.removeItem(optionsStorageKey);
            }
        }

        function updateKeybindLabels() {
            Object.keys(keybinds).forEach(action => {
                const button = document.getElementById(`bind-${action}`);
                if (button) button.innerText = keyLabel(keybinds[action]);
            });
            const mapKeyLabel = document.getElementById('levelMapKeyLabel');
            if (mapKeyLabel) mapKeyLabel.innerText = keyLabel(keybinds.map);
            const questKeyLabel = document.getElementById('questKeyLabel');
            if (questKeyLabel) questKeyLabel.innerText = keyLabel(keybinds.quests);
            const questsButton = document.getElementById('questsBtn');
            if (questsButton) {
                questsButton.innerText = `🏆 QUESTS (${keyLabel(keybinds.quests)})`;
                questsButton.title = `Open quest log (${keyLabel(keybinds.quests)})`;
            }
            const questMenuLink = document.getElementById('questMenuLink');
            if (questMenuLink) questMenuLink.innerText = `Quests (${keyLabel(keybinds.quests)})`;
            const slackButton = document.getElementById('slackBtn');
            if (slackButton) slackButton.title = `Hold ${keyLabel(keybinds.slack)} to slack off`;
            const interactButton = document.getElementById('interactBtn');
            if (interactButton) interactButton.title = `${keyLabel(keybinds.interact)} to interact`;
            const pauseButton = document.getElementById('pauseBtn');
            if (pauseButton) {
                pauseButton.title = `${keyLabel(keybinds.pause)} to pause or resume`;
                pauseButton.innerHTML = isPaused
                    ? `<span aria-hidden="true">▶</span> Resume (${keyLabel(keybinds.pause)})`
                    : `<span aria-hidden="true">⏸</span> Pause (${keyLabel(keybinds.pause)})`;
            }
            const soundButton = document.getElementById('soundBtn');
            if (soundButton) {
                soundButton.title = `${keyLabel(keybinds.sound)} to toggle sound`;
                soundButton.innerText = `Sound: ${soundEnabled ? 'ON' : 'OFF'} (${keyLabel(keybinds.sound)})`;
            }
            const foodKeyHint = document.getElementById('shopFoodKey');
            if (foodKeyHint) foodKeyHint.innerText = keyLabel(keybinds.food);
            const passKeyHint = document.getElementById('shopPassKey');
            if (passKeyHint) passKeyHint.innerText = keyLabel(keybinds.pass);
        }

        function applyOptions() {
            const resolution = Number(document.getElementById('resolutionOption').value);
            maxFps = Number(document.getElementById('fpsOption').value);
            frameInterval = 1000 / maxFps;
            canvas.style.width = `${resolution}px`;
            canvas.style.height = `${resolution * 0.5625}px`;
            canvas.style.maxWidth = '100%';
            const appWindow = document.getElementById('appWindow');
            appWindow.style.width = `min(${resolution + 40}px, calc(100vw - 2rem))`;
            appWindow.style.maxWidth = 'none';
            const selectedTheme = document.getElementById('themeOption').value;
            document.body.dataset.theme = selectedTheme;
            if (selectedTheme === 'dynamic') {
                updateDynamicThemeColors();
            } else {
                document.body.style.background = '';
            }
            document.getElementById('optionsStatus').innerText = `${resolution}x${resolution * 0.5625} | ${maxFps} FPS applied`;
            saveOptions();
        }

        function restartGame() {
            if (multiplayerSession?.gameId === 'skyline') {
                gameState = 'GAMEOVER';
                isPaused = false;
                keys = {};
                doorIntent = false;
                lastTimestamp = 0;
                lastFrameTime = 0;
                particles = [];
                roomBanner = { text: '', time: 0 };
                setupSkylineArena(skylineLevel);
                startGame();
                return;
            }
            const retryLevel = level;
            const retrySubjects = retryLevel === 2 ? ['History', 'Chemistry', 'MusicClass'] : [...activeLevelSubjects];
            const retryAbilities = {
                canDoubleJump: player.canDoubleJump,
                canStealth: player.canStealth,
                canDash: player.canDash,
                hasMasterKey: player.hasMasterKey
            };

            energy = 100;
            sprintStamina = maxSprintStamina;
            resetLevelObjectives(retryLevel === 1 ? ['Math', 'ELA', 'Science', 'Gym'] : retrySubjects);
            isSlacking = false;
            isPaused = false;
            keys = {};
            doorIntent = false;
            lastTimestamp = 0;
            player.x = 100;
            player.y = 300;
            player.vx = 0;
            player.vy = 0;
            player.grounded = false;
            player.doubleJumpsLeft = 0;
            doorCooldown = 0;
            spawnSafeTime = 1.25;
            sprintTime = 0;
            player.sprintBoost = false;
            player.sprinting = false;
            player.sprintLocked = false;
            player.dashTime = 0;
            resetTroubleMeter();
            particles = [];
            roomBanner = { text: '', time: 0 };
            combo = 0;
            popQuizPending = null;
            popQuizShownThisLevel = false;
            isPopQuiz = false;
            slackSeconds = 0;
            activeSeconds = 0;
            level = retryLevel;
            if (retryLevel === 1) {
                coins = 0;
                inventory = { food: 0, hallPasses: 0, helpers: [] };
                roomCoinsInitialized = false;
            }
            player.canDoubleJump = retryLevel === 1 ? false : retryAbilities.canDoubleJump;
            player.canStealth = retryLevel === 1 ? false : retryAbilities.canStealth;
            player.canDash = retryLevel === 1 ? false : retryAbilities.canDash;
            player.hasMasterKey = retryLevel === 1 ? false : retryAbilities.hasMasterKey;
            currentRoomKey = retryLevel === 1 ? 'Math' : (retryLevel === 2 ? 'WestbridgeHub' : `Level${retryLevel}Hub`);
            checkpoint = { room: currentRoomKey, x: 100, y: 300 };
            cameraX = 0;
            Object.values(rooms).forEach(room => {
                if (room.teacher) {
                    const teacher = room.teacher;
                    teacher.startX ??= teacher.x;
                    teacher.x = teacher.startX;
                    teacher.patrolOriginX = teacher.startX;
                    delete teacher.patrolMinX;
                    delete teacher.patrolMaxX;
                    teacher.timer = 0;
                    teacher.state = 'WRITING';
                    teacher.nextDecision = 2 + Math.random() * 2;
                    teacher.patrolSpeed = 30 + Math.random() * 30;
                    teacher.dir = Math.random() < 0.5 ? -1 : 1;
                    teacher.facing = teacher.dir;
                    teacher.scanDirection = teacher.dir;
                    teacher.scanTimer = 0;
                    teacher.lookAtPlayer = false;
                    teacher.warned = false;
                }
                if (room.balls) room.balls = [];
                resetPlatformState(room);
                if (room.enemies) room.enemies.forEach(enemy => enemy.x = enemy.startX || enemy.x);
                if (room.reporters) room.reporters.forEach(reporter => {
                    reporter.x = reporter.startX || reporter.x;
                    reporter.timer = 0;
                    reporter.reported = false;
                });
            });
            updateUI();
            startGame();
        }

        function resetLevelObjectives(subjects) {
            homeworkDone = {};
            subjects.forEach(subject => homeworkDone[subject] = false);
            activeLevelSubjects = subjects;
            activeHomework = [];
        }

        function resetPlatformState(room) {
            (room.platforms || []).forEach(platform => {
                platform.crumbling = false;
                platform.crumbleTimer = 0;
                platform.brokenUntil = 0;
            });
            resetMovementChallenges(room);
        }

        function resetLevel2Platforms() {
            ['WestbridgeHub', 'SecondFloor', 'HistoryClass', 'ChemistryClass', 'MusicClass'].forEach(roomKey => {
                resetPlatformState(rooms[roomKey]);
            });
        }

        const generatedLevelLayouts = [
            {
                title: 'LEVEL 3: GREENHOUSE CLIMB', style: 'greenhouse', width: 3280, color: '#e9ffe9', accent: '#22c55e',
                platforms: [[120, 325, 190], [450, 270, 150], [780, 210, 170], [1110, 150, 160], [1440, 215, 185], [1770, 285, 200], [2100, 225, 170], [2430, 155, 185], [2760, 285, 200]],
                platformFeatures: { 1: ['spring'], 6: ['spring'] },
                classroomPlatforms: [[90, 310, 175], [365, 235, 160], [630, 285, 190]],
                classroomColors: ['#dcfce7', '#d1fae5', '#ecfccb', '#cffafe'],
                doorY: [195, 235, 165, 185, 170, 220], exitX: 2770, teacherX: 1180, teacherRange: 152,
                enemySpeed: 1.08, reporterSpeed: 1.12, enemyLanes: [0.17, 0.48, 0.75], reporterLanes: [0.3, 0.66],
                movingPlatforms: [{ x: 790, y: 190, w: 130, h: 20, speedY: 42, minY: 120, maxY: 295 }, { x: 2050, y: 220, w: 145, h: 20, speedX: 65, minX: 1960, maxX: 2390 }]
            },
            {
                title: 'LEVEL 4: CLOCKWORK SCIENCE WING', style: 'science', width: 3320, color: '#e0f7fa', accent: '#06b6d4',
                platforms: [[120, 300, 270], [540, 300, 235], [915, 230, 150], [1190, 160, 145], [1475, 230, 265], [1870, 300, 250], [2260, 230, 155], [2550, 160, 150], [2850, 230, 320]],
                platformFeatures: { 2: ['boost', 1], 6: ['boost', -1] },
                classroomPlatforms: [[115, 295, 180], [395, 225, 160], [655, 285, 185]],
                classroomColors: ['#cffafe', '#dbeafe', '#e0f2fe', '#ccfbf1'],
                doorY: [200, 170, 180, 230, 165, 185], exitX: 2940, teacherX: 1460, teacherRange: 160,
                enemySpeed: 1.14, reporterSpeed: 1.18, enemyLanes: [0.22, 0.58, 0.84], reporterLanes: [0.4, 0.73],
                movingPlatforms: [{ x: 845, y: 270, w: 125, h: 20, speedY: 52, minY: 135, maxY: 315 }, { x: 2170, y: 205, w: 125, h: 20, speedY: 44, minY: 120, maxY: 285 }]
            },
            {
                title: 'LEVEL 5: ARTISTS’ ATRIUM', style: 'atrium', width: 3370, color: '#ffe9f2', accent: '#ec4899',
                platforms: [[100, 330, 210], [430, 270, 180], [760, 210, 170], [1090, 150, 175], [1420, 210, 230], [1750, 270, 195], [2080, 330, 235], [2420, 270, 190], [2740, 210, 250], [3090, 150, 180]],
                platformFeatures: { 3: ['crumble'], 7: ['crumble'] },
                classroomPlatforms: [[80, 300, 180], [365, 220, 165], [650, 285, 190]],
                classroomColors: ['#fce7f3', '#fae8ff', '#ffe4e6', '#fef3c7'],
                doorY: [235, 180, 165, 205, 175, 225], exitX: 3070, teacherX: 1540, teacherRange: 168,
                enemySpeed: 1.2, reporterSpeed: 1.22, enemyLanes: [0.14, 0.39, 0.66, 0.86], reporterLanes: [0.27, 0.57, 0.78],
                movingPlatforms: [{ x: 1170, y: 185, w: 135, h: 20, speedX: 70, minX: 1040, maxX: 1480 }, { x: 2490, y: 250, w: 130, h: 20, speedY: 40, minY: 135, maxY: 315 }]
            },
            {
                title: 'LEVEL 6: THE FLOODED ARCHIVES', style: 'archives', width: 3400, color: '#e0f2fe', accent: '#0ea5e9',
                platforms: [[110, 320, 235], [470, 250, 155], [780, 315, 190], [1110, 255, 240], [1480, 190, 165], [1800, 255, 205], [2150, 320, 250], [2530, 255, 175], [2850, 190, 230], [3210, 270, 150]],
                platformFeatures: { 2: ['spring'], 7: ['spring'] },
                classroomPlatforms: [[100, 300, 220], [420, 220, 155], [690, 295, 195]],
                classroomColors: ['#e0f2fe', '#dbeafe', '#cffafe', '#ede9fe'],
                doorY: [215, 170, 220, 165, 180, 245], exitX: 3240, teacherX: 1770, teacherRange: 176,
                enemySpeed: 1.27, reporterSpeed: 1.3, enemyLanes: [0.18, 0.43, 0.71, 0.9], reporterLanes: [0.32, 0.62, 0.82],
                movingPlatforms: [{ x: 990, y: 210, w: 135, h: 20, speedX: 62, minX: 850, maxX: 1240 }, { x: 2250, y: 215, w: 135, h: 20, speedY: 48, minY: 145, maxY: 305 }]
            },
            {
                title: 'LEVEL 7: ROOFTOP SKYBRIDGE', style: 'skybridge', width: 3510, color: '#fef3c7', accent: '#f97316',
                platforms: [[100, 325, 215], [470, 260, 160], [840, 195, 175], [1210, 130, 170], [1580, 195, 175], [1950, 260, 215], [2380, 325, 250], [2830, 260, 175], [3200, 195, 235]],
                platformFeatures: { 3: ['boost', 1], 7: ['boost', -1] },
                classroomPlatforms: [[100, 300, 175], [390, 220, 165], [680, 285, 190]],
                classroomColors: ['#fef3c7', '#ffedd5', '#fee2e2', '#fef9c3'],
                doorY: [235, 180, 165, 205, 175, 240], exitX: 3340, teacherX: 1960, teacherRange: 184,
                enemySpeed: 1.34, reporterSpeed: 1.38, enemyLanes: [0.16, 0.37, 0.61, 0.82], reporterLanes: [0.28, 0.55, 0.78],
                movingPlatforms: [{ x: 1560, y: 230, w: 145, h: 20, speedX: 82, minX: 1480, maxX: 1790 }, { x: 2800, y: 185, w: 135, h: 20, speedY: 46, minY: 115, maxY: 290 }]
            },
            {
                title: 'LEVEL 8: THE AFTER-HOURS MUSEUM', style: 'museum', width: 3650, color: '#ede9fe', accent: '#8b5cf6',
                platforms: [[100, 305, 280], [500, 235, 165], [840, 165, 175], [1190, 235, 280], [1590, 305, 190], [1940, 235, 185], [2290, 165, 275], [2680, 235, 180], [3020, 305, 280], [3430, 235, 165]],
                platformFeatures: { 2: ['crumble'], 7: ['crumble'] },
                classroomPlatforms: [[100, 290, 235], [435, 210, 165], [730, 285, 205]],
                classroomColors: ['#ede9fe', '#fae8ff', '#e0e7ff', '#fce7f3'],
                doorY: [185, 165, 210, 175, 170, 220], exitX: 3460, teacherX: 2070, teacherRange: 192,
                enemySpeed: 1.42, reporterSpeed: 1.44, enemyLanes: [0.2, 0.49, 0.77], reporterLanes: [0.35, 0.68],
                movingPlatforms: [{ x: 1060, y: 210, w: 145, h: 20, speedX: 72, minX: 950, maxX: 1370 }, { x: 2290, y: 230, w: 140, h: 20, speedY: 54, minY: 150, maxY: 315 }]
            },
            {
                title: 'LEVEL 9: THE STORM DRAIN', style: 'storm', width: 3760, color: '#dbeafe', accent: '#3b82f6',
                platforms: [[100, 330, 180], [440, 270, 150], [780, 205, 150], [1120, 140, 150], [1460, 205, 220], [1830, 270, 170], [2180, 330, 200], [2540, 270, 170], [2890, 205, 150], [3230, 140, 220], [3590, 245, 150]],
                platformFeatures: { 3: ['spring'], 8: ['spring'] },
                classroomPlatforms: [[100, 300, 180], [390, 220, 160], [680, 285, 200]],
                classroomColors: ['#dbeafe', '#cffafe', '#e0f2fe', '#e0e7ff'],
                doorY: [240, 185, 165, 220, 175, 190], exitX: 3560, teacherX: 2220, teacherRange: 200,
                enemySpeed: 1.5, reporterSpeed: 1.52, enemyLanes: [0.13, 0.34, 0.57, 0.8, 0.92], reporterLanes: [0.25, 0.49, 0.73],
                movingPlatforms: [{ x: 750, y: 175, w: 130, h: 20, speedY: 56, minY: 105, maxY: 300 }, { x: 2370, y: 240, w: 135, h: 20, speedX: 78, minX: 2300, maxX: 2690 }, { x: 3190, y: 170, w: 125, h: 20, speedY: 50, minY: 100, maxY: 275 }]
            },
            {
                title: 'LEVEL 10: PRISM TOWER', style: 'prism', width: 3870, color: '#f3e8ff', accent: '#a855f7',
                platforms: [[100, 335, 195], [450, 285, 160], [800, 235, 150], [1150, 185, 145], [1500, 135, 145], [1850, 85, 175], [2210, 135, 195], [2590, 185, 155], [2940, 235, 150], [3290, 285, 195], [3650, 180, 150]],
                platformFeatures: { 1: ['spring'], 5: ['boost', 1], 9: ['crumble'] },
                classroomPlatforms: [[100, 300, 185], [390, 225, 165], [680, 285, 205]],
                classroomColors: ['#f3e8ff', '#fae8ff', '#e0e7ff', '#cffafe'],
                doorY: [245, 205, 185, 165, 175, 220], exitX: 3660, teacherX: 2370, teacherRange: 208,
                enemySpeed: 1.62, reporterSpeed: 1.62, enemyLanes: [0.15, 0.36, 0.58, 0.79, 0.91], reporterLanes: [0.28, 0.52, 0.76],
                movingPlatforms: [{ x: 1280, y: 190, w: 130, h: 20, speedY: 58, minY: 75, maxY: 300 }, { x: 2150, y: 230, w: 145, h: 20, speedX: 88, minX: 2100, maxX: 2530 }, { x: 3320, y: 120, w: 135, h: 20, speedY: 48, minY: 70, maxY: 260 }]
            }
        ];

        function createGeneratedQuestions(subject, levelNumber) {
            const base = homeworkData[subject] || homeworkData.Math;
            const variants = {
                Math: [
                    { q: `A school route has ${levelNumber + 3} rooms and each has 4 desks. How many desks?`, options: [String((levelNumber + 3) * 4), String((levelNumber + 3) * 3), String(levelNumber + 7), String((levelNumber + 3) + 4)], a: String((levelNumber + 3) * 4) },
                    { q: `What is ${levelNumber * 7 + 18} - ${levelNumber + 5}?`, options: [String(levelNumber * 7 + 13), String(levelNumber * 7 + 23), String(levelNumber + 13), String(levelNumber * 7 + 5)], a: String(levelNumber * 7 + 13) },
                    { q: `A meter is at ${levelNumber + 1} and rises by 2. What is the new reading?`, options: [String(levelNumber + 3), String(levelNumber + 1), String(levelNumber + 2), String(levelNumber + 4)], a: String(levelNumber + 3) },
                    { q: `Which fraction is equal to ${levelNumber % 2 ? '1/2' : '2/4'}?`, options: ['1/4', '1/2', '3/4', '2/3'], a: '1/2' }
                ],
                ELA: [
                    { q: 'Which sentence uses a semicolon correctly?', options: ['I ran; because I was late.', 'I ran; I was late.', 'I; ran I was late.', 'I ran I; was late.'], a: 'I ran; I was late.' },
                    { q: 'In “The hallway whispered,” what device gives the hallway a human action?', options: ['Simile', 'Personification', 'Rhyme', 'Alliteration'], a: 'Personification' },
                    { q: 'Which word is an adverb?', options: ['Carefully', 'Careful', 'Care', 'Cared'], a: 'Carefully' },
                    { q: 'What is the best summary of a passage?', options: ['Every tiny detail', 'The main idea and key points', 'Only the title', 'A random opinion'], a: 'The main idea and key points' }
                ],
                Science: [
                    { q: 'Which force pulls objects toward Earth?', options: ['Friction', 'Gravity', 'Magnetism', 'Buoyancy'], a: 'Gravity' },
                    { q: 'What is the process by which liquid becomes gas?', options: ['Condensation', 'Evaporation', 'Freezing', 'Melting'], a: 'Evaporation' },
                    { q: 'Which part of a cell contains genetic material?', options: ['Nucleus', 'Cell wall', 'Vacuole', 'Ribosome'], a: 'Nucleus' },
                    { q: 'An object moving at a steady speed in a straight line has balanced…', options: ['Colors', 'Forces', 'Masses', 'Temperatures'], a: 'Forces' }
                ],
                Gym: [
                    { q: 'Which training principle gradually increases challenge?', options: ['Overload', 'Inactivity', 'Dehydration', 'Skipping'], a: 'Overload' },
                    { q: 'What does a pulse measure?', options: ['Heart beats', 'Lung size', 'Bone length', 'Body temperature'], a: 'Heart beats' },
                    { q: 'Which is a component of physical fitness?', options: ['Flexibility', 'Laziness', 'Noise', 'Luck'], a: 'Flexibility' },
                    { q: 'Why is recovery important after exercise?', options: ['It helps the body repair', 'It removes all skill', 'It stops hydration', 'It weakens muscles'], a: 'It helps the body repair' }
                ],
                Art: [
                    { q: 'Which principle describes how light or dark a color appears?', options: ['Value', 'Texture', 'Balance', 'Pattern'], a: 'Value' },
                    { q: 'A painting that shows objects arranged in a scene is a…', options: ['Still life', 'Blueprint', 'Map key', 'Timeline'], a: 'Still life' },
                    { q: 'Which pair are complementary colors?', options: ['Red and green', 'Red and orange', 'Blue and purple', 'Yellow and orange'], a: 'Red and green' },
                    { q: 'What does texture describe in artwork?', options: ['How a surface feels or looks', 'The artwork size only', 'The artist name', 'The frame price'], a: 'How a surface feels or looks' }
                ],
                Computer: [
                    { q: 'What does a web browser display?', options: ['Web pages', 'Only music', 'Paper books', 'Lunch menus only'], a: 'Web pages' },
                    { q: 'Which symbol commonly starts a comment in JavaScript?', options: ['//', '##', '<!--', '**'], a: '//' },
                    { q: 'What is a strong password more likely to contain?', options: ['Mixed characters', 'Your first name only', 'The word password', 'One digit only'], a: 'Mixed characters' },
                    { q: 'What does RAM help a computer do?', options: ['Hold active data', 'Print paper', 'Charge a battery', 'Cool the keyboard'], a: 'Hold active data' }
                ],
                Cafeteria: [
                    { q: 'Which nutrient helps build and repair muscles?', options: ['Protein', 'Water vapor', 'Ink', 'Plastic'], a: 'Protein' },
                    { q: 'Why should perishable food be kept cold?', options: ['To slow harmful bacteria', 'To make it heavier', 'To change its color', 'To remove all flavor'], a: 'To slow harmful bacteria' },
                    { q: 'Which is a whole grain?', options: ['Brown rice', 'Candy bar', 'Soda', 'Butter'], a: 'Brown rice' },
                    { q: 'What does a balanced meal include?', options: ['Several food groups', 'Only one candy', 'No water', 'Only salt'], a: 'Several food groups' }
                ],
                Music: [
                    { q: 'What does tempo describe?', options: ['How fast music is played', 'How high a chair is', 'The song title', 'The instrument color'], a: 'How fast music is played' },
                    { q: 'Which dynamic marking means very loud?', options: ['Fortissimo', 'Pianissimo', 'Ritardando', 'Adagio'], a: 'Fortissimo' },
                    { q: 'A repeated musical idea is called a…', options: ['Motif', 'Paragraph', 'Polygon', 'Hypothesis'], a: 'Motif' },
                    { q: 'Which family does the trumpet belong to?', options: ['Brass', 'String', 'Percussion', 'Keyboard'], a: 'Brass' }
                ],
                History: [
                    { q: 'What is a primary source?', options: ['Evidence from the time studied', 'A modern guess', 'A fictional story only', 'A math formula'], a: 'Evidence from the time studied' },
                    { q: 'What does a timeline show?', options: ['Events in chronological order', 'Only map distances', 'Weather by color', 'A list of foods'], a: 'Events in chronological order' },
                    { q: 'Which invention greatly increased the spread of books?', options: ['Printing press', 'Compass only', 'Steam shovel', 'Light bulb'], a: 'Printing press' },
                    { q: 'Why do historians compare multiple sources?', options: ['To check reliability', 'To make time stop', 'To avoid evidence', 'To change geography'], a: 'To check reliability' }
                ],
                Chemistry: [
                    { q: 'What is the smallest unit of an element?', options: ['Atom', 'Organ', 'Planet', 'Pixel'], a: 'Atom' },
                    { q: 'A substance with a pH of 7 is usually…', options: ['Neutral', 'Strongly acidic', 'Metallic', 'Frozen'], a: 'Neutral' },
                    { q: 'What happens when many substances dissolve in water?', options: ['A solution forms', 'A planet forms', 'It becomes a solid instantly', 'The water vanishes'], a: 'A solution forms' },
                    { q: 'Which state of matter keeps its own volume but takes its container shape?', options: ['Liquid', 'Solid', 'Gas', 'Plasma only'], a: 'Liquid' }
                ],
                MusicClass: [
                    { q: 'What is the distance between two musical pitches called?', options: ['Interval', 'Chapter', 'Vector', 'Paragraph'], a: 'Interval' },
                    { q: 'Which clef is commonly used for higher notes?', options: ['Treble clef', 'Bass clef', 'Rest clef', 'Drum clef'], a: 'Treble clef' },
                    { q: 'What does a rest tell a musician to do?', options: ['Be silent', 'Play faster', 'Change instruments', 'Repeat the title'], a: 'Be silent' },
                    { q: 'Which family includes drums and cymbals?', options: ['Percussion', 'Brass', 'Woodwind', 'String'], a: 'Percussion' }
                ]
            };
            const levelVariants = variants[subject] || [];
            return [...base, ...levelVariants].map(item => ({
                q: `LEVEL ${levelNumber}: ${item.q}`,
                options: [...item.options],
                a: item.a
            }));
        }

        const generatedSpecialRooms = [
            {
                title: 'LEVEL 3: BLOOM VAULT',
                color: '#dcfce7',
                reward: { coins: 35, food: 1 },
                prize: { x: 365, y: 215 },
                platforms: [[120, 300, 145, 'spring'], [330, 235, 145], [535, 300, 145]]
            },
            {
                title: 'LEVEL 4: CHRONO LAB',
                color: '#cffafe',
                reward: { coins: 40, hallPasses: 1 },
                prize: { x: 355, y: 200 },
                platforms: [[100, 300, 150], [320, 220, 145, 'boost'], [535, 300, 150]]
            },
            {
                title: 'LEVEL 5: HALL OF MASTERPIECES',
                color: '#fce7f3',
                reward: { coins: 45, helpers: 2 },
                prize: { x: 330, y: 200 },
                platforms: [[100, 295, 135, 'crumble'], [295, 220, 155], [515, 155, 155], [605, 300, 100]]
            },
            {
                title: 'LEVEL 6: SUNKEN TREASURY',
                color: '#dbeafe',
                reward: { coins: 50, food: 2 },
                prize: { x: 500, y: 225 },
                platforms: [[90, 285, 145], [285, 315, 155, 'spring'], [490, 245, 145], [635, 300, 90]]
            },
            {
                title: 'LEVEL 7: STARWATCH DECK',
                color: '#ffedd5',
                reward: { coins: 55, hallPasses: 1, helpers: 1 },
                prize: { x: 505, y: 160 },
                platforms: [[100, 310, 145], [305, 245, 135, 'boost'], [500, 180, 150], [625, 290, 105]]
            },
            {
                title: 'LEVEL 8: AFTER-HOURS GALLERY',
                color: '#ede9fe',
                reward: { coins: 65, helpers: 3 },
                prize: { x: 530, y: 170 },
                platforms: [[100, 300, 155], [320, 245, 145], [525, 190, 145, 'crumble'], [620, 300, 100]]
            },
            {
                title: 'LEVEL 9: STORM CORE',
                color: '#dbeafe',
                reward: { coins: 70, food: 2, hallPasses: 1 },
                prize: { x: 490, y: 150 },
                platforms: [[95, 300, 135], [290, 235, 135, 'spring'], [485, 170, 135], [625, 295, 105]]
            },
            {
                title: 'LEVEL 10: PRISM CROWN CHAMBER',
                color: '#f3e8ff',
                reward: { coins: 100, food: 2, hallPasses: 1, helpers: 3 },
                prize: { x: 485, y: 190 },
                platforms: [[90, 320, 135], [285, 270, 135, 'spring'], [475, 210, 135, 'boost'], [625, 300, 105]]
            }
        ];

        function setupGeneratedLevel(levelNumber) {
            const hubKey = `Level${levelNumber}Hub`;
            const layout = generatedLevelLayouts[levelNumber - 3];
            if (!layout) throw new Error(`No generated level layout configured for level ${levelNumber}.`);
            const specialRoom = generatedSpecialRooms[levelNumber - 3];
            if (!specialRoom) throw new Error(`No special room configured for level ${levelNumber}.`);
            const specialRoomKey = `${hubKey}Special`;
            const subjectPool = ['History', 'Chemistry', 'MusicClass', 'Math', 'Science', 'ELA', 'Art', 'Computer', 'Cafeteria', 'Gym'];
            const classOrder = multiplayerSession
                ? seededShuffleArray(subjectPool, (networkWorldSeed ^ Math.imul(levelNumber, 0x9e3779b1)) >>> 0)
                : shuffleArray(subjectPool);
            const classSubjects = classOrder.slice(0, 6);
            const generatedSubjects = classSubjects.map((subject, index) => `L${levelNumber}C${index + 1}`);
            const classDoorHeights = layout.doorY;
            const classDoors = generatedSubjects.map((subject, index) => ({
                x: 170 + Math.round((layout.width - 650) * (index / 5)),
                y: classDoorHeights[index % classDoorHeights.length],
                w: 70,
                h: 100,
                targetRoom: `${hubKey}Class${index + 1}`,
                targetX: 100,
                targetY: 300,
                label: `${classSubjects[index]} classroom`
            }));
            classDoors.push({
                x: layout.exitX,
                y: 280,
                w: 80,
                h: 100,
                targetRoom: 'FinalExit',
                targetX: 400,
                targetY: 320,
                reqLevelSubjects: true,
                isLevelExit: true,
                label: `Level ${levelNumber} exit`
            });
            const specialDoorX = Math.round(layout.width * 0.48);
            classDoors.push({
                x: specialDoorX,
                y: 280,
                w: 70,
                h: 100,
                targetRoom: specialRoomKey,
                targetX: 100,
                targetY: 300,
                label: specialRoom.title
            });

            const doorPlatforms = classDoors.map(door => ({
                x: Math.max(0, door.x - 35),
                y: door.y + door.h,
                w: door.w + 70,
                h: 20
            }));
            const platformSpeed = getDifficultySettings().platformSpeed;
            const movingPlatforms = layout.movingPlatforms.map(platform => ({
                ...platform,
                speedX: platform.speedX ? platform.speedX * platformSpeed : undefined,
                speedY: platform.speedY ? platform.speedY * platformSpeed : undefined
            }));

            rooms[hubKey] = {
                title: layout.title,
                color: layout.color,
                levelStyle: layout.style,
                levelAccent: layout.accent,
                width: layout.width,
                doors: classDoors,
                platforms: [
                    { x: 0, y: 380, w: layout.width, h: 70 },
                    ...layout.platforms.map(([x, y, w], index) => {
                        const [surface, direction] = layout.platformFeatures[index] || [];
                        return { x, y, w, h: 20, ...(surface ? { surface } : {}), ...(direction ? { direction } : {}) };
                    }),
                    ...doorPlatforms,
                    ...movingPlatforms
                ],
                desk: null,
                teacher: { x: layout.teacherX, y: 330, range: layout.teacherRange, dir: 1, timer: 0, state: 'WRITING' },
                enemies: [
                    ...layout.enemyLanes.map((lane, index) => {
                        const x = Math.round(layout.width * lane);
                        return {
                            x,
                            startX: x,
                            y: 330,
                            w: 28,
                            h: 38,
                            dir: index % 2 ? -1 : 1,
                            speed: (90 + levelNumber * 8 + index * 10) * layout.enemySpeed * getDifficultySettings().enemySpeed,
                            phase: levelNumber + index * 2,
                            chase: levelNumber > 3 && index === 1 || levelNumber > 6 && index === 2
                        };
                    })
                ],
                reporters: layout.reporterLanes.map((lane, index) => {
                    const x = Math.round(layout.width * lane);
                    return {
                        x,
                        startX: x,
                        y: 330,
                        dir: index % 2 ? -1 : 1,
                        speed: (55 + levelNumber * 3 + index * 8) * layout.reporterSpeed,
                        range: 75 + index * 10,
                        timer: 0,
                        reported: false
                    };
                })
            };
            setMovementChallenges(
                rooms[hubKey],
                Math.round(layout.width * 0.34),
                Math.round(layout.width * 0.72),
                levelNumber + 1,
                84 + levelNumber % 4 * 8
            );

            rooms[specialRoomKey] = {
                title: specialRoom.title,
                color: specialRoom.color,
                levelStyle: layout.style,
                levelAccent: layout.accent,
                doors: [{ x: 20, y: 280, w: 55, h: 100, targetRoom: hubKey, targetX: specialDoorX - 90, targetY: 300 }],
                platforms: [
                    { x: 0, y: 380, w: 800, h: 70 },
                    ...specialRoom.platforms.map(([x, y, w, surface]) => ({ x, y, w, h: 20, ...(surface ? { surface } : {}) }))
                ],
                desk: null,
                teacher: null,
                enemies: [],
                prize: { ...specialRoom.reward, ...specialRoom.prize, claimed: false }
            };

            generatedSubjects.forEach((subject, index) => {
                homeworkData[subject] = createGeneratedQuestions(classSubjects[index], levelNumber);
                const classroomColor = layout.classroomColors[index % layout.classroomColors.length];
                rooms[`${hubKey}Class${index + 1}`] = {
                    title: `LEVEL ${levelNumber}: ${classSubjects[index].toUpperCase()}`,
                    color: classroomColor,
                    levelStyle: layout.style,
                    levelAccent: layout.accent,
                    width: 1200,
                    doors: [{ x: 20, y: 280, w: 50, h: 100, targetRoom: hubKey, targetX: 280 + index * 370, targetY: 300 }],
                    platforms: [
                        { x: 0, y: 380, w: 1200, h: 70 },
                        ...layout.classroomPlatforms.map(([x, y, w]) => ({ x, y, w, h: 20 }))
                    ],
                    desk: { x: 500, y: 170, w: 60, h: 50, subject },
                    teacher: { x: 620, y: 330, range: 120 + levelNumber * 6, dir: index % 2 ? -1 : 1, timer: 0, state: 'WRITING' },
                    reporters: [{ x: 270, startX: 270, y: 330, dir: 1, speed: 45 + levelNumber * 4, range: 65, timer: 0, reported: false }]
                };
            });

            resetLevelObjectives(generatedSubjects);
            return hubKey;
        }

        function startLevel2() {
            resetPhoneForLevel();
            level = 2;
            resetLevel2Platforms();
            resetLevelObjectives(['History', 'Chemistry', 'MusicClass']);
            resetTroubleMeter();
            energy = maxEnergy;
            sprintStamina = maxSprintStamina;
            player.sprintLocked = false;
            popQuizPending = null;
            popQuizShownThisLevel = false;
            isPopQuiz = false;
            gameState = 'PLAYING';
            document.getElementById('levelCompleteOverlay').classList.add('hidden');
            document.getElementById('gameOverOverlay').classList.add('hidden');
            currentRoomKey = 'WestbridgeHub';
            initializeLevelSecurityCameras();
            cameraX = 0;
            player.x = 100;
            player.y = 300;
            player.vx = 0;
            player.vy = 0;
            checkpoint = { room: 'WestbridgeHub', x: 100, y: 300 };
            doorCooldown = 0.8;
            spawnSafeTime = 1.25;
            document.getElementById('statusText').innerText = 'Status: LEVEL 2 - Westbridge Academy!';
            roomBanner = { text: 'LEVEL 2: WESTBRIDGE ACADEMY', time: 2.2 };
            spawnBurst(player.x, player.y, '#63e6be', 24);
            updateUI();
            playTone(180, 0.2);
        }

        function advanceLevel() {
            if (level >= 10) {
                triggerWin();
                return;
            }

            resetPhoneForLevel();
            level++;
            const hubKey = setupGeneratedLevel(level);
            initializeLevelSecurityCameras();
            resetTroubleMeter();
            energy = maxEnergy;
            sprintStamina = maxSprintStamina;
            player.sprintLocked = false;
            popQuizPending = null;
            popQuizShownThisLevel = false;
            isPopQuiz = false;
            currentRoomKey = hubKey;
            cameraX = 0;
            player.x = 100;
            player.y = 300;
            player.vx = 0;
            player.vy = 0;
            checkpoint = { room: hubKey, x: 100, y: 300 };
            doorCooldown = 0.8;
            spawnSafeTime = 1.25;
            gameState = 'PLAYING';
            document.getElementById('gameOverOverlay').classList.add('hidden');
            document.getElementById('statusText').innerText = `Status: LEVEL ${level} - New academy wing!`;
            roomBanner = { text: `LEVEL ${level}: NEW WING`, time: 2.2 };
            spawnBurst(player.x, player.y, '#63e6be', 24);
            updateUI();
            playTone(180, 0.2);
        }

        function showLevel1Complete() {
            if (isPhoneOpen) togglePhone(false);
            gameState = 'LEVEL1_COMPLETE';
            isSlacking = false;
            registerLevelCompletion();
            document.getElementById('levelCompleteOverlay').classList.remove('hidden');
            updateUI();
            playTone(880, 0.2);
        }

        // Performs the actual "leaving the level" transition for a level-exit door.
        // Split out from the door-trigger loop so it can also be resumed after the
        // player clears a required pop quiz that was gating that same door.
        function completeLevelExit(d) {
            if (d.targetRoom === 'Principal') {
                recordQuestProgress('doorTransitions');
                showLevel1Complete();
                doorIntent = false;
                return;
            }

            if (d.targetRoom === 'FinalExit') {
                recordQuestProgress('doorTransitions');
                currentRoomKey = 'FinalExit';
                player.x = d.targetX;
                player.y = d.targetY;
                player.vx = 0;
                player.vy = 0;
                updateUI();
                doorIntent = false;
                spawnSafeTime = 0.8;
                if (level < 10) advanceLevel();
                else triggerWin();
                return;
            }
        }

        function continueToLevel2() {
            startLevel2();
        }

        function continueAfterWin() {
            if (multiplayerSession?.gameId === 'skyline') {
                continueSkylineLevel();
                return;
            }
            if (level < 10) advanceLevel();
            else returnToMenu();
        }

        function continueSkylineLevel() {
            if (multiplayerSession?.gameId !== 'skyline' || skylineLevel !== 1) return;
            document.getElementById('gameOverOverlay').classList.add('hidden');
            setupSkylineArena(2, true);
            roomBanner = { text: 'NIGHT SHIFT: COLLECT FOUR PRISMS!', time: 2.5 };
            startGame();
        }

        function returnToMenu() {
            if (questProgressDirty) saveProgression();
            if (isPhoneOpen) togglePhone(false);
            closeMultiplayerConnections();
            multiplayerPlayers = [];
            remotePlayers = [];
            toggleLevelMap(false);
            toggleQuestLog(false);
            gameState = 'MENU';
            level = 1;
            isPaused = false;
            isSlacking = false;
            keys = {};
            doorIntent = false;
            cameraX = 0;
            currentRoomKey = 'Math';
            resetLevelObjectives(['Math', 'ELA', 'Science', 'Gym']);
            energy = maxEnergy;
            sprintStamina = maxSprintStamina;
            player.sprintLocked = false;
            popQuizPending = null;
            popQuizShownThisLevel = false;
            isPopQuiz = false;
            slackSeconds = 0;
            activeSeconds = 0;
            resetTroubleMeter();
            player.x = 100;
            player.y = 300;
            document.getElementById('gameOverOverlay').classList.add('hidden');
            document.getElementById('levelCompleteOverlay').classList.add('hidden');
            document.getElementById('pauseOverlay').classList.add('hidden');
            document.getElementById('multiplayerModal').classList.add('hidden');
            document.getElementById('startOverlay').classList.remove('hidden');
            updateMultiplayerHud();
            document.getElementById('statusText').innerText = 'Status: Exploring School...';
            updateUI();
            draw();
        }

        function initializeRoomCoins() {
            if (roomCoinsInitialized) return;
            Object.values(rooms).forEach(room => {
                room.coins = [];
                const floorSpots = [
                    { x: 130, y: 350 }, { x: 390, y: 350 }, { x: 650, y: 350 }
                ];
                floorSpots.forEach(spot => {
                    if (Math.random() < 0.25 && room.coins.length < 3) {
                        room.coins.push({ x: spot.x, y: spot.y, collected: false, bob: Math.random() * Math.PI * 2 });
                    }
                });
            });
            roomCoinsInitialized = true;
        }

        function collectRoomCoins(room) {
            if (!room.coins) return;
            room.coins.forEach(coin => {
                if (!coin.collected && Math.abs((player.x + player.w / 2) - coin.x) < 24 && Math.abs((player.y + player.h / 2) - coin.y) < 30) {
                    coin.collected = true;
                    const coinReward = buddyNearby ? 2 : 1;
                    recordQuestProgress('coinsCollected');
                    coins += coinReward + getQuestBuffs().coinBonus;
                    combo++;
                    spawnBurst(coin.x, coin.y, '#ffd43b', 10); // Added burst effect for coin collection
                    roomBanner = { text: buddyNearby ? `BUDDY BONUS +${coinReward}!` : (combo > 1 ? `COIN COMBO x${combo}!` : 'COIN GET!'), time: 1.2 };
                    playTone(980, 0.05);
                }
            });
        }

        function smashNearbyPoundTargets(room) {
            let rewardsCollected = false;
            (room.poundTargets || []).forEach(target => {
                if (target.broken ||
                    Math.abs(player.x + player.w / 2 - target.x) > 145 ||
                    Math.abs(player.y + player.h - (target.y + target.h / 2)) > 60) return;
                target.broken = true;
                coins += target.reward;
                recordQuestProgress('coinsCollected');
                spawnBurst(target.x, target.y + target.h / 2, '#fbbf24', 16);
                roomBanner = { text: `SLAM BLOCK BROKEN! +${target.reward} COINS`, time: 1.6 };
                rewardsCollected = true;
            });
            if (rewardsCollected) updateUI();
        }

        function updateSlideGateRewards(room) {
            (room.slideGates || []).forEach(gate => {
                const overlapsGate = player.x + player.w > gate.x && player.x < gate.x + gate.w;
                if (player.isSliding && overlapsGate) gate.entered = true;
                if (!gate.entered || gate.rewarded || overlapsGate) return;
                gate.rewarded = true;
                gate.entered = false;
                coins += 2;
                recordQuestProgress('coinsCollected');
                spawnBurst(gate.x + gate.w / 2, gate.y + gate.h, '#38bdf8', 12);
                roomBanner = { text: 'SLIDE TUNNEL CLEAR! +2 COINS', time: 1.4 };
                updateUI();
            });
        }

        function endPlayerSlide(room) {
            if (!player.isSliding) return;
            player.y += player.h - 40;
            player.h = 40;
            player.isSliding = false;
            player.slideTimer = 0;

            const direction = Math.sign(player.vx) || player.dashDirection || 1;
            (room.slideGates || []).forEach(gate => {
                const overlapsGate = player.x + player.w > gate.x && player.x < gate.x + gate.w &&
                    player.y + player.h > gate.y && player.y < gate.y + gate.h;
                if (!overlapsGate) return;
                player.x = direction > 0 ? gate.x - player.w : gate.x + gate.w;
                player.vx = 0;
                gate.entered = false;
            });
        }

        function emitSlideDust() {
            const direction = Math.sign(player.vx) || player.dashDirection || 1;
            particles.push({
                x: direction > 0 ? player.x - 2 : player.x + player.w + 2,
                y: player.y + player.h - 3,
                vx: -direction * (24 + Math.random() * 34),
                vy: -8 - Math.random() * 28,
                life: 0.24 + Math.random() * 0.16,
                maxLife: 0.4,
                size: 2 + Math.random() * 2.5,
                spin: 0,
                rotation: 0,
                color: '#ffffff'
            });
        }

        function updateSkylineArena(dt, room) {
            if (multiplayerSession?.gameId !== 'skyline' || currentRoomKey !== 'MultiplayerArena') return false;
            const scoreBefore = skylineScore;

            Object.keys(skylinePowerups).forEach(type => {
                skylinePowerups[type] = Math.max(0, skylinePowerups[type] - dt);
            });

            room.platforms.forEach(platform => {
                if (platform.crumbling) {
                    platform.crumbleTimer -= dt;
                    if (platform.crumbleTimer <= 0) {
                        platform.crumbling = false;
                        platform.brokenUntil = 2.8;
                    }
                } else if (platform.brokenUntil > 0) {
                    platform.brokenUntil = Math.max(0, platform.brokenUntil - dt);
                }
            });

            room.pickups.forEach(pickup => {
                if (!pickup.active) {
                    pickup.respawn -= dt;
                    if (pickup.respawn <= 0) pickup.active = true;
                    return;
                }
                if (Math.hypot((player.x + player.w / 2) - pickup.x, (player.y + player.h / 2) - pickup.y) > 30) return;

                pickup.active = false;
                pickup.respawn = 14;
                skylinePowerups[pickup.type] = pickup.type === 'shield' ? 12 : 8;
                skylineScore += 50;
                const color = pickup.type === 'turbo' ? '#46e6ff' : (pickup.type === 'highJump' ? '#ff5edb' : '#ffe66d');
                spawnBurst(pickup.x, pickup.y, color, 18);
                roomBanner = { text: `${pickup.type.toUpperCase().replace('-', ' ')} POWERUP!`, time: 1.4 };
                playTone(820, 0.08);
            });

            room.crystals.forEach(crystal => {
                if (crystal.collected || Math.hypot((player.x + player.w / 2) - crystal.x, (player.y + player.h / 2) - crystal.y) > 27) return;
                crystal.collected = true;
                skylineCrystals++;
                skylineScore += 100;
                spawnBurst(crystal.x, crystal.y, '#a5f3fc', 16);
                roomBanner = { text: `SKY PRISM ${skylineCrystals}/4`, time: 1.3 };
                playTone(960, 0.06);
            });

            room.hazards.forEach(hazard => {
                if (hazard.stunned > 0) {
                    hazard.stunned = Math.max(0, hazard.stunned - dt);
                    return;
                }
                hazard.phase += dt * 5;
                hazard.x += hazard.direction * hazard.speed * dt;
                if (hazard.x < hazard.minX || hazard.x + hazard.w > hazard.maxX) {
                    hazard.direction *= -1;
                    hazard.x = Math.max(hazard.minX, Math.min(hazard.maxX - hazard.w, hazard.x));
                }
                const overlaps = player.x + player.w > hazard.x && player.x < hazard.x + hazard.w &&
                    player.y + player.h > hazard.y && player.y < hazard.y + hazard.h;
                if (!overlaps) return;
                if (skylinePowerups.shield > 0) {
                    skylinePowerups.shield = 0;
                    hazard.stunned = 1.2;
                    spawnBurst(hazard.x + hazard.w / 2, hazard.y + hazard.h / 2, '#ffe66d', 16);
                    roomBanner = { text: 'SHIELD BLOCK!', time: 1 };
                    return;
                }
                triggerGameOver('A skyline drone tagged you!');
            });

            if (skylineScore !== scoreBefore) updateUI();
            updateSkylineHud();
            return gameState === 'GAMEOVER';
        }

        function useFood() {
            if (inventory.food < 1) return;
            inventory.food--;
            energy = Math.min(100, energy + 35);
            updateUI();
            playTone(600, 0.08);
        }

        function useHallPass() {
            if (inventory.hallPasses < 1 || sprintTime > 0) return;
            inventory.hallPasses--;
            sprintTime = 60;
            updateUI();
            particles = [];
            roomBanner = { text: '', time: 0 };
            combo = 0;
            player.sprintBoost = false;
            playTone(760, 0.08);
        }

        function closeHomeworkComplete() {
            document.getElementById('homeworkCompleteOverlay').classList.add('hidden');
            gameState = 'PLAYING';
            if (isPopQuiz) {
                isPopQuiz = false;
                const pendingDoor = popQuizPending;
                popQuizPending = null;
                if (pendingDoor) completeLevelExit(pendingDoor);
            }
            updateUI();
        }

        function useHelper() {
            if (!inventory.helpers.length) return;
            const helper = inventory.helpers.shift();
            const helperStrength = getQuestBuffs().helperStrength;
            recordQuestProgress('helpersUsed');
            if (helper === 'energy') energy = Math.min(100, energy + 20 * helperStrength);
            if (helper === 'stealth') player.canStealth = true;
            if (helper === 'dash') sprintTime = Math.max(sprintTime, 20 * helperStrength);
            document.getElementById('statusText').innerText = `Used mystery helper: ${helper.toUpperCase()}!`;
            updateUI();
            playTone(820, 0.08);
        }

        function openShop() {
            if (currentRoomKey !== 'WestbridgeShop') {
                document.getElementById('statusText').innerText = 'Shop: Enter the Westbridge Supply Shop first.';
                return;
            }
            clearMobileInputs();
            gameState = 'SHOP';
            updateShopUI();
            document.getElementById('shopModal').classList.remove('hidden');
        }

        function closeShop() {
            document.getElementById('shopModal').classList.add('hidden');
            if (gameState === 'SHOP') gameState = 'PLAYING';
        }

        function buyShopItem(item) {
            const costs = { food: 3, pass: 5, random: 4, energy: 4, stamina: 4, lunch: 8, helperBundle: 9 };
            if (!Object.prototype.hasOwnProperty.call(costs, item)) {
                document.getElementById('shopMessage').innerText = 'That item is not available.';
                return;
            }
            if (coins < costs[item]) {
                document.getElementById('shopMessage').innerText = 'Not enough coins yet.';
                return;
            }
            if (item === 'energy' && energy >= maxEnergy) {
                document.getElementById('shopMessage').innerText = 'Energy is already full. Save your coins for later.';
                return;
            }
            if (item === 'stamina' && sprintStamina >= maxSprintStamina) {
                document.getElementById('shopMessage').innerText = 'Sprint stamina is already full. Save your coins for later.';
                return;
            }
            if (item === 'lunch' && energy >= maxEnergy && sprintStamina >= maxSprintStamina) {
                document.getElementById('shopMessage').innerText = 'Both energy and sprint stamina are already full.';
                return;
            }
            coins -= costs[item];
            if (item === 'food') inventory.food++;
            if (item === 'pass') inventory.hallPasses++;
            if (item === 'energy') energy = Math.min(maxEnergy, energy + 50);
            if (item === 'stamina') {
                sprintStamina = Math.min(maxSprintStamina, sprintStamina + 45);
                if (sprintStamina === maxSprintStamina) player.sprintLocked = false;
            }
            if (item === 'lunch') {
                energy = maxEnergy;
                sprintStamina = maxSprintStamina;
                player.sprintLocked = false;
            }
            if (item === 'random' || item === 'helperBundle') {
                const helper = ['energy', 'stealth', 'dash'][Math.floor(Math.random() * 3)];
                if (item === 'random') {
                    inventory.helpers.push(helper);
                    document.getElementById('shopMessage').innerText = `Mystery helper stored: ${helper.toUpperCase()} (press ${keyLabel(keybinds.helper)}).`;
                } else {
                    for (let count = 0; count < 3; count++) {
                        inventory.helpers.push(['energy', 'stealth', 'dash'][Math.floor(Math.random() * 3)]);
                    }
                    document.getElementById('shopMessage').innerText = 'Helper bundle added: 3 mystery helpers stored!';
                }
            } else if (item === 'energy') {
                document.getElementById('shopMessage').innerText = 'Energy Drink used: +50 energy.';
            } else if (item === 'stamina') {
                document.getElementById('shopMessage').innerText = 'Sprint Tonic used: +45 sprint stamina.';
            } else if (item === 'lunch') {
                document.getElementById('shopMessage').innerText = 'Power Lunch used: energy and sprint stamina refilled!';
            } else {
                document.getElementById('shopMessage').innerText = 'Purchase added to your inventory.';
            }
            updateShopUI();
            updateUI();
            playTone(740, 0.08);
        }

        function updateShopUI() {
            document.getElementById('shopCoins').innerText = coins;
            document.getElementById('shopFood').innerText = inventory.food;
            document.getElementById('shopPasses').innerText = inventory.hallPasses;
            document.getElementById('shopHelpers').innerText = inventory.helpers.length;
        }

        function spawnBurst(x, y, color, count) {
            for (let index = 0; index < count; index++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 35 + Math.random() * 90;
                const life = 0.45 + Math.random() * 0.35;
                particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 20,
                    life,
                    maxLife: life,
                    size: 2 + Math.random() * 4,
                    spin: (Math.random() - 0.5) * 10,
                    rotation: Math.random() * Math.PI * 2,
                    color
                });
            }
        }

        function updateParticles(dt) {
            particles = particles.filter(particle => particle.life > 0);
            particles.forEach(particle => {
                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.vy += 80 * dt;
                particle.rotation = (particle.rotation || 0) + (particle.spin || 0) * dt;
                particle.life -= dt;
            });
        }

        function drawParticles() {
            particles.forEach(particle => {
                ctx.globalAlpha = Math.max(0, particle.life / (particle.maxLife || 0.5));
                ctx.fillStyle = particle.color;
                ctx.save();
                ctx.translate(Math.round(particle.x), Math.round(particle.y));
                ctx.rotate(particle.rotation || 0);
                const size = particle.size || 4;
                ctx.fillRect(-size / 2, -size / 2, size, size);
                ctx.restore();
            });
            ctx.globalAlpha = 1;
        }

        function togglePause() {
            if ((gameState !== 'PLAYING' && gameState !== 'PAUSED') || isLevelMapOpen ||
                !document.getElementById('questModal').classList.contains('hidden')) return;
            clearMobileInputs();
            isPaused = !isPaused;
            const pauseButton = document.getElementById('pauseBtn');
            if (pauseButton) pauseButton.innerHTML = isPaused
                ? `<span aria-hidden="true">▶</span> Resume (${keyLabel(keybinds.pause)})`
                : `<span aria-hidden="true">⏸</span> Pause (${keyLabel(keybinds.pause)})`;
            document.getElementById('pauseOverlay').classList.toggle('hidden', !isPaused);
            gameState = isPaused ? 'PAUSED' : 'PLAYING';
            document.getElementById('statusText').innerText = isPaused ? 'Status: Paused' : 'Status: Exploring School...';
            playTone(isPaused ? 220 : 440, 0.05);
        }

        function toggleSound() {
            soundEnabled = !soundEnabled;
            const soundButton = document.getElementById('soundBtn');
            if (soundButton) soundButton.innerText = `Sound: ${soundEnabled ? 'ON' : 'OFF'} (${keyLabel(keybinds.sound)})`;
            if (soundEnabled) playTone(440, 0.06);
        }

        function playTone(frequency, duration) {
            if (!soundEnabled) return;
            audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.type = 'square';
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0.045, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
            oscillator.connect(gain).connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration);
        }

        function jumpPlayer() {
            player.jumpBufferTimer = 0.12;
        }

        function executeJump() {
            const jumpMultiplier = (multiplayerSession?.gameId === 'skyline' && skylinePowerups.highJump > 0 ? 1.45 : 1) *
                getQuestBuffs().jumpPower;
            if (player.grounded || player.coyoteTimer > 0) {
                player.vy = -560 * jumpMultiplier;
                player.grounded = false;
                player.coyoteTimer = 0;
                player.doubleJumpsLeft = player.canDoubleJump ? 1 : 0;
                spawnBurst(player.x + player.w / 2, player.y + player.h, '#ffffff', 5);
                playTone(520, 0.04);
                recordQuestProgress('jumps');
                return true;
            } else if (player.isWallSliding) {
                player.vy = -540 * jumpMultiplier;
                player.vx = -player.wallDir * 450;
                player.isWallSliding = false;
                player.doubleJumpsLeft = player.canDoubleJump ? 1 : 0;
                spawnBurst(player.x + player.w / 2, player.y + player.h / 2, '#38bdf8', 12);
                playTone(640, 0.05);
                recordQuestProgress('jumps');
                return true;
            } else if (player.doubleJumpsLeft > 0) {
                player.vy = -500 * jumpMultiplier;
                player.doubleJumpsLeft--;
                spawnBurst(player.x + player.w / 2, player.y + player.h, '#7dd3fc', 8);
                playTone(720, 0.04);
                recordQuestProgress('jumps');
                return true;
            }
            return false;
        }

        function dashPlayer() {
            if (!player.canDash || player.dashCooldown > 0) return;
            const dir = mobileMoveAxis < -0.12 || keys[keybinds.left] ? -1
                : (mobileMoveAxis > 0.12 || keys[keybinds.right] ? 1 : (player.vx < 0 ? -1 : 1));
            player.dashDirection = dir;
            player.dashTime = 0.18;
            player.dashCooldown = 0.75;
            player.vy = 0;
            spawnBurst(player.x + player.w / 2, player.y + player.h / 2, '#7dd3fc', 14);
            playTone(300, 0.08);
        }

        function interactObject() {
            const currentRoom = rooms[currentRoomKey];
            if (multiplayerSession?.gameId === 'skyline' && currentRoomKey === 'MultiplayerArena') {
                const goal = currentRoom.goal;
                const nearGoal = Math.abs((player.x + player.w / 2) - (goal.x + goal.w / 2)) < 90 &&
                    Math.abs((player.y + player.h / 2) - (goal.y + goal.h / 2)) < 100;
                if (nearGoal && skylineCrystals >= 4) triggerWin();
                else if (nearGoal) document.getElementById('statusText').innerText = `Beacon locked. Find all four prisms (${skylineCrystals}/4).`;
                else document.getElementById('statusText').innerText = `Skyline Scramble: find four prisms, then use the finish beacon (${skylineCrystals}/4).`;
                return;
            }
            const nearbyDoor = currentRoom.doors.find(door => {
                const targetRoom = rooms[door.targetRoom];
                return targetRoom &&
                    Math.abs((player.x + player.w / 2) - (door.x + door.w / 2)) < 78 &&
                    Math.abs((player.y + player.h / 2) - (door.y + door.h / 2)) < 90;
            });
            if (nearbyDoor) {
                doorIntent = true;
                document.getElementById('statusText').innerText = 'Door selected. Entering classroom...';
                return;
            }
            if (currentRoom.prize) {
                const prize = currentRoom.prize;
                const prizeDistance = Math.hypot((player.x + player.w / 2) - (prize.x + 20), (player.y + player.h / 2) - prize.y);
                if (prizeDistance < 95) {
                    if (prize.claimed) {
                        document.getElementById('statusText').innerText = 'This level’s treasure has already been claimed.';
                        return;
                    }
                    prize.claimed = true;
                    coins += prize.coins;
                    inventory.food += prize.food || 0;
                    inventory.hallPasses += prize.hallPasses || 0;
                    for (let count = 0; count < (prize.helpers || 0); count++) {
                        inventory.helpers.push(['energy', 'stealth', 'dash'][Math.floor(Math.random() * 3)]);
                    }
                    const rewardParts = [`${prize.coins} coins`];
                    if (prize.food) rewardParts.push(`${prize.food} food`);
                    if (prize.hallPasses) rewardParts.push(`${prize.hallPasses} hall pass`);
                    if (prize.helpers) rewardParts.push(`${prize.helpers} mystery helpers`);
                    document.getElementById('statusText').innerText = `TREASURE CLAIMED! ${rewardParts.join(' + ')}!`;
                    roomBanner = { text: `BONUS ROOM REWARD: +${prize.coins} COINS!`, time: 2.6 };
                    spawnBurst(prize.x + 20, prize.y - 12, '#ffd43b', 28);
                    updateUI();
                    playTone(980, 0.2);
                    return;
                }
            }
            // Extra reporter feature: bribe a suspicious reporter with coins to keep them quiet.
            if (currentRoom.reporters) {
                const suspiciousReporter = currentRoom.reporters.find(reporter =>
                    reporter.timer > 0.15 && !reporter.reported &&
                    Math.abs((player.x + player.w / 2) - reporter.x) < reporter.range &&
                    Math.abs((player.y + player.h / 2) - reporter.y) < 75
                );
                if (suspiciousReporter) {
                    const bribeCost = 2;
                    if (coins >= bribeCost) {
                        coins -= bribeCost;
                        suspiciousReporter.timer = 0;
                        suspiciousReporter.bribeCooldown = 4;
                        spawnBurst(suspiciousReporter.x, suspiciousReporter.y, '#ffd43b', 10);
                        playTone(520, 0.08);
                        document.getElementById('statusText').innerText = `🤐 Bribed the reporter quiet! -${bribeCost} coins`;
                    } else {
                        document.getElementById('statusText').innerText = "Need 2 coins to bribe them quiet!";
                    }
                    updateUI();
                    return;
                }
            }
            if (currentRoom.desk && !homeworkDone[currentRoom.desk.subject]) {
                const dist = Math.hypot((player.x + player.w / 2) - (currentRoom.desk.x + currentRoom.desk.w / 2), (player.y + player.h / 2) - (currentRoom.desk.y + currentRoom.desk.h / 2));
                if (dist < 70) {
                    openHomework(currentRoom.desk.subject);
                }
            }
        }

        function shuffleArray(arr) {
            const copy = [...arr];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        }

        function seededShuffleArray(arr, seed) {
            const copy = [...arr];
            let state = seed >>> 0;
            const random = () => {
                state = (state + 0x6D2B79F5) >>> 0;
                let value = state;
                value = Math.imul(value ^ (value >>> 15), value | 1);
                value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
                return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
            };
            for (let index = copy.length - 1; index > 0; index--) {
                const swapIndex = Math.floor(random() * (index + 1));
                [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
            }
            return copy;
        }

        function openHomework(subject) {
            if (gameState !== 'PLAYING') return;
            gameState = 'HOMEWORK';

            const modal = document.getElementById('homeworkModal');
            const container = document.getElementById('hwQuestionsContainer');
            document.getElementById('hwTitle').innerText = `${subject.toUpperCase()} HOMEWORK`;
            document.getElementById('hwFeedback').innerText = "";
            const showAnswers = level === 1;
            document.getElementById('hwHint').innerText = showAnswers
                ? 'LEVEL 1: The green PICK ME answer is your friend.'
                : `LEVEL ${level}: No answer hints. Read carefully!`;

            // Each visit gets a fresh random selection AND randomized answer order.
            const questionCount = level >= 7 ? 4 : (level >= 4 ? 3 : 2);
            activeHomework = shuffleArray(homeworkData[subject])
                .slice(0, Math.min(questionCount, homeworkData[subject].length))
                .map(item => ({ ...item, options: shuffleArray(item.options) }));

            container.innerHTML = "";
            activeHomework.forEach((item, idx) => {
                const qBox = document.createElement('div');
                qBox.className = 'quiz-question';
                qBox.innerHTML = `
                    <p class="quiz-prompt">${idx + 1}. ${item.q}</p>
                    <div class="space-y-1">
                        ${item.options.map(opt => {
                            return `
                            <label class="quiz-option">
                                <input type="radio" name="q${idx}" value="${opt}">
                                <span>${showAnswers && opt === item.a ? '★ PICK ME: ' : ''}${opt}</span>
                            </label>
                        `;
                        }).join('')}
                    </div>
                `;
                container.appendChild(qBox);
            });

            modal.classList.remove('hidden');
        }

        // Low-chance required extra assignment that can gate a level exit door.
        // Reuses the homework modal's markup but is not tied to any classroom desk.
        function openPopQuiz() {
            if (gameState !== 'PLAYING') return;
            gameState = 'HOMEWORK';
            isPopQuiz = true;

            const modal = document.getElementById('homeworkModal');
            const container = document.getElementById('hwQuestionsContainer');
            document.getElementById('hwTitle').innerText = '🚨 SURPRISE MATH TEST!';
            document.getElementById('hwFeedback').innerText = "";
            document.getElementById('hwHint').innerText = "POP QUIZ: You can't leave until you pass this. Big coin reward if you do!";

            const pool = homeworkData.Math || Object.values(homeworkData)[0];
            activeHomework = shuffleArray(pool)
                .slice(0, Math.min(3, pool.length))
                .map(item => ({ ...item, options: shuffleArray(item.options) }));

            container.innerHTML = "";
            activeHomework.forEach((item, idx) => {
                const qBox = document.createElement('div');
                qBox.className = 'quiz-question';
                qBox.innerHTML = `
                    <p class="quiz-prompt">${idx + 1}. ${item.q}</p>
                    <div class="space-y-1">
                        ${item.options.map(opt => `
                            <label class="quiz-option">
                                <input type="radio" name="q${idx}" value="${opt}">
                                <span>${opt}</span>
                            </label>
                        `).join('')}
                    </div>
                `;
                container.appendChild(qBox);
            });

            modal.classList.remove('hidden');
        }

        function submitPopQuiz() {
            const data = activeHomework;
            let allCorrect = true;

            data.forEach((item, idx) => {
                const selected = document.querySelector(`input[name="q${idx}"]:checked`);
                if (!selected || selected.value !== item.a) {
                    allCorrect = false;
                }
            });

            if (allCorrect) {
                recordQuestProgress('homeworks');
                document.getElementById('homeworkModal').classList.add('hidden');
                gameState = 'PLAYING';
                activeHomework = [];
                updateUI();
                playTone(880, 0.12);
                const reward = 15 + Math.floor(Math.random() * 11) + getQuestBuffs().homeworkCoins;
                coins += reward;
                spawnBurst(player.x + player.w / 2, player.y, '#ffd43b', 22);
                document.getElementById('homeworkCompleteTitle').innerText = 'POP QUIZ PASSED!';
                document.getElementById('homeworkCompleteReward').innerText = `+${reward} COINS (Surprise Test Bonus!)`;
                document.getElementById('homeworkCompleteOverlay').classList.remove('hidden');
                gameState = 'HOMEWORK_COMPLETE';
                updateUI();
            } else {
                document.getElementById('hwFeedback').innerText = "❌ F- GRADE! The hall monitor isn't impressed. Try again!";
            }
        }

        function submitHomework() {
            if (isPopQuiz) {
                submitPopQuiz();
                return;
            }
            const currentSubject = rooms[currentRoomKey].desk.subject;
            const data = activeHomework;
            let allCorrect = true;

            data.forEach((item, idx) => {
                const selected = document.querySelector(`input[name="q${idx}"]:checked`);
                if (!selected || selected.value !== item.a) {
                    allCorrect = false;
                }
            });

            if (allCorrect) {
                homeworkDone[currentSubject] = true;
                recordQuestProgress('homeworks');
                document.getElementById('homeworkModal').classList.add('hidden');
                gameState = 'PLAYING';
                
                // Unlock Abilities according to solved homework
                if (currentSubject === 'Math') player.canDoubleJump = true;
                if (currentSubject === 'ELA') player.canStealth = true;
                if (currentSubject === 'Science') player.canDash = true;
                if (currentSubject === 'Gym') player.hasMasterKey = true;
                activeHomework = [];

                updateUI();
                playTone(880, 0.12);
                const reward = 1 + Math.floor(Math.random() * 5) + getQuestBuffs().homeworkCoins;
                coins += reward;
                spawnBurst(player.x + player.w / 2, player.y, '#ffd43b', 16);
                document.getElementById('homeworkCompleteTitle').innerText = `${currentSubject.toUpperCase()} COMPLETE!`;
                document.getElementById('homeworkCompleteReward').innerText = `+${reward} COINS | ${getAbilityName(currentSubject)}`;
                document.getElementById('homeworkCompleteOverlay').classList.remove('hidden');
                gameState = 'HOMEWORK_COMPLETE';
                updateUI();

            } else {
                document.getElementById('hwFeedback').innerText = "❌ F- GRADE! Try again!";
            }
        }

        function getAbilityName(subject) {
            if (subject === 'Math') return 'Double Jump Sneakers 👟';
            if (subject === 'ELA') return 'Stealth Hood 🥷';
            if (subject === 'Science') return 'Hall Pass Dash ⚡';
            if (subject === 'Gym') return 'Master Keycard 🔑';
            return 'None';
        }

        function updateUI() {
            registerQuestRoomVisit(currentRoomKey);
            const roomLabel = document.getElementById('roomLabel');
            if (roomLabel) roomLabel.innerText = rooms[currentRoomKey].title;
            let abs = [];
            if (player.canDoubleJump) abs.push('DoubleJump');
            if (player.canStealth) abs.push('Stealth');
            if (player.canDash) abs.push('Dash');
            if (player.hasMasterKey) abs.push('MasterKey');
            const sprintLabel = sprintTime > 0 ? ` Pass:${Math.ceil(sprintTime)}s` : ` Stamina:${Math.ceil(sprintStamina)}%${player.sprintLocked ? ' LOCKED' : ''}`;
            const completedClasses = activeLevelSubjects.filter(subject => homeworkDone[subject]).length;
            const abilityLabel = document.getElementById('abilityLabel');
            if (abilityLabel) {
                abilityLabel.innerText = multiplayerSession?.gameId === 'skyline'
                    ? `SKYLINE SCRAMBLE ${skylineLevel} | Local score:${skylineScore} | Prisms:${skylineCrystals}/4`
                    : `L${level} | ${difficulty} | Classes:${completedClasses}/${activeLevelSubjects.length} | ${abs.length > 0 ? abs.join(', ') : 'None'} | Coins:${coins} Food:${inventory.food} Pass:${inventory.hallPasses}${sprintLabel}`;
            }
            updateShopUI();
        }

        // Report-card style "how much did you slack off" rating for the end of a run,
        // based on the ratio of time spent slacking vs. actively playing this run.
        function getSlackRating() {
            const total = slackSeconds + activeSeconds;
            const pct = total > 0 ? (slackSeconds / total) * 100 : 0;
            let stars, label;
            if (pct < 10) { stars = 1; label = "TEACHER'S PET 🤓"; }
            else if (pct < 25) { stars = 2; label = 'FOCUSED STUDENT 🎯'; }
            else if (pct < 45) { stars = 3; label = 'BALANCED SLACKER ⚖️'; }
            else if (pct < 70) { stars = 4; label = 'PROFESSIONAL SLACKER 🛋️'; }
            else { stars = 5; label = 'CERTIFIED SLACK LEGEND 😴'; }
            return { stars, label, pct: Math.round(pct) };
        }

        function showSlackRating() {
            const box = document.getElementById('slackRatingBox');
            if (slackSeconds + activeSeconds < 1) {
                box.classList.add('hidden');
                return;
            }
            const rating = getSlackRating();
            document.getElementById('slackRatingStars').innerText = '⭐'.repeat(rating.stars) + '☆'.repeat(5 - rating.stars);
            document.getElementById('slackRatingLabel').innerText = `${rating.label} — slacked ${rating.pct}% of the run`;
            box.classList.remove('hidden');
        }

        function triggerWin() {
            gameState = 'WIN';
            if (multiplayerSession?.gameId === 'skyline') {
                const isFinalSkylineLevel = skylineLevel >= 2;
                document.getElementById('gameOverTitle').innerText = isFinalSkylineLevel
                    ? 'SKYLINE SCRAMBLE COMPLETE!'
                    : 'SKYLINE LEVEL 1 CLEAR!';
                document.getElementById('gameOverTitle').className = 'text-4xl sm:text-5xl font-black text-green-400 drop-shadow-[4px_4px_0px_#000] mb-4';
                document.getElementById('gameOverReason').innerText = isFinalSkylineLevel
                    ? `You cleared both skyline courses and scored ${skylineScore} points!`
                    : `You banked ${skylineCrystals}/4 prisms and scored ${skylineScore} points. Ready for the night course?`;
                const nextLevelButton = document.getElementById('nextLevelBtn');
                nextLevelButton.classList.toggle('hidden', isFinalSkylineLevel);
                nextLevelButton.innerText = '▶ SKYLINE LEVEL 2';
                document.getElementById('retryLevelBtn').classList.remove('hidden');
                showSlackRating();
                document.getElementById('gameOverOverlay').classList.remove('hidden');
                playTone(880, 0.2);
                return;
            }
            document.getElementById('nextLevelBtn').innerText = '▶ NEXT LEVEL';
            registerLevelCompletion();
            document.getElementById('gameOverTitle').innerText = level === 10 ? "🎉 LEVEL 10 CLEAR! YOU ESCAPED!" : `🎉 LEVEL ${level} CLEAR!`;
            document.getElementById('gameOverTitle').className = "text-5xl font-black text-green-400 drop-shadow-[4px_4px_0px_#000] mb-4";
            document.getElementById('gameOverReason').innerText = level > 1
                ? `You cleared Level ${level} with ${coins} coins!`
                : "You escaped Westbridge Academy with " + coins + " coins in your pocket!";
            document.getElementById('nextLevelBtn').classList.toggle('hidden', level >= 10);
            document.getElementById('retryLevelBtn').classList.toggle('hidden', level >= 10);
            showSlackRating();
            document.getElementById('gameOverOverlay').classList.remove('hidden');
        }

        function rescueWithTeammate() {
            if (Date.now() - lastBuddyRescue < 60000) return false;
            const teammate = getNearbyTeammate();
            if (!teammate) return false;

            lastBuddyRescue = Date.now();
            currentRoomKey = checkpoint.room || currentRoomKey;
            player.x = checkpoint.x;
            player.y = checkpoint.y;
            player.vx = 0;
            player.vy = 0;
            player.grounded = false;
            energy = Math.max(35, energy);
            sprintStamina = Math.max(35, sprintStamina);
            player.sprinting = false;
            player.sprintLocked = false;
            isSlacking = false;
            cameraX = Math.max(0, player.x - canvas.width * 0.42);
            spawnSafeTime = 2;
            doorCooldown = 0.6;
            resetTroubleMeter();
            gameState = 'PLAYING';
            roomBanner = { text: `${teammate.name} RESCUED YOU!`, time: 2.2 };
            document.getElementById('gameOverOverlay').classList.add('hidden');
            document.getElementById('statusText').innerText = `${teammate.name} pulled you back into the game!`;
            spawnBurst(player.x + player.w / 2, player.y + player.h / 2, '#63e6be', 20);
            updateUI();
            return true;
        }

        function triggerGameOver(reason) {
            if (multiplayerSession && rescueWithTeammate()) return;
            if (isPhoneOpen) togglePhone(false);
            gameState = 'GAMEOVER';
            document.getElementById('nextLevelBtn').classList.add('hidden');
            document.getElementById('retryLevelBtn').classList.remove('hidden');
            document.getElementById('gameOverTitle').innerText = "DETENTION!";
            document.getElementById('gameOverTitle').className = "text-5xl font-black text-yellow-300 drop-shadow-[4px_4px_0px_#000] mb-4";
            document.getElementById('gameOverReason').innerText = multiplayerSession
                ? `${reason}\nA nearby teammate can rescue you once per minute.`
                : reason;
            showSlackRating();
            document.getElementById('gameOverOverlay').classList.remove('hidden');
        }

        function toggleEasterEgg() {
            document.getElementById('secretModal').classList.toggle('hidden');
        }

        function toggleAdminPanel() {
            const modal = document.getElementById('adminModal');
            modal.classList.remove('hidden');
            if (adminAuthenticated) {
                document.getElementById('adminLoginView').classList.add('hidden');
                document.getElementById('adminControlsView').classList.remove('hidden');
            } else {
                document.getElementById('adminUsernameInput').focus();
            }
        }

        function closeAdminPanel() {
            document.getElementById('adminModal').classList.add('hidden');
        }

        function submitAdminLogin(event) {
            event.preventDefault();
            const username = document.getElementById('adminUsernameInput').value;
            const password = document.getElementById('adminPasswordInput').value;
            const message = document.getElementById('adminLoginMessage');
            if (username !== adminUsername || password !== adminPassword) {
                message.innerText = 'Access denied.';
                document.getElementById('adminPasswordInput').select();
                return;
            }
            adminAuthenticated = true;
            document.getElementById('adminLoginView').classList.add('hidden');
            document.getElementById('adminControlsView').classList.remove('hidden');
            document.getElementById('adminStatus').innerText = 'Admin tools unlocked.';
        }

        function logoutAdmin() {
            adminAuthenticated = false;
            document.getElementById('adminUsernameInput').value = '';
            document.getElementById('adminPasswordInput').value = '';
            document.getElementById('adminLoginMessage').innerText = '';
            document.getElementById('adminLoginView').classList.remove('hidden');
            document.getElementById('adminControlsView').classList.add('hidden');
        }

        function adminSetStatus(message) {
            document.getElementById('adminStatus').innerText = message;
            updateUI();
        }

        function adminUnlockProgression() {
            unlockedLevels.fill(true);
            hardCompletedLevels.fill(true);
            extremeUnlocked = true;
            saveProgression();
            updateLevelSelectUI();
            adminSetStatus('All levels and Extreme difficulty unlocked.');
        }

        function adminUnlockAbilities() {
            player.canDoubleJump = true;
            player.canStealth = true;
            player.canDash = true;
            player.hasMasterKey = true;
            adminSetStatus('All abilities unlocked for the current run.');
        }

        function adminCompleteObjectives() {
            Object.keys(homeworkDone).forEach(subject => homeworkDone[subject] = true);
            activeLevelSubjects.forEach(subject => homeworkDone[subject] = true);
            adminSetStatus('All homework objectives marked complete.');
        }

        function adminResetTrouble() {
            resetTroubleMeter();
            adminSetStatus('Trouble Meter cleared.');
        }

        function adminGiveCoins() {
            coins = Math.max(0, Number(document.getElementById('adminCoinsInput').value) || 0);
            adminSetStatus(`Coins set to ${coins}.`);
        }

        function adminAddCoins() {
            const amount = Math.max(0, Number(document.getElementById('adminCoinsInput').value) || 0);
            coins += amount;
            adminSetStatus(`Added ${amount} coins. Total: ${coins}.`);
        }

        function adminGiveSupplies() {
            inventory.food = Math.max(0, Number(document.getElementById('adminFoodInput').value) || 0);
            inventory.hallPasses = Math.max(0, Number(document.getElementById('adminPassInput').value) || 0);
            adminSetStatus('Food and hall passes updated.');
        }

        function adminGiveHelper() {
            inventory.helpers.push(document.getElementById('adminHelperSelect').value);
            adminSetStatus('Mystery helper added to inventory.');
        }

        function adminRefillPlayer() {
            energy = maxEnergy;
            sprintStamina = maxSprintStamina;
            player.sprintLocked = false;
            adminSetStatus('Energy and sprint stamina refilled.');
        }

        function toggleChangelog() {
            document.getElementById('changelogModal').classList.toggle('hidden');
        }

        function toggleFullscreen() {
            const appWindow = document.getElementById('appWindow');
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (appWindow.requestFullscreen) {
                appWindow.requestFullscreen().then(lockLandscape).catch(() => {});
            }
        }

        function clampAppWindowToViewport() {
            const appWindow = document.getElementById('appWindow');
            if (appWindow.style.position !== 'fixed') return;

            const rect = appWindow.getBoundingClientRect();
            const maxLeft = Math.max(0, window.innerWidth - rect.width);
            const maxTop = Math.max(0, window.innerHeight - rect.height);
            appWindow.style.left = `${Math.min(Math.max(0, rect.left), maxLeft)}px`;
            appWindow.style.top = `${Math.min(Math.max(0, rect.top), maxTop)}px`;
        }

        function setupWindowControls() {
            const appWindow = document.getElementById('appWindow');
            const titleBar = document.getElementById('windowTitleBar');
            let dragPointerId = null;
            let pointerStartX = 0;
            let pointerStartY = 0;
            let windowStartX = 0;
            let windowStartY = 0;

            titleBar.addEventListener('pointerdown', event => {
                if (!event.isPrimary || event.button !== 0 || event.target.closest('button')) return;
                if (document.fullscreenElement === appWindow) return;

                const rect = appWindow.getBoundingClientRect();
                appWindow.classList.add('window-dragged');
                appWindow.style.position = 'fixed';
                appWindow.style.left = `${rect.left}px`;
                appWindow.style.top = `${rect.top}px`;
                appWindow.style.width = `${Math.min(rect.width, window.innerWidth)}px`;
                appWindow.style.maxWidth = 'none';
                appWindow.style.margin = '0';
                appWindow.style.transform = 'none';
                appWindow.style.zIndex = '45';

                const boundedRect = appWindow.getBoundingClientRect();
                pointerStartX = event.clientX;
                pointerStartY = event.clientY;
                windowStartX = boundedRect.left;
                windowStartY = boundedRect.top;
                dragPointerId = event.pointerId;
                event.preventDefault();
            });

            window.addEventListener('pointermove', event => {
                if (event.pointerId !== dragPointerId) return;
                const rect = appWindow.getBoundingClientRect();
                const maxLeft = Math.max(0, window.innerWidth - rect.width);
                const maxTop = Math.max(0, window.innerHeight - rect.height);
                appWindow.style.left = `${Math.min(Math.max(0, windowStartX + event.clientX - pointerStartX), maxLeft)}px`;
                appWindow.style.top = `${Math.min(Math.max(0, windowStartY + event.clientY - pointerStartY), maxTop)}px`;
            });

            const endDrag = event => {
                if (event.pointerId === dragPointerId) dragPointerId = null;
            };
            window.addEventListener('pointerup', endDrag);
            window.addEventListener('pointercancel', endDrag);
            window.addEventListener('blur', () => { dragPointerId = null; });
            window.addEventListener('resize', clampAppWindowToViewport);
        }

        function minimizeAppWindow() {
            document.getElementById('appWindow').classList.add('hidden');
            document.getElementById('desktopAppIcon').classList.add('hidden');
            document.getElementById('desktopAppIcon').classList.remove('flex');
            const launcher = document.getElementById('minimizedLauncher');
            launcher.classList.remove('hidden');
            launcher.classList.add('flex');
        }

        function closeAppWindow() {
            document.getElementById('appWindow').classList.add('hidden');
            const launcher = document.getElementById('minimizedLauncher');
            launcher.classList.add('hidden');
            launcher.classList.remove('flex');
            const desktopIcon = document.getElementById('desktopAppIcon');
            desktopIcon.classList.remove('hidden');
            desktopIcon.classList.add('flex');
        }

        function restoreAppWindow() {
            const appWindow = document.getElementById('appWindow');
            appWindow.classList.remove('hidden');
            const launcher = document.getElementById('minimizedLauncher');
            launcher.classList.add('hidden');
            launcher.classList.remove('flex');
            const desktopIcon = document.getElementById('desktopAppIcon');
            desktopIcon.classList.add('hidden');
            desktopIcon.classList.remove('flex');
            clampAppWindowToViewport();
        }

        function showControls() {
            if (gameState === 'MENU') {
                document.getElementById('optionsPanel').classList.remove('hidden');
                showSettingsTab('controls');
                return;
            }
            const controls = Object.entries(keybindLabels)
                .map(([action, label]) => `${label}: ${keyLabel(keybinds[action])}`)
                .join('\n');
            alert(`Controls:\n${controls}`);
        }

        function showHelp() {
            alert('Objective:\nComplete Math, ELA, Science, and Gym to unlock the Principal Office.\nHold S while grounded for a slide burst (maximum 1.5 seconds); press S in the air to ground pound cracked blocks.\nBonus subjects unlock no ability, but help you explore the school.');
        }

        function gameLoop(timestamp) {
            if (lastFrameTime && timestamp - lastFrameTime < frameInterval) {
                requestAnimationFrame(gameLoop);
                return;
            }
            lastFrameTime = timestamp;
            if (!lastTimestamp) lastTimestamp = timestamp;
            const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
            lastTimestamp = timestamp;

            if (isPhoneOpen) updatePhoneSignal(dt);
            if (gameState === 'PLAYING' && !isPaused) {
                update(dt);
            }
            if (gameState === 'GAMEOVER' && multiplayerSession) {
                updateRemoteAnimation(dt);
                if (Date.now() - lastBuddyRescue >= 60000 && getNearbyTeammate()) rescueWithTeammate();
            }
            
            draw();
            updateMultiplayer();

            if (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'HOMEWORK' || gameState === 'SHOP' || gameState === 'LEVEL1_COMPLETE' || gameState === 'HOMEWORK_COMPLETE' || (gameState === 'GAMEOVER' && multiplayerSession)) {
                requestAnimationFrame(gameLoop);
            }
        }

        function updateStealthAlert(dt, source, teacher = null) {
            if (slackingCaughtCooldown > 0) {
                teacherAlertTimer = 0;
                return;
            }

            if (teacherAlertTimer === 0) {
                document.getElementById('statusText').innerText = source === 'camera'
                    ? '📷 Security camera spotted you slacking! Move out of its red zone!'
                    : '👀 Your teacher noticed you. Stop slacking or get out of sight!';
            }
            teacherAlertTimer = Math.min(1.6, teacherAlertTimer + dt * (player.canStealth ? 0.72 : 1) * getQuestBuffs().alertGain);
            if (teacherAlertTimer < 1.6) return;

            const stealthDodged = player.canStealth && Math.random() < 0.3;
            teacherAlertTimer = 0;
            slackingCaughtCooldown = 4.5;
            if (teacher) {
                teacher.state = 'WRITING';
                teacher.timer = 0;
                teacher.nextDecision = 1.6;
                teacher.lookAtPlayer = false;
                teacher.warned = false;
            }
            if (stealthDodged) {
                document.getElementById('statusText').innerText = `🥷 Stealth Hood fooled the ${source}. Move before they spot you again!`;
                return;
            }

            troubleMeter += 1;
            const sourceName = source === 'camera' ? 'Security camera' : 'Teacher';
            if (troubleMeter === 1) {
                document.getElementById('statusText').innerText = `⚠️ ${sourceName} caught you slacking! Strike 1/2!`;
            } else {
                document.getElementById('statusText').innerText = `🚨 ${sourceName} caught you again! Strike 2/2!`;
                triggerGameOver(`👀 Two strikes! ${sourceName} caught you slacking and sent you to detention.`);
            }
        }

        function update(dt) {
            gameTime += dt;
            const difficultyPressure = Math.min(2, 1.25 + gameTime / 120);
            if (multiplayerSession?.gameId !== 'skyline' && currentRoomKey !== 'MultiplayerArena') {
                playQuestTimer += dt;
                if (playQuestTimer >= 1) {
                    recordQuestProgress('playSeconds', Math.floor(playQuestTimer));
                    playQuestTimer %= 1;
                }
            }
            if (isSlacking) {
                slackQuestTimer += dt;
                if (slackQuestTimer >= 1) {
                    recordQuestProgress('slackSeconds', Math.floor(slackQuestTimer));
                    slackQuestTimer %= 1;
                }
            }
            questSaveTimer += dt;
            questRenderTimer += dt;
            if (questProgressDirty && questSaveTimer >= 5) saveProgression();
            if (questRenderTimer >= 0.5) {
                questRenderTimer = 0;
                if (!document.getElementById('questModal').classList.contains('hidden')) renderQuestLog();
            }
            if (sprintTime > 0) sprintTime = Math.max(0, sprintTime - dt);
            if (sprintTime === 0) combo = 0; // Reset combo when sprint time is over
            if (spawnSafeTime > 0) spawnSafeTime = Math.max(0, spawnSafeTime - dt);
            if (roomBanner.time > 0) roomBanner.time -= dt; // Decrease room banner time
            updateParticles(dt); // Update particle effects
            updateRemoteAnimation(dt);
            const wasBuddyNearby = buddyNearby;
            buddyNearby = Boolean(getNearbyTeammate());
            if (wasBuddyNearby !== buddyNearby) {
                document.getElementById('buddyBoostStatus').innerText = buddyNearby ? 'BUDDY LINK +20%' : '';
                if (buddyNearby) roomBanner = { text: 'BUDDY LINK! MOVE TOGETHER!', time: 1.5 };
            }
            const room = rooms[currentRoomKey];
            if (updateSkylineArena(dt, room)) return;

            // Update Timers
            if (player.jumpBufferTimer > 0) player.jumpBufferTimer -= dt;
            if (player.coyoteTimer > 0) player.coyoteTimer -= dt;

            const slidePoseTarget = player.isSliding ? 1 : 0;
            player.slidePoseVelocity += (slidePoseTarget - player.slidePose) * 180 * dt;
            player.slidePoseVelocity *= Math.exp(-24 * dt);
            player.slidePose = Math.max(-0.08, Math.min(1.08, player.slidePose + player.slidePoseVelocity * dt));
            player.landBounce = Math.max(0, player.landBounce - dt);
            // Update Moving Platforms
            (room.platforms || []).forEach(p => {
                p.springPulse = Math.max(0, (p.springPulse || 0) - dt);
                if (p.speedX) {
                    p.x += (p.dirX || 1) * p.speedX * dt;
                    if (p.x <= (p.minX || 0) || p.x + p.w >= (p.maxX || 3000)) p.dirX = (p.dirX || 1) * -1;
                }
                if (p.speedY) {
                    p.y += (p.dirY || 1) * p.speedY * dt;
                    if (p.y <= (p.minY || 100) || p.y >= (p.maxY || 380)) p.dirY = (p.dirY || 1) * -1;
                }
                if (p.crumbling) {
                    p.crumbleTimer -= dt;
                    if (p.crumbleTimer <= 0) {
                        p.crumbling = false;
                        p.brokenUntil = 2.8;
                    }
                } else if (p.brokenUntil > 0) {
                    p.brokenUntil = Math.max(0, p.brokenUntil - dt);
                }
            });

            // Player movement controls
            const moveSpeed = player.sprintBoost && sprintTime > 0 ? 430 : (sprintTime > 0 ? 360 : 220);
            const movementAxis = Math.max(-1, Math.min(1,
                (keys[keybinds.right] ? 1 : 0) - (keys[keybinds.left] ? 1 : 0) + mobileMoveAxis
            ));
            const moveLeft = movementAxis < -0.12;
            const moveRight = movementAxis > 0.12;
            const movingInput = moveLeft || moveRight;
            if (movingInput && (player.sprinting || sprintTime > 0)) {
                sprintQuestTimer += dt;
                if (sprintQuestTimer >= 1) {
                    recordQuestProgress('sprintSeconds', Math.floor(sprintQuestTimer));
                    sprintQuestTimer %= 1;
                }
            }
            const onFloor = room.platforms.some(platform =>
                platform.y === 380 && player.y >= platform.y - player.h - 40 && player.y <= platform.y - player.h + 10
            );
            const slideKeyHeld = Boolean(keys[keybinds.groundPound]);
            if (player.isSliding) {
                player.slideTimer = Math.max(0, player.slideTimer - dt);
                if (!player.grounded || !slideKeyHeld || player.slideTimer <= 0) {
                    endPlayerSlide(room);
                }
            } else if (!player.groundPounding && player.grounded && slideKeyHeld && !player.slideUsedUntilRelease) {
                player.y += player.h - 24;
                player.h = 24;
                player.isSliding = true;
                player.slideTimer = 1.5;
                player.slideUsedUntilRelease = true;
                player.slideParticleTimer = 0;
                spawnBurst(player.x + player.w / 2, player.y + player.h, '#ffffff', 5);
            }

            if (player.sprinting && sprintTime <= 0 && movingInput) {
                sprintStamina = Math.max(0, sprintStamina - 28 * getQuestBuffs().sprintDrain * dt);
                if (sprintStamina === 0) {
                    player.sprinting = false;
                    player.sprintLocked = true;
                    document.getElementById('statusText').innerText = 'Sprint exhausted. Ease up to recover.';
                }
            } else if (sprintTime <= 0 && sprintStamina < maxSprintStamina) {
                const idleRegen = !movingInput && (player.grounded || onFloor);
                sprintStamina = Math.min(maxSprintStamina, sprintStamina + ((idleRegen ? 34 : 20) + (buddyNearby ? 12 : 0)) * getQuestBuffs().staminaRegen * dt);
                if (player.sprintLocked && sprintStamina >= maxSprintStamina) {
                    sprintStamina = maxSprintStamina;
                    player.sprintLocked = false;
                    document.getElementById('statusText').innerText = 'Sprint stamina full.';
                }
            }

            const turboMultiplier = multiplayerSession?.gameId === 'skyline' && skylinePowerups.turbo > 0 ? 1.5 : 1;
            const normalSpeed = (player.isSliding ? 360 : (player.sprinting && sprintStamina > 0 ? 300 : moveSpeed)) *
                (buddyNearby ? 1.2 : 1) * turboMultiplier * getQuestBuffs().moveSpeed;
            
            if (player.dashTime > 0) {
                player.dashTime = Math.max(0, player.dashTime - dt);
                player.vx = player.dashDirection * 1250;
                spawnBurst(player.x + (player.vx > 0 ? 0 : player.w), player.y + player.h / 2, '#7dd3fc', 3);
            } else if (moveLeft || moveRight) player.vx = normalSpeed * movementAxis;
            else player.vx *= 0.7;

            // Cooldowns
            if (player.dashCooldown > 0) player.dashCooldown -= dt;
            if (doorCooldown > 0) doorCooldown -= dt;

            // Wall Slide Logic
            const roomBoundsWidth = room.width || canvas.width;
            const touchingLeftWall = (player.x <= 2 || room.platforms.some(p => Math.abs(player.x - (p.x + p.w)) < 4 && player.y + player.h > p.y && player.y < p.y + p.h)) && moveLeft;
            const touchingRightWall = (player.x + player.w >= roomBoundsWidth - 2 || room.platforms.some(p => Math.abs((player.x + player.w) - p.x) < 4 && player.y + player.h > p.y && player.y < p.y + p.h)) && moveRight;
            
            player.isWallSliding = !player.grounded && player.vy > 0 && !player.groundPounding && (touchingLeftWall || touchingRightWall);
            if (player.isWallSliding) {
                player.wallDir = touchingRightWall ? 1 : -1;
                player.vy = Math.min(player.vy, 110);
                if (Math.random() < 0.3) spawnBurst(player.x + (touchingRightWall ? player.w : 0), player.y + player.h, '#e2e8f0', 2);
            }

            // Gravity
            if (player.groundPounding) {
                player.vy = 850;
            } else {
                player.vy += 1200 * dt;
            }

            // Apply position
            const wasGrounded = player.grounded;
            const previousX = player.x;
            player.x += player.vx * dt;
            player.y += player.vy * dt;
            if (player.isSliding && Math.abs(player.vx) > 35) {
                player.slideParticleTimer += dt;
                while (player.slideParticleTimer >= 0.045) {
                    player.slideParticleTimer -= 0.045;
                    emitSlideDust();
                }
            } else {
                player.slideParticleTimer = 0;
            }
            if (wasGrounded && !player.isSliding) {
                (room.slideGates || []).forEach(gate => {
                    const overlapsGate = player.x + player.w > gate.x && player.x < gate.x + gate.w &&
                        player.y + player.h > gate.y && player.y < gate.y + gate.h;
                    if (overlapsGate) {
                        player.x = previousX;
                        player.vx = 0;
                    }
                });
            }

            // Room Collisions with Platforms
            player.grounded = false;

            room.doors.forEach(door => {
                const accessible = !door.reqAbility || player[door.reqAbility];
                const nearDoor = Math.abs((player.x + player.w / 2) - (door.x + door.w / 2)) < 90 &&
                    Math.abs((player.y + player.h / 2) - (door.y + door.h / 2)) < 85;
                const targetProgress = accessible && nearDoor ? 1 : 0;
                door.openProgress = (door.openProgress || 0) + (targetProgress - (door.openProgress || 0)) * Math.min(1, dt * 10);
                door.lockedPulse = Math.max(0, (door.lockedPulse || 0) - dt);
            });

            room.platforms.forEach(p => {
                if (p.brokenUntil > 0) return;
                if (player.x + player.w > p.x && player.x < p.x + p.w &&
                    player.y + player.h >= p.y && player.y + player.h <= p.y + p.h + Math.max(20, player.vy * dt + 5)) {
                    player.y = p.y - player.h;
                    player.vy = 0;
                    player.grounded = true;
                    if (!wasGrounded) player.landBounce = 0.22;
                    player.coyoteTimer = 0.1 + getQuestBuffs().coyoteTime;
                    player.dashCooldown = 0; // Landing resets dash

                    // Ground Pound Impact
                    if (player.groundPounding) {
                        player.groundPounding = false;
                        spawnBurst(player.x + player.w / 2, player.y + player.h, '#ef4444', 20);
                        playTone(200, 0.12);
                        document.getElementById('statusText').innerText = '💥 DESK SLAM SHOCKWAVE!';
                        smashNearbyPoundTargets(room);
                        // Stun enemies in room
                        if (room.enemies) {
                            room.enemies.forEach(enemy => {
                                if (Math.abs(enemy.x - player.x) < 180) {
                                    enemy.stunnedTimer = 2.0;
                                }
                            });
                        }
                    }

                    if (p.surface === 'spring') {
                        p.springPulse = 0.22;
                        player.vy = -790 * getQuestBuffs().jumpPower;
                        player.grounded = false;
                        player.coyoteTimer = 0;
                        player.doubleJumpsLeft = player.canDoubleJump ? 1 : 0;
                        recordQuestProgress('springBounces');
                        spawnBurst(player.x + player.w / 2, player.y + player.h, '#57f3d2', 12);
                        playTone(680, 0.05);
                    } else if (p.surface === 'boost') {
                        player.vx = (p.direction || 1) * 560;
                        spawnBurst(player.x + player.w / 2, player.y + player.h / 2, '#ffe66d', 8);
                    } else if (p.surface === 'crumble' && !p.crumbling) {
                        p.crumbling = true;
                        p.crumbleTimer = 0.4;
                    }
                }
            });
            updateSlideGateRewards(room);

            if (wasGrounded && !player.grounded && player.vy >= 0) {
                player.coyoteTimer = 0.1 + getQuestBuffs().coyoteTime; // Coyote grace period
            }

            // Execute buffered jump if available
            if (player.jumpBufferTimer > 0) {
                if (executeJump()) {
                    player.jumpBufferTimer = 0;
                }
            }

            // Canvas Boundary Clamp
            if (player.x < 0) player.x = 0;
            const roomWidth = rooms[currentRoomKey].width || canvas.width;
            if (player.x + player.w > roomWidth) player.x = roomWidth - player.w;
            const maxCameraX = Math.max(0, roomWidth - canvas.width);
            const targetCameraX = Math.max(0, Math.min(maxCameraX, player.x - canvas.width * 0.42));
            cameraX += (targetCameraX - cameraX) * Math.min(1, dt * 8);
            if (player.y > canvas.height + 80) {
                currentRoomKey = checkpoint.room;
                player.x = checkpoint.x;
                player.y = checkpoint.y;
                player.vx = 0;
                player.vy = 0;
                updateUI();
            }

            // Door Triggers
            let changedRoom = false;
            room.doors.forEach(d => {
                if (doorCooldown > 0) return;
                if (player.x + player.w > d.x && player.x < d.x + d.w &&
                    player.y + player.h > d.y && player.y < d.y + d.h) {
                    if (!doorIntent) {
                        document.getElementById('statusText').innerText = `Press ${keyLabel(keybinds.interact)} to use this door.`;
                        return;
                    }
                    
                    // Ability unlock requirement check
                    if (d.reqAbility && !player[d.reqAbility]) {
                        d.lockedPulse = 0.45;
                        document.getElementById('statusText').innerText = `Locked! ${d.label}`;
                        return;
                    }

                    const coreSubjectsComplete = ['Math', 'ELA', 'Science', 'Gym'].every(subject => homeworkDone[subject]);
                    if (d.reqCore && level === 1 && !coreSubjectsComplete) {
                        document.getElementById('statusText').innerText = 'Locked! Finish every class worksheet first.';
                        playTone(110, 0.05);
                        return;
                    }

                    const secondFloorComplete = ['History', 'Chemistry', 'MusicClass'].every(subject => homeworkDone[subject]);
                    if (d.reqSecondFloor && !secondFloorComplete) {
                        document.getElementById('statusText').innerText = 'Locked! Complete every second-floor class first.';
                        playTone(110, 0.05);
                        return;
                    }

                    if (d.reqLevelSubjects && !activeLevelSubjects.every(subject => homeworkDone[subject])) {
                        document.getElementById('statusText').innerText = `Locked! Finish all Level ${level} classes first.`;
                        playTone(110, 0.05);
                        return;
                    }

                    // Completing every class opens Level 2 instead of ending the run.
                    if (d.targetRoom === 'Principal' || d.targetRoom === 'FinalExit') {
                        // Low-chance required "pop quiz" before you're allowed to leave the level.
                        if (!popQuizShownThisLevel && Math.random() < 0.15) {
                            popQuizShownThisLevel = true;
                            popQuizPending = d;
                            doorIntent = false;
                            changedRoom = true;
                            openPopQuiz();
                            return;
                        }
                        completeLevelExit(d);
                        changedRoom = true;
                        return;
                    }

                    // Room Transition
                    currentRoomKey = d.targetRoom;
                    recordQuestProgress('doorTransitions');
                    player.x = d.targetX;
                    player.y = d.targetY;
                    player.vx = 0;
                    player.vy = 0;
                    spawnSafeTime = 0.8;
                    doorCooldown = 0.35 * getQuestBuffs().doorCooldown;
                    checkpoint = { room: currentRoomKey, x: d.targetX, y: d.targetY };
                    roomBanner = { text: rooms[currentRoomKey].title, time: 1.8 }; // Show room title in banner
                    spawnBurst(player.x + player.w / 2, player.y + player.h / 2, '#ffffff', 12); // Added burst effect for checkpoint
                    updateUI();
                    doorIntent = false;
                    changedRoom = true;
                }
            });

            if (changedRoom) return;

            collectRoomCoins(room);

            // Level 2 detention monitors patrol faster and one monitor homes in on the player.
            let monitorWatchingPlayer = false;
            if (room.enemies) {
                room.enemies.forEach(enemy => {
                    if (enemy.chase && Math.abs(player.x - enemy.x) < 300) monitorWatchingPlayer = true;
                    if (enemy.chase && Math.abs(player.x - enemy.x) < 300) {
                        enemy.x += Math.sign(player.x - enemy.x) * 55 * dt;
                    } else {
                        enemy.x += enemy.dir * enemy.speed * dt;
                    }
                    const enemyLimit = (room.width || canvas.width) - 65;
                    if (enemy.x < 35 || enemy.x > enemyLimit) enemy.dir *= -1;

                    if (spawnSafeTime <= 0 && player.x < enemy.x + enemy.w && player.x + player.w > enemy.x &&
                        player.y < enemy.y + enemy.h && player.y + player.h > enemy.y) {
                        spawnBurst(player.x + player.w / 2, player.y + player.h / 2, '#ff416c', 14); // Added burst effect for game over
                        triggerGameOver('🚨 A detention monitor caught you in Level 2!');
                    }
                });
            }

            let reporterWatchingPlayer = false;
            if (room.reporters) {
                room.reporters.forEach(reporter => {
                    reporter.x += reporter.dir * reporter.speed * dt;
                    const reporterLimit = (room.width || canvas.width) - 55;
                    if (reporter.x < 35 || reporter.x > reporterLimit) reporter.dir *= -1;

                    if (reporter.bribeCooldown > 0) reporter.bribeCooldown = Math.max(0, reporter.bribeCooldown - dt);

                    const nearby = Math.abs((player.x + player.w / 2) - reporter.x) < reporter.range &&
                        Math.abs((player.y + player.h / 2) - reporter.y) < 75;
                    if (nearby && !(reporter.bribeCooldown > 0)) reporterWatchingPlayer = true;
                    if (isSlacking && nearby && !player.canStealth && !(reporter.bribeCooldown > 0)) {
                        reporter.timer += dt;
                        if (reporter.timer > 0.7 && !reporter.reported) {
                            reporter.reported = true;
                            triggerGameOver('📣 A student reported you for slacking. Timeout!');
                        }
                    } else {
                        reporter.timer = Math.max(0, reporter.timer - dt * 2);
                        reporter.reported = false;
                    }
                });
            }

            // Slacking Energy Recovery / Sleep Decay
            if (isSlacking) {
                energy = Math.min(100, energy + (buddyNearby ? 70 : 55) * getQuestBuffs().slackRecovery * dt);
                slackSeconds += dt;
            } else {
                energy = Math.max(0, energy - (buddyNearby ? 0.35 : 1.25) * getQuestBuffs().energyDrain * dt);
                activeSeconds += dt;
            }

            if (energy <= 0) {
                triggerGameOver("😴 You fell asleep in the hallway/classroom!");
                return;
            }

            let teacherSpotted = false;
            let teacherWatchingPlayer = false;

            // Teacher Patrol AI Stealth Logic
            if (room.teacher) {
                const t = room.teacher;
                t.timer += dt;
                const teacherLimit = (room.width || canvas.width) - 60;
                t.startX ??= t.x;
                t.dir ||= 1;
                t.facing ||= t.dir;
                t.patrolSpeed ||= 30 + Math.random() * 30;
                t.patrolOriginX ??= t.x;
                t.patrolMinX ??= Math.max(60, t.patrolOriginX - Math.max(120, t.range * 1.2));
                t.patrolMaxX ??= Math.min(teacherLimit, t.patrolOriginX + Math.max(120, t.range * 1.2));
                t.nextDecision ||= 2 + Math.random() * 2;
                t.scanDirection ||= 1;

                const playerCenterX = player.x + player.w / 2;
                const playerCenterY = player.y + player.h / 2;
                const deltaX = playerCenterX - t.x;
                const teacherEyeY = t.y - 14;
                const deltaY = Math.abs(playerCenterY - teacherEyeY);
                const nearbyToNotice = Math.abs(deltaX) <= t.range * 1.55 && deltaY < 145;
                if (isSlacking && nearbyToNotice && t.state === 'WRITING') {
                    t.state = 'SUSPICIOUS';
                    t.timer = 0;
                    t.nextDecision = 0.7 + Math.random() * 0.25;
                    t.facing = Math.sign(deltaX) || t.facing;
                    t.warned = true;
                    document.getElementById('statusText').innerText = '👀 Your teacher noticed you. Stop slacking or get out of sight!';
                }

                if (t.state === 'WRITING') {
                    t.x += t.dir * t.patrolSpeed * difficultyPressure * getDifficultySettings().teacherSpeed * dt;
                    if (t.x <= t.patrolMinX || t.x >= t.patrolMaxX) {
                        t.x = Math.max(t.patrolMinX, Math.min(t.patrolMaxX, t.x));
                        t.dir *= -1;
                        t.facing = t.dir;
                    }
                    if (t.timer >= t.nextDecision) {
                        t.state = 'LOOKING';
                        t.timer = 0;
                        t.nextDecision = 1.3 + Math.random() * 1.1;
                        t.lookAtPlayer = nearbyToNotice;
                        if (nearbyToNotice) t.facing = Math.sign(deltaX) || t.facing;
                    }
                } else if (t.state === 'SUSPICIOUS') {
                    t.facing = Math.sign(deltaX) || t.facing;
                    if (t.timer >= t.nextDecision) {
                        t.state = 'LOOKING';
                        t.timer = 0;
                        t.nextDecision = 1.35 + Math.random() * 0.8;
                        t.lookAtPlayer = true;
                    }
                } else if (t.state === 'LOOKING') {
                    if (nearbyToNotice && t.lookAtPlayer) {
                        t.facing = Math.sign(deltaX) || t.facing;
                    } else if (!t.scanTimer || t.scanTimer <= 0) {
                        t.scanDirection *= -1;
                        t.facing = t.scanDirection;
                        t.scanTimer = 0.45;
                    }
                    t.scanTimer = Math.max(0, (t.scanTimer || 0) - dt);
                    if (t.timer >= t.nextDecision) {
                        t.state = 'WRITING';
                        t.timer = 0;
                        t.nextDecision = 2.2 + Math.random() * 2.1;
                        t.lookAtPlayer = false;
                        t.warned = false;
                    }
                } else {
                    t.state = 'WRITING';
                    t.timer = 0;
                    t.nextDecision = 2.2 + Math.random() * 2.1;
                }

                slackingCaughtCooldown = Math.max(0, slackingCaughtCooldown - dt);
                const alertRange = t.range * Math.min(1.25, difficultyPressure);
                const facing = t.facing || t.dir || 1;
                const teacherVision = {
                    left: facing > 0 ? t.x - 18 : t.x - alertRange,
                    right: facing > 0 ? t.x + alertRange : t.x + 18,
                    top: teacherEyeY - 90,
                    bottom: teacherEyeY + 90
                };
                teacherWatchingPlayer = (t.state === 'LOOKING' || t.state === 'SUSPICIOUS') &&
                    player.x + player.w >= teacherVision.left &&
                    player.x <= teacherVision.right &&
                    player.y + player.h >= teacherVision.top &&
                    player.y <= teacherVision.bottom;
                teacherSpotted = isSlacking && teacherWatchingPlayer;
                if (teacherSpotted) updateStealthAlert(dt, 'teacher', t);
            } else {
                slackingCaughtCooldown = Math.max(0, slackingCaughtCooldown - dt);
            }

            const cameraWatchingPlayer = (room.securityCameras || []).some(camera => {
                const cameraVision = {
                    left: camera.x - camera.rangeX / 2,
                    right: camera.x + camera.rangeX / 2,
                    top: camera.platformY + (camera.platformHeight || 20) + 8,
                    bottom: camera.platformY + (camera.platformHeight || 20) + 8 + camera.rangeY
                };
                return player.x + player.w >= cameraVision.left &&
                    player.x <= cameraVision.right &&
                    player.y + player.h >= cameraVision.top &&
                    player.y <= cameraVision.bottom;
            });
            const cameraSpotted = isSlacking && cameraWatchingPlayer;
            if (cameraSpotted && !teacherSpotted) updateStealthAlert(dt, 'camera');
            if (gameState === 'GAMEOVER') return;
            const phoneDetected = teacherWatchingPlayer || cameraWatchingPlayer || reporterWatchingPlayer || monitorWatchingPlayer;
            if (isPhoneOpen && phoneDetected && !phoneTaken) {
                phoneCaughtTime = Math.min(5, phoneCaughtTime + dt);
                updatePhoneDetectionMeter();
                if (phoneCaughtTime >= 5) {
                    phoneTaken = true;
                    togglePhone(false);
                    showPhoneConfiscatedToast();
                }
            }
            // Gym Hazard Dodgeballs
            if (currentRoomKey === 'Gym') {
                if (!room.balls) room.balls = [];
                if (Math.random() < 0.04) {
                    room.balls.push({ x: Math.random() * 700 + 50, y: 0, speed: 200 + Math.random() * 100 });
                }

                room.balls.forEach(b => {
                    b.y += b.speed * dt;
                    if (Math.abs(b.x - player.x) < 25 && Math.abs(b.y - player.y) < 25) {
                        triggerGameOver("🏀 KO'd by dodgeball in Gym!");
                    }
                });
                room.balls = room.balls.filter(b => b.y < canvas.height);
            }
        }

        function draw() {
            const room = rooms[currentRoomKey] || rooms.Math;
            if (!rooms[currentRoomKey]) {
                currentRoomKey = 'Math';
                cameraX = 0;
                updateUI();
            }
            ctx.fillStyle = room.color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Notebook Grid Background
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 30) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            ctx.save();
            ctx.translate(-cameraX, 0);
            drawGeneratedLevelDecor(room);
            drawRoomDecor(currentRoomKey);
            drawClassroomDecor(room);
            if (currentRoomKey === 'MultiplayerArena') drawSkylineBackdrop(room);

            // Draw Platforms
            room.platforms.forEach(drawGamePlatform);
            drawMovementChallenges(room);
            drawSecurityCameras(room);

            // Draw Doors
            room.doors.forEach(d => {
                const openProgress = d.openProgress || 0;
                const lockedOffset = d.lockedPulse ? Math.sin(gameTime * 55) * d.lockedPulse * 4 : 0;
                const doorX = d.x + lockedOffset;
                const panelWidth = d.w * (1 - openProgress) / 2;

                ctx.save();
                ctx.translate(doorX - d.x, 0);
                ctx.fillStyle = '#18212b';
                ctx.fillRect(d.x, d.y, d.w, d.h);
                ctx.fillStyle = (d.reqAbility && !player[d.reqAbility]) ? '#ff9999' : '#99ff99';
                if (panelWidth > 0.5) {
                    ctx.fillRect(d.x, d.y, panelWidth, d.h);
                    ctx.fillRect(d.x + d.w - panelWidth, d.y, panelWidth, d.h);
                }
                ctx.strokeRect(d.x, d.y, d.w, d.h);
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 10px "Comic Sans MS"';
                ctx.fillText(openProgress > 0.55 ? 'OPEN' : (d.reqAbility ? 'LOCK' : 'DOOR'), d.x + 5, d.y + d.h / 2);
                ctx.restore();
            });

            // Draw Homework Desk
            if (room.desk) {
                const isDone = homeworkDone[room.desk.subject];
                ctx.fillStyle = isDone ? '#99cc99' : '#ffcc66';
                ctx.fillRect(room.desk.x, room.desk.y, room.desk.w, room.desk.h);
                ctx.strokeRect(room.desk.x, room.desk.y, room.desk.w, room.desk.h);
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 11px "Comic Sans MS"';
                ctx.fillText(isDone ? '✅ SOLVED' : '📝 WORK', room.desk.x + 5, room.desk.y + 30);
            }

            // Draw Teacher
            if (room.teacher) {
                drawTeacher(room.teacher);
            }

            if (room.reporters) {
                room.reporters.forEach(drawReporter);
            }

            // Draw Gym Dodgeballs
            if (room.balls) {
                room.balls.forEach(b => {
                    ctx.fillStyle = '#ff3300';
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, 14, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                });
            }

            if (room.enemies) drawLevel2Enemies(room.enemies);

            if (room.coins) {
                room.coins.forEach(coin => {
                    if (coin.collected) return;
                    const bob = Math.round(Math.sin(gameTime * 5 + coin.bob) * 3);
                    ctx.fillStyle = '#ffd43b';
                    ctx.fillRect(coin.x - 7, coin.y - 12 + bob, 14, 18);
                    ctx.fillStyle = '#fff3a6';
                    ctx.fillRect(coin.x - 2, coin.y - 9 + bob, 4, 12);
                    ctx.strokeStyle = '#000000';
                    ctx.strokeRect(coin.x - 7, coin.y - 12 + bob, 14, 18);
                });
            }

            if (room.prize) {
                const prize = room.prize;
                const pulse = 0.5 + Math.sin(gameTime * 4) * 0.12;
                ctx.save();
                ctx.globalAlpha = prize.claimed ? 0.5 : pulse;
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.arc(prize.x + 20, prize.y - 2, 31, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.fillStyle = prize.claimed ? '#94a3b8' : '#92400e';
                ctx.fillRect(prize.x, prize.y - 5, 40, 22);
                ctx.fillStyle = prize.claimed ? '#cbd5e1' : '#f59e0b';
                ctx.fillRect(prize.x - 3, prize.y - 12, 46, 10);
                ctx.strokeStyle = '#111827';
                ctx.lineWidth = 3;
                ctx.strokeRect(prize.x, prize.y - 5, 40, 22);
                ctx.strokeRect(prize.x - 3, prize.y - 12, 46, 10);
                ctx.fillStyle = prize.claimed ? '#334155' : '#fff7b2';
                ctx.fillRect(prize.x + 17, prize.y - 3, 6, 13);
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#111827';
                ctx.fillText(prize.claimed ? 'CLAIMED' : 'PRESS USE', prize.x + 20, prize.y - 20);
                ctx.restore();
            }

            if (currentRoomKey === 'MultiplayerArena') drawSkylineObjects(room);

            // Draw Player Stick figure
            const linkedTeammate = buddyNearby ? getNearbyTeammate() : null;
            if (linkedTeammate) drawBuddyLink(linkedTeammate);
            remotePlayers.forEach(remote => {
                if (remote.state && remote.state.level === level && remote.state.room === currentRoomKey) drawRemotePlayer(remote);
            });
            drawPlayerStickman();
            drawParticles();

            ctx.restore();

            const roomTitle = room.title.toUpperCase();
            ctx.save();
            ctx.font = 'bold 14px "Comic Sans MS"';
            const titleWidth = Math.min(canvas.width - 40, ctx.measureText(roomTitle).width + 28);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
            ctx.fillRect((canvas.width - titleWidth) / 2, 100, titleWidth, 25);
            ctx.fillStyle = '#fff8dc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(roomTitle, canvas.width / 2, 112.5, titleWidth - 16);
            ctx.restore();

            // Draw Energy HUD
            drawHUD();
            drawPixelNoise();

            if (roomBanner.time > 0) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
                ctx.fillRect(210, 66, 380, 34);
                ctx.fillStyle = '#fff36b';
                ctx.font = 'bold 16px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(roomBanner.text, 400, 88);
                ctx.textAlign = 'left';
            }

            if (energy < 20 && Math.floor(gameTime * 5) % 2 === 0) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.13)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            if (room.enemies && room.enemies.some(enemy => Math.abs(player.x - enemy.x) < 130)) {
                ctx.fillStyle = '#ff3355';
                ctx.font = 'bold 14px monospace';
                ctx.fillText('!! MONITOR NEARBY !!', 300, 420);
            }

            if (isPaused) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#ffff66';
                ctx.font = 'bold 34px monospace';
                ctx.fillText('PAUSED', 325, 220);
                ctx.font = 'bold 14px monospace';
                ctx.fillText('P / ESC TO RESUME', 306, 248);
            }
        }

        function drawGamePlatform(platform) {
            if (platform.brokenUntil > 0) return;
            const shake = platform.crumbling ? Math.sin(gameTime * 50) * 2 : 0;
            const x = platform.x + shake;
            const colors = {
                floor: '#28485d',
                spring: '#49e3c1',
                boost: '#ffd34f',
                crumble: platform.crumbling ? '#ff795f' : '#e6a95c'
            };
            ctx.save();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#102435';
            ctx.fillStyle = (platform.speedX || platform.speedY) ? '#38bdf8' : (colors[platform.surface] || '#8b5a2b');
            ctx.fillRect(x, platform.y, platform.w, platform.h);
            ctx.strokeRect(x, platform.y, platform.w, platform.h);

            if (platform.speedX || platform.speedY) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x + 4, platform.y + 3, platform.w - 8, 3);
                ctx.fillStyle = '#0369a1';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('ELEVATOR 🛗', x + platform.w / 2, platform.y + 15);
                ctx.textAlign = 'left';
            } else if (platform.surface === 'spring') {
                const compression = platform.springPulse > 0
                    ? Math.sin((platform.springPulse / 0.22) * Math.PI) * 5
                    : Math.max(0, Math.sin(gameTime * 3 + platform.x * 0.02)) * 1.5;
                ctx.strokeStyle = '#eaffff';
                ctx.lineWidth = 2;
                for (let mark = 12; mark < platform.w - 8; mark += 24) {
                    ctx.beginPath();
                    ctx.moveTo(x + mark, platform.y + platform.h - 2);
                    ctx.quadraticCurveTo(x + mark + 3, platform.y + platform.h - compression, x + mark + 6, platform.y + 4 + compression);
                    ctx.stroke();
                }
            } else if (platform.surface === 'boost') {
                ctx.fillStyle = `rgba(255, 248, 220, ${0.55 + Math.sin(gameTime * 7 + platform.x) * 0.25})`;
                const direction = platform.direction || 1;
                for (let mark = 22; mark < platform.w - 12; mark += 38) {
                    const centerX = x + (direction > 0 ? mark : platform.w - mark);
                    ctx.beginPath();
                    ctx.moveTo(centerX + direction * 9, platform.y + platform.h / 2);
                    ctx.lineTo(centerX - direction * 5, platform.y + 4);
                    ctx.lineTo(centerX - direction * 5, platform.y + platform.h - 4);
                    ctx.closePath();
                    ctx.fill();
                }
            } else if (platform.surface === 'crumble') {
                ctx.strokeStyle = '#714332';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + platform.w * 0.35, platform.y + 2);
                ctx.lineTo(x + platform.w * 0.48, platform.y + platform.h * 0.6);
                ctx.lineTo(x + platform.w * 0.42, platform.y + platform.h - 2);
                ctx.moveTo(x + platform.w * 0.75, platform.y + 2);
                ctx.lineTo(x + platform.w * 0.66, platform.y + platform.h * 0.65);
                ctx.stroke();
            }
            ctx.restore();
        }

        function drawMovementChallenges(room) {
            (room.slideGates || []).forEach(gate => {
                ctx.fillStyle = '#475569';
                ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
                ctx.fillStyle = '#94a3b8';
                for (let mark = 8; mark < gate.w - 4; mark += 20) {
                    ctx.fillRect(gate.x + mark, gate.y + 4, 10, 4);
                }
                ctx.fillStyle = '#0f172a';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('SLIDE', gate.x + gate.w / 2, gate.y - 5);
            });

            (room.poundTargets || []).forEach(target => {
                if (target.broken) {
                    ctx.fillStyle = '#a16207';
                    ctx.fillRect(target.x - 14, target.y + 17, 12, 6);
                    ctx.fillRect(target.x + 4, target.y + 19, 13, 5);
                    return;
                }
                ctx.fillStyle = '#b45309';
                ctx.fillRect(target.x - target.w / 2, target.y, target.w, target.h);
                ctx.strokeStyle = '#451a03';
                ctx.lineWidth = 2;
                ctx.strokeRect(target.x - target.w / 2, target.y, target.w, target.h);
                ctx.beginPath();
                ctx.moveTo(target.x, target.y + 3);
                ctx.lineTo(target.x - 5, target.y + 12);
                ctx.lineTo(target.x + 3, target.y + 17);
                ctx.lineTo(target.x - 2, target.y + 24);
                ctx.stroke();
                ctx.fillStyle = '#451a03';
                ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('SLAM', target.x, target.y - 4);
            });
        }

        function drawSkylineBackdrop(room) {
            ctx.save();
            const nightShift = skylineLevel === 2;
            ctx.fillStyle = nightShift ? '#24294d' : '#98d7ed';
            ctx.fillRect(0, 55, room.width, 270);
            if (nightShift) {
                ctx.fillStyle = '#fef3c7';
                ctx.beginPath();
                ctx.arc(room.width - 150, 110, 34, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#24294d';
                ctx.beginPath();
                ctx.arc(room.width - 164, 98, 31, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(226, 232, 255, 0.8)';
                for (let index = 0; index < 32; index++) {
                    const x = (index * 173 + 41) % room.width;
                    const y = 75 + (index * 47) % 180;
                    ctx.fillRect(x, y, index % 4 === 0 ? 3 : 2, index % 4 === 0 ? 3 : 2);
                }
            }
            for (let index = 0; index < room.width / 120; index++) {
                const buildingX = index * 120;
                const buildingHeight = 70 + (index * 47 % 95);
                ctx.fillStyle = nightShift
                    ? (index % 2 ? '#414679' : '#30375f')
                    : (index % 2 ? '#5f91ad' : '#47758f');
                ctx.fillRect(buildingX, 320 - buildingHeight, 94, buildingHeight);
                ctx.fillStyle = nightShift
                    ? (index % 3 ? '#a5f3fc' : '#fef08a')
                    : (index % 3 ? '#c9f5ff' : '#ffe77a');
                for (let row = 0; row < 3; row++) {
                    for (let column = 0; column < 3; column++) {
                        const windowY = 320 - buildingHeight + 14 + row * 21;
                        if (windowY < 315) ctx.fillRect(buildingX + 12 + column * 24, windowY, 9, 11);
                    }
                }
            }
            ctx.fillStyle = nightShift ? '#fb7185' : '#f7c85b';
            ctx.fillRect(0, 320, room.width, 5);
            ctx.restore();
        }

        function drawSkylineObjects(room) {
            room.pickups.forEach(pickup => {
                if (!pickup.active) return;
                const pulse = 1 + Math.sin(gameTime * 6 + pickup.x) * 0.12;
                const color = pickup.type === 'turbo' ? '#39daf4' : (pickup.type === 'highJump' ? '#fb62d0' : '#ffe66d');
                ctx.save();
                ctx.translate(pickup.x, pickup.y);
                ctx.scale(pulse, pulse);
                ctx.fillStyle = `${color}55`;
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#123047';
                ctx.font = 'bold 19px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(pickup.type === 'turbo' ? '⚡' : (pickup.type === 'highJump' ? '⬆' : '◇'), 0, 1);
                ctx.restore();
            });

            room.crystals.forEach(crystal => {
                if (crystal.collected) return;
                const pulse = 1 + Math.sin(gameTime * 7 + crystal.x) * 0.15;
                ctx.save();
                ctx.translate(crystal.x, crystal.y + Math.sin(gameTime * 3 + crystal.x) * 4);
                ctx.rotate(gameTime * 1.4);
                ctx.scale(pulse, pulse);
                ctx.fillStyle = '#94f6ff';
                ctx.strokeStyle = '#137b9a';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, -15);
                ctx.lineTo(11, -3);
                ctx.lineTo(7, 13);
                ctx.lineTo(-7, 13);
                ctx.lineTo(-11, -3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            });

            room.hazards.forEach(hazard => {
                ctx.save();
                ctx.translate(hazard.x + hazard.w / 2, hazard.y + hazard.h / 2);
                ctx.rotate(hazard.phase);
                ctx.fillStyle = hazard.stunned > 0 ? '#ffe66d' : '#ff557a';
                ctx.strokeStyle = '#17364b';
                ctx.lineWidth = 3;
                ctx.fillRect(-hazard.w / 2, -hazard.h / 2, hazard.w, hazard.h);
                ctx.strokeRect(-hazard.w / 2, -hazard.h / 2, hazard.w, hazard.h);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-8, -4, 5, 5);
                ctx.fillRect(3, -4, 5, 5);
                ctx.restore();
            });

            const goal = room.goal;
            const unlocked = skylineCrystals >= 4;
            const glow = 0.65 + Math.sin(gameTime * 5) * 0.25;
            ctx.save();
            ctx.globalAlpha = glow;
            ctx.fillStyle = unlocked ? '#49e3c1' : '#637d8d';
            ctx.fillRect(goal.x, goal.y, 10, goal.h);
            ctx.fillRect(goal.x + goal.w - 10, goal.y, 10, goal.h);
            ctx.fillRect(goal.x, goal.y, goal.w, 10);
            ctx.strokeStyle = unlocked ? '#eaffff' : '#263d4c';
            ctx.lineWidth = 3;
            ctx.strokeRect(goal.x, goal.y, goal.w, goal.h);
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#102435';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(unlocked ? (skylineLevel === 1 ? 'LEVEL 2' : 'FINISH') : 'LOCKED', goal.x + goal.w / 2, goal.y + goal.h + 18);
            ctx.restore();
        }

        function drawGeneratedLevelDecor(room) {
            if (!room.levelStyle) return;

            const width = room.width || canvas.width;
            const accent = room.levelAccent || '#60a5fa';
            ctx.save();
            ctx.globalAlpha = 0.24;
            ctx.fillStyle = accent;
            ctx.fillRect(0, 54, width, 7);

            for (let x = 70; x < width; x += 240) {
                ctx.strokeStyle = accent;
                ctx.fillStyle = accent;
                ctx.lineWidth = 4;

                if (room.levelStyle === 'greenhouse') {
                    ctx.beginPath();
                    ctx.moveTo(x + 20, 80);
                    ctx.bezierCurveTo(x - 20, 135, x + 65, 175, x + 15, 225);
                    ctx.stroke();
                    for (let leaf = 0; leaf < 3; leaf++) {
                        ctx.beginPath();
                        ctx.ellipse(x + (leaf % 2 ? 30 : 5), 115 + leaf * 40, 16, 7, leaf % 2 ? 0.7 : -0.7, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else if (room.levelStyle === 'science') {
                    ctx.strokeRect(x, 95, 76, 50);
                    ctx.beginPath();
                    ctx.moveTo(x + 38, 145);
                    ctx.lineTo(x + 38, 185);
                    ctx.lineTo(x + 92, 185);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(x + 38, 120, 8, 0, Math.PI * 2);
                    ctx.fill();
                } else if (room.levelStyle === 'atrium') {
                    ctx.beginPath();
                    ctx.arc(x + 48, 140, 28, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x + 48, 100);
                    ctx.lineTo(x + 78, 140);
                    ctx.lineTo(x + 48, 180);
                    ctx.lineTo(x + 18, 140);
                    ctx.closePath();
                    ctx.stroke();
                } else if (room.levelStyle === 'archives') {
                    ctx.fillRect(x, 105, 112, 8);
                    ctx.fillRect(x, 155, 112, 8);
                    for (let book = 0; book < 5; book++) {
                        ctx.fillRect(x + 5 + book * 21, 115, 14, 38);
                    }
                } else if (room.levelStyle === 'skybridge') {
                    ctx.strokeRect(x, 95, 100, 92);
                    ctx.beginPath();
                    ctx.moveTo(x + 50, 95);
                    ctx.lineTo(x + 50, 187);
                    ctx.moveTo(x, 140);
                    ctx.lineTo(x + 100, 140);
                    ctx.stroke();
                    ctx.fillRect(x + 44, 187, 12, 38);
                } else if (room.levelStyle === 'museum') {
                    ctx.strokeRect(x, 100, 98, 78);
                    ctx.strokeRect(x + 12, 112, 74, 54);
                    ctx.beginPath();
                    ctx.moveTo(x + 18, 158);
                    ctx.lineTo(x + 42, 128);
                    ctx.lineTo(x + 58, 145);
                    ctx.lineTo(x + 78, 118);
                    ctx.stroke();
                } else if (room.levelStyle === 'storm') {
                    ctx.lineWidth = 12;
                    ctx.beginPath();
                    ctx.moveTo(x, 105);
                    ctx.lineTo(x + 85, 105);
                    ctx.lineTo(x + 85, 160);
                    ctx.lineTo(x + 145, 160);
                    ctx.stroke();
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(x + 35, 195, 7, 0, Math.PI * 2);
                    ctx.arc(x + 65, 215, 5, 0, Math.PI * 2);
                    ctx.fill();
                } else if (room.levelStyle === 'prism') {
                    ctx.beginPath();
                    ctx.moveTo(x + 50, 88);
                    ctx.lineTo(x + 92, 162);
                    ctx.lineTo(x + 50, 218);
                    ctx.lineTo(x + 8, 162);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x + 50, 88);
                    ctx.lineTo(x + 50, 218);
                    ctx.moveTo(x + 8, 162);
                    ctx.lineTo(x + 92, 162);
                    ctx.stroke();
                } else {
                    ctx.strokeRect(x, 95, 100, 75);
                    ctx.beginPath();
                    ctx.moveTo(x + 50, 95);
                    ctx.lineTo(x + 50, 170);
                    ctx.moveTo(x, 132);
                    ctx.lineTo(x + 100, 132);
                    ctx.stroke();
                }
            }

            ctx.restore();
        }

        function drawRoomDecor(roomKey) {
            ctx.save();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000000';

            const now = Date.now();

            const drawClock = (x, y) => {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
                // Clock hands
                const timeAngle = (now / 1000) % 60;
                const secRad = (timeAngle / 60) * Math.PI * 2 - Math.PI / 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(secRad) * 11, y + Math.sin(secRad) * 11);
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#ef4444';
                ctx.stroke();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
            };

            const drawWindow = (x, y, skyColor) => {
                ctx.fillStyle = '#b9efff';
                ctx.fillRect(x, y, 110, 65);
                ctx.strokeRect(x, y, 110, 65);
                ctx.fillStyle = skyColor;
                ctx.fillRect(x + 8, y + 8, 94, 49);
                // Sun or clouds in window
                ctx.fillStyle = '#fde047';
                ctx.beginPath();
                ctx.arc(x + 80, y + 25, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x + 52, y + 8, 6, 49);
                ctx.fillRect(x + 8, y + 30, 94, 6);
            };

            const drawPoster = (x, y, color, text) => {
                ctx.fillStyle = '#fff3a6';
                ctx.fillRect(x, y, 92, 58);
                ctx.strokeRect(x, y, 92, 58);
                ctx.fillStyle = color;
                ctx.fillRect(x + 8, y + 8, 76, 18);
                ctx.fillStyle = '#000000';
                ctx.font = 'black 11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(text, x + 46, y + 44);
                ctx.textAlign = 'left';
            };

            const drawLockers = (x, y, count) => {
                for (let index = 0; index < count; index++) {
                    ctx.fillStyle = index % 2 ? '#3b82f6' : '#2563eb';
                    ctx.fillRect(x + index * 42, y, 36, 105);
                    ctx.strokeRect(x + index * 42, y, 36, 105);
                    // Vents & handle
                    ctx.fillStyle = '#1e40af';
                    ctx.fillRect(x + 8 + index * 42, y + 10, 20, 3);
                    ctx.fillRect(x + 8 + index * 42, y + 16, 20, 3);
                    ctx.fillStyle = '#f3f4f6';
                    ctx.fillRect(x + 26 + index * 42, y + 52, 6, 8);
                    ctx.strokeRect(x + 26 + index * 42, y + 52, 6, 8);
                }
            };

            const drawChalkboard = (x, y, w, h, title, contentLines = []) => {
                // Wooden frame
                ctx.fillStyle = '#854d0e';
                ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
                ctx.strokeRect(x - 6, y - 6, w + 12, h + 12);
                // Green chalkboard
                ctx.fillStyle = '#14532d';
                ctx.fillRect(x, y, w, h);
                ctx.strokeRect(x, y, w, h);
                // Title chalk
                ctx.fillStyle = '#fef08a';
                ctx.font = 'bold 15px monospace';
                ctx.fillText(title, x + 15, y + 24);
                // Content lines
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px monospace';
                contentLines.forEach((line, idx) => {
                    ctx.fillText(line, x + 15, y + 48 + idx * 20);
                });
            };

            if (roomKey === 'Math') {
                drawWindow(55, 70, '#38bdf8');
                drawClock(400, 50);
                drawChalkboard(105, 160, 220, 95, '📐 MATH 101', ['2 + 2 = 4', 'a² + b² = c²', 'π ≈ 3.14159']);
                drawPoster(640, 70, '#ef4444', 'COUNT IT!');
                // Math symbols decor on wall
                ctx.fillStyle = '#cbd5e1';
                ctx.font = 'bold 20px monospace';
                ctx.fillText('∑', 480, 100);
                ctx.fillText('√x', 530, 130);
                ctx.fillText('÷', 580, 95);
            } else if (roomKey === 'ELA') {
                drawWindow(70, 70, '#d5f4ff');
                drawClock(400, 50);
                drawChalkboard(105, 160, 220, 95, '📖 ELA CLASS', ['Noun & Verb', 'Metaphor vs Simile', 'Read 20 mins!']);
                drawPoster(635, 70, '#f97316', 'READ!');
                // Bookshelves
                for (let index = 0; index < 4; index++) {
                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(75 + index * 140, 310, 105, 45);
                    ctx.strokeRect(75 + index * 140, 310, 105, 45);
                    // Colorful book spines
                    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
                    for (let b = 0; b < 6; b++) {
                        ctx.fillStyle = colors[b % colors.length];
                        ctx.fillRect(82 + index * 140 + b * 15, 318, 12, 30);
                        ctx.strokeRect(82 + index * 140 + b * 15, 318, 12, 30);
                    }
                }
            } else if (roomKey === 'HallwayCentral' || roomKey === 'HallwayEast' || roomKey === 'HallwayWest') {
                drawLockers(60, 65, 8);
                drawClock(480, 50);
                drawPoster(620, 70, '#10b981', 'BE KIND');
                drawPoster(620, 145, '#f59e0b', 'HALL PASS');
                // School Motto Banner
                ctx.fillStyle = '#8b5cf6';
                ctx.fillRect(420, 110, 170, 35);
                ctx.strokeRect(420, 110, 170, 35);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('PRISM HIGH SCHOOL', 505, 132);
                ctx.textAlign = 'left';
            } else if (roomKey === 'Science') {
                drawWindow(55, 65, '#6ee7b7');
                drawClock(400, 50);
                drawChalkboard(110, 155, 210, 95, '🔬 LAB WORK', ['H₂O = Water', 'Photosynthesis', 'Safety Goggles!']);
                drawPoster(630, 70, '#06b6d4', 'SCIENCE!');
                // Science lab table & glowing bubbling beakers
                ctx.fillStyle = '#78350f';
                ctx.fillRect(70, 315, 180, 35);
                ctx.strokeRect(70, 315, 180, 35);
                // Beaker 1 (Green)
                ctx.fillStyle = '#10b981';
                ctx.fillRect(95, 280, 32, 35);
                ctx.strokeRect(95, 280, 32, 35);
                // Beaker 2 (Orange Flask)
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.moveTo(170, 275);
                ctx.lineTo(155, 315);
                ctx.lineTo(185, 315);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // Animated Bubbles
                const bY = 270 - (now / 40) % 25;
                ctx.fillStyle = '#a7f3d0';
                ctx.beginPath();
                ctx.arc(110, bY, 4, 0, Math.PI * 2);
                ctx.arc(170, bY + 5, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (roomKey === 'Gym') {
                drawClock(400, 45);
                drawPoster(65, 70, '#ef4444', 'MOVE!');
                drawPoster(645, 70, '#3b82f6', 'TEAM!');
                // Basketball Hoop
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(720, 140, 60, 50);
                ctx.strokeRect(720, 140, 60, 50);
                ctx.fillStyle = '#f97316';
                ctx.fillRect(700, 175, 30, 6);
                // Net
                ctx.strokeStyle = '#9ca3af';
                ctx.strokeRect(705, 181, 20, 25);
                ctx.strokeStyle = '#000000';
                // Gym Floor Markings
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(80, 345, 640, 5);
                ctx.beginPath();
                ctx.arc(400, 345, 40, Math.PI, 0);
                ctx.stroke();
            } else if (roomKey === 'Art') {
                drawWindow(55, 70, '#f472b6');
                drawClock(400, 50);
                drawPoster(625, 70, '#ec4899', 'CREATE!');
                // Rainbow paint splatters on wall
                const splatters = [
                    { x: 120, y: 180, color: '#ef4444', r: 18 },
                    { x: 160, y: 160, color: '#f59e0b', r: 22 },
                    { x: 200, y: 190, color: '#10b981', r: 16 },
                    { x: 230, y: 150, color: '#3b82f6', r: 20 }
                ];
                splatters.forEach(s => {
                    ctx.fillStyle = s.color;
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                    ctx.fill();
                });
                // Easels with paintings
                ctx.fillStyle = '#78350f';
                ctx.fillRect(90, 280, 8, 70);
                ctx.fillRect(140, 280, 8, 70);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(85, 290, 68, 45);
                ctx.strokeRect(85, 290, 68, 45);
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(95, 300, 48, 25);
            } else if (roomKey === 'Computer') {
                drawLockers(60, 65, 4);
                drawClock(400, 50);
                drawPoster(625, 70, '#8b5cf6', 'CODE!');
                for (let index = 0; index < 4; index++) {
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(75 + index * 175, 320, 80, 40);
                    ctx.strokeRect(75 + index * 175, 320, 80, 40);
                    // Glowing code screen
                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(84 + index * 175, 327, 62, 22);
                    ctx.fillStyle = '#052e16';
                    ctx.font = 'bold 9px monospace';
                    ctx.fillText('> npm dev', 88 + index * 175, 342);
                }
            } else if (roomKey === 'Cafeteria') {
                drawClock(400, 50);
                drawPoster(65, 70, '#f97316', 'EAT UP!');
                // Vending Machine
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(630, 240, 75, 115);
                ctx.strokeRect(630, 240, 75, 115);
                ctx.fillStyle = '#bfdbfe';
                ctx.fillRect(640, 250, 55, 60);
                ctx.strokeRect(640, 250, 55, 60);
                ctx.fillStyle = '#facc15';
                ctx.font = 'bold 10px monospace';
                ctx.fillText('SNACKS', 645, 246);
                // Dining tables
                for (let index = 0; index < 3; index++) {
                    ctx.fillStyle = '#b45309';
                    ctx.fillRect(75 + index * 170, 320, 130, 28);
                    ctx.strokeRect(75 + index * 170, 320, 130, 28);
                    ctx.fillStyle = '#ef4444'; // Red apples
                    ctx.beginPath();
                    ctx.arc(95 + index * 170, 312, 6, 0, Math.PI * 2);
                    ctx.arc(115 + index * 170, 312, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (roomKey === 'Music') {
                drawWindow(60, 70, '#c084fc');
                drawClock(400, 50);
                drawPoster(635, 70, '#a855f7', 'PLAY!');
                // Grand Piano
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(80, 310, 95, 50);
                ctx.strokeRect(80, 310, 95, 50);
                ctx.fillStyle = '#ffffff';
                for (let index = 0; index < 6; index++) {
                    ctx.fillRect(92 + index * 13, 322, 10, 22);
                    ctx.strokeRect(92 + index * 13, 322, 10, 22);
                }
            } else if (roomKey === 'Level2Hall' || roomKey === 'SecondFloor') {
                ctx.fillStyle = '#4c1d95';
                ctx.fillRect(0, 65, 1600, 14);
                drawClock(400, 45);
                drawPoster(220, 85, '#f97316', 'HISTORY');
                drawPoster(640, 85, '#06b6d4', 'CHEMISTRY');
                drawPoster(1040, 85, '#a855f7', 'MUSIC');
                drawPoster(1410, 85, '#10b981', 'ROOFTOP');
                for (let index = 0; index < 15; index++) {
                    ctx.fillStyle = index % 2 ? '#93c5fd' : '#1d4ed8';
                    ctx.fillRect(100 + index * 100, 335, 64, 30);
                    ctx.strokeRect(100 + index * 100, 335, 64, 30);
                }
            } else if (roomKey === 'Level2Exit') {
                drawPoster(330, 75, '#10b981', 'ESCAPE!');
                ctx.fillStyle = '#10b981';
                ctx.fillRect(285, 235, 230, 38);
                ctx.strokeRect(285, 235, 230, 38);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 18px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('FINAL ESCAPE EXIT', 400, 260);
                ctx.textAlign = 'left';
            }

            ctx.restore();
        }

        function drawClassroomDecor(room) {
            if (!room.desk) return;
            ctx.save();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000000';
            ctx.fillStyle = '#9b7653';
            const roomWidth = room.width || 800;
            for (let x = 90; x < roomWidth - 70; x += 150) {
                ctx.fillRect(x, 330, 92, 22);
                ctx.strokeRect(x, 330, 92, 22);
                ctx.fillStyle = Math.floor(x / 150) % 2 ? '#ffdb70' : '#b9efff';
                ctx.fillRect(x + 12, 318, 30, 12);
                ctx.fillStyle = '#9b7653';
            }
            for (let x = 80; x < roomWidth - 180; x += 420) {
                ctx.fillStyle = '#fff3a6';
                ctx.fillRect(x, 75, 220, 78);
                ctx.strokeRect(x, 75, 220, 78);
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 16px monospace';
                ctx.fillText('CLASS NOTES', x + 18, 102);
                ctx.font = 'bold 12px monospace';
                ctx.fillText('STAY AWAKE!', x + 18, 126);
            }
            ctx.restore();
        }

        function drawPixelNoise() {
            if (multiplayerSession) return;
            ctx.save();
            ctx.globalAlpha = 0.045;
            const noiseFrame = Math.floor(gameTime * 6);
            for (let index = 0; index < 90; index++) {
                const seed = Math.imul(index + 1, 374761393) + Math.imul(noiseFrame + 1, 668265263);
                const hash = Math.imul(seed ^ (seed >>> 13), 1274126177);
                const x = ((hash >>> 0) % 200) * 4;
                const y = ((Math.imul(hash ^ (hash >>> 16), 2246822519) >>> 0) % 112) * 4;
                ctx.fillStyle = index % 2 ? '#000000' : '#ffffff';
                ctx.fillRect(x, y, 2, 2);
            }
            ctx.restore();
        }

        function drawLevel2Enemies(enemies) {
            enemies.forEach(enemy => {
                const isStunned = enemy.stunnedTimer > 0;
                const running = Math.abs(enemy.speed || 0) > 0 && !isStunned;
                const cycle = gameTime * 12 + enemy.phase;
                const bob = Math.round(Math.sin(cycle) * (isStunned ? 1 : 3));
                const x = Math.round(enemy.x);
                const y = Math.round(enemy.y + bob);
                const stride = running ? Math.sin(cycle) * 4 : 0;
                ctx.save();
                ctx.translate(x + enemy.w / 2, y + enemy.h / 2);
                ctx.scale(enemy.dir < 0 ? -1 : 1, isStunned ? 0.82 : 1);
                ctx.translate(-(x + enemy.w / 2), -(y + enemy.h / 2));
                ctx.globalAlpha = isStunned ? 0.65 : 1;
                ctx.fillStyle = '#4d1f5f';
                ctx.fillRect(x + 2, y + 9, enemy.w - 4, 28);
                ctx.fillStyle = '#ff5d73';
                ctx.fillRect(x + 3, y, enemy.w - 6, 16);
                ctx.fillStyle = '#ffff66';
                ctx.fillRect(x + 7, y + 5, 4, isStunned ? 2 : 4);
                ctx.fillRect(x + enemy.w - 11, y + 5, 4, isStunned ? 2 : 4);
                ctx.fillStyle = '#000000';
                ctx.fillRect(x + 5, y + 22, enemy.w - 10, 4);
                ctx.strokeStyle = '#4d1f5f';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x + 5, y + 23);
                ctx.lineTo(x + 1 - stride, y + 31);
                ctx.moveTo(x + enemy.w - 5, y + 23);
                ctx.lineTo(x + enemy.w - 1 + stride, y + 31);
                ctx.stroke();
                ctx.restore();
            });
        }

        function drawTeacher(teacher) {
            const isLooking = teacher.state === 'LOOKING';
            const isSuspicious = teacher.state === 'SUSPICIOUS';
            const facing = teacher.facing || teacher.dir || 1;
            const stepCycle = gameTime * (teacher.patrolSpeed > 0 ? 8 : 4) + teacher.x * 0.02;
            const bob = Math.sin(stepCycle) * (isLooking ? 1.5 : 1);
            const headX = teacher.x;
            const headY = teacher.y - 14 + bob;
            const bodyY = teacher.y + 12 + bob;
            const writingMotion = Math.sin(gameTime * 8 + teacher.x * 0.1) * 0.16;
            const armAngle = isLooking ? 0.25 : (isSuspicious ? -0.55 : 0.8 + writingMotion);
            const step = Math.sin(stepCycle) * 4;

            ctx.save();
            if (isLooking || isSuspicious) {
                const visionRange = (teacher.range || 100) * 1.25;
                const eyeY = teacher.y - 14;
                const left = facing > 0 ? teacher.x - 18 : teacher.x - visionRange;
                ctx.globalAlpha = isLooking ? 0.15 : 0.1;
                ctx.fillStyle = isLooking ? '#ef4444' : '#f59e0b';
                const visionWidth = visionRange + 18;
                const alertPulse = isLooking ? 1 + Math.sin(gameTime * 10) * 0.025 : 1;
                ctx.fillRect(left, eyeY - 90, visionWidth * alertPulse, 180);
                ctx.globalAlpha = 1;
            }
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000000';
            ctx.fillStyle = isLooking ? '#ff4444' : (isSuspicious ? '#ffd166' : '#ffcccc');
            ctx.beginPath();
            ctx.arc(headX, headY, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#000000';
            ctx.fillRect(headX - 14, headY - 20, 28, 5);
            ctx.fillRect(headX - 9, headY - 25, 18, 6);

            ctx.beginPath();
            ctx.moveTo(headX, headY + 18);
            ctx.lineTo(headX, bodyY + 34);
            ctx.moveTo(headX, bodyY);
            ctx.lineTo(headX + Math.cos(armAngle) * 24, bodyY + Math.sin(armAngle) * 24);
            ctx.moveTo(headX, bodyY);
            ctx.lineTo(headX - Math.cos(armAngle) * 20, bodyY - Math.sin(armAngle) * 20);
            ctx.moveTo(headX, bodyY + 34);
            ctx.lineTo(headX - 10 - step, bodyY + 55);
            ctx.moveTo(headX, bodyY + 34);
            ctx.lineTo(headX + 10 + step, bodyY + 55);
            ctx.stroke();

            if (!isLooking && !isSuspicious) {
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(headX + facing * 7, bodyY + 15, 19, 14);
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1;
                ctx.strokeRect(headX + facing * 7, bodyY + 15, 19, 14);
                ctx.beginPath();
                ctx.moveTo(headX + facing * 10, bodyY + 19 + writingMotion * 7);
                ctx.lineTo(headX + facing * 22, bodyY + 19 - writingMotion * 7);
                ctx.stroke();
            }
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 12px "Comic Sans MS"';
            ctx.fillText(isLooking ? '!! DETECT !!' : (isSuspicious ? '?? HMM ??' : 'WRITE...'), teacher.x - 30, teacher.y - 42 + bob);
            if (isLooking) {
                const eyeX = teacher.x + (teacher.facing || teacher.dir || 1) * 5;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(eyeX - 8, headY - 2, 7, 7);
                ctx.fillRect(eyeX + 3, headY - 2, 7, 7);
                ctx.fillStyle = '#111827';
                ctx.fillRect(eyeX - 5, headY, 3, 4);
                ctx.fillRect(eyeX + 6, headY, 3, 4);
            }
            ctx.restore();
        }

        function drawSecurityCameras(room) {
            (room.securityCameras || []).forEach(camera => {
                const platformBottom = camera.platformY + (camera.platformHeight || 20);
                const pivotY = platformBottom + 4;
                const lensX = camera.x;
                const lensY = platformBottom + 23;
                const scanAngle = Math.PI / 2 + Math.sin(gameTime * 1.45 + camera.phase) * 0.48;
                const coneSpread = 0.27;
                const coneLength = camera.rangeY + 34;
                ctx.save();
                ctx.globalAlpha = 0.2 + (Math.sin(gameTime * 4 + camera.phase) + 1) * 0.025;
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.moveTo(lensX, lensY);
                ctx.lineTo(lensX + Math.cos(scanAngle - coneSpread) * coneLength, lensY + Math.sin(scanAngle - coneSpread) * coneLength);
                ctx.lineTo(lensX + Math.cos(scanAngle + coneSpread) * coneLength, lensY + Math.sin(scanAngle + coneSpread) * coneLength);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(camera.x, platformBottom);
                ctx.lineTo(camera.x, pivotY + 12);
                ctx.stroke();
                ctx.fillStyle = '#64748b';
                ctx.beginPath();
                ctx.arc(camera.x, pivotY + 12, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.save();
                ctx.translate(camera.x, pivotY + 20);
                ctx.rotate(scanAngle);
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(-10, -7, 22, 14);
                ctx.fillStyle = '#475569';
                ctx.fillRect(-7, -10, 12, 4);
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(10, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff1f3d';
                ctx.globalAlpha = 0.7 + Math.sin(gameTime * 8 + camera.phase) * 0.25;
                ctx.beginPath();
                ctx.arc(12, 0, 2.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                ctx.globalAlpha = 0.25 + Math.sin(gameTime * 5 + camera.phase) * 0.1;
                ctx.fillStyle = '#fb7185';
                ctx.beginPath();
                ctx.arc(lensX, lensY, 8 + Math.sin(gameTime * 5 + camera.phase) * 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }

        function drawReporter(reporter) {
            const bob = Math.sin(gameTime * 5 + reporter.x * 0.02) * 1.5;
            const headY = reporter.y - 18 + bob;
            ctx.save();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000000';
            const isBribed = reporter.bribeCooldown > 0;
            ctx.fillStyle = isBribed ? '#b9f6c5' : (reporter.timer > 0 ? '#ffcf56' : '#b9e6ff');
            ctx.beginPath();
            ctx.arc(reporter.x, headY, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#32506b';
            ctx.fillRect(reporter.x - 13, headY - 15, 26, 5);
            ctx.beginPath();
            ctx.moveTo(reporter.x, headY + 14);
            ctx.lineTo(reporter.x, reporter.y + 25 + bob);
            ctx.moveTo(reporter.x, reporter.y - 3 + bob);
            ctx.lineTo(reporter.x - 16, reporter.y + 9 + bob);
            ctx.moveTo(reporter.x, reporter.y - 3 + bob);
            ctx.lineTo(reporter.x + 16, reporter.y + 9 + bob);
            ctx.moveTo(reporter.x, reporter.y + 25 + bob);
            ctx.lineTo(reporter.x - 8, reporter.y + 43 + bob);
            ctx.moveTo(reporter.x, reporter.y + 25 + bob);
            ctx.lineTo(reporter.x + 8, reporter.y + 43 + bob);
            ctx.stroke();
            if (isBribed) {
                ctx.fillStyle = '#16803c';
                ctx.font = 'bold 11px "Comic Sans MS"';
                ctx.fillText('🤐 shh...', reporter.x - 22, headY - 25);
            } else if (reporter.timer > 0) {
                ctx.fillStyle = '#d62828';
                ctx.font = 'bold 11px "Comic Sans MS"';
                ctx.fillText('REPORT!', reporter.x - 25, headY - 25);
            }
            ctx.restore();
        }

        function drawBuddyLink(remote) {
            ctx.save();
            ctx.strokeStyle = 'rgba(14, 165, 233, 0.8)';
            ctx.lineWidth = 4;
            ctx.setLineDash([9, 7]);
            ctx.lineDashOffset = -gameTime * 28;
            ctx.beginPath();
            ctx.moveTo(player.x + player.w / 2, player.y + player.h / 2);
            ctx.lineTo((remote.renderX ?? remote.state.x) + 12, (remote.renderY ?? remote.state.y) + 20);
            ctx.stroke();
            ctx.restore();
        }

        function drawRemotePlayer(remote) {
            const state = remote.state;
            const remoteX = remote.renderX ?? state.x;
            const remoteY = remote.renderY ?? state.y;
            const centerX = remoteX + 12;
            const headY = remoteY + 15;
            ctx.save();
            if (multiplayerSession?.gameId === 'skyline' && state.moving) {
                const direction = remote.moveDirection || -1;
                ctx.globalAlpha = 0.55;
                ctx.fillStyle = remote.color || '#3b82f6';
                ctx.fillRect(centerX + direction * 17, headY + 16, 22, 4);
                ctx.fillRect(centerX + direction * 28, headY + 25, 14, 3);
                ctx.globalAlpha = 1;
            }
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000000';
            ctx.fillStyle = remote.color || '#3b82f6';
            ctx.beginPath();
            ctx.arc(centerX, headY, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(centerX, headY + 12);
            ctx.lineTo(centerX, headY + 30);
            ctx.moveTo(centerX, headY + 18);
            ctx.lineTo(centerX - 11, headY + 27);
            ctx.moveTo(centerX, headY + 18);
            ctx.lineTo(centerX + 11, headY + 27);
            ctx.moveTo(centerX, headY + 30);
            ctx.lineTo(centerX - 9, headY + 42);
            ctx.moveTo(centerX, headY + 30);
            ctx.lineTo(centerX + 9, headY + 42);
            ctx.stroke();
            ctx.textAlign = 'center';
            ctx.font = 'bold 12px "Comic Sans MS"';
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ffffff';
            ctx.strokeText(remote.name, centerX, remoteY - 8);
            ctx.fillStyle = '#000000';
            ctx.fillText(remote.name, centerX, remoteY - 8);
            ctx.restore();
        }

        function drawPlayerStickman() {
            ctx.save();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000000';

            const px = player.x + player.w / 2;
            const isMoving = player.grounded && Math.abs(player.vx) > 12;
            const isSprinting = player.sprinting || player.sprintBoost || sprintTime > 0;
            const walkCycle = gameTime * (isSprinting ? 18 : 12);
            const stride = isMoving ? Math.sin(walkCycle) * (isSprinting ? 14 : 10) : 0;
            const slidePhase = gameTime * 8;
            const slidePose = player.slidePose;
            const slideWobble = player.isSliding ? Math.sin(slidePhase) * 0.018 : 0;
            const idleBounce = Math.sin(gameTime * 3.5) * 1.4;
            const landingSquash = player.landBounce > 0
                ? Math.sin((1 - player.landBounce / 0.22) * Math.PI) * 0.16
                : 0;
            const isAirborne = !player.grounded;
            const jumpStretch = isAirborne ? Math.max(-0.08, Math.min(0.12, -player.vy / 5200)) : 0;
            const bob = player.isSliding ? Math.sin(slidePhase) * 0.8
                : (isMoving ? Math.abs(Math.sin(walkCycle)) * (isSprinting ? 3 : 2) : (isAirborne ? 0 : idleBounce));
            const baseY = player.y + player.h;
            const py = player.y + 15 + bob;
            const travelDirection = Math.sign(player.vx) || player.dashDirection || 1;
            const slideDirection = travelDirection;
            const airbornePose = isAirborne ? Math.max(-1, Math.min(1, -player.vy / 420)) : 0;
            const armSwing = isMoving ? Math.sin(walkCycle + Math.PI) * (isSprinting ? 13 : 9) : 0;
            const armLift = isAirborne ? -airbornePose * 7 : (player.groundPounding ? 8 : 0);

            if (multiplayerSession?.gameId === 'skyline') {
                const auraColor = skylinePowerups.shield > 0 ? '#ffe66d'
                    : (skylinePowerups.highJump > 0 ? '#fb62d0' : (skylinePowerups.turbo > 0 ? '#39daf4' : '#7ee8ed'));
                ctx.strokeStyle = auraColor;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.45 + Math.sin(gameTime * 7) * 0.18;
                ctx.beginPath();
                ctx.ellipse(px, player.y + player.h / 2, 19 + Math.sin(gameTime * 4) * 2, 27, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            if ((isSprinting || player.dashTime > 0) && (isMoving || player.dashTime > 0)) {
                const direction = Math.sign(player.vx) || player.dashDirection || 1;
                const trailLength = player.dashTime > 0 ? 42 : (isSprinting ? 30 : 20);
                const trailX = direction > 0 ? px - trailLength : px;
                ctx.fillStyle = '#7dd3fc';
                ctx.globalAlpha = 0.75;
                ctx.fillRect(trailX, py + 18, trailLength * 0.45, 4);
                ctx.fillRect(trailX + (direction > 0 ? -trailLength * 0.2 : trailLength * 0.35), py + 26, trailLength * 0.65, 4);
                ctx.globalAlpha = 1;
            }

            ctx.translate(px, baseY);
            ctx.scale(
                1 + landingSquash + slidePose * 0.07 + slideWobble,
                1 - landingSquash + jumpStretch - slidePose * 0.08 - slideWobble * 0.7
            );
            ctx.translate(-px, -baseY);

            const headTilt = isSlacking ? -0.08 : (isAirborne ? -airbornePose * 0.12 : (isSprinting ? travelDirection * 0.05 : 0));
            const headBob = isAirborne ? -airbornePose * 1.5 : 0;
            const headX = px - slideDirection * 8 * slidePose;
            const headY = py + headBob + (baseY - 21 - py) * slidePose;
            ctx.save();
            ctx.translate(headX, headY);
            ctx.rotate(headTilt - slideDirection * 0.12 * slidePose);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 12 - slidePose * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const emoji = isSlacking ? '🤪' : (energy < 30 ? '😴' : '😇');
            ctx.fillText(emoji, 0, 0);
            ctx.restore();

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            const lerp = (normal, sliding) => normal + (sliding - normal) * slidePose;
            const neckX = lerp(px, px - slideDirection * 2);
            const neckY = lerp(py + 12, baseY - 12);
            const waistX = lerp(px, px + slideDirection * 8);
            const waistY = lerp(py + 30, baseY - 12);
            const legTuck = isAirborne ? airbornePose * 5 : 0;
            const shoulderX = lerp(px, px + slideDirection);
            const shoulderY = lerp(py + 18, baseY - 15);
            const rearArmX = lerp(px - 10 - stride * 0.45 - armSwing * 0.45, px - slideDirection * 13);
            const rearArmY = lerp(py + 26 + armLift, baseY - 10);
            const frontArmX = lerp(px + 10 + stride * 0.45 + armSwing * 0.45, px + slideDirection * 15);
            const frontArmY = lerp(py + 26 + armLift, baseY - 20);
            const rearLegX = lerp(px - 8 - stride + legTuck, px - slideDirection * 14);
            const rearLegY = lerp(py + 42 - legTuck, baseY - 4);
            const frontLegX = lerp(px + 8 + stride + legTuck, px + slideDirection * 24);
            const frontLegY = lerp(py + 42 - legTuck, baseY - 3);
            ctx.beginPath();
            ctx.moveTo(neckX, neckY);
            ctx.lineTo(waistX, waistY);
            ctx.moveTo(shoulderX, shoulderY);
            ctx.lineTo(rearArmX, rearArmY);
            ctx.moveTo(shoulderX, shoulderY);
            ctx.lineTo(frontArmX, frontArmY);
            ctx.moveTo(waistX, waistY);
            ctx.lineTo(rearLegX, rearLegY);
            ctx.moveTo(waistX, waistY);
            ctx.lineTo(frontLegX, frontLegY);
            ctx.stroke();

            if (player.groundPounding || player.isWallSliding) {
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.7 + Math.sin(gameTime * 20) * 0.2;
                ctx.beginPath();
                ctx.arc(px, py + 18, 20 + Math.sin(gameTime * 14) * 3, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            if (isSlacking) {
                const float = Math.sin(gameTime * 4) * 3;
                ctx.font = 'bold 12px "Comic Sans MS"';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ff0055';
                ctx.fillText('🎉 SLACKING!', px - 30, py - 20 + float);
            }

            ctx.restore();
        }

        function drawHUD() {
            const energyPercent = Math.round((energy / maxEnergy) * 100);
            const staminaPercent = Math.round((sprintStamina / maxSprintStamina) * 100);
            const phoneBatteryPercent = Math.round((phoneBattery / maxPhoneBattery) * 100);
            const energyColor = energyPercent > 60 ? '#28c76f' : (energyPercent > 30 ? '#ffd43b' : '#ff4d4f');
            const staminaColor = staminaPercent > 45 ? '#36a3ff' : (staminaPercent > 15 ? '#ff9f43' : '#b66dff');
            const phoneBatteryColor = phoneBatteryPercent > 30 ? '#28c76f' : (phoneBatteryPercent > 10 ? '#ffd43b' : '#ff4d4f');
            const core = [homeworkDone.Math, homeworkDone.ELA, homeworkDone.Science, homeworkDone.Gym].filter(Boolean).length;
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 12px "Comic Sans MS"';
            ctx.textAlign = 'left';
            ctx.fillText(`CORE CLASSES: ${core}/4`, 30, 425);

            const resourcePanel = { x: 550, y: 7, width: 242, height: 102 };
            ctx.fillStyle = '#000000';
            ctx.fillRect(resourcePanel.x + 3, resourcePanel.y + 3, resourcePanel.width, resourcePanel.height);
            ctx.fillStyle = '#fff9dc';
            ctx.fillRect(resourcePanel.x, resourcePanel.y, resourcePanel.width, resourcePanel.height);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(resourcePanel.x, resourcePanel.y, resourcePanel.width, resourcePanel.height);

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 10px "Comic Sans MS"';
            ctx.textAlign = 'left';
            ctx.fillText('Player Stats', resourcePanel.x + 8, resourcePanel.y + 13);

            const resourceRows = [
                { label: 'AWAKE ENERGY', percent: energyPercent, color: energyColor },
                { label: `SPRINT STAMINA${player.sprintLocked ? ' · RECOVER' : ''}`, percent: staminaPercent, color: staminaColor },
                { label: 'PHONE BATTERY', percent: phoneBatteryPercent, color: phoneBatteryColor }
            ];
            resourceRows.forEach((resource, index) => {
                const rowY = resourcePanel.y + 19 + index * 26;
                ctx.font = 'bold 9px "Comic Sans MS"';
                ctx.textAlign = 'left';
                ctx.fillStyle = '#111111';
                ctx.fillText(resource.label, resourcePanel.x + 8, rowY + 9);
                ctx.textAlign = 'right';
                ctx.fillText(`${resource.percent}%`, resourcePanel.x + resourcePanel.width - 8, rowY + 9);

                const bar = { x: resourcePanel.x + 8, y: rowY + 13, width: resourcePanel.width - 16, height: 7 };
                ctx.fillStyle = '#d6d3c8';
                ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
                ctx.fillStyle = resource.color;
                ctx.fillRect(bar.x, bar.y, bar.width * resource.percent / 100, bar.height);
                ctx.strokeStyle = '#111111';
                ctx.lineWidth = 1;
                ctx.strokeRect(bar.x, bar.y, bar.width, bar.height);
            });
            ctx.textAlign = 'left';

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 12px "Comic Sans MS"';
            ctx.fillText(`TROUBLE METER: ${troubleMeter}/2 STRIKES`, 30, 25);
            ctx.fillText('TEACHER ALERT', 240, 25);
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(240, 35, 180, 18);
            if (teacherAlertTimer > 0) {
                ctx.fillStyle = teacherAlertTimer >= 1.1 ? '#ef4444' : '#f59e0b';
                ctx.fillRect(240, 35, Math.min(180, teacherAlertTimer / 1.6 * 180), 18);
            }
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(240, 35, 180, 18);
            // Bar background
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(30, 35, 180, 18);
            // Strike 1 (Left Half 0-90px)
            if (troubleMeter >= 1) {
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(30, 35, 90, 18);
            }
            // Strike 2 (Right Half 90-180px)
            if (troubleMeter >= 2) {
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(120, 35, 90, 18);
            }
            // Outline & Center Divider
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(30, 35, 180, 18);
            ctx.beginPath();
            ctx.moveTo(120, 35);
            ctx.lineTo(120, 53);
            ctx.stroke();
        }

        loadProgression();
        loadOptions();
        updatePhoneStatusBar();
        applyPhoneWallpaper();
        document.getElementById('multiplayerName').value = localStorage.getItem('ntg-player-name') || '';
        updateKeybindLabels();
        applyOptions();
        setupJoystick();
        setupWindowControls();
        draw();
