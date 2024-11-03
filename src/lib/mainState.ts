import type { AutoISFProfile, BolusData, DetermineBasalData, DetermineBasalResult, DetermineBasalResultWithTime, EmulationResult, InsulinConfig, InsulinConfig, IobData, IobDataValue, OverrideProfile, OverrideProfileConfig } from "./types";
import { determineBasalUseProfileUnits } from "./aaps/determineBasal";
import { atom, batched, computed, map, type ReadableAtom } from "nanostores";
import { calculateIOB } from "./aaps/iob/calculateIOB";
import { generate } from "./aaps/iob";
import { registerUpdateLifecycle } from "echarts";


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

export const importedLog = atom<boolean>(false);
export const profileOverrideConfig = atom<OverrideProfile | undefined>(undefined);
export const overriddenStep = atom<DetermineBasalData | undefined>(undefined);
export const steps = atom<DetermineBasalData[]>([]);
export const bolusData = atom<BolusData[]>([]);
export const is_mg_dl = atom(true);
export const insulinConfig = atom<InsulinConfig>({
    dia:9,
    peak:55,
    curve:"ultra-rapid",
    useCustomPeakTime:false,
    insulinPeakTime:55
});


function generateIOB(treatments: any[], currentTime: Date, profile: {}) {
    const inputs = {
        clock: currentTime,

        profile,
        // history: treatments.reverse(),
        autosens: undefined
    }
    const treatments2 = treatments.map((treatment) => {
        return {
            date: new Date(treatment.created_at),
            started_at: new Date(treatment.created_at),
            insulin: treatment.amount
        }
    })
    console.log("inputs", inputs);
    console.log("treatments2", treatments2);
    return generate(inputs, false, treatments2);
}

function calculateEmulatedIOB(insulinConfig:InsulinConfig,basalProfile: any, currentTime: Date, emulated_treatments: any[]): IobData {
    const iobProfile: Profile = {
         ...insulinConfig,
        basalprofile: basalProfile
    }
    const embulated_iob = generateIOB(emulated_treatments, currentTime, iobProfile);

    return embulated_iob;
}

function getTreatments(result: DetermineBasalResult) {
    const treatments: any[] = [];

    //TODO:
    //I'm not sure if i should make a list of all the original treatments and the new treatments and then calculate the two iob each time, then get the differentece
    // or if i should make the individual treatments a difference between the original result and the new result so when we calculte 
    // the iob it's already correct...
    //I should test both and see if they give the same result
    if (result.units && result.units > 0) {
        //TODO: make the bolus a difference between the original result and the new result so when we calculte 

        const bolus = {
            _type: "Bolus",
            amount: result.units,
            date: new Date(result.deliverAt),
            created_at: new Date(result.deliverAt),
        };
        treatments.push(bolus);
        console.log("bolus", bolus);
    }


    // if (result.rate && result.duration) {
    //     //TODO: I don't know if all these dates should be the same. or if deliverat is correct for temp basals
    //     //TODO: make the basal a difference between the original result and the new result so when we calculte 
    //     const temp_basal = { _type: "Temp Basal", temp: "absolute", rate: result.rate, 
    //         duration: result.duration??5,
    //          date: new Date(result.deliverAt),
    //           started_at: new Date(result.deliverAt),
    //            timestamp: new Date(result.deliverAt).toISOString() };
    //     treatments.push(temp_basal);
    //     console.log("temp_basal",temp_basal);
    // }
    return treatments;
}


