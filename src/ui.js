import { UpdateState, MENUS } from "./firebaseData.js";

const appContainer = document.getElementById('app');

// decides which screen to show based on game state
export function Render(oldState, newState)
{
    const shouldScreenChange = oldState?.currentScreen !== newState.currentScreen ||
                                oldState?.player.role !== newState.player.role;
    
    if (shouldScreenChange) RenderScreen(newState.currentScreen, newState.player.role);
}

function RenderScreen(screen, role)
{
    let templateID;

    if (screen === MENUS.LOADING) templateID = 'boot-screen-template';
    else if (screen === MENUS.CHOOSE) templateID = 'choose-screen-template';
    else if (screen === MENUS.CONNECTING) templateID = 'connecting-screen-template';
    else if (screen === MENUS.ENGINEER) templateID = 'engineer-screen-template';
    else if (screen === MENUS.ELECTRICIAN) templateID = 'electrician-screen-template';
    else if (screen === MENUS.SCIENTIST) templateID = 'scientist-screen-template';
    else if (screen === MENUS.COMMS) templateID = 'comms-screen-template';
    else {
        templateID = 'choose-screen-template';
    }

    const template = document.getElementById(templateID);
    if (template)
    {
        appContainer.innerHTML = '';
        appContainer.appendChild(template.content.cloneNode(true));
    }
}

