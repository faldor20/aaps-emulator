import { parseBolusData, parseDetermineBasalData } from "./readaapslog";
import type { AutoISFProfile,  BolusData, DetermineBasalData, DetermineBasalResultWithTime } from "./types";
import { determineBasalUseProfileUnits } from "./aaps/determineBasal";

function parseLog(log: string) {
    return {
        steps: parseDetermineBasalData(log),
        bolusData: parseBolusData(log),
    };
}
function generateResults(steps: DetermineBasalData[]): DetermineBasalResultWithTime[] {
    return steps.map((data) => {
        const startTime = performance.now();
        const result = determineBasalUseProfileUnits(data);

        const endTime = performance.now();
        console.log(
            `Time taken for determineBasal: ${endTime - startTime} milliseconds`,
        );
        return { ...result, currentTime: new Date(data.glucoseStatus.date),is_mg_dl:data.profile.out_units!=="mmol/L" };
    });
}

export class AapsStateManager {
    profileOverrideConfig: AutoISFProfile | undefined = $state(undefined);
    overriddenStep: DetermineBasalData | undefined = $state(undefined);
    steps: DetermineBasalData[] = $state([]);
    bolusData: BolusData[] = $state([]);
    is_mg_dl:boolean=$state(true);

    profileOverride: AutoISFProfile | undefined = $derived.by(()=>{
        if (this.profileOverrideConfig) {
            return this.profileOverrideConfig;
        } else if (this.overriddenStep) {
            return this.overriddenStep.profile;
        } else {
            return undefined;
        }
    });

    overriddenSteps: DetermineBasalData[] = $derived.by(()=>{
        if (this.overriddenStep != undefined && this.profileOverride != undefined) {
            return this.steps.map((step) => {
                if (step.currentTime >= this.overriddenStep!.currentTime) {
                    const step_snapshot=$state.snapshot(step);
                    const profile_snapshot=$state.snapshot(this.profileOverride!);
                    return {...step_snapshot, profile: profile_snapshot };
                }
                return step;
            });
        } else {
            return this.steps;
        }
    });
    results: DetermineBasalResultWithTime[] = $derived.by(()=>{
        return generateResults(this.overriddenSteps);
    });

    constructor(log: string) {
        const { steps, bolusData } = parseLog(log);

        this.steps = steps;
        this.bolusData = bolusData;
        this.is_mg_dl= steps[0]?.profile.out_units !== "mmol/L" ;
    }

}



