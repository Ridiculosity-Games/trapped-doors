# Trapped Doors
A module for Foundry Virtual Tabletop that adds functionality to doors:
  * Allows the GM to attach traps to doors (with some included for dnd5e, add your own traps to the td-traps compendium in-game to expand it!)
    * Supported in dnd5e and pf2e, please submit an issue if you'd like another system supported
  * Adds a keybinding for the GM to quickly arm/disarm trapped doors
  * Allows the GM to generate a key that will allow players to lock/unlock doors when in their inventory
  * Allows GMs to customize how doors should be peeked, and allows GMs and players both to peek doors open
  
# Trapping a Door (pf2e and dnd5e)
  * Open up the config for the door you want to trap
    * ![image](https://user-images.githubusercontent.com/110709343/210155566-a4dfc1e0-0639-4fb9-9b1e-2df4a573d898.png)
  * Select the desired trap from the dropdown
    * ![image](https://user-images.githubusercontent.com/110709343/210155550-ee7a0418-c8f4-4fc6-b13a-85bdca2d3767.png)
  * Once the door is opened, trapped-doors looks for a "Door Traps" Actor folder and creates one if none exists
  * Trapped Doors then looks for an existing Actor that matches the entry in the compendium for the trap, and will create one if one does not exist.
    * This Actor is then put into the Door Traps folder, and deleted after five minutes have passed.
      * ![image](https://user-images.githubusercontent.com/110709343/210155668-2beef6e2-9bb3-4120-a00f-fdb8aba5a847.png)
  * Trapped doors then:
    * In dnd5e: Shows the spell card for the "Effect" action on the trap's character sheet so the GM can roll attack/damage, or to prompt a player for a saving roll.
      * ![image](https://user-images.githubusercontent.com/110709343/210155778-c17e8504-0b78-4905-a60b-996e59520433.png)
    * In pf2e: Pops up the roll prompt to roll the trap's attack
      * ![image](https://user-images.githubusercontent.com/110709343/210155798-88ffce2b-a1b2-4cf3-955b-3b7497cb97da.png)
  * The trap is then deactivated and can be reactivated by:
    * Holding the activate/deactivate trap hotkey and clicking the door
    * Opening the wall config and saving it again with the trap still selected in the trap dropdown
    
# Generating a key for a door
  * Open up the config for the door you want to key and select the "Generate a key for this door" checkbox
    * ![image](https://user-images.githubusercontent.com/110709343/210155864-2b851415-80f5-4ef2-a554-559fdb7740b0.png)
  * This creates a key with the door's ID in the name in the Items tab
    * ![image](https://user-images.githubusercontent.com/110709343/210155884-73559736-b99e-4c42-8dd9-cf0cf7a11cce.png)
  * Add the key to a player's character sheet to allow the player to lock and unlock that door with a right click\
  
# Creating a Trap
  * dnd5e:
    * Create a new Non-Player Character Actor
    * Open the Features tab on the character sheet
      * ![image](https://user-images.githubusercontent.com/110709343/210155958-2dbee7c0-576e-468d-bb31-2945ade9c654.png)
    * Add an Action named "Effect" and fill in the Description and Details fields as appropriate
  * pf2e:
    * Create a new NPC Actor
    * In Main, add a melee or ranged attack
      * ![image](https://user-images.githubusercontent.com/110709343/210156223-3c2dca61-0f95-4ddb-bdeb-b48f43a5b7e1.png)
  * Add the trap Actor to the Traps (Trapped Doors) compendium
    * ![image](https://user-images.githubusercontent.com/110709343/210156195-53f0db20-3691-4310-ac9d-5dd693dc2b1d.png)

# Default Hotkeys
  * Disarm/Re-arm trapped door
    * Left Shift and click on door
  * Reveal secret door
    * Left Alt and click on door
  * Peek door
    * Left Control and click on door
