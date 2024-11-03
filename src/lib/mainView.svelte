<script lang="ts">

    import { main_chart } from "$lib/charting";
    import Chart from "$lib/charts/Chart.svelte";
    import { init } from "echarts/core";
    import { onMount } from "svelte";
    import type { ECMouseEvent } from "$lib/charts/events";
    import type { EChartsType } from "echarts";
    import DataEditor from "$lib/dataEditor.svelte";
  
    import { overriddenStep, profileOverrideConfig, results,bolusData, is_mg_dl } from "./mainState";
  
    import * as nano from "nanostores";
    let chartOptions: any = $state({});
    let onclick: ( event: CustomEvent<ECMouseEvent>) => void;
    let myChart: EChartsType|undefined=$state(undefined);

    let showDataEditor= nano.computed([overriddenStep,profileOverrideConfig],
    (overriddenStep,profileOverrideConfig)=>overriddenStep&&profileOverrideConfig!==undefined);
  
    onMount(async () => {
      
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
        let opts=main_chart({ results: results.get(), bolusData: bolusData.get(), chart: myChart, is_mg_dl: is_mg_dl.get() });
        chartOptions=opts.options;
        onclick=opts.onclick;
        inited.setOption(opts.options);
        return inited;
        }
      }
      options={chartOptions}
      on:click={(event) => onclick( event)}
      on:mousedown={(event) => console.log("mousedown:", event)}
    />
    </div>
    {#if showDataEditor && $overriddenStep}
      <DataEditor profile={($overriddenStep).profile} onDataSaved={(profile)=>{
        console.log("altered profile saved",profile);
        profileOverrideConfig.set(profile);
      }} />
    {/if}
  </div>

<style>
  .main-view {

    width: 100%;
    height: 100%;
    overflow: visible;
    flex-direction: row;
    flex-wrap: wrap;
    display: flex;
  }
  .chart{
    flex:1;
    min-width: 75%;
    max-width: 100%;
    min-height: 90%;

  }
</style>
