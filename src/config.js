/**
 * Config: Handles updating wall config and generating keys if necessary
 */
import { settingsKey } from "./settings.js";

/**
 * Called in response to a wall being updated. Handles updating data from our module and generating a key if necessary
 * 
 * @param {*} event 
 * @param {*} formData 
 * @returns 
 */
export async function onWallConfigUpdate(event, formData) 
{
	const updateData = {flags: {trappedDoors: {pauseGame: formData.pauseGame, pauseGameOnce: formData.pauseGameOnce, trapID: formData.trapID, trapActive: formData.trapID != ''}}};
	let ids = this.editTargets;
	if (ids.length == 0) {
		ids = [this.object.id];
	}
	
	if (formData.generateKey)
	{
		generateKeys(ids);
	}

	// Update all the edited walls
	const updateDataset = ids.map(id => {return {_id: id, ...updateData}});
	const updateResult = await canvas.scene.updateEmbeddedDocuments("Wall", updateDataset);

	return updateResult;
}

/**
 * Generates a key for each provided wall
 * 
 * @param {*} wallIDs 
 */
async function generateKeys(wallIDs)
{
	let itemPack = game.packs.get('trapped-doors.td-items');
	let keyIndex = itemPack.index.filter(i => i.name == 'Key');
	wallIDs.forEach((wallID) => 
	{
		generateKey(itemPack, keyIndex, wallID)
	});
}

/**
 * Generates a key to lock/unlock the provided wall
 * 
 * @param {*} itemPack 
 * @param {*} keyIndex 
 * @param {*} wallID 
 */
async function generateKey(itemPack, keyIndex, wallID)
{
	let key = await game.items.importFromCompendium(itemPack, keyIndex[0]._id);
	key.setFlag(settingsKey, 'wallID', wallID);
	let keyName = 'Key - ' + wallID;
	key.update({name: keyName});
}