import { parseBolusData, parseDetermineBasalData } from "./readaapslog";
import type { AutoISFProfile, BolusData, DetermineBasalData, DetermineBasalResultWithTime } from "./types";
import { determineBasalUseProfileUnits } from "./aaps/determineBasal";
import { atom, batched, computed, map } from "nanostores";

function parseLog(log: string) {
    return {
        steps: parseDetermineBasalData(log),
        bolusData: parseBolusData(log),
    };
}

function generateResults(steps: DetermineBasalData[]): DetermineBasalResultWithTime[] {
    const startTime = performance.now();
    console.log("Calculating results");
    const res = steps.map((data) => {
        const result = determineBasalUseProfileUnits(data);
        return { ...result, currentTime: new Date(data.glucoseStatus.date), is_mg_dl: data.profile.out_units !== "mmol/L" };
    });
    const endTime = performance.now();
    console.log(`Time taken calculating results: ${endTime - startTime} milliseconds`);
    return res;
}
export const importedLog = atom<string | undefined>(undefined);
export const profileOverrideConfig = atom<AutoISFProfile | undefined>(undefined);
export const overriddenStep = atom<DetermineBasalData | undefined>(undefined);
export const steps = atom<DetermineBasalData[]>([]);
export const bolusData = atom<BolusData[]>([]);
export const is_mg_dl = atom(true);

export const profileOverride = computed([profileOverrideConfig, overriddenStep], (config, step) => {
    console.log("recalculating profile override");
    if (config) {
        return config;
    } else if (step) {
        return step.profile;
    } else {
        return undefined;
    }
});

export const overriddenSteps = computed([steps, overriddenStep, profileOverride], (steps, overriddenStep, profileOverride) => {
    console.log("recalculating overridden steps");
    if (overriddenStep !== undefined && profileOverride !== undefined) {
        return steps.map((step) => {
            if (step.currentTime >= overriddenStep.currentTime) {
                return { ...step, profile: profileOverride };
            }
            return step;
        });
    } else {
        return steps;
    }
});

export const results = batched(overriddenSteps, (steps) => {
    return generateResults(steps);
});

export function initializeAapsState(log: string) {
    const { steps: logSteps, bolusData: logBolusData } = parseLog(log);
    importedLog.set(log);
    steps.set(logSteps);
    bolusData.set(logBolusData);
    is_mg_dl.set(logSteps[0]?.profile.out_units !== "mmol/L");
    
}