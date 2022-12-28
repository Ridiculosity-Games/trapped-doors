"use strict";

import { libWrapper } from "../lib/libwrapper_shim.js";
import * as Config from "./config.js";
import * as DoorControls from "./features/doorControls.js"

import {registerKeybindings} from "./keybindings.js";
import {registerSettings, settingsKey} from "./settings.js";

let socket;

///////////////////////////////////
//
// Hooks
//
///////////////////////////////////

// Do initial setup
Hooks.once("init", () => 
{
	registerSettings();
	registerKeybindings();
	overrideDoorEvents();

	// Override the wall config save method so we can save custom settings
	libWrapper.register(settingsKey, "WallConfig.prototype._updateObject", async function (wrapped, event, formData)
	{
		await wrapped(event, formData);
		return Config.onWallConfigUpdate.call(this, event, formData)
	}, "WRAPPER");

	// TODO: Create a Door Traps folder if it doesn't exist
});

// Register socket methods
Hooks.once("socketlib.ready", () => {
	socket = socketlib.registerModule(settingsKey);
	DoorControls.registerSocketMethods(socket);
});

// Inject custom settings into the wall config diallog
Hooks.on("renderWallConfig", (wallConfig, html, data) => 
{
	// Don't show trap information if it's not a door
	// TODO: Should we show this even when it's not a door?
	if (data.document.door == 1)
	{
		// Try to find the trap assigned to this door
		let trapsIndex = game.packs.get('trapped-doors.td-traps').index;
		let indexArray = Array.from(trapsIndex.keys());
		let emptySelect = 'selected';
		indexArray.forEach((key) =>
		{
			if (key == data.object.flags.trappedDoors?.trapID)
			{
				// If we find a key, we don't want to select the empty option
				emptySelect = '';
			}
		});
		// Otherwise, the emmpty option will be selected
		let trapSelectBlock = `<select name="trapID" id="trapID">
				<option value ="" ${emptySelect}></option>`;
		// Iterate through the trap IDs in the index to construct the options list
		indexArray.forEach((key) => 
		{
			let selected = '';
			if (key == data.object.flags.trappedDoors?.trapID)
			{
				// If this trap ID matches what the door has attached to it, select that option by default
				selected = 'selected';
			}
			trapSelectBlock += `
				<option value = "${key}" ${selected}>${trapsIndex.get(key).name}</option>`;
		});
		trapSelectBlock += `
			</select>`;

		let doorHingeSide = data.object.flags.trappedDoors?.hingeSide;
		let doorOpenDirection = data.object.flags.trappedDoors?.openDirection;
		let doorHingeSet = doorHingeSide == "cw" || doorHingeSide == "ccw";
		let doorOpenDirectionSet = doorOpenDirection == "cw" || doorOpenDirection == "ccw";

		let doorHingeSideCW = doorHingeSide == "cw";
		let hingeSideCW = "cw" == game.settings.get(settingsKey, "hingeSide");
		let cwHingeSelected = doorHingeSet ? (doorHingeSideCW ? 'selected' : '') : (hingeSideCW ? 'selected' : '');
		let ccwHingeSelected = cwHingeSelected == 'selected' ? '' : 'selected';

		let doorOpenDirectionCW = doorOpenDirection == "cw";
		let openDirectionCW = "cw" == game.settings.get(settingsKey, "openDirection");
		let cwOpenSelected = doorOpenDirectionSet ? (doorOpenDirectionCW ? 'selected' : '') : (openDirectionCW ? 'selected' : '');
		let ccwOpenSelected = cwOpenSelected == 'selected' ? '' : 'selected';

		let hingeSideSelectBlock = `<select name="hingeSide" id="hingeSide">
				<option value = "cw" ${cwHingeSelected}>${game.i18n.localize("trapped-doors.settings.directions.cw")}</option>
				<option value = "ccw" ${ccwHingeSelected}>${game.i18n.localize("trapped-doors.settings.directions.ccw")}</option>
			</select>`;
		let openDirectionSelectBlock = `<select name="openDirection" id="openDirection">
				<option value = "cw" ${cwOpenSelected}>${game.i18n.localize("trapped-doors.settings.directions.cw")}</option>
				<option value = "ccw" ${ccwOpenSelected}>${game.i18n.localize("trapped-doors.settings.directions.ccw")}</option>
			</select>`;

		// Check the game's items before going through all the actors
		let keyFound = game.items.filter(i => i.getFlag(settingsKey, 'wallID') == data.object._id).length > 0;
		if (!keyFound)
		{
			// If we didn't find the key in the items, check all the actors for a key matching the door
			keyFound = game.actors.filter(i => i.items.filter(o => o.getFlag(settingsKey, 'wallID') == data.object._id).length > 0).length > 0;
		}
		let readonly = keyFound ? 'disabled' : '';
		const settingsBlock = `
			<div class="form-group">
				<label for="pauseGame">${game.i18n.localize("trapped-doors.wallConfig.pause.always")}</label>
				<input type="checkbox" name="pauseGame"/>
			</div>
			<div class="form-group">
				<label for="pauseGameOnce">${game.i18n.localize("trapped-doors.wallConfig.pause.once")}</label>
				<input type="checkbox" name="pauseGameOnce"/>
			</div>
			<p class="notes">${game.i18n.localize("trapped-doors.wallConfig.pause.note")}</p>
			<div class="form-group">
				<label for="trapID">${game.i18n.localize("trapped-doors.wallConfig.trap.onDoor")}</label>
				${trapSelectBlock}
			</div>
			<p class="notes">${game.i18n.localize("trapped-doors.wallConfig.trap.note")}</p>
			<div class="form-group">
				<label for="generateKey">${game.i18n.localize("trapped-doors.wallConfig.key.generate")}</label>
				<input type="checkbox" name="generateKey" ${readonly}/>
			</div>
			<p class="notes">${game.i18n.localize("trapped-doors.wallConfig.key.note")}</p>
			<div class="form-group">
				<label for="hingeSide">${game.i18n.localize("trapped-doors.settings.hingeSide.name")}</label>
				${hingeSideSelectBlock}
			</div>
			<div class="form-group">
				<label for="openDirection">${game.i18n.localize("trapped-doors.settings.openDirection.name")}</label>
				${openDirectionSelectBlock}
			</div>
			<div class="form-group">
				<label for="allowPeeking">${game.i18n.localize("trapped-doors.wallConfig.peek.allow")}</label>
				<input type="checkbox" name="allowPeeking"/>
			</div>
		`;
		html.find(".form-group").last().after(settingsBlock);

		// If our custom fields have values saved on the wall, fill them in
		const input = (name) => html.find(`input[name="${name}"]`);
		input("pauseGame").prop("checked", data.object.flags.trappedDoors?.pauseGame);
		input("pauseGameOnce").prop("checked", data.object.flags.trappedDoors?.pauseGameOnce);
		input("allowPeeking").prop("checked", data.object.flags.trappedDoors?.allowPeeking == null? true : data.object.flags.trappedDoors?.allowPeeking);

		// Force config window to resize
		wallConfig.setPosition({height: "auto"});
	}
});

