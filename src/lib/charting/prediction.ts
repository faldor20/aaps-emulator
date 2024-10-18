import type { EChartsType, EChartsOption} from "echarts/types/dist/shared";
import type { DetermineBasalResultWithTime } from "../types.ts";
import type { DatasetOption,SeriesOption } from "echarts/types/dist/shared";

type PredictionData = {
    [x: string]: string | number,
    time: string
}
type PredictionDataObject = {
    iobData: PredictionData[],
    ztData: PredictionData[],
    uamData: PredictionData[],
    autoISF_msg: string,
    reason: string,
    startTime: Date,
    is_mg_dl: boolean
}
export type Predictions=Record<number,PredictionDataObject>

function predictionToData(name: string, values: number[], startTime: Date) {
    return values.map((value, index) => {
        const time = new Date(startTime.getTime() + index * 5 * 60000);
        return { time: time.toISOString(), [name]: value };
    });
}

function getPredictionData(results: readonly DetermineBasalResultWithTime[], startTime: Date): PredictionDataObject {
    startTime=new Date(startTime);
    const latestResults = results.find(r => r.currentTime.getTime() === startTime.getTime());
    const predBGs = latestResults?.predBGs;
    const minLength = Math.max(20, Math.min(predBGs?.IOB?.length ?? 0, predBGs?.ZT?.length ?? 0, predBGs?.UAM?.length ?? 0));
    const trimmedPredBGs = {
        IOB: predBGs?.IOB?.slice(0, minLength) ?? [],
        ZT: predBGs?.ZT?.slice(0, minLength) ?? [],
        UAM: predBGs?.UAM?.slice(0, minLength) ?? []
    };

    const iobData = predictionToData('bg_prediction_iob', trimmedPredBGs.IOB, startTime);
    const ztData = predictionToData('bg_prediction_zt', trimmedPredBGs.ZT, startTime);
    const uamData = predictionToData('bg_prediction_uam', trimmedPredBGs.UAM, startTime);
    const formattedReason = latestResults?.reason?.split(',')
        .reduce((acc:string[], item:string, index:number) => {
            acc.push(item.trim());
            if ((index + 1) % 5 === 0) acc.push('\n');
            return acc;
        }, [])
        .join(', ');
    return { iobData, ztData, uamData, reason: formattedReason??'', autoISF_msg: latestResults?.autoISF_msg ?? '', startTime,is_mg_dl:latestResults?.is_mg_dl ?? false };
}

function createPredictionData({ iobData, ztData, uamData, autoISF_msg, startTime,is_mg_dl,reason }: PredictionDataObject): EChartsOption {
    const dateUnix = startTime.getTime();
    return {
        dataset: [
            {
                dimensions: ['time', 'bg_prediction_iob'],
                id: dateUnix + "-pred-iob",
                source: iobData
            },
            {
                dimensions: ['time', 'bg_prediction_zt'],
                id: dateUnix + "-pred-zt",
                source: ztData
            },
            {
                dimensions: ['time', 'bg_prediction_uam'],
                id: dateUnix + "-pred-uam",
                source: uamData
            }
        ],

        series: [
            {
                name: 'IOB Prediction',
                id: dateUnix + "-pred-iob",
                datasetId: dateUnix + "-pred-iob",

                type: 'line',
                markPoint: {
                    data: [{
                        name: 'coordinate',
                        coord: [startTime.toISOString(), (is_mg_dl ? (startTime.getUTCMinutes() % 15 === 0 ? 200 : 150) : (startTime.getUTCMinutes() % 15 === 0 ? 16 : 12))]
                    },],
                    label: {
                        formatter: function (params) {
                            return autoISF_msg.trim() + "\n"+"-------------------------------"+ "\n" + reason.trim();
                        },
                        backgroundColor: 'rgb(242,242,242)',
                        borderColor: '#aaa',
                        borderWidth: 1,
                        borderRadius: 4,
                        padding: [4, 10],
                        lineHeight: 26,

                        position: 'top',
                        distance: 20,
                    },

                },

                color: 'lightblue',
                smooth: false,
                encode: {
                    x: 'time',
                    y: 'bg_prediction_iob',
                },
            },

            {
                name: 'ZT Prediction',

                type: 'line',
                smooth: false,
                id: dateUnix + "-pred-zt",
                datasetId: dateUnix + "-pred-zt",
                color: 'blue',
                encode: {
                    x: 'time',
                    y: 'bg_prediction_zt',
                },
            },
            {
                name: 'UAM Prediction',

                type: 'line',
                smooth: false,
                color: 'orange',
                id: dateUnix + "-pred-uam",
                datasetId: dateUnix + "-pred-uam",
                encode: {
                    x: 'time',
                    y: 'bg_prediction_uam',
                },
            }
        ]
    }

}

/**
 * Removes a prediction from the chart
 * @param chart 
 * @param predictionStartTime 
 */
export function removePrediction(predictions:Predictions, chart: EChartsType, predictionStartTime: number) {
    const options = chart.getOption() as EChartsOption;
    if (Array.isArray(options.dataset) && Array.isArray(options.series)) {

        options.dataset = options.dataset?.filter((d: DatasetOption) => !(d.id as string ?? "").startsWith(predictionStartTime.toString())) ?? [];
        //@ts-ignore
        options.series = options.series?.filter((s: SeriesOption) => !(s.datasetId as string ?? "").startsWith(predictionStartTime.toString())) ?? [];
        chart.setOption({ dataset: options.dataset, series: options.series }, {
            replaceMerge: ['series', 'dataset'],
        });
        delete predictions[predictionStartTime];
    }
}

/**
 * Sets a prediction on the chart overwriting any existing predictions
 * @param chart 
 * @param results 
 * @param startTime 
 */
export function setPrediction(predictions:Predictions,chart:EChartsType,results:readonly DetermineBasalResultWithTime[],startTime:Date){
    const prediction=getPredictionData(results,startTime);
    const predictionOptions=createPredictionData(prediction);
    chart.setOption(predictionOptions);
    predictions[startTime.getTime()]=prediction;
    console.log("set prediction:",prediction);
}

/**
 * Updates all predictions on the chart with new results
 * @param predictions 
 * @param chart 
 * @param results 
 * @param startTime 
 */
export function updatePredictions(predictions:Predictions,chart:EChartsType,results:readonly DetermineBasalResultWithTime[]){
    Object.values(predictions).forEach(p=>{
    setPrediction(predictions,chart,results,p.startTime);

    });
}
