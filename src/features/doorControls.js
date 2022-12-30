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
	socket.register("peekTheDoor", peekTheDoor);
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
	if (wall.document.flags.trappedDoors?.pauseGameOnce && wall.document.ds === CONST.WALL_DOOR_STATES.CLOSED)
	{
		socket.executeAsGM('openDoor', wall.document._id);
		socket.executeForEveryone('socketPause');
		return true;
	}

	if (wall.document.flags.trappedDoors?.pauseGame && wall.document.ds === CONST.WALL_DOOR_STATES.CLOSED)
	{
		socket.executeAsGM('openDoor', wall.document._id);
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
		let wall = game.canvas.walls.objects.children.filter(i => i.document._id == wallID)[0];
		wall.document.update({ds: CONST.WALL_DOOR_STATES.OPEN, flags: {trappedDoors: {pauseGameOnce: false}}});
	}
	else
	{
		console.log('Oops: openDoor called as non-GM player');
	}
} 

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Calls through the socket to let players peek doors. If the user is the GM, just call the regular function
 *
 * @param {} wall
 * @param {*} socket
 * @returns
 */
export function peek(wall, socket)
{
	// Only peek if we're peeking, and only peek if the door is closed
	if (peekDoor && wall.document.ds == CONST.WALL_DOOR_STATES.CLOSED)
	{
		if (game.user.isGM)
		{
			peekTheDoor(wall.document._id);
		}
		else if (wall.document.flags.trappedDoors?.allowPeeking == null || wall.document.flags.trappedDoors?.allowPeeking)
		{
			socket.executeAsGM('peekTheDoor', wall.document._id);
		}
		return true;
	}
	return false;
}

/**
 * Function for peeking a wall.
 * 
 * @param {*} wall 
 * @returns 
 */
export function peekTheDoor(wallID)
{
	// Load up the wall from the ID
	let wall = game.canvas.walls.objects.children.filter(i => i.document._id == wallID)[0];
	let newC = [wall.document.c[0], wall.document.c[1], wall.document.c[2], wall.document.c[3]];
	let originalC = wall.document.c;
	let peeked = false;

	// If the door is already peeked, set it back to its original state
	if (wall.document.flags.trappedDoors?.peeked)
	{
		newC = wall.document.flags.trappedDoors?.originalC;
		originalC = newC;
	}
	else
	{
		// Otherwise, get all of our settings handy so we know how to peek the door
		// First determine if the door settings are set, and whether or not they're CW
		let doorHingeSide = wall.document.flags.trappedDoors?.hingeSide;
		let doorOpenDirection = wall.document.flags.trappedDoors?.openDirection;
		let doorHingeSideCW = doorHingeSide == "cw";
		let doorOpenDirectionCW = doorOpenDirection == "cw";
		let doorHingeSet = doorHingeSideCW || doorHingeSide == "ccw";
		let doorOpenDirectionSet = doorOpenDirectionCW || doorOpenDirection == "ccw";
		// If the door settings are set, prefer those. Otherwise, use the global ones.
		let hingeSideCW = doorHingeSet ? doorHingeSideCW : "cw" == game.settings.get(settingsKey, "hingeSide");
		let openDirectionCW = doorOpenDirectionSet ? doorOpenDirectionCW : "cw" == game.settings.get(settingsKey, "openDirection");
		let peekDegrees = game.settings.get(settingsKey, "peekDegrees");

		// Time for math - start off with getting the distances between the points so we can get the length of the door
		let xdiff = wall.document.c[2] - wall.document.c[0];
		let ydiff = wall.document.c[3] - wall.document.c[1];
		let wallSlope = ydiff / xdiff;
		let length = Math.sqrt((xdiff * xdiff) + (ydiff * ydiff));
		let horizXdiff = length;
		let horizSlope = 0;

		let unroundedDegrees = Math.atan(ydiff / xdiff) * 180 / Math.PI;
		if (Object.is(-0, unroundedDegrees))
		{
			unroundedDegrees = 180;
		}
		else if (wall.document.c[0] > wall.document.c[2] && wall.document.c[1] != wall.document.c[3])
		{
			unroundedDegrees = 180 + unroundedDegrees
		}

		// Get the angle of the door in its closed position
		let currentDegrees = Math.round(unroundedDegrees);
		// Add (or subtract) the desired peek degrees based on the direction we should be opening the door
		let newDegrees = currentDegrees + (peekDegrees * (openDirectionCW ? 1 : -1));

		//////
		// m1 = rise over run = y2 - y1 / (x2 - x1)
		// m2 = horizontal line from hinge
		// tan(theta) = m1 - m2 / (1 + m1 * m2)
		// Math.atan(ydiff / xdiff) * 180 / Math.PI
		//////

		// Calculate the location of the new X and Y using the new degrees value, the length, and the starting point of our "circle"
		let newX = Math.roundDecimals((hingeSideCW ? -1 : 1) * Math.cos(newDegrees * Math.PI / 180), 4) * length + (hingeSideCW ? wall.document.c[2] : wall.document.c[0]);
		let newY = Math.roundDecimals((hingeSideCW ? -1 : 1) * Math.sin(newDegrees * Math.PI / 180), 4) * length + (hingeSideCW ? wall.document.c[3] : wall.document.c[1]);

		// Set the new location of the door, keeping in mind which side should be the hinge.
		newC = hingeSideCW ? [newX, newY, wall.document.c[2], wall.document.c[3]] : [wall.document.c[0], wall.document.c[1], newX, newY];
		// Set the door to peeked so we know to switch back next time
		peeked = true;
	}

	// Update the wall we're peeking (or unpeeking)
	const updateData = {door: CONST.WALL_DOOR_TYPES.DOOR, c: newC, flags: {trappedDoors: {originalC: originalC, peeked: peeked}}};
	wall.document.update(updateData);
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
		const updateData = {'flags.trappedDoors.trapActive': !wall.document.flags.trappedDoors.trapActive};
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
	 let wall = game.canvas.walls.objects.children.filter(i => i.document._id == wallID)[0];
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
	if (wall.document.ds === CONST.WALL_DOOR_STATES.CLOSED)
	{
		// If we have a trap on this door, and it's active, trip it
		if (wall.document.flags.trappedDoors?.trapID != null && wall.document.flags.trappedDoors?.trapActive)
		{
			socket.executeAsGM('socketTrip', wall.document._id);
			if (game.settings.get(settingsKey, "openOnTrap"))
			{
				socket.executeAsGM('openDoor', wall.document._id);
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
	let wall = game.canvas.walls.objects.children.filter(i => i.document._id == wallID)[0];
	let trapsPack = game.packs.get('trapped-doors.td-traps');
	// Look for an existing actor for the trap on a door if it exists
	let trapActor = game.actors.filter(i => i.flags.core?.sourceId == `Compendium.trapped-doors.td-traps.${wall.document.flags.trappedDoors.trapID}`);
	if (trapActor.length > 0)
	{
		// If it does exist, (Which it shouldn't, because we should be deleting it, but we're here, that's life), roll the Effect
		if (game.system.id == 'pf2e')
		{
			trapActor[0].system.actions[0].roll();
		}
		else
		{
			trapActor[0].items.filter(i => foundry.utils.getProperty(i, "name") === 'Effect')[0].use({rollMode: CONST.DICE_ROLL_MODES.PUBLIC});
		}
	}
	else
	{
		// If it doesn't exist, import the ID from the compendium and put it in the "Door Traps" folder, then schedule delete in five minutes
		let promisedActor = await game.actors.importFromCompendium(trapsPack, wall.document.flags.trappedDoors.trapID);
		trapActor.push(promisedActor);
		if (game.system.id == 'pf2e')
		{
			promisedActor.system.actions[0].roll();
		}
		else
		{
			promisedActor.items.filter(i => foundry.utils.getProperty(i, "name") === 'Effect')[0].use({rollMode: CONST.DICE_ROLL_MODES.PUBLIC});
		}
		promisedActor.update({folder: game.folders.filter(i => i.name == 'Door Traps')[0].id})
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
	if (revealSecretDoor && game.user.isGM && wall.document.door === CONST.WALL_DOOR_TYPES.SECRET)
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
	var keys;
	if (game.system.id == 'pf2e')
	{
		keys = user.character.inventory.filter(i => i.getFlag(settingsKey, 'wallID') == wall.document._id);
	}
	else
	{
		keys = user.character.items.filter(i => i.getFlag(settingsKey, 'wallID') == wall.document._id);
	}
	if (keys != null && keys.length > 0)
	{
		socket.executeAsGM('socketToggleLock', wall.document._id, wall.document.ds == CONST.WALL_DOOR_STATES.LOCKED ? CONST.WALL_DOOR_STATES.CLOSED : CONST.WALL_DOOR_STATES.LOCKED);
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
	 let wall = game.canvas.walls.objects.children.filter(i => i.document._id == wallID)[0];
	 wall.document.update({ds: state});
 }