import type { InsulinConfig,Preset } from "$lib/types";
import Dexie from "dexie";
export interface InsulinConfigDBEntry {
    insulinConfig: InsulinConfig;
    preset: Preset;
    id: string;
}

export class InsulinConfigDB extends Dexie {
    currentConfig!: Dexie.Table<InsulinConfigDBEntry, string>;

    constructor() {
        super('insulinConfigDB');
        this.version(1).stores({
            currentConfig: 'id'
        });
    }
}

export const insulinConfigDB = new InsulinConfigDB();
