// Area trigger ID from Godot (must match the "id" property in Godot)
const COMBAT_AREA_TRIGGER_ID: string = "1";
const CONSTRUCTION_AREA_TRIGGER_ID: string = "2";
const DISARM_AREA_TRIGGER_ID: string = "3";

// Track which players are currently in each area
let playersInCombatAreaTrigger: Set<number> = new Set();
let playersInConstructionAreaTrigger: Set<number> = new Set();
let playersInDisarmArea: Set<number> = new Set();

const randomEnumValue = (enumeration: any) => {
  const values = Object.keys(enumeration);
  const enumKey = values[Math.floor(Math.random() * values.length)];
  return enumeration[enumKey];
}

export function endGame(): void{
  mod.EndGameMode(mod.GetTeam(1))
  mod.EndGameMode(mod.GetTeam(2))
}

export function disarmPlayer(player: mod.Player): void{
    mod.RemoveEquipment(player, mod.InventorySlots.PrimaryWeapon)
    mod.RemoveEquipment(player, mod.InventorySlots.SecondaryWeapon)
    mod.RemoveEquipment(player, mod.InventorySlots.MeleeWeapon)
    mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne)
    mod.RemoveEquipment(player, mod.InventorySlots.GadgetTwo)
    mod.RemoveEquipment(player, mod.InventorySlots.Throwable)
    mod.RemoveEquipment(player, mod.InventorySlots.ClassGadget)
}

export async function OnGameModeStarted(){
  const randomInt = Math.round(Math.random()*mod.AllPlayers.length)
  
  const fatKid = mod.ValueInArray(mod.AllPlayers(), randomInt)
  mod.SetTeam(fatKid, mod.GetTeam(2))

  const runnerNumbers: number[] = []
  for (let i = 0; i < mod.AllPlayers.length; i++) {
    if (i != randomInt) {
      runnerNumbers.push(i)
    }
  }
  for (const num of runnerNumbers){
    mod.SetTeam(mod.ValueInArray(mod.AllPlayers(), num), mod.GetTeam(1))
  }
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    disarmPlayer(eventPlayer)
    if (mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(1))){
      mod.AddEquipment(eventPlayer, mod.Gadgets.Melee_Combat_Knife)
    }
    else {
      if (mod.GetPlayerDeaths(eventPlayer) > 0){
        mod.AddEquipment(eventPlayer, mod.Gadgets.Melee_Hunting_Knife)
        mod.SetPlayerMaxHealth(eventPlayer, 20)
        mod.SetPlayerMovementSpeedMultiplier(eventPlayer, 1.5)
      }
      else {
        mod.AddEquipment(eventPlayer, mod.Gadgets.Melee_Sledgehammer)
      }
    }
    
    mod.DisplayNotificationMessage(mod.Message(String(mod.GetPlayerDeaths(eventPlayer))), eventPlayer)
}

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): void {
  const triggerID = String(mod.GetObjId(eventAreaTrigger));
  const playerId = mod.GetObjId(eventPlayer);

  // Check if this is a specific area trigger
  if (triggerID === CONSTRUCTION_AREA_TRIGGER_ID && mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(1))) {
    // Add player to tracking set
    playersInConstructionAreaTrigger.add(playerId);
    mod.AddEquipment(eventPlayer, mod.Gadgets.Melee_Sledgehammer)
    mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.enterConstruction), eventPlayer)
  }
  
  if (triggerID === COMBAT_AREA_TRIGGER_ID && mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(1))) {
    // Add player to tracking set
    playersInCombatAreaTrigger.add(playerId);
    mod.AddEquipment(eventPlayer, randomEnumValue(mod.Weapons))
    mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.enterCombat), eventPlayer)
  }
  
  // if (triggerID === DISARM_AREA_TRIGGER_ID && mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(1))) {
  //   // Add player to tracking set
  //   playersInDisarmArea.add(playerId);
  //   disarmPlayer(eventPlayer, )
  // }
}

// Called when a player exits the spawn area trigger
export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): void {
  const triggerID = String(mod.GetObjId(eventAreaTrigger));
  const playerId = mod.GetObjId(eventPlayer);

  // Check if this is a specific area trigger
  if (triggerID === COMBAT_AREA_TRIGGER_ID) {
    // Remove player from tracking set
    playersInCombatAreaTrigger.delete(playerId);

    disarmPlayer(eventPlayer)
    if (mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(1))) {
      mod.AddEquipment(eventPlayer, mod.Gadgets.Melee_Combat_Knife)
    }
    else {
      mod.AddEquipment(eventPlayer, mod.Gadgets.Melee_Sledgehammer)
    }
  }

  if (triggerID === CONSTRUCTION_AREA_TRIGGER_ID && mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(1))) {
    // Remove player from tracking set
    playersInConstructionAreaTrigger.delete(playerId);

    disarmPlayer(eventPlayer)
    if (mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(1))) {
      mod.AddEquipment(eventPlayer, mod.Gadgets.Melee_Combat_Knife)
    }
    else {
      mod.AddEquipment(eventPlayer, mod.Gadgets.Melee_Sledgehammer)
    }
  }
  // Check if this is a specific area trigger
  // if (triggerID === DISARM_AREA_TRIGGER_ID && mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(1))) {
  //   // Remove player from tracking set
  //   playersInDisarmArea.delete(playerId);

  //   disarmPlayer(eventPlayer)
  //   mod.AddEquipment(eventPlayer, mod.Gadgets.Melee_Combat_Knife)
  // }

}

export function OnPlayerDied(eventPlayer: mod.Player): void{
    if (mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(1))){
      mod.SetTeam(eventPlayer, mod.GetTeam(2))
    }
    else {
      if (mod.GetPlayerDeaths(eventPlayer) == 1){
        endGame()
      }
    }    
}


export function Ongoing() {
  const dummy: boolean[] = []
  for (let i = 0; i < mod.AllPlayers.length; i++) {
    dummy.push(mod.Equals(mod.ValueInArray(mod.AllPlayers(), i), mod.GetTeam(1)))
  } 

  // If any are true then there are still runners
  // So if they are all false then game ends
  if (dummy.every(value => value === false)){
    endGame()
  }
}



// To do

//Add proper team filling on start
//Add win conditions
//  All team 1 dead
//  Time expires
//Add proper team switching on death
//Add fast and weak to fat kid team on death
//  If player has died and is on team 2 set health low, speed high, damage high
//Work out why the sledgehammer only works some of the time
//Add proper disarm
//Add spawn room and rounds

