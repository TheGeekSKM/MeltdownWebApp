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

export const MENUS = {
    LOADING: 'loading',
    CHOOSE: 'choose',
    CONNECTING: 'connecting',
    ENGINEER: 'engineer',
    ELECTRICIAN: 'electrician',
    SCIENTIST: 'scientist',
    COMMS: 'comms'
};

//const firebaseApp = initializeApp(firebaseConfig);
//export const database = getDatabase(firebaseApp);

export function Publish(eventName, data) 
{
	console.log(`Publishing to ${eventName}: `, data);
	
	const topicRef = ref(database, `${eventName}`);

	set(topicRef, {
		...data,
		timestamp: new Date().getTime()
	}).catch(err => {
		console.error("Error publishing to Firebase:", err);
	});
}

export function Subscribe(eventName, callback) 
{
	console.log(`Subscribing to ${eventName}`);
	const topicRef = ref(database, `${eventName}`);

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


// IMPORTANT NOTE: Bear in mind that the role.id values must match the MENUS constants for this to work seamlessly
let gameState = {
    currentScreen: MENUS.LOADING, // loading, choose, connecting, engineer, electrician, scientist, comms
    player: { 
        id: `PLAYER-${Math.random().toString(36).substring(2, 9).toUpperCase()}`, // random ID for demo purposes
        role: null // { id, name, color } ex: { id: 'engineer', name: 'Engineer', color: 'green-400' }
    },
    availableRoles: []
};

export function GetCurrentState() 
{
    return { ...gameState };
}

let subscribers = [];

export function SubscribeToStateChange(CallbackFunc) 
{
    subscribers.push(CallbackFunc);
    CallbackFunc(null, gameState);
}

export function UpdateState(UpdaterFunc) 
{
    const oldState = { ...gameState };
    gameState = UpdaterFunc(gameState);
    subscribers.forEach(CallbackFunc => CallbackFunc(oldState, gameState));
}





