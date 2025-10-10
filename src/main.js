import { database, Subscribe, UpdateState, MENUS, GetCurrentState, Publish, Subscribe, SubscribeToStateChange } from './firebaseData.js';
import { Render } from './ui.js';

function InitChooseScreen(roles) 
{
    const roleButtonsContainer = document.getElementById('role-buttons');
    if (!roleButtonsContainer) return;

    const allRoles = [
        { id: 'electrician', name: 'Electrician', color: 'yellow-400' },
        { id: 'scientist', name: 'Scientist', color: 'blue-400' },
        { id: 'comms', name: 'Comms', color: 'red-400' },
        { id: 'engineer', name: 'Engineer', color: 'green-400' }
    ];

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

function SelectRole(role)
{
	console.log(`Selected Role: ${role.name}`);

	SendActionToFirebase('claim_role', {
		roleID: role.id
		// TODO: remove role name, color, etc. from Firebase data structure when role is claimed...
	});

	UpdateState(oldState => ({
		...oldState, 
		currentScreen: MENUS.CONNECTING
	}));

	// force re-render for the connecting screen
	Render(null, { currentScreen: MENUS.CONNECTING });

	const connectingText = document.getElementById('connecting-text');
	if (connectingText) connectingText.textContent = `Initializing interface for: ${role.name.toUpperCase()}`;

}

function SendActionToFirebase(action, data) 
{
	console.log(`Sending action to Firebase: ${action}`, data);
	const playerID = GetCurrentState().player.id;
	
	Publish(`client_actions/${data.roleID || GetCurrentState().player.role || 'unknown'}`, {
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
	if (newState.currentScreen === MENUS.CHOOSE) InitChooseScreen(newState.availableRoles);
};

SubscribeToStateChange(boundRender);
StartLoadingSequence();

FakeServerUpdates();

// the app won't start without this function...
// InitializeFirebaseListeners();
