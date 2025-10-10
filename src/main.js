import { database, Subscribe, UpdateState, MENUS, GetCurrentState, Publish, Subscribe, SubscribeToStateChange } from './firebaseData.js';
import { Render } from './ui.js';

let latestRoleData = null;
const allRoles = [
	{ id: 'electrician', name: 'Electrician', color: 'yellow-400' },
	{ id: 'scientist', name: 'Scientist', color: 'blue-400' },
	{ id: 'comms', name: 'Comms', color: 'red-400' },
	{ id: 'engineer', name: 'Engineer', color: 'green-400' }
];

function InitChooseScreen(roles) 
{
    const roleButtonsContainer = document.getElementById('role-buttons');
    if (!roleButtonsContainer) return;

    roleButtonsContainer.innerHTML = '';
    allRoles.forEach(role => {
        const button = document.createElement('button');
        const isAvailable = roles.some(availableRole => availableRole.id === role.id); // checks to see if at least one role is available and matches a role in the allRoles array

        button.className = `role-button w-full p-4 text-xl font-bold border-2 border-${role.color} text-${role.color} rounded-lg bg-black/30`;
        button.textContent = role.name.toUpperCase();
        button.disabled = !isAvailable;

        if (isAvailable) 
        {
            button.addEventListener('click', () => SelectRole(role));
        }
        roleButtonsContainer.appendChild(button);
    });
}

function SelectRole(roleObject)
{
	console.log(`Selected Role: ${roleObject.name}`);

	SendActionToFirebase('claim_role', {
		roleID: roleObject.id
	});
	
	// we optimistically update the availableRoles in Firebase to remove the selected role
	// i say "optimistically" because ideally the server would confirm this change but we go fucking ham here for simplicity
	let newAvailableRoles = GetCurrentState().availableRoles.filter(role => role.id !== roleObject.id);
	Publish('availableRoles', newAvailableRoles.map(role => role.id));

	// Update local state: set screen to 'connecting', assign player role, and update available roles object array.
	UpdateState(oldState => ({
		...oldState, 
		currentScreen: MENUS.CONNECTING,
		player: { 
			...oldState.player, 
			role: roleObject 
		},
		availableRoles: newAvailableRoles
	}));

	// force re-render for the connecting screen
	Render(null, { currentScreen: MENUS.CONNECTING });

	const connectingText = document.getElementById('connecting-text');
	if (connectingText) connectingText.textContent = `Initializing interface for: ${roleObject.name.toUpperCase()}`;

	StartUIUpdateLoop(3);

	setTimeout(() => {
		UpdateState(oldState => ({
			...oldState,
			currentScreen: roleObject.id // move to the role-specific screen, works cuz the roleIDs match the MENUS constants
		}));
	}, 1500); // 1.5-second fake connecting time
}

function SendActionToFirebase(action, data) 
{
	console.log(`Sending action to Firebase: ${action}`, data);
	const playerID = GetCurrentState().player.id;
	
	Publish(`client_actions/${data.roleID || GetCurrentState().player.role.id || 'unknown'}`, {
		...data,
		action,
		playerID,
		timestamp: new Date().getTime()
	});

	/* Example data structure send to Firebase:
	
	'client_actions': {
		'engineer': {
			action: 'claim_role',
			roleID: 'engineer',
			playerID: 'PLAYER-ABC1234',
			timestamp: 1672531199000
		},
	}
	
	*/
}

function InitializeFirebaseListeners()
{
	// ooof...
	// basically on init, we check to see which roles are taken by polling the availableRoles entry in Firebase
	// which hopefully is an array of roleIDs that are still available...
	// then we update our local state with that info, which will trigger a re-render of the screen
	// and disable buttons for roles that are taken
	Subscribe(`availableRoles`, (data) => {
		console.log("Available roles updated:", data);
		if (data && Array.isArray(data))
		{
			UpdateState(oldState => ({
				...oldState,
				availableRoles: data
			}));
		}
	})

	/* Example data structure that would need to pre-exist in Firebase:
	availableRoles: ['engineer', 'scientist', 'comms'],
	*/

	Subscribe(`server_events/${GetCurrentState().player.role}`, (data) => {
		latestRoleData = data;
	})

}

function StartLoadingSequence()
{
	UpdateState(oldState => ({
		...oldState,
		currentScreen: MENUS.LOADING
	}));

	setTimeout(() => {
		UpdateState(oldState => ({
			...oldState,
			currentScreen: MENUS.CHOOSE
		}));
	}, 2500); // 2.5-second fake loading time
}

function FakeServerUpdates()
{
	// This is just for testing purposes to simulate server updates
	// In a real game, these updates would come from Firebase listeners
	let fakeAvailableRoles = [
		{ id: 'electrician', name: 'Electrician', color: 'yellow-400' },
		{ id: 'scientist', name: 'Scientist', color: 'blue-400' },
		{ id: 'comms', name: 'Comms', color: 'red-400' },
		{ id: 'engineer', name: 'Engineer', color: 'green-400' }
	];

	// we're missing comms and engineer to simulate them being taken
	UpdateState(oldState => ({
		...oldState,
		availableRoles: fakeAvailableRoles
	}));

	setInterval(() => {
		// Randomly remove or add roles to simulate changes
		if (Math.random() > 0.5 && fakeAvailableRoles.length > 1) 
		{
			const roleToRemove = fakeAvailableRoles.pop();
			console.log(`Simulating role taken: ${roleToRemove.name}`);
			UpdateState(oldState => ({
				...oldState,
				availableRoles: fakeAvailableRoles
			}));	
		}
	}, 5000); // every 5 seconds
}

// ayo what the fuck?
// ooohhhhh we're adding this boundRender to the subscribers array from the firebaseData.js module....
// that way the Render function will run and it'll check for the Choose screen...
const boundRender = (oldState, newState) => {
	Render(oldState, newState);
	if (newState.currentScreen === MENUS.CHOOSE) InitChooseScreen(newState.availableRoles.map(role => role.id));
};

function StartUIUpdateLoop(delayTime = 3)
{
	setInterval(() => {
		if (latestRoleData)
		{
			//TODO: Implement UI Updates and Logic Updates based on events that the Server/Database has called
			//TODO: Figure out what data needs to be updated for each role...
		}
	}, delayTime * 1000);
}



SubscribeToStateChange(boundRender);
StartLoadingSequence();

FakeServerUpdates();

// InitializeFirebaseListeners();
