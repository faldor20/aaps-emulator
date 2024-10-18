import type { GlucoseValue, AutoISFProfile, GlucoseStatus, IobData, CurrentTemp, MealData, AutoSensData, DetermineBasalData, BolusData } from "./types";
export function parseLogLine(logLine: string): GlucoseValue | null {
	const regex =
		/GlucoseValue\(.*timestamp=(\d+).*value=(\d+\.\d+).*noise=(\d+\.\d+)/;
	const match = logLine.match(regex);

	if (match) {
		const [, timestamp, value, noise] = match;
		return {
			timestamp: new Date(parseInt(timestamp, 10))
				.toISOString()
				.slice(0, 19)
				.replace("T", " "),
			value: parseFloat(value) / 18.018, // Convert mg/dL to mmol/L
			noise: parseFloat(noise),
		};
	}

	return null;
}

export function parseLog(log: string) {
	const lines = log.split("\n");
	const glucoseValues = lines
		.map((line) => parseLogLine(line))
		.filter((value) => value !== null);
	return glucoseValues;
}

export function parseBolusData(logContent: string): BolusData[] {
    const results: BolusData[] = [];
    const lines = logContent.split('\n');
    
    for (const line of lines) {
        if (line.length<800 && line.length>200&&line.includes('PumpSyncImplementation.syncBolusWithPumpId') && line.includes('Inserted Bolus')) {
            const bolusMatch = line.match(/Bolus\((.*)\)/);
            if (bolusMatch) {
                const bolusData = bolusMatch[1].split(', ').reduce((acc, pair) => {
                    const [key, value] = pair.split('=');
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, string>);
				if (bolusData.amount&&bolusData.timestamp) {
                results.push({
                    id: parseInt(bolusData.id),
                    timestamp: parseInt(bolusData.timestamp),
                    amount: parseFloat(bolusData.amount),
                    type: bolusData.type,
                    isBasalInsulin: bolusData.isBasalInsulin === 'true'
                });
			}
            }
        }
    }
    
    return results;
}
export function parseDetermineBasalData(logContent: string): DetermineBasalData[] {
	const results: DetermineBasalData[] = [];
	const startSequence = '>>> Invoking determine_basal <<<';
	const lines = logContent.split('\n');
	let idx= 0;
try{
	while (idx<lines.length) {
		const line= lines[idx];
		const hasStart=line.includes(startSequence);
		if(!hasStart){
			idx++;
			continue;
		}

		const result = {
			glucoseStatus: {} as GlucoseStatus,
			iobData: [] as IobData,
			currentTemp: {} as CurrentTemp,
			profile: {} as AutoISFProfile,
			mealData: {} as MealData,
			autosensData: {} as AutoSensData,
			reservoirData: undefined as number | undefined,
			microBolusAllowed: false,
			smbAlwaysAllowed: false,
			currentTime: 0,
			flatBGsDetected: false,
		};
		function parser ( prefix:string){
			return ()=>{
			while(idx<lines.length){
				const parts=lines[idx].split(prefix);
				idx++;
				if(parts.length>2  ){
					throw Error(`this line isn't parsing correctly, saw more than two parts when split on ${prefix}\nline:${line}`)
				}
				if (parts.length<2){
					continue;
				}
				return parts[1].trim()
			}
				throw Error("out of lines");	
			}
			}
			function jsonParser(prefix:string){
			const parse=parser(prefix) ;
				return ()=>
				JSON.parse(parse());
			}
			

		const extractGlucoseStatus =jsonParser('Glucose status:');
		const extractIobData =jsonParser('IOB data:')
		const extractCurrentTemp =jsonParser('Current temp:')
		const extractProfile =jsonParser('Profile:')
		const extractMealData =jsonParser('Meal data:')
		const extractAutosensData =jsonParser('Autosens data:')
		const extractReservoirData = () => {
			const parse=parser('Reservoir data:');
			const data=parse()
			return data !== 'undefined' ? Number.parseFloat(data) : undefined;
		};
		const extractMicroBolusAllowed =jsonParser('MicroBolusAllowed:');
		const extractSmbAlwaysAllowed =jsonParser('SMBAlwaysAllowed:');
		const extractCurrentTime = () => Number.parseInt(parser('CurrentTime:')(), 10);
		const extractFlatBGsDetected =jsonParser('flatBGsDetected:');

		result.glucoseStatus = extractGlucoseStatus();
		result.iobData = extractIobData();
		result.currentTemp = extractCurrentTemp();
		result.profile = extractProfile();
		result.mealData = extractMealData();
		result.autosensData = extractAutosensData();
		result.reservoirData = extractReservoirData();
		result.microBolusAllowed = extractMicroBolusAllowed();
		result.smbAlwaysAllowed = extractSmbAlwaysAllowed();
		result.currentTime = extractCurrentTime();
		result.flatBGsDetected = extractFlatBGsDetected();

		results.push(result);
		
	}


	return results;
	}
	catch(e:any){
		if(e?.message ==="out of lines"){
			return results;
		}
		throw e;
		
	}
}

//TODO: parse temp basals and boluses to get treatments for calculating iob
