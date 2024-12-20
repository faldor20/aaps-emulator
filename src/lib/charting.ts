import { init, use } from 'echarts/core'
import { BarChart, LineChart, ScatterChart } from 'echarts/charts'
import { GridComponent, TitleComponent, DatasetComponent, TooltipComponent, DataZoomComponent, AxisPointerComponent, LegendComponent, MarkPointComponent, GraphicComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

import type { GlucoseValue, DetermineBasalResult, DetermineBasalResultWithTime, BolusData, ChartData, EmulationResult } from './types.ts';
import type { ECMouseEvent } from './charts/events.ts';
import type { DatasetOption, EChartsOption, EChartsType, SeriesOption } from 'echarts/types/dist/shared';
import { overriddenStep, results, steps } from './mainState';
import * as prediction from './charting/prediction';
// now with tree-shaking
use([GraphicComponent, GridComponent, CanvasRenderer, TitleComponent, LineChart, DatasetComponent, TooltipComponent, DataZoomComponent, AxisPointerComponent, LegendComponent, ScatterChart, MarkPointComponent])

let options: EChartsOption & { series?: SeriesOption[], dataset?: DatasetOption[] };

let chartResultData = []

const predictions: prediction.Predictions = {};

function makeLabelwithStalk(label: string, width: number, stalkLength: number) {
    const stalk = '|\n'.padStart(width/2-1,' ').repeat(stalkLength);
    return `${stalk}${label}`;
}
function setAdjustedSmbs(chart:EChartsType,results: readonly EmulationResult[]) {
    const smb_data = results.filter(b => (b.emulated?.units??0)>0).map(b => ({ time: b.emulated?.deliverAt.toISOString(), units: b.emulated?.units }));
    console.log("adjusted smb_data",smb_data);
    chart.setOption({
        dataset: [
            {
                dimensions: ['time', { name: 'units', type: 'number' }],
                id: "adjusted-smb-data",
                source: smb_data
            }
        ],
        series: [
            {
                id: "adjusted-smb-data",
                name: 'Adjusted SMB',
                type: 'scatter',
                symbol: 'triangle',
                color: 'lightblue',
                symbolSize: function (data:any) {
                    return Math.min(20, 5 + data.units * 20); // Scale between 5 and 20
                },
                encode: {
                    x: 'time',
                    y: 'units',
                },
                yAxisId: 'units',
                datasetId: "adjusted-smb-data",
                label: {
                    show: true,
                    formatter: makeLabelwithStalk('{@units} U', 10, 12),
                    position: 'below',
                    color: '#29a674',

                    
                }
            }
        ]
    });
}
export function main_chart(chartData: ChartData) {

    const options_ret = main_chart_options(chartData);
    const { chart } = chartData;
    results.listen((results:readonly EmulationResult[]) => {
        const dataset = resultDataSource(results);
        chart.setOption({ dataset: [dataset] });
        prediction.updatePredictions(predictions, chart, results.map(r=>r.emulated??r.og), new Date());
      
        setAdjustedSmbs(chart,results);
    });
    return {
        options: options_ret,
        
        onclick: ({ detail }: CustomEvent<ECMouseEvent>) => {
            if (chart) {
                console.log("onclick", detail);
                let time=null;
                if (detail?.componentType==="markPoint"){
                    //@ts-ignore
                    time=detail?.data?.coord[0];
                }
                else{
                    //@ts-ignore
                    time=detail?.value?.time;
                }
                if (time){
                //@ts-ignore
                const date = new Date(time);
                const dateunix = date.getTime();
                if (predictions[dateunix]) {
                    prediction.removePrediction(predictions, chart, dateunix);
                }
                else {
                    prediction.setPrediction(predictions, chart, chartData.results.map(r=>r.emulated??r.og), date);
                }
            }
            }

        }
    };
}


export function resultDataSource(results: readonly EmulationResult[]): DatasetOption {
    chartResultData = results.map(r => ({ time: r.og.currentTime.toISOString(), bg: r.og.bg, iob: r.og.IOB, emulated_iob: r.emulated?.IOB, activity:r.emulated?.activity, target: r.og.targetBG, variable_sens: r.og.variable_sens, reason: r.og.reason, eventualBG: r.og.eventualBG }));

    return {

        dimensions: ['time', { name: 'bg', type: 'number' }, { name: 'iob', type: 'number' }, { name: 'emulated_iob', type: 'number' }, { name: 'activity', type: 'number' },{ name: 'target', type: 'number' }, { name: 'variable_sens', type: 'number' }, { name: 'eventualBG', type: 'number' }],
        source: chartResultData,
        id: "result-data",

    };
}
let drag_position = { time: 0, bg: 0 };


export function main_chart_options({ results, bolusData, is_mg_dl, chart }: ChartData): EChartsOption {


    const bolus_data = bolusData.filter(b => b.type !== "SMB").map(b => ({ time: new Date(b.timestamp).toISOString(), units: b.amount }));
    const smb_data = bolusData.filter(b => b.type === "SMB").map(b => ({ time: new Date(b.timestamp).toISOString(), units: b.amount }));
    const bg_units=is_mg_dl? "mg/dL": "mmol/L";

    let max_bg= 0; 
    let max_iob= 0; 
    // biome-ignore lint/complexity/noForEach: <explanation>
    results.forEach(v=>{
        const  result=v.emulated ?? v.og;
        max_bg = (result).bg > max_bg ? (result).bg : max_bg;
        max_iob = (result).IOB > max_iob ? (result).IOB : max_iob ;
    } );

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
            resultDataSource(results),
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
            name: bg_units,
            min: 0,
            max: max_bg*1.3,

            position: 'left',
            axisLabel: {
                formatter: `{value} ${bg_units}`
            }
        },
        {
            type: 'value',
            name: 'U',
            position: 'right',
            min: -1.5,
            max: max_iob*1.3,
            axisLabel: {
                formatter: '{value} U'
            },
            id: 'units'
        },
        {
            type: 'value',
            name: 'Activity',
            position: 'right',
            min: 0,
            max: 0.15,
            axisLabel: {
                formatter: '{value} Activity'
            },
            id: 'activity'
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
                name: 'Emulated IOB',
                id: "emulated-iob-data",
                type: 'line',
                color: 'blue',
                encode: {
                    x: 'time',
                    y: 'emulated_iob',
                },
                yAxisId: 'units',
                datasetId: "result-data",
                symbol: 'none',
                smooth: true,
                lineStyle: {
                    type: 'dotted'
                }
            },
            {name:"Insulin activity",
            type:'line',
            symbol:'none',
            color:'orange',
            encode:{
                x:'time',
                y:'activity',
            },
            yAxisId:'activity',
            datasetId:"result-data",
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
                z: 100,
                label: {
                 
                    show: true,
                    formatter: makeLabelwithStalk('{@units} U',5,6),
                    position: 'bottom',
                    color: 'blue'

                }
            }

        ],
        dataZoom: [
            {
                type: 'slider',
                start: 0,
                end: 100,
                handleStyle: {
                    color: 'blue'
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
                        return (Math.abs(curr.og.currentTime.getTime() - time) < Math.abs(prev.og.currentTime.getTime() - time) ? curr : prev);
                    });

                    const [x2, y2] = chart.convertToPixel({ seriesId: "bg-data" }, [closest.og.currentTime, -1]);
                    //@ts-ignore
                    this.x = x2;
                    //@ts-ignore
                    this.y = y2;
                    drag_position.time = closest.og.currentTime.getTime();
                    drag_position.bg = -1;

                    console.log(time);
                },
                ondragend: function (this, e) {

                    updateDragPosition(chart);
                    
                    const x=e.offsetX;
                    const y=e.offsetY;

                    const [time, bg] = chart.convertFromPixel({ seriesId: "bg-data" }, [x, y]);

                    const closest = results.reduce((prev, curr) => {
                        return (Math.abs(curr.og.currentTime.getTime() - time) < Math.abs(prev.og.currentTime.getTime() - time) ? curr : prev);
                    });
                    const closestTime = closest.og.currentTime.getTime();
                    const closestStep = steps.get().reduce((prev, curr) => {
                        return ((curr.currentTime - closestTime) < Math.abs(prev.currentTime - closestTime) ? curr : prev);
                    });
                    overriddenStep.set(closestStep);
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
