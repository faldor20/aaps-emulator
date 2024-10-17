<script lang="ts">

    import { main_chart } from "$lib/charting";
    import Chart from "$lib/charts/Chart.svelte";
    import { init } from "echarts/core";
    import { onMount } from "svelte";
    import type { ECMouseEvent } from "$lib/charts/events";
    import type { EChartsType } from "echarts";
    import DataEditor from "$lib/dataEditor.svelte";
  
    import { overriddenStep,profileOverride, profileOverrideConfig, results,bolusData, is_mg_dl } from "./mainState";
  
    import * as nano from "nanostores";
    let chartOptions: any = $state({});
    let onclick: ( event: CustomEvent<ECMouseEvent>) => void;
    let myChart: EChartsType|undefined=$state(undefined);

    let showDataEditor= nano.computed([overriddenStep,profileOverride],
    (overriddenStep,profileOverride)=>overriddenStep&&profileOverride!==undefined);
  
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
        let opts=main_chart({ results: results.get(), bolusData: bolusData.get(), chart: inited, is_mg_dl: is_mg_dl.get() });
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
    {#if showDataEditor && $profileOverride}
      <DataEditor profile={$profileOverride} onDataSaved={(profile)=>{
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
    display: flex;
  }
  .chart{
    width: 80vw;

  }
</style>
