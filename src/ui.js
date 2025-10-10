import { UpdateState, MENUS } from "./firebaseData.js";

const appContainer = document.getElementById('app');

// decides which screen to show based on game state
export function Render(oldState, newState)
{
    const oldRoleID = oldState?.player?.role?.id;
    const newRoleID = newState?.player?.role?.id;

    const shouldScreenChange = oldState?.currentScreen !== newState.currentScreen ||
                                oldRoleID !== newRoleID;

    if (shouldScreenChange) RenderScreen(newState.currentScreen, newRoleID);
}

function RenderScreen(screen, roleID)
{
    let templateID;

    if (screen === MENUS.LOADING) templateID = 'boot-screen-template';
    else if (screen === MENUS.CHOOSE) templateID = 'choose-screen-template';
    else if (screen === MENUS.CONNECTING) templateID = 'connecting-screen-template';
    else if (roleID) 
    {
        templateID = `${roleID}-screen-template`;
        console.log(`Rendering role-specific screen for roleID: ${roleID}`);
    }
    else 
    {
        templateID = 'choose-screen-template';
    }

    const template = document.getElementById(templateID);
    if (template)
    {
        appContainer.innerHTML = '';
        appContainer.appendChild(template.content.cloneNode(true));
    }
}

