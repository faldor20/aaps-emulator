import { init, use } from 'echarts/core'
import { BarChart, LineChart, ScatterChart } from 'echarts/charts'
import { GridComponent, TitleComponent, DatasetComponent, TooltipComponent, DataZoomComponent, AxisPointerComponent, LegendComponent, MarkPointComponent, GraphicComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption, EChartsType, SeriesOption } from 'echarts';
import type { GlucoseValue, DetermineBasalResult, DetermineBasalResultWithTime, BolusData, ChartData } from './types.ts';
import type { ECMouseEvent } from './charts/events.ts';
import type { DatasetOption } from 'echarts/types/dist/shared';

import * as prediction from './charting/prediction';
// now with tree-shaking
use([GraphicComponent, GridComponent, CanvasRenderer, TitleComponent, LineChart, DatasetComponent, TooltipComponent, DataZoomComponent, AxisPointerComponent, LegendComponent, ScatterChart, MarkPointComponent])

let options: EChartsOption & { series?: SeriesOption[], dataset?: DatasetOption[] };


let result_data: DetermineBasalResultWithTime[] = []
let chartResultData = []

let predictions: prediction.Predictions = {};

export function main_chart(chartData: ChartData) {
    result_data = chartData.results;
    const options_ret = main_chart_options(chartData);
    const { chart } = chartData;

    return {
        options: options_ret,
        onNewResults: (results: DetermineBasalResultWithTime[]) => {
            const dataset = resultDataSource(results);
            chart.setOption({ dataset: [dataset] });
            prediction.updatePredictions(predictions, chart, results, new Date());
        },
        onclick: ({ detail }: CustomEvent<ECMouseEvent>) => {
            if (chart) {
                //@ts-ignore
                const time = detail?.value?.time;
                const date = new Date(time);
                const dateunix = date.getTime();
                if (predictions[dateunix]) {
                    prediction.removePrediction(predictions, chart, dateunix);
                }
                else {
                    prediction.setPrediction(predictions, chart, result_data, date);
                }
            }

        }
    };
}


export function resultDataSource(results: DetermineBasalResultWithTime[]): DatasetOption {
    result_data = results;
    chartResultData = results.map(r => ({ time: r.currentTime.toISOString(), bg: r.bg, iob: r.IOB, target: r.targetBG, variable_sens: r.variable_sens, reason: r.reason, eventualBG: r.eventualBG }));

    return {

        dimensions: ['time', { name: 'bg', type: 'number' }, { name: 'iob', type: 'number' }, { name: 'target', type: 'number' }, { name: 'variable_sens', type: 'number' }, { name: 'eventualBG', type: 'number' }],
        source: chartResultData,
        id: "result-data",

    };
}
let drag_position = { time: null, bg: null };


