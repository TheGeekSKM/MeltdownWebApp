document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app');
    let currentScreen = 'loading'; // loading, choose, connecting

    // TODO: Connect to Firebase and check to see which roles are taken. Remove taken roles from the roles array.

    const roles = [
        { id: 'electrician', name: 'Electrician', color: 'yellow-400' },
        { id: 'scientist', name: 'Scientist', color: 'blue-400' },
        { id: 'comms', name: 'Comms', color: 'red-400' },
        { id: 'engineer', name: 'Engineer', color: 'green-400' }
    ];

    // --- Main Render Function ---
    function render() {
        let templateId;
        if (currentScreen === 'loading') {
            templateId = 'boot-screen-template';
        } else if (currentScreen === 'choose') {
            templateId = 'choose-screen-template';
        } else if (currentScreen === 'connecting') {
            templateId = 'connecting-screen-template';
        }
        
        const template = document.getElementById(templateId);
        appContainer.innerHTML = ''; // Clear the container
        appContainer.appendChild(template.content.cloneNode(true));

        // Run screen-specific logic after rendering
        if (currentScreen === 'choose') {
            initMenuScreen();
        }
    }

    // --- Screen Initializers ---
    function initMenuScreen() {
        const roleButtonsContainer = document.getElementById('role-buttons');
        roles.forEach(role => {
            const button = document.createElement('button');
            button.className = `role-button w-full p-4 text-xl font-bold border-2 border-${role.color} text-${role.color} rounded-lg bg-black/30`;
            button.textContent = role.name.toUpperCase();
            button.addEventListener('click', () => selectRole(role));
            roleButtonsContainer.appendChild(button);
        });
    }

    // --- State Transition Logic ---
    function selectRole(role) {
        console.log(`Selected Role: ${role.name}`);
        currentScreen = 'connecting';
        render(); // Re-render for the connecting screen

        const connectingText = document.getElementById('connecting-text');
        connectingText.textContent = `Initializing interface for: ${role.name.toUpperCase()}`;
        
        // In a real game, you would now send this selection to Firebase.
    }

    // --- Initial Load Sequence ---
    function startLoadingSequence() {
        currentScreen = 'loading';
        render();
        setTimeout(() => {
            currentScreen = 'menu';
            render();
        }, 2500); // 2.5-second loading time
    }

    // --- Start the Application ---
    startLoadingSequence();
});