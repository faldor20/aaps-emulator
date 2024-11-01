<script lang="ts">
    import type { InsulinConfig, Preset } from "$lib/types";
    import { onMount } from "svelte";
    import { Button, Slider,Folder,List,Checkbox, type ListChangeEvent } from 'svelte-tweakpane-ui';
    import { insulinConfigDB } from "./indexDB/indexDB";
 
    let {insulinConfig=$bindable()}:{insulinConfig:InsulinConfig} = $props();

    let preset= $state<Preset>("ultra-rapid/fiasp");
    function handlePresetChange(e:ListChangeEvent){
        switch(e.detail.value){
            case "lyumjev":
                insulinConfig.dia=7;
                insulinConfig.peak=45;
                insulinConfig.curve="ultra-rapid";
                insulinConfig.useCustomPeakTime=true;
                insulinConfig.insulinPeakTime=45;
                break;
            case "ultra-rapid/fiasp":
                insulinConfig.dia=9;
                insulinConfig.peak=55;
                insulinConfig.curve="ultra-rapid";
                insulinConfig.useCustomPeakTime=false;
                insulinConfig.insulinPeakTime=55;
                break;
            case "rapid/novolog/humalog":
                insulinConfig.dia=9;
                insulinConfig.peak=75;
                insulinConfig.curve="rapid-acting";
                insulinConfig.useCustomPeakTime=false;
                insulinConfig.insulinPeakTime=75;
                break;
        }
    }
    let customFolderDisabled = $derived(preset!="custom");
    let mounted=false;
    $effect(()=>{
        if((insulinConfig&&preset) && mounted){
            console.log("saving insulin config",insulinConfig);
            insulinConfigDB.currentConfig.put({ insulinConfig:$state.snapshot(insulinConfig),preset:$state.snapshot(preset),id:"current"}).catch((e)=>{
                console.error("Error saving insulin config",e);
            }).then(()=>{
                insulinConfigDB.currentConfig.get("current").then((config)=>{
                    console.log("saved insulin config ",config);
                });
                
            });
            
        }
    })
    onMount(async () => {
        const config = await insulinConfigDB.currentConfig.get("current");
        console.log("got saved insulin config",config);
        insulinConfig = config?.insulinConfig??insulinConfig;
        preset = config?.preset??preset;
        handlePresetChange(new CustomEvent("change",{detail: {value: preset,origin:"external"}}));
        mounted=true;
    });
</script>

<div class="startup-settings">
    <h2>Insulin Config</h2>
    <Folder title="Insulin Config">
        <Slider label="Dia" min={5} max={14} step={1} bind:value={insulinConfig.dia} />
        <List bind:value={preset} label="presets" options={["lyumjev","ultra-rapid/fiasp","rapid/novolog/humalog", "custom"]} on:change={handlePresetChange} />
        <Folder title="Custom" disabled={customFolderDisabled} expanded={!customFolderDisabled}>
            <Slider label="Peak" min={20} max={80} step={1} bind:value={insulinConfig.peak} />
            <List label="Curve" options={["rapid-acting","ultra-rapid"]} bind:value={insulinConfig.curve} />
            <Checkbox label="Use Custom Peak Time" bind:value={insulinConfig.useCustomPeakTime} />
            <Slider label="Insulin Peak Time" min={20} max={80} step={1} bind:value={insulinConfig.insulinPeakTime} />
        </Folder>
    </Folder>

</div>

<style>
.startup-settings{
    max-width: 20em;
}

</style>