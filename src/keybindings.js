/**
 * Keybindings: Registers keybindings for different door functions.
 */
import {settingsKey} from "./settings.js";

export let revealSecretDoor = false;
export let peekDoor = false;
export let disarmTrappedDoor = false;

/**
 * Register keybindings for functionality
 */
export function registerKeybindings() 
{
	game.keybindings.register(settingsKey, "peekDoor", 
	{
		name: "trapped-doors.keybindings.peekDoor.name",
		hint: "trapped-doors.keybindings.peekDoor.hint",
		onDown: handlePeekDoor,
		onUp: handlePeekDoor,
		restricted: false,
		editable: [{key: "ControlLeft"}],
		precedence: -1,
	});
	game.keybindings.register(settingsKey, "revealSecretDoor", 
	{
		name: "trapped-doors.keybindings.revealSecretDoor.name",
		hint: "trapped-doors.keybindings.revealSecretDoor.hint",
		onDown: handleRevealSecretDoor,
		onUp: handleRevealSecretDoor,
		restricted: true,
		editable: [{key: "AltLeft"}],
		precedence: -1,
	});
	game.keybindings.register(settingsKey, "disarmTrappedDoor", 
	{
		name: "trapped-doors.keybindings.disarmTrappedDoor.name",
		hint: "trapped-doors.keybindings.disarmTrappedDoor.hint",
		onDown: handleDisarmTrappedDoor,
		onUp: handleDisarmTrappedDoor,
		restricted: true,
		editable: [{key: "ShiftLeft"}],
		precedence: -1,
	});
}

///////////////////////////////////
//
// Keybind Listeners
//
///////////////////////////////////

function handleRevealSecretDoor(event)
{
	revealSecretDoor = !event.up;
	return false;
}

function handlePeekDoor(event)
{
	peekDoor = !event.up;
	return false;
}

function handleDisarmTrappedDoor(event)
{
	disarmTrappedDoor = !event.up;
	return false;
}
