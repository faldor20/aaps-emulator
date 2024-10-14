import * as charts from 'echarts';

export function echarts(node: HTMLElement, option: charts.EChartsOption) {
	const chart = charts.init(node);
	chart.setOption(option);
}