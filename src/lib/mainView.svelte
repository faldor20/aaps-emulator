<script lang="ts">

    import { main_chart } from "$lib/charting";
    import Chart from "$lib/charts/Chart.svelte";
    import { init } from "echarts/core";
    import { onMount } from "svelte";
    import type { ECMouseEvent } from "$lib/charts/events";
    import type { EChartsType } from "echarts";
    import DataEditor from "$lib/dataEditor.svelte";
    import type { AapsStateManager } from "$lib/mainState.svelte";
    import type { DetermineBasalResultWithTime } from "./types";
  
    const {aapsState}: {aapsState:AapsStateManager} = $props();
    
    let chartOptions: any = $state({});
    let onclick: ( event: CustomEvent<ECMouseEvent>) => void;
    let onNewResults: (results: DetermineBasalResultWithTime[]) => void=()=>{};
    let myChart: EChartsType|undefined=$state(undefined);
    let showDataEditor= $derived.by(
      ()=>aapsState.overriddenStep&&aapsState.profileOverride!==undefined);
  
    onMount(async () => {
      
    });
    $effect(() => {
      $inspect(aapsState.profileOverride);
      $inspect(aapsState.results);
    // myChart?.setOption({dataset:[resultDataSource(aapsState.results)]});
    onNewResults(aapsState.results);
  });
  </script>

  
  <div class="main-view">
    <div class="chart">
    <Chart 
      bind:chart={myChart}  
      init={(element,theme,initOptions)=>{
        const inited=init(element,theme);
        //TODO: fix this
        //@ts-ignore
        myChart=inited;
        let opts=main_chart({ results: aapsState.results, bolusData: aapsState.bolusData, bgUnits: aapsState.bgUnits, chart:myChart as EChartsType,aapsState });
        chartOptions=opts.options;
        onclick=opts.onclick;
        inited.setOption(opts.options);
        onNewResults=opts.onNewResults;
        return inited;
        }
      }
      options={chartOptions}
      on:click={(event) => onclick( event)}
      on:mousedown={(event) => console.log("mousedown:", event)}
    />
    </div>
    {#if showDataEditor && aapsState.profileOverride}
      <DataEditor profile={aapsState.profileOverride} onDataSaved={(profile)=>{
        aapsState.profileOverrideConfig=profile;
      }} />
    {/if}
  </div>

<style>
  .main-view {

    width: 100%;
    height: 100%;
    overflow: visible;
    flex-direction: row;
    display: flex;
  }
  .chart{
    width: 80vw;

  }
</style>