import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
	apiKey: "YOUR_API_KEY",
	authDomain: "YOUR_AUTH_DOMAIN",
	databaseURL: "YOUR_DATABASE_URL",
	projectId: "YOUR_PROJECT_ID",
	storageBucket: "YOUR_STORAGE_BUCKET",
	messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
	appId: "YOUR_APP_ID"
};

//const firebaseApp = initializeApp(firebaseConfig);
//const database = getDatabase(firebaseApp);

//
function publish(eventName, data) 
{
	console.log(`Publishing to ${eventName}: `, data);
	const topicRef = ref(database, `events/${eventName}`);
	set(topicRef, { 
		...data, 
		timestamp: new Date().getTime() }).catch(err => {
		console.error("Error publishing to Firebase:", err);
	});
}

function subscribe(eventName, callback) 
{
	console.log(`Subscribing to ${eventName}`);
	const topicRef = ref(database, `events/${eventName}`);

	const listener = (snapshot) => {
		if (snapshot.exists())
		{
			callback(snapshot.val());
		}
	};

	onValue(topicRef, listener);

	return () => {
		console.log(`Unsubscribing from ${eventName}`);
		off(topicRef, 'value', listener);
	};
}

// --- GLOBAL STATE ---
let gameState = {
	currentScreen: 'BOOT',
	player: { id: 'player_123', action: null },
	minigame: { type: null, prompt: '', solution: null },
};


// --- STATE MANAGEMENT ---
let subscribers = [];
function Subscribe(callback) {
	subscribers.push(callback);
	callback(null, gameState);
}
function UpdateState(updater) {
	const oldState = { ...gameState };
	gameState = updater(gameState);
	subscribers.forEach(callback => callback(oldState, gameState));
}

// --- THE RENDERER ---
const app = document.getElementById('app');
let minigameTimer;
function Render(oldState, newState) {
	if (oldState?.currentScreen !== newState.currentScreen || (newState.currentScreen === 'MAIN' && oldState?.player.action !== newState.player.action)) {
		if (window.minigameTimer) clearInterval(window.minigameTimer);
		switch (newState.currentScreen) {
			case 'BOOT':
				RenderScreen('boot-screen-template');
				InitBootScreen();
				break;
			case 'MAIN':
				RenderScreen('main-screen-template');
				InitMainScreen();
				break;
			case 'MINIGAME':
				const templateId = `minigame-${newState.minigame.type.toLowerCase()}-template`;
				RenderScreen(templateId);
				InitMinigame(newState.minigame);
				break;
		}
	}
}
function RenderScreen(templateId) {
	const template = document.getElementById(templateId);
	app.innerHTML = '';
	app.appendChild(template.content.cloneNode(true));
}

// --- SCREEN INITIALIZERS & LOGIC ---
function InitBootScreen() {
	const bootText = document.getElementById('boot-text');
	const progressBar = document.getElementById('boot-progress');
	bootText.textContent = 'CONNECTING TO HYPERION PROTOCOL...';
	setTimeout(() => progressBar.style.width = '100%', 100);
	setTimeout(() => UpdateState(s => ({ ...s, currentScreen: 'MAIN' })), 4500);
}

function InitMainScreen() {
	const actionDescriptions = {
		OVERCLOCK: 'Divert power to increase reactor stability, risking location damage.',
		REPAIR: 'Perform structural repairs on a damaged location.',
		VENT: 'Vent plasma at a location to mitigate damage from an Overclock.',
	};
	document.getElementById('player-action').textContent = gameState.player.action || 'AWAITING ASSIGNMENT';
	document.getElementById('player-role-desc').textContent = actionDescriptions[gameState.player.action] || 'Stand by for your operational role.';

	const locations = ['Reactor Base', 'Coolant Pool', 'Power Cells', 'Comms Tower'];
	const buttonsContainer = document.getElementById('location-buttons');
	buttonsContainer.innerHTML = locations.map(loc => `
					<button data-location="${loc}" class="location-btn bg-black/30 border-2 border-[var(--green)] rounded-lg p-6 text-lg transition-all duration-200 hover:bg-[var(--green)] hover:text-black">
						${loc}
					</button>
				`).join('');
	buttonsContainer.querySelectorAll('.location-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			const location = btn.dataset.location;
			SendActionToServer('start_action', { location });
		});
	});
}

