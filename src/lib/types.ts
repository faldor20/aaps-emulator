import type { AapsStateManager } from "./mainState.svelte.ts";

export type GlucoseValue = {
    timestamp: string;
    value: number;
    noise: number;
}

export type AutoISFProfile = {
    max_iob: number;
    type: string;
    max_daily_basal: number;
    max_basal: number;
    min_bg: number;
    max_bg: number;
    target_bg: number;
    carb_ratio: number;
    sens: number;
    max_daily_safety_multiplier: number;
    current_basal_safety_multiplier: number;
    high_temptarget_raises_sensitivity: boolean;
    low_temptarget_lowers_sensitivity: boolean;
    sensitivity_raises_target: boolean;
    resistance_lowers_target: boolean;
    adv_target_adjustments: boolean;
    exercise_mode: boolean;
    half_basal_exercise_target: number;
    maxCOB: number;
    skip_neutral_temps: boolean;
    remainingCarbsCap: number;
    enableUAM: boolean;
    A52_risk_enable: boolean;
    SMBInterval: number;
    enableSMB_with_COB: boolean;
    enableSMB_with_temptarget: boolean;
    allowSMB_with_high_temptarget: boolean;
    enableSMB_always: boolean;
    enableSMB_after_carbs: boolean;
    maxSMBBasalMinutes: number;
    maxUAMSMBBasalMinutes: number;
    bolus_increment: number;
    carbsReqThreshold: number;
    current_basal: number;
    temptargetSet: boolean;
    autosens_max: number;
    autoISF_version: string;
    enable_autoISF: boolean;
    autoISF_max: number;
    autoISF_min: number;
    bgAccel_ISF_weight: number;
    bgBrake_ISF_weight: number;
    pp_ISF_weight: number;
    lower_ISFrange_weight: number;
    higher_ISFrange_weight: number;
    dura_ISF_weight: number;
    smb_delivery_ratio: number;
    smb_delivery_ratio_min: number;
    smb_delivery_ratio_max: number;
    smb_delivery_ratio_bg_range: number;
    smb_max_range_extension: number;
    enableSMB_EvenOn_OddOff_always: boolean;
    iob_threshold_percent: number;
    profile_percentage: number;
    out_units: string;
    recentSteps5Minutes: number;
    recentSteps10Minutes: number;
    recentSteps15Minutes: number;
    recentSteps30Minutes: number;
    recentSteps60Minutes: number;
    activity_detection: boolean;
    phone_moved: boolean;
    activity_scale_factor: number;
    inactivity_scale_factor: number;
    ignore_inactivity_overnight: boolean;
    inactivity_idle_start: number;
    inactivity_idle_end: number;
    time_since_start: number;
}


export type GlucoseStatus = {
    glucose: number
    noise: number
    delta: number
    short_avgdelta: number
    long_avgdelta: number
    date: number
    dura_ISF_minutes: number
    dura_ISF_average: number
    useFSL1minuteRaw: boolean
    parabola_fit_correlation: number
    parabola_fit_minutes: number
    parabola_fit_last_delta: number
    parabola_fit_next_delta: number
    parabola_fit_a0: number
    parabola_fit_a1: number
    parabola_fit_a2: number
    bg_acceleration: number
}
export type IobDataValue = {
    iob: number;
    basaliob: number;
    bolussnooze: number;
    activity: number;
    lastBolusTime: number;
    time: Date;
    iobWithZeroTemp?: IobDataValue;
}
export type IobData = IobDataValue[];

export type CurrentTemp = {
    temp: string;
    duration: number;
    rate: number;
    minutesrunning: number;
}

export type MealData = {
    carbs: number;
    mealCOB: number;
    slopeFromMaxDeviation: number;
    slopeFromMinDeviation: number;
    lastBolusTime: number;
    lastCarbTime: number;
}
export type AutoSensData = {
    ratio: number;
}

export type DetermineBasalResult = {
    temp: string;
    bg: number;
    tick: string;
    eventualBG: number;
    targetBG: number;
    insulinReq: number;
    deliverAt: Date;
    sensitivityRatio: number;
    variable_sens: number;
    predBGs: PredBGs;
    COB: number;
    IOB: number;
    reason: string;
    autoISF_msg: string;
    units?: number;
}
export type DetermineBasalResultWithTime = DetermineBasalResult & {
    currentTime: Date;
    is_mgdl: boolean;
}

export type PredBGs = {
    IOB: number[];
    ZT: number[];
    UAM?: number[];
}
export type DetermineBasalData =
    {
        glucoseStatus: GlucoseStatus;
        iobData: IobData;
        currentTemp: CurrentTemp;
        profile: AutoISFProfile;
        mealData: MealData;
        autosensData: AutoSensData;
        reservoirData: number | undefined;
        microBolusAllowed: boolean;
        smbAlwaysAllowed: boolean;
        currentTime: number;
        flatBGsDetected: boolean;
    }
export type BolusData = {
    id: number;
    timestamp: number;
    amount: number;
    type: string;
    isBasalInsulin: boolean;
}
export type ChartData = {
    results: DetermineBasalResultWithTime[];
    bolusData: BolusData[];
    bgUnits: BgUnits;
    chart:echarts.EChartsType;
    aapsState: AapsStateManager;
}
export type BgUnits = "mmol/L" | "mg/dL";
