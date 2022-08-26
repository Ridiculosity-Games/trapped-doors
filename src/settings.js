/**
 * Settings: Registers settings and holds the settingsKey constant.
 */
export const settingsKey = "trapped-doors";

/**
 * Registers the settings with Foundry.
 */
export function registerSettings() 
{
	game.settings.register(settingsKey, "pauseOnTrap",
	{
		name: "trapped-doors.settings.pauseOnTrap.name",
		hint: "trapped-doors.settings.pauseOnTrap.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
	game.settings.register(settingsKey, "openOnTrap",
	{
		name: "trapped-doors.settings.openOnTrap.name",
		hint: "trapped-doors.settings.openOnTrap.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
}
