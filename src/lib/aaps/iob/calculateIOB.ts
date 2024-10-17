import {iobCalc} from './calculate.js';
type Treatment = {
    date: Date;
    insulin: number;
}
type Profile = {
    dia: number; // Duration of insulin action in hours
    peak: number; // Time of peak insulin activity in minutes
    useCustomPeakTime: boolean; // Whether to use a custom peak time
    insulinPeakTime: number; // The custom peak time in minutes
    curve: string; // The type of insulin action curve
}

/**
 * 
 * @param treatment 
 * @param time 
 * @param curve 
 * @param dia 
 * @param peak 
 * @param profile 
 * @returns 
 */
export function calculateIOB(treatment:Treatment, time:Date, curve:string, dia:number, peak:number, profile:Profile){
    return iobCalc(treatment, time, curve, dia, peak, profile);
}