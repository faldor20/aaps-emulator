
/**
 * @typedef {Object} Inputs
 * @property {string|number|Date} clock - The current date and time
 * @property {InputTreatment[]} history - The full history of treatments and events
 * @property {InputTreatment[]} history24 - The history of treatments and events for the last 24 hours
 * @property {Profile} profile - The user's profile settings
 * @property {any} autosens - Autosens data, if available
 */


/**
 * @typedef {Object} Profile
 * @property {number} dia - The duration of insulin action in hours
 * @property {number} peak - The time of peak insulin action in minutes
 * @property {boolean} useCustomPeakTime - Whether to use a custom peak time
 * @property {number} insulinPeakTime - The custom peak time in minutes
 * @property {string} curve - The type of insulin action curve
 * @property {BasalRate} basalprofile 
 */

/**
 * @typedef {Object }BasalRate
 * @property {number}minutes
 * @property {number} rate
 */

/**
 * @typedef {Object} Autosens
 * @property {number} value - The autosensitivity value
 * @property {number} timestamp - The timestamp of the autosensitivity value
 */


/**
 * @typedef {Object} IOB
 * @property {number} activity - The amount of insulin activity
 * @property {number} iob - The amount of insulin on board
 */


/**
 * @typedef {Object} IOBResult
 * @property {number} activity - The amount of insulin activity
 * @property {number} iob - The amount of insulin on board
 */

/**
 * @typedef {Object} PumpEvent
 * @property {"PumpSuspend"|"PumpResume"} _type
 * @property {number} timestamp
 * @property {Date} started_at
 * @property {number} date
 */

/**
 * 
 * @typedef {Object} TempBasal
 * @property {"TempBasal"} _type
 * @property {"percent"|"absolute"} temp
 * @property {number} rate
 * @property {Date} timestamp
 * @property {Date} started_at
 * @property {number} date
 * @property {number} duration
 */

/** 
 * @typedef {Object} TempBolus 
 * @property {"Bolus"} _type
 * @property {number} insulin
 * @property {Date} date
 * @property {Date} created_at
 */

/** @typedef {PumpEvent|TempBasal|TempBolus} InputTreatment */

/**
 * @typedef {Object} OutputTempBasal
 * @property {number} duration
 * @property {number} rate
 * @property {Date} timestamp
 * @property {Date} started_at
 * @property {number} date
 */

/**
 * @typedef {Object} OutputTempBolus
 * @property {number} insulin
 * @property {Date} date
 * @property {Date} created_at
 */

/**
 * @typedef {OutputTempBasal|OutputTempBolus} Treatment 
*/