export const results: ReadableAtom<EmulationResult[]> = computed([steps, overriddenStep, profileOverrideConfig], (steps, overriddenStep, profileOverrideConfig) => {
    console.log("recalculating overridden steps");
    const emulated_treatments: any[] = [];
    const og_treatments: any[] = [];

    if (overriddenStep !== undefined && profileOverrideConfig !== undefined) {
        let lastStep: DetermineBasalData | null = null;
        let shouldOverride = true;
        let firstStep=true;

        return steps.map((step) => {
            let inOverrideRange= step.currentTime >= overriddenStep.currentTime;
            if (inOverrideRange && !firstStep) {
                if (lastStep==null){ throw new Error("lastStep is null");}
                //stop overriding if any of these values change
                for (const key in profileOverrideConfig) {
                    if (profileOverrideConfig[key as keyof OverrideProfileConfig] !== undefined && lastStep?.profile[key as keyof AutoISFProfile] !== step.profile[key as keyof AutoISFProfile]) {
                        shouldOverride = false;
                        break;
                    }
                }
            }
            lastStep = step;
            if (inOverrideRange && shouldOverride) {
                firstStep=false;
               console.log("overriding step", step, "profileOverrideConfig", profileOverrideConfig);
                //We don't want to override the target bg because it's not a constant.

                const newProfile = { ...step.profile, ...profileOverrideConfig };
                // const newProfile = step.profile;
                const newStep = JSON.parse(JSON.stringify({ ...step, profile: newProfile }));
                
                if (emulated_treatments.length > 0 || og_treatments.length > 0) {
                    console.log("calculating emulated iob");
                    //TOOD: make a real profile
                    let basalProfile = [
                        {
                            minutes: 0,
                            rate: step.profile.current_basal
                        }
                    ]
                    const newIob = calculateEmulatedIOB(insulinConfig.get(),basalProfile, new Date(step.iobData[0].time), emulated_treatments);
                    const ogIob = calculateEmulatedIOB(insulinConfig.get(),basalProfile, new Date(step.iobData[0].time), og_treatments);
                   
                    if(ogIob[0]!= step.iobData[0]){
                        //This should keep happpening until we add basal changes into the emulation. 
                        console.log("stepIob", step.iobData[0].iob);
                        console.log("newIob", newIob[0].iob);
                        console.log("ogIob", ogIob[0].iob);
                        console.log("stepIob-10", step.iobData[10].iob);
                        console.log("newIob-10", newIob[10].iob);
                        console.log("ogIob-10", ogIob[10].iob);
                    }
                    
                    //TODO: calculte activity properly
                    //TODO: use the activity for the new and original 
                    // iob to calulate the original and current BGimpact then adjust the reading by that amount

                    const differenceIob = newIob
                        .map((newIobItem, index) => {
                            return {
                                ...newIobItem,
                                basaliob: newIobItem.basaliob - ogIob[index].basaliob,
                                iob: newIobItem.iob - ogIob[index].iob,
                                activity: newIobItem.activity - ogIob[index].activity,
                                iobwithzerotemp: {
                                    ...newIobItem.iobWithZeroTemp,
                                    iob: newIobItem.iobWithZeroTemp?.iob - ogIob[index].iobWithZeroTemp?.iob,
                                    basaliob: newIobItem.iobWithZeroTemp?.basaliob - ogIob[index].iobWithZeroTemp?.basaliob,
                                    activity: newIobItem.iobWithZeroTemp?.activity - ogIob[index].iobWithZeroTemp?.activity,
                                }
                            }
                        })
                    const finalIob = newStep.iobData.map((iobItem, index) => {

                        return {
                            ...iobItem,
                            basaliob: iobItem.basaliob + differenceIob[index].basaliob,
                            iob: iobItem.iob + differenceIob[index].iob,
                            // activity: activity,
                            activity: iobItem.activity + differenceIob[index].activity,
                            iobwithzerotemp: {
                                ...iobItem.iobWithZeroTemp,
                                iob: iobItem.iobWithZeroTemp?.iob + differenceIob[index].iobwithzerotemp?.iob,
                                basaliob: iobItem.iobWithZeroTemp?.basaliob + differenceIob[index].iobwitactivityhzerotemp?.basaliob,
                                // activity: activityZeroTemp,
                                activity: iobItem.iobWithZeroTemp?.activity + differenceIob[index].iobwithzerotemp?.activity,

                            }
                        }
                    })
                    newStep.iobData = finalIob;
                    console.log("finalIob:", newStep.iobData[0].iob, "originalIob:", step.iobData[0].iob);
                }

                const result = determineBasalUseProfileUnits(newStep);
                const og_result = determineBasalUseProfileUnits(step);

                console.log("result units", result.units ?? undefined);
                console.log("og_result units", og_result.units ?? undefined);

                //add the treatments
                console.log("adding treatments");
                emulated_treatments.push(...getTreatments(result));
                og_treatments.push(...getTreatments(og_result));


                console.log("newStep.iobData[0].iob", newStep.iobData[0].iob);
                console.log("step.iobData[0].iob", step.iobData[0].iob);
                return {
                    og:
                        { ...og_result, currentTime: new Date(step.glucoseStatus.date), is_mg_dl: step.profile.out_units !== "mmol/L" }
                    ,
                    emulated:{
                    ...result,
                    activity: newStep.iobData[0].activity,
                    bgi: (newStep.iobData[0].activity * result.sensitivityRatio * 5),

                    currentTime: new Date(newStep.glucoseStatus.date),
                    is_mg_dl: newStep.profile.out_units !== "mmol/L"
                }};
            }
            const result = determineBasalUseProfileUnits(step);
            return {og:{ ...result, currentTime: new Date(step.glucoseStatus.date), is_mg_dl: step.profile.out_units !== "mmol/L" },
                emulated:undefined};



            ;
        });
    } else {
        return steps.map((step) => {
            
            const result = determineBasalUseProfileUnits(step);
            return {og:{ ...result, currentTime: new Date(step.glucoseStatus.date), is_mg_dl: step.profile.out_units !== "mmol/L" },
                emulated:undefined};
        });
    }
});




export function initializeAapsState({steps:logSteps,bolusData:logBolusData}:{steps:DetermineBasalData[],bolusData:BolusData[]}, insulinConf:InsulinConfig) {

    importedLog.set(true);
    steps.set(logSteps);
    bolusData.set(logBolusData);
    is_mg_dl.set(logSteps[0]?.profile.out_units !== "mmol/L");
    insulinConfig.set(insulinConf);
}