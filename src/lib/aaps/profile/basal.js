'use strict';

/* Return basal rate(U / hr) at the provided timeOfDay */
export function basalLookup (schedules, now) {

    var nowDate = now;

    if (typeof(now) === 'undefined') {
      nowDate = new Date();
    }

    var basalprofile_data = schedules.sort((a, b) => a.i - b.i);
    var basalRate = basalprofile_data[basalprofile_data.length-1].rate
    if (basalRate === 0) {
        // TODO - shared node - move this print to shared object.
        console.error("ERROR: bad basal schedule",schedules);
        return;
    }
    var nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

    for (var i = 0; i < basalprofile_data.length - 1; i++) {
        if ((nowMinutes >= basalprofile_data[i].minutes) && (nowMinutes < basalprofile_data[i + 1].minutes)) {
            basalRate = basalprofile_data[i].rate;
            break;
        }
    }
    return Math.round(basalRate*1000)/1000;
}


export function maxDailyBasal (inputs) {
    var maxRate = inputs.basals.reduce((max, current) => Number(current.rate) > Number(max.rate) ? current : max);
    return (Number(maxRate.rate) *1000)/1000;
}

/*Return maximum daily basal rate(U / hr) from profile.basals */

export function maxBasalLookup (inputs) {
    return inputs.settings.maxBasal;
}