///////////////////////////////////
//
// Functions
//
///////////////////////////////////

/**
 * Register overrides of left and right clicks on doors
 */
function overrideDoorEvents() 
{
	// Override left click on doors 
	libWrapper.register(settingsKey, "DoorControl.prototype._onMouseDown", function (wrapped, event)
	{
		const eventHandled = onDoorMouseDown.call(this, event)
		// If we fully handled the event, just return. Otherwise, run the original method as well.
		if (eventHandled)
		{
			return;
		}
		return wrapped(event);
	}, "MIXED");

	// Override right click on doors
	libWrapper.register(settingsKey, "DoorControl.prototype._onRightDown", function (wrapped, event)
	{
		const eventHandled = onDoorRightDown.call(this, event)
		// If we fully handled the event, just return. Otherwise, run the original method as well.
		if (eventHandled)
			return
		return wrapped(event);
	}, "MIXED");
}

/**
 * Override method for controlling left clicks on doors.
 * @param {*} event The mouse down event
 * @returns true if we've fully handled the event, false if we should pass it back to the default Foundry method.
 */
function onDoorMouseDown(event)
{
	// Send it back up to Foundry if the user doesn't have door permissions
	if (!game.user.can("WALL_DOORS"))
	{
		return false;
	}

	// Send it back up to Foundry if the game is paused and the user isn't GM
	if (game.paused && !game.user.isGM)
	{
		return false;
	}

	// Reveal the door if applicable, otherwise keep going
	if (DoorControls.reveal(this.wall))
	{
		return true;
	}

	// Disarm the trap on the door if applicable, otherwise keep going
	if (DoorControls.disarm(this.wall))
	{
		return true;
	}

	// Trip the trap on the door if applicable, otherwise keep going
	if (DoorControls.trip(this.wall, socket))
	{
		return true;
	}

	// Peek the door if applicable, otherwise keep going
	if (DoorControls.peek(this.wall, socket))
	{
		return true;
	}

	// Pause the game for everyone if applicable, otherwise keep going
	if (DoorControls.pause(this.wall, socket))
	{
		return true;
	}

	// Send it back up to Foundry
	return false;
}

/**
 * Override method for controlling right clicks on doors.
 * @param {*} event The mouse down event
 * @returns true if we've fully handled the event, false if we should pass it back to the default Foundry method.
 */
function onDoorRightDown(event)
{
	// If the user is the GM, send it back up to Foundry
	if (game.user.isGM)
	{
		return false;
	}

	// Toggle the door's lock if appropriate, otherwise keep going
	if (DoorControls.toggleLock(game.user, this.wall, socket))
	{
		return true;
	}

	// Send it back up to Foundry
	return false;
}

