/**
 * Rounds a basal rate to the nearest increment supported by the insulin pump.
 * 
 * @param {number} basal - The basal rate to round, in units per hour.
 * @param {Object} [profile] - Optional profile object containing pump model information.
 * @param {string} [profile.model] - The pump model string, if available.
 * @returns {number} The rounded basal rate.
 */
function round_basal(basal, profile) {

    /* x23 and x54 pumps change basal increment depending on how much basal is being delivered:
            0.025u for 0.025 < x < 0.975
            0.05u for 1 < x < 9.95
            0.1u for 10 < x
      To round numbers nicely for the pump, use a scale factor of (1 / increment). */

    let lowest_rate_scale = 20;

    // Has profile even been passed in?
    if (typeof profile !== 'undefined')
    {
        // Make sure optional model has been set
        if (typeof profile.model === 'string')
        {
            if (profile.model.endsWith("54") || profile.model.endsWith("23"))
            {
                lowest_rate_scale = 40;
            }
        }
    }

    let rounded_basal = basal;
    // Shouldn't need to check against 0 as pumps can't deliver negative basal anyway?
    if (basal < 1)
    {
        rounded_basal = Math.round(basal * lowest_rate_scale) / lowest_rate_scale;
    }
    else if (basal < 10)
    {
        rounded_basal = Math.round(basal * 20) / 20;
    }
    else
    {
        rounded_basal = Math.round(basal * 10) / 10;
    }

    return rounded_basal;
}

export default round_basal;