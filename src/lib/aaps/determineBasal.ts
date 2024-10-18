import type { AutoISFProfile, GlucoseStatus, CurrentTemp, IobData, AutoSensData, MealData, DetermineBasalResult, DetermineBasalData } from "../types";
import {  determine_basal as determineBasalJS } from "./determine-basal.mjs";

export function determineBasalWrapper(
  glucose_status: GlucoseStatus,
  currenttemp: CurrentTemp,
  iob_data: IobData,
  profile: AutoISFProfile,
  autosens_data: AutoSensData,
  meal_data: MealData,
  tempBasalFunctions: any,
  microBolusAllowed: boolean,
  reservoir_data: number | undefined,
  currentTime: number,
  flatBGsDetected: boolean
): DetermineBasalResult {
  return determineBasalJS(
    glucose_status,
    currenttemp,
    iob_data,
    profile,
    autosens_data,
    meal_data,
    tempBasalFunctions,
    microBolusAllowed,
    reservoir_data,
    currentTime,
    flatBGsDetected
  );
}
function round(value:number, digits:number)
{
    if (! digits) { digits = 0; }
    var scale = Math.pow(10, digits);
    return Math.round(value * scale) / scale;
}
export function convert_bg(value:number, profile:AutoISFProfile)
{
    if (profile.out_units === "mmol/L")
    {
        return round(value / 18.018, 2)
    }
    else {
    return Math.round(value);
    }
}

function convertBgWrapper(value:number,profile:AutoISFProfile){
  return convert_bg(value,profile);
}
const tempBasalFunctions = {
  getMaxSafeBasal: (profile: AutoISFProfile) => 0,
  setTempBasal: (rate: number, duration: number, profile: AutoISFProfile, result: DetermineBasalResult, currentTemp: CurrentTemp) => 
    {return {...result, rate,duration}}
}
export function determineBasalUseProfileUnits(determineBasalData: DetermineBasalData): DetermineBasalResult {
  let result = determineBasal(determineBasalData);
  result.bg = convert_bg(result.bg,determineBasalData.profile);
  result.eventualBG = convert_bg(result.eventualBG,determineBasalData.profile);
  result.targetBG = convert_bg(result.targetBG,determineBasalData.profile);
  result.predBGs.IOB = result.predBGs.IOB.map(value => convert_bg(value,determineBasalData.profile));
  result.predBGs.ZT = result.predBGs.ZT.map(value => convert_bg(value,determineBasalData.profile));
  result.predBGs.UAM = result.predBGs.UAM?.map(value => convert_bg(value,determineBasalData.profile));
  
  
  return result;
}

export function determineBasal(determineBasalData: DetermineBasalData): DetermineBasalResult {
  //Determinbasal outputs a ton of logging garbage so we will divert all logs here
  // const oldErrorLog=console.error;
  // console.error=()=>{}
  // const oldLog=console.error;
  // console.log=()=>{}
 const result=determineBasalWrapper(determineBasalData.glucoseStatus, determineBasalData.currentTemp, determineBasalData.iobData, determineBasalData.profile, determineBasalData.autosensData, determineBasalData.mealData, tempBasalFunctions, determineBasalData.microBolusAllowed, determineBasalData.reservoirData, determineBasalData.currentTime, determineBasalData.flatBGsDetected);
//  console.error=oldErrorLog;
//  console.log=oldLog;
 return result
}
