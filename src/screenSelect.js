 document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app');
    let currentScreen = 'loading'; // loading, menu, connecting

    const roles = [
        { id: 'engineer', name: 'Engineer', color: 'yellow-400' },
        { id: 'scientist', name: 'Scientist', color: 'blue-400' },
        { id: 'operator', name: 'Operator', color: 'red-400' },
        { id: 'medic', name: 'Medic', color: 'green-400' }
    ];

    // --- Main Render Function ---
    function render() {
        let templateId;
        if (currentScreen === 'loading') {
            templateId = 'boot-screen-template';
        } else if (currentScreen === 'menu') {
            templateId = 'menu-screen-template';
        } else if (currentScreen === 'connecting') {
            templateId = 'connecting-screen-template';
        }
        
        const template = document.getElementById(templateId);
        appContainer.innerHTML = ''; // Clear the container
        appContainer.appendChild(template.content.cloneNode(true));

        // Run screen-specific logic after rendering
        if (currentScreen === 'menu') {
            initMenuScreen();
        }
    }

    // --- Screen Initializers ---
    function initMenuScreen() {
        const roleButtonsContainer = document.getElementById('role-buttons');
        roles.forEach(role => {
            const button = document.createElement('button');
            button.className = `role-button w-full p-6 text-2xl font-bold border-2 border-${role.color} text-${role.color} rounded-lg bg-black/30`;
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
        }, 3000); // 3-second loading time
    }

    // --- Start the Application ---
    startLoadingSequence();
});