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
	game.settings.register(settingsKey, "peekDegrees",
	{
		name: "trapped-doors.settings.peekDegrees.name",
		hint: "trapped-doors.settings.peekDegrees.hint",
		scope: "world",
		config: true,
		type: Number,
		default: 20
	});
	game.settings.register(settingsKey, "hingeSide",
	{
		name: "trapped-doors.settings.hingeSide.name",
		hint: "trapped-doors.settings.hingeSide.hint",
		scope: "world",
		config: true,
		type: String,
		choices:
		{
			"cw" : "Clockwise From L",
			"ccw" : "Counterclockwise from L"
		},
		default: "cw"
	});
	game.settings.register(settingsKey, "openDirection",
	{
		name: "trapped-doors.settings.openDirection.name",
		hint: "trapped-doors.settings.openDirection.hint",
		scope: "world",
		config: true,
		type: String,
		choices:
		{
			"cw" : "Clockwise From L",
			"ccw" : "Counterclockwise from L"
		},
		default: "cw"
	});
}
