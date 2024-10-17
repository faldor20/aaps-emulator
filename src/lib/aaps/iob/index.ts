import {generate as generateJs} from './index.js';


type Inputs = {
    clock: Date;
    history: any[];
    history24: any[];
    profile: any;
    autosens: any;
}

/**
 * History must be in reverse chronological order or it will not work
 */
export function generate(inputs:Inputs, currentIOBOnly:boolean, treatments:any=null){
    if (treatments!==undefined&&treatments.length===0){
        throw new Error("treatments is empty, that would cause the calculation to always just return 0");
    }
    return generateJs(inputs, currentIOBOnly, treatments);
}