function InitMinigame(minigame) {
	document.getElementById('minigame-prompt').textContent = minigame.prompt;
	let timeLeft = minigame.type === 'SEQUENCE' ? 15 : 10;
	const timerEl = document.getElementById('minigame-timer');
	timerEl.textContent = String(timeLeft);

	window.minigameTimer = setInterval(() => {
		timeLeft--;
		timerEl.textContent = String(timeLeft);
		if (timeLeft <= 0) {
			clearInterval(window.minigameTimer);
			SendActionToServer('minigame_result', { success: false, reason: 'time_out' });
		}
	}, 1000);

	const submitButton = document.getElementById('submit-minigame');
	let finalInput = '';

	if (minigame.type === 'PASSWORD') {
		const input = document.getElementById('password-input');
		input.addEventListener('input', () => {
			finalInput = input.value.toUpperCase();
		});
		input.focus();
	}
	else if (minigame.type === 'SEQUENCE') {
		const buttonsContainer = document.getElementById('sequence-buttons');
		const display = document.getElementById('sequence-display');

		for (let i = 1; i <= 9; i++) {
			const btn = document.createElement('button');
			btn.textContent = String(i);
			btn.className = 'minigame-btn bg-black/50 border-2 border-gray-600 text-2xl p-4 rounded-lg transition-colors hover:bg-gray-700';
			btn.addEventListener('click', () => {
				finalInput += i;
				display.textContent += '*';
			});
			buttonsContainer.appendChild(btn);
		}
	}

	submitButton.addEventListener('click', () => {
		clearInterval(window.minigameTimer);
		const success = finalInput === minigame.solution;
		SendActionToServer('minigame_result', { success });
	});
}

function ShowSolutionPopup(solutionText) {
	const template = document.getElementById('solution-popup-template');
	document.body.appendChild(template.content.cloneNode(true));
	const popupEl = document.body.querySelector('.popup');
	popupEl.querySelector('#solution-text').textContent = solutionText;
	setTimeout(() => {
		popupEl.style.opacity = '1';
		popupEl.style.transform = 'translateY(0)';
	}, 10);
	popupEl.querySelector('#popup-close-btn').addEventListener('click', () => popupEl.remove());
}

function TriggerFailureFeedback() {
	console.log("FEEDBACK: Triggering failure screen shake.");
	app.classList.add('animate-shake');
	setTimeout(() => {
		app.classList.remove('animate-shake');
	}, 500);
}

// --- GAME LOGIC & SERVER COMMUNICATION ---

function GenerateMinigameData() {
	const isPasswordGame = Math.random() > 0.5;
	const minigameType = isPasswordGame ? 'PASSWORD' : 'SEQUENCE';
	let solution, prompt;
	if (minigameType === 'PASSWORD') {
		const words = ['ALPHA', 'BRAVO', 'DELTA', 'GAMMA', 'OMEGA'];
		solution = words[Math.floor(Math.random() * words.length)];
		prompt = 'Enter Emergency Bypass Code:';
	}
	else {
		solution = String(Math.floor(100 + Math.random() * 900));
		prompt = 'Input Coolant Frequency Sequence:';
	}
	return { type: minigameType, prompt: prompt, solution: solution };
}

function SendActionToServer(action, data) {
	console.log(`[TO SERVER] Action: ${action}`, data);

	if (action === 'start_action') {
		const minigameData = GenerateMinigameData();

		console.log('[TO FIREBASE FOR HELPERS]', {
			actingPlayerId: gameState.player.id,
			actingPlayerName: "Operator",
			...minigameData
		});

		setTimeout(() => {
			UpdateState(s => ({ ...s, currentScreen: 'MINIGAME', minigame: minigameData }));
		}, 100);

	}
	else if (action === 'minigame_result') {
		if (!data.success) {
			TriggerFailureFeedback();
		}

		setTimeout(() => {
			UpdateState(s => ({ ...s, currentScreen: 'MAIN' }));
		}, 500);
	}
}

// --- MOCK SERVER UPDATES ---
function MockServerUpdates() {
	setTimeout(() => {
		console.log('[MOCK SERVER] Assigning role...');
		UpdateState(s => ({ ...s, player: { ...s.player, action: 'REPAIR' } }));
	}, 5000);
	setTimeout(() => {
		console.log('[MOCK SERVER] Broadcasting solution for another player...');
		ShowSolutionPopup('Tell Operator 2 the coolant password is "STABILIZE".');
	}, 10000);
}

// --- INITIALIZATION ---
Subscribe(Render);
MockServerUpdates();