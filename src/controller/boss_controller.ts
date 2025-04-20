import { Entity, IPosition, MonsterData, MonsterName, GData, Game } from "alclient"
import { SpecialName } from "../configs/boss_configs"


type BossPoint = {
    boss_name: SpecialName|MonsterName,
    point: IPosition,
    last_seen?: number
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

const BOSSES_TO_CHECK: SpecialName|MonsterName[] = [
    "phoenix", "greenjr", "fvampire", "mvampire", "jr", "stompy", "skeletor"
]

export class BossController {
    

    private state: BossPoint[] 
    public constructor(){
        this.loadState()
    }

    private loadState()
    {
        if(this.state.length<1)
        {
            for(let boss of BOSSES_TO_CHECK)
            {
                //try to load from JSON or Mongo
            }
        }

        this.CheckBosses()
    }

    public CheckBosses() {
        
        try{
            for(let i of BOSS_CHECK_ROUTE) {
                let boss_state = Object.values(this.state).filter(e => e.boss_name == i.boss_name && e.last_seen)
                if(boss_state[0].last_seen && Date.now()-boss_state[0].last_seen>Game.G.monsters[i.boss_name].respawn)
                {
                    //smart_move i.point or add to schedule task
                }
            }
        }
        catch(ex)
        {
            console.error('Something goes wrong at checkBosses function \n'+ex)
        }
        finally
        {
            setTimeout(this.CheckBosses, 1000)
        }
    }

}