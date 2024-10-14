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
	let startIndex = 0;

	while (true) {
		startIndex = logContent.indexOf(startSequence, startIndex);
		if (startIndex === -1) break;

		const endIndex = logContent.indexOf(startSequence, startIndex + 1);
		const relevantContent = endIndex !== -1
			? logContent.slice(startIndex, endIndex)
			: logContent.slice(startIndex);

		startIndex += startSequence.length;

		const lines = relevantContent.split('\n');

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

		const extractGlucoseStatus = (line: string) => JSON.parse(line.split('Glucose status:')[1].trim());
		const extractIobData = (line: string) => JSON.parse(line.split('IOB data:')[1].trim());
		const extractCurrentTemp = (line: string) => JSON.parse(line.split('Current temp:')[1].trim());
		const extractProfile = (line: string) => JSON.parse(line.split('Profile:')[1].trim());
		const extractMealData = (line: string) => JSON.parse(line.split('Meal data:')[1].trim());
		const extractAutosensData = (line: string) => JSON.parse(line.split('Autosens data:')[1].trim());
		const extractReservoirData = (line: string) => {
			const data = line.split('Reservoir data:')[1].trim();
			return data !== 'undefined' ? Number.parseFloat(data) : undefined;
		};
		const extractMicroBolusAllowed = (line: string) => line.split('MicroBolusAllowed:')[1].trim() === 'true';
		const extractSmbAlwaysAllowed = (line: string) => line.split('SMBAlwaysAllowed:')[1].trim() === 'true';
		const extractCurrentTime = (line: string) => Number.parseInt(line.split('CurrentTime:')[1].trim(), 10);
		const extractFlatBGsDetected = (line: string) => line.split('flatBGsDetected:')[1].trim() === 'true';

		if (lines[1]) result.glucoseStatus = extractGlucoseStatus(lines[1]);
		if (lines[2]) result.iobData = extractIobData(lines[2]);
		if (lines[3]) result.currentTemp = extractCurrentTemp(lines[3]);
		if (lines[4]) result.profile = extractProfile(lines[4]);
		if (lines[5]) result.mealData = extractMealData(lines[5]);
		if (lines[6]) result.autosensData = extractAutosensData(lines[6]);
		if (lines[7]) result.reservoirData = extractReservoirData(lines[7]);
		if (lines[8]) result.microBolusAllowed = extractMicroBolusAllowed(lines[8]);
		if (lines[9]) result.smbAlwaysAllowed = extractSmbAlwaysAllowed(lines[9]);
		if (lines[10]) result.currentTime = extractCurrentTime(lines[10]);
		if (lines[11]) result.flatBGsDetected = extractFlatBGsDetected(lines[11]);

		results.push(result);
		startIndex += startSequence.length;
	}

	return results;
}