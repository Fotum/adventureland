import { Entity, IPosition, MonsterData, MonsterName, GData, Game } from "alclient"
import { SpecialName } from "../configs/boss_configs"
import { MongoClient, Collection } from 'mongodb'
import * as fs from 'fs'
import * as path from 'path'

type BossPoint = {
    boss_name: SpecialName|MonsterName,
    point: IPosition,
    last_seen?: number
}

type BossTask = {
    boss: BossPoint,
    priority: number
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

const STATE_FILE_PATH = path.join(__dirname, '../../data/boss_state.json');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'adventureland';
const COLLECTION_NAME = 'boss_states';

export class BossController {
    private state: BossPoint[] = [];
    private bossTaskQueue: BossTask[] = [];
    private readyToSpawnBosses: Set<SpecialName|MonsterName> = new Set();
    private mongoCollection: Collection | null = null;
    private character: any; // Replace 'any' with your actual character type

    public constructor(character: any) {
        this.character = character;
        this.initializeMongoDB().then(() => {
            this.loadState();
        }).catch(err => {
            console.error('Failed to initialize MongoDB:', err);
            this.loadState();
        });
    }

    private async initializeMongoDB() {
        try {
            const client = await MongoClient.connect(MONGODB_URI);
            const db = client.db(DB_NAME);
            this.mongoCollection = db.collection(COLLECTION_NAME);
        } catch (err) {
            console.error('MongoDB connection failed:', err);
            this.mongoCollection = null;
        }
    }

    private async loadState() {
        try {
            if (this.mongoCollection) {
                // Try loading from MongoDB
                const dbStates = await this.mongoCollection.find({}).toArray();
                if (dbStates.length > 0) {
                    this.state = BOSS_CHECK_ROUTE.map(point => {
                        const dbState = dbStates.find(s => s.boss_name === point.boss_name);
                        return {
                            ...point,
                            last_seen: dbState?.last_seen || 0
                        };
                    });
                    console.log('Loaded boss states from MongoDB');
                    this.checkBosses();
                    return;
                }
            }

            // Try loading from file if MongoDB failed or had no data
            if (fs.existsSync(STATE_FILE_PATH)) {
                const fileData = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf8'));
                this.state = BOSS_CHECK_ROUTE.map(point => ({
                    ...point,
                    last_seen: fileData[point.boss_name]?.last_seen || 0
                }));
                console.log('Loaded boss states from file');
            } else {
                // Initialize with default state if no saved state exists
                this.state = BOSS_CHECK_ROUTE.map(point => ({
                    ...point,
                    last_seen: 0
                }));
                console.log('Initialized default boss states');
            }
        } catch (err) {
            console.error('Error loading state:', err);
            // Initialize with default state if loading fails
            this.state = BOSS_CHECK_ROUTE.map(point => ({
                ...point,
                last_seen: 0
            }));
        }

        this.checkBosses();
    }

    private async saveState() {
        try {
            if (this.mongoCollection) {
                // Save to MongoDB
                for (const bossState of this.state) {
                    await this.mongoCollection.updateOne(
                        { boss_name: bossState.boss_name },
                        { $set: { last_seen: bossState.last_seen } },
                        { upsert: true }
                    );
                }
            } else {
                // Save to file as fallback
                const stateObj = this.state.reduce((acc, curr) => {
                    acc[curr.boss_name] = { last_seen: curr.last_seen };
                    return acc;
                }, {} as Record<string, { last_seen: number }>);

                fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(stateObj, null, 2));
            }
        } catch (err) {
            console.error('Error saving state:', err);
        }
    }

    private async updateBossLastSeen(bossName: SpecialName|MonsterName, time: number = Date.now()) {
        this.state
            .filter(boss => boss.boss_name === bossName)
            .forEach(boss => boss.last_seen = time);
        
        await this.saveState();
    }

    private async moveMerchantToBoss(bossPoint: BossPoint) {
        if (this.character && this.character.smart_move) {
            try {
                await this.character.smart_move(bossPoint.point);
                console.log(`Moving to ${bossPoint.boss_name} at ${JSON.stringify(bossPoint.point)}`);
            } catch (err) {
                console.error(`Failed to move to boss location:`, err);
            }
        }
    }

    public async checkBosses() {
        try {
            this.readyToSpawnBosses.clear();

            // Check which bosses are ready to spawn
            for (const bossPoint of this.state) {
                const monster = Game.G.monsters[bossPoint.boss_name];
                if (!monster) continue;

                const lastSeen = bossPoint.last_seen || 0;
                if (Date.now() - lastSeen > monster.respawn) {
                    this.readyToSpawnBosses.add(bossPoint.boss_name);
                    
                    // If character is merchant, move to boss location
                    if (this.character && this.character.ctype === 'merchant') {
                        await this.moveMerchantToBoss(bossPoint);
                    }
                }
            }

            // Check points for ready-to-spawn bosses
            for (const point of BOSS_CHECK_ROUTE) {
                if (this.readyToSpawnBosses.has(point.boss_name)) {
                    this.addToBossQueue(point);
                }
            }
        } catch (ex) {
            console.error('Something went wrong in checkBosses function:', ex);
        } finally {
            setTimeout(() => this.checkBosses(), 1000);
        }
    }

    private addToBossQueue(bossPoint: BossPoint, priority: number = 1) {
        this.bossTaskQueue.push({
            boss: bossPoint,
            priority
        });
        // Here you would typically notify other bots about the new task
        // Implementation depends on your bot communication system
    }

    // Method to be called when a boss is found
    public onBossFound(bossName: SpecialName|MonsterName, position: IPosition) {
        this.updateBossLastSeen(bossName);
        // Remove this boss from ready to spawn set
        this.readyToSpawnBosses.delete(bossName);
    }

    // Get current boss task queue
    public getBossTaskQueue(): BossTask[] {
        return [...this.bossTaskQueue];
    }

    // Clear completed tasks
    public clearCompletedTasks() {
        this.bossTaskQueue = [];
    }
}