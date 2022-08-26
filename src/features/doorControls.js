/**
 * DoorControls: Contains methods for interacting with doors and their traps.
 */
import {revealSecretDoor, disarmTrappedDoor, peekDoor} from "../keybindings.js";
import {settingsKey} from "../settings.js";

/**
 * Registers socket methods
 * 
 * @param socket 
 */
export function registerSocketMethods(socket)
{
	socket.register("socketPause", socketPause);
	socket.register("openDoor", openDoor);
	socket.register("socketDisarm", socketDisarm);
	socket.register("socketTrip", socketTrip);
	socket.register("socketToggleLock", socketToggleLock);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Socket function for pausing the game
 */
function socketPause()
{
	game.togglePause(true, true);
}

/**
 * Determines if we should be pausing the game, and sending the message along the socket if so.
 * 
 * @param wall - The door that was interacted with 
 * @param socket - The socket to send a pause message on
 * @returns 
 */
export function pause(wall, socket)
{
	if (wall.data.flags.trappedDoors?.pauseGameOnce && wall.data.ds === CONST.WALL_DOOR_STATES.CLOSED)
	{
		socket.executeAsGM('openDoor', wall.data._id);
		socket.executeForEveryone('socketPause');
		return true;
	}

	if (wall.data.flags.trappedDoors?.pauseGame && wall.data.ds === CONST.WALL_DOOR_STATES.CLOSED)
	{
		socket.executeAsGM('openDoor', wall.data._id);
		socket.executeForEveryone('socketPause');
		return true;
	}
	return false;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Socket function for opening a door, must be done as GM
 * 
 * @param {*} wallID 
 */
async function openDoor(wallID)
{
	if (game.user.isGM)
	{
		let wall = game.canvas.walls.objects.children.filter(i => i.data._id == wallID)[0];
		wall.document.update({ds: CONST.WALL_DOOR_STATES.OPEN, flags: {trappedDoors: {pauseGameOnce: false}}});
	}
	else
	{
		console.log('Oops: openDoor called as non-GM player');
	}
} 

/**
 * Function for peeking a wall.
 * TODO: Peeking - store direction? Move it 20 degrees or so?
 * 
 * @param {*} wall 
 * @returns 
 */
export function peek(wall)
{
	if (peekDoor)
	{
		const updateData = {door: CONST.WALL_DOOR_TYPES.DOOR};
		wall.document.update(updateData);

		return true;
	}
	return false;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Determines whether a wall should be disarmed, and sends the message along the socket if so
 * TODO: Support for players rolling to disarm
 * 
 * @param {*} wall 
 * @returns 
 */
export function disarm(wall)
{
	if (disarmTrappedDoor)
	{
		const updateData = {'flags.trappedDoors.trapActive': !wall.data.flags.trappedDoors.trapActive};
		wall.document.update(updateData);

		return true;
	}
	return false;
}

/**
 * Socket function for disarming a trap on a door, must be done as GM
 * @param {*} wallID 
 */
 async function socketDisarm(wallID)
 {
	 let wall = game.canvas.walls.objects.children.filter(i => i.data._id == wallID)[0];
	 wall.document.update({flags: {trappedDoors: {trapActive: false}}});
 } 

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Determines whether a trap has been tripped on a door open.
 * If so, then opens the door and pauses if appropriate.
 * 
 * @param {*} wall 
 * @param {*} socket 
 * @returns 
 */
export function trip(wall, socket)
{
	// Only trip the trap if the door is being opened
	if (wall.data.ds === CONST.WALL_DOOR_STATES.CLOSED)
	{
		// If we have a trap on this door, and it's active, trip it
		if (wall.data.flags.trappedDoors?.trapID != null && wall.data.flags.trappedDoors?.trapActive)
		{
			socket.executeAsGM('socketTrip', wall.data._id);
			if (game.settings.get(settingsKey, "openOnTrap"))
			{
				socket.executeAsGM('openDoor', wall.data._id);
			}
			if (game.settings.get(settingsKey, "pauseOnTrap"))
			{
				socket.executeForEveryone('socketPause');
			}
			return true;
		}
	}
	return false;
}

/**
 * Socket function for tripping a trap on a door, must be done as GM
 * @param {*} wallID 
 */
async function socketTrip(wallID)
{
	let wall = game.canvas.walls.objects.children.filter(i => i.data._id == wallID)[0];
	let trapsPack = game.packs.get('trapped-doors.td-traps');
	// Look for an existing actor for the trap on a door if it exists
	let trapActor = game.actors.filter(i => i.data.flags.core?.sourceId == `Compendium.trapped-doors.td-traps.${wall.data.flags.trappedDoors.trapID}`);
	if (trapActor.length > 0)
	{
		// If it does exist, (Which it shouldn't, because we should be deleting it, but we're here, that's life), roll the Effect
		trapActor[0].items.filter(i => foundry.utils.getProperty(i, "data.name") === 'Effect')[0].roll({rollMode: CONST.DICE_ROLL_MODES.PUBLIC});
	}
	else
	{
		// If it doesn't exist, import the ID from the compendium and put it in the "Door Traps" folder, then schedule delete in five minutes
		let promisedActor = await game.actors.importFromCompendium(trapsPack, wall.data.flags.trappedDoors.trapID);
		trapActor.push(promisedActor);
		promisedActor.items.filter(i => foundry.utils.getProperty(i, "data.name") === 'Effect')[0].roll({rollMode: CONST.DICE_ROLL_MODES.PUBLIC});
		promisedActor.update({folder: game.folders.filter(i => i.name == 'Door Traps')[0].data._id})
		setTimeout(deleteTrap, 300000, trapActor[0]);
	}
	// Deactivate the trap since we just tripped it
	wall.document.update({flags: {trappedDoors: {trapActive: false}}});
} 

/**
 * Delete the provided trap
 * @param {*} trap 
 */
 function deleteTrap(trap)
 {
	 trap.delete();
 }
 
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Determines if a secret wall should be revealed to the players
 * 
 * @param {*} wall 
 * @returns 
 */
export function reveal(wall)
{
	if (revealSecretDoor && game.user.isGM && wall.data.door === types.SECRET)
	{
		const updateData = {door: CONST.WALL_DOOR_TYPES.DOOR};
		wall.document.update(updateData);

		return true;
	}
	return false;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Determines if a player should be allowed to lock/unlock a door
 * 
 * @param {*} user 
 * @param {*} wall 
 * @param {*} socket 
 * @returns 
 */
export function toggleLock(user, wall, socket)
{
	let keys = user.character.items.filter(i => i.getFlag(settingsKey, 'wallID') == wall.data._id);
	if (keys.length > 0)
	{
		socket.executeAsGM('socketToggleLock', wall.data._id, wall.data.ds == CONST.WALL_DOOR_STATES.LOCKED ? CONST.WALL_DOOR_STATES.CLOSED : CONST.WALL_DOOR_STATES.LOCKED);
		return true;
	}
	return false;
}

/**
 * Socket function for setting the lock on the door, must be run as the GM
 * @param {*} wallID 
 * @param {*} state 
 */
 async function socketToggleLock(wallID, state)
 {
	 let wall = game.canvas.walls.objects.children.filter(i => i.data._id == wallID)[0];
	 wall.document.update({ds: state});
 }