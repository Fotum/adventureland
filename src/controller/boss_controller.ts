import { Entity, IPosition, MonsterData, MonsterName, GData } from "alclient"
import { SpecialName } from "../configs/boss_configs"


type BossPoint = {
    boss_name: SpecialName|MonsterName,
    point: IPosition
}


const BOSS_CHECK_ROUTE : BossPoint[] = [
	{boss_name: "phoenix", point:{map: "main", x: -1184, y: 784}},
	{boss_name: "phoenix", point: {map: "main", x: 641, y: 1803}},
	{boss_name: "phoenix", point: {map: "main", x: 1188, y: -193}},
	{boss_name: "phoenix", point: {map: "halloween", x: 8, y: 631}},
	{boss_name: "greenjr", point: {map: "halloween", x: -569, y: -412}},
	{boss_name: "fvampire", point: {map: "halloween", x: -406, y: -1643}},
	{boss_name: "phoenix", point: {map: "cave", x: -181, y: -1164}},
	{boss_name: "mvampire", point: {map: "cave", x: -181, y: -1164}},
	{boss_name: "mvampire", point: {map: "cave", x: 1244, y: -23}},
	{boss_name: "jr", point: {map: "spookytown", x: -784, y: -301}},
	{boss_name: "stompy", point: {map: "winterland", x: 400, y: -2600}},
	{boss_name: "skeletor", point: {map: "arena", x: 247, y: -558}}
]

export class BossController {
    

    let state 
    public constructor(){
        
    }

    
    public CheckBosses() {
        // let state = {BossTimers: {}}
        let respawn 
        for(let i of state.BossTimers) {
            if(state.BossTimers[i] && Date.now()-state.BossTimers[i]>respawn)
            {
                
            }
        }
    }

}