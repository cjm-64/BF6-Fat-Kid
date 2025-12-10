// Area trigger ID from Godot (must match the "id" property in Godot)
const COMBAT_AREA_TRIGGER_ID: string = "1";
const CONSTRUCTION_AREA_TRIGGER_ID: string = "2";

// Track objects to give physics
const BARREL_ID: number = 100
const TIRE_ID: number = 101

// Track which players are currently in each area
let playersInCombatAreaTrigger: Set<number> = new Set();
let playersInConstructionAreaTrigger: Set<number> = new Set();

var runnerCount: number = 0

const randomEnumValue = (enumeration: any) => {
  const values = Object.keys(enumeration);
  const enumKey = values[Math.floor(Math.random() * values.length)];
  return enumeration[enumKey];
}

export function endGame(): void{
  mod.EndGameMode(mod.GetTeam(1))
  mod.EndGameMode(mod.GetTeam(2))
}

export function giveCorrectMeleeWeapon(eventPlayer:mod.Player): void{
    if(mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(1))){
        mod.AddEquipment(eventPlayer, mod.Gadgets.Melee_Combat_Knife)
    }
    else{
        if (mod.GetPlayerDeaths(eventPlayer)>0){
            mod.AddEquipment(eventPlayer, mod.Gadgets.Melee_Hunting_Knife)
        }
        else{
            mod.AddEquipment(eventPlayer, mod.Gadgets.Melee_Sledgehammer)
        }
    }
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
  const fatKidNumber = Math.round(Math.random()*mod.AllPlayers.length)
  for (let i = 0; i < mod.AllPlayers.length; i++) {
    if (i == fatKidNumber){
        mod.SetTeam(mod.ValueInArray(mod.AllPlayers(), i), mod.GetTeam(2))
    }
    else{
        mod.SetTeam(mod.ValueInArray(mod.AllPlayers(), i), mod.GetTeam(1))
    }
  }
  mod.MoveObject(mod.GetSpatialObject(TIRE_ID), mod.CreateVector(-1, -1, -1))
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void{
    disarmPlayer(eventPlayer)
    giveCorrectMeleeWeapon(eventPlayer)

    if (mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(2))){
      if (mod.GreaterThan(mod.GetPlayerDeaths(eventPlayer), 0)){
        mod.SetPlayerMovementSpeedMultiplier(eventPlayer, 5)
        mod.SetPlayerMaxHealth(eventPlayer, 10)
      }
      else{
        mod.SetPlayerMaxHealth(eventPlayer, 500)
        mod.SetPlayerMovementSpeedMultiplier(eventPlayer, 0.75)
      }
    }

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
}

// Called when a player exits the spawn area trigger
export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): void {
  const triggerID = String(mod.GetObjId(eventAreaTrigger));
  const playerId = mod.GetObjId(eventPlayer);
  disarmPlayer(eventPlayer)
  giveCorrectMeleeWeapon(eventPlayer)

  // Check if this is a specific area trigger
  if (triggerID === COMBAT_AREA_TRIGGER_ID) {
    // Remove player from tracking set
    playersInCombatAreaTrigger.delete(playerId);
  }

  if (triggerID === CONSTRUCTION_AREA_TRIGGER_ID && mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(1))) {
    // Remove player from tracking set
    playersInConstructionAreaTrigger.delete(playerId);
  }
}

export function OnPlayerDied(eventPlayer: mod.Player): void{
    if (mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(1))){
      mod.SetTeam(eventPlayer, mod.GetTeam(2))
      runnerCount = runnerCount - 1
    }
    else {
      if (mod.GetPlayerDeaths(eventPlayer) == 1){
        endGame()
      }
    } 
    if(runnerCount < 1){
        endGame()
    }   
}

export function Ongoing(){
  if (mod.GetRoundTime() > 2*60){
    mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.minRem2))
  }
  if (mod.GetRoundTime() > 1*60){
    mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.minRem1))
  }
    
}