export function main_chart_options({ results, bolusData, bgUnits, chart, aapsState }: ChartData): EChartsOption {


    const bolus_data = bolusData.filter(b => b.type !== "SMB").map(b => ({ time: new Date(b.timestamp).toISOString(), units: b.amount }));
    const smb_data = bolusData.filter(b => b.type === "SMB").map(b => ({ time: new Date(b.timestamp).toISOString(), units: b.amount }));

    chart.on('finished', () => window.dispatchEvent(new Event('echarts.finished')));
    //TOOD: THis is obviously a hack...
    let updateTimer: number | null = null;
    window.addEventListener('echarts.finished', () => {
        if (updateTimer !== null) {
            clearTimeout(updateTimer);
        }
        updateTimer = setTimeout(() => {
            updateDragPosition(chart);
            updateTimer = null;
        }, 500);
    });
    options = {

        animationDuration: 300,
        // animation:false,
        // animationDelay:100,
        dataset: [
            resultDataSource(result_data),
            {
                dimensions: ['time', { name: 'units', type: 'number' }],
                source: bolus_data,
                id: "bolus-data",
            },
            {
                dimensions: ['time', { name: 'units', type: 'number' }],
                source: smb_data,
                id: "smb-data",
            },

        ],
        title: {
            text: 'Blood Glucose and Predictions',
        },
        xAxis: [{
            type: 'time',
            name: 'Time',
            id: 'time-axis',
            // axisPointer: {
            //     // value: '2016-10-7',
            //     snap: true,

            //     triggerOn: 'mousemove',
            //     lineStyle: {
            //         color: '#7581BD',
            //         width: 2
            //     },

            //     // label: {
            //     //   show: true,
            //     //   formatter: function (params) {
            //     //     return echarts.format.formatTime('yyyy-MM-dd', params.value);
            //     //   },
            //     //   backgroundColor: '#7581BD'
            //     // },
            //     handle: {
            //         show: true,
            //         color: '#7581BD'
            //     }
            // },

        },],

        yAxis: [{
            type: 'value',
            name: bgUnits,
            min: 0,
            max: bgUnits === "mg/dL" ? 300 : 20,

            position: 'left',
            axisLabel: {
                formatter: '{value} ' + bgUnits
            }
        },
        {
            type: 'value',
            name: 'U',
            position: 'right',
            min: -2,
            max: 8,
            axisLabel: {
                formatter: '{value} U'
            },
            id: 'units'
        }
        ],

        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',

            },

        },
        legend: {},


        series: [
            {
                name: 'BG',
                type: 'line',
                color: 'green',
                encode: {
                    x: 'time',
                    y: 'bg',
                },
                symbolSize: 15,
                datasetId: "result-data",
                id: "bg-data",
            },
            {
                name: 'Eventual BG',
                type: 'scatter',
                color: 'orange',
                symbol: 'diamond',
                encode: {
                    x: 'time',
                    y: 'eventualBG',
                },

                symbolSize: 15,
                datasetId: "result-data",
                id: "eventualbg-data",
            },
            {
                name: 'IOB',
                id: "iob-data",
                type: 'line',
                color: 'blue',
                encode: {
                    x: 'time',
                    y: 'iob',
                },
                yAxisId: 'units',
                datasetId: "result-data",
                symbol: 'none',
                smooth: true
            },
            {
                name: 'Target',
                id: "target-data",
                type: 'line',
                color: 'lightgreen',
                encode: {
                    x: 'time',
                    y: 'target',
                },
                datasetId: "result-data",
                symbol: 'none'
            },


            {
                name: 'Bolus',
                type: 'scatter',
                symbol: 'square',
                symbolSize: function (data) {
                    const units = data.units;
                    return Math.min(20, 5 + units * 5); // Scale between 5 and 20
                },
                color: 'blue',
                encode: {
                    x: 'time',
                    y: 'units',
                },
                yAxisId: 'units',
                datasetId: "bolus-data",
                id: "bolus-data",
                label: {
                    show: true,
                    formatter: '{@units} U',
                    position: 'top'
                }
            },
            {
                name: 'SMB',
                type: 'scatter',
                symbol: 'triangle',
                symbolSize: function (data) {
                    const units = data.units;
                    return Math.min(20, 5 + units * 20); // Scale between 5 and 20
                },
                color: 'blue',
                encode: {
                    x: 'time',
                    y: 'units',
                },
                yAxisId: 'units',
                datasetId: "smb-data",
                id: "smb-data",
                label: {
                    show: true,
                    formatter: '{@units} U',
                    position: 'top'
                }
            }

        ],
        graphic: [
            {
                id: 'drag-handle',
                type: 'group',
                left: '10%',
                bottom: '1%',
                draggable: true,


                ondrag: function (this, e) {
                    let x = e.offsetX;
                    let y = e.offsetY;
                    const [time, bg] = chart.convertFromPixel({ seriesId: "bg-data" }, [x, y]);
                    const closest = results.reduce((prev, curr) => {
                        return (Math.abs(curr.currentTime.getTime() - time) < Math.abs(prev.currentTime.getTime() - time) ? curr : prev);
                    });

                    const [x2, y2] = chart.convertToPixel({ seriesId: "bg-data" }, [closest.currentTime, -1]);
                    //@ts-ignore
                    this.x = x2;
                    //@ts-ignore
                    this.y = y2;
                    drag_position.time = closest.currentTime.getTime();
                    drag_position.bg = -1;

                    console.log(time);
                },
                ondragend: function (this, e) {

                    updateDragPosition(chart);
                    
                    const x=e.offsetX;
                    const y=e.offsetY;

                    const [time, bg] = chart.convertFromPixel({ seriesId: "bg-data" }, [x, y]);

                    const closest = results.reduce((prev, curr) => {
                        return (Math.abs(curr.currentTime.getTime() - time) < Math.abs(prev.currentTime.getTime() - time) ? curr : prev);
                    });
                    const closestTime = closest.currentTime.getTime();
                    const closestStep = aapsState.steps.reduce((prev, curr) => {
                        return ((curr.currentTime - closestTime) < Math.abs(prev.currentTime - closestTime) ? curr : prev);
                    });
                    aapsState.overriddenStep = closestStep;
                },

                children: [
                    {

                        type: 'circle',
                        z: 100,
                        left: 'center',
                        top: 'middle',
                        shape: {
                            // cx: 20,
                            // cy: 30,
                            r: 10
                        },
                        style: {
                            fill: 'pink',
                            stroke: '#555',
                            lineWidth: 1,
                            shadowBlur: 8,
                            shadowOffsetX: 3,
                            shadowOffsetY: 3,
                            shadowColor: 'rgba(0,0,0,0.2)'
                        }
                    },
                    {
                        type: 'rect',
                        z: 100,
                        shape: {
                            height: 10000,
                            width: 1
                        },
                        style: {
                            stroke: 'pink',
                            lineWidth: 1,
                            fill: 'pink'

                        },
                        left: 'center',
                        bottom: '90%'

                    }


                ]
            }
        ]
    }
    return options;
}


function updateDragPosition(chart: EChartsType | undefined) {
    if (chart && drag_position.time && drag_position.bg) {
        console.log("updateDragPosition", drag_position.time, drag_position.bg);
        const res = chart.convertToPixel({ seriesId: "bg-data" }, [drag_position.time, drag_position.bg]);
        if (res) {
            const [x, y] = res;
            chart.setOption({
                graphic: [
                    {
                        id: 'drag-handle',
                        x,
                        y,
                        left: null,
                        bottom: null
                    }
                ]
            });
        }
    }
}