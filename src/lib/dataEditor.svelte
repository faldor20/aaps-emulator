<script lang="ts">

    import { Button, Slider,Folder } from 'svelte-tweakpane-ui';
    import { overrideProfileInit, type AutoISFProfile, type OverrideProfile } from './types';
    let {profile,onDataSaved}:{profile:AutoISFProfile,onDataSaved:(profile:OverrideProfile)=>void} = $props();
    
    let profileState:OverrideProfile=$state(overrideProfileInit(profile));

    let debounceTimer: number | undefined;

    $effect(() => {
        const currentProfileState = $state.snapshot(profileState);
        
        clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(() => {
            onDataSaved(currentProfileState);
        }, 500);

        return () => {
            clearTimeout(debounceTimer);
        };
    });
</script>
  
<div class="data-editor">
    <Button title="Reset settings" on:click={()=>{
        console.log("clicked reset settings");
        profileState= overrideProfileInit(profile);
    }} />
<!--TODO: make a way for this to be undefined so that it won't override the profiel and we don't have to stop emulatino when the orgiinal value in the profile changes-->
<Slider label="BG Accel ISF Weight" min={0} max={1} bind:value={profileState.bgAccel_ISF_weight} />
<Slider label="PP ISF Weight" min={0} max={1} bind:value={profileState.pp_ISF_weight} />

<Slider label="Lower ISF Range Weight" min={0} max={2} step={0.1} bind:value={profileState.lower_ISFrange_weight} />
<Slider label="Higher ISF Range Weight" min={0} max={2} step={0.1} bind:value={profileState.higher_ISFrange_weight} />

<Slider label="Dura isf weight" min={0} max={5} bind:value={profileState.dura_ISF_weight} />
<Folder title="SMB Settings">
<Slider label="SMB Delivery Ratio" min={0.1} max={1.0} step={0.1} bind:value={profileState.smb_delivery_ratio} />
<Slider label="SMB Delivery Ratio Min" min={0.1} max={1.0} step={0.1} bind:value={profileState.smb_delivery_ratio_min} />
<Slider label="SMB Delivery Ratio Max" min={0.5} max={1.0} step={0.1} bind:value={profileState.smb_delivery_ratio_max} />
<Slider label="SMB Delivery Rati`o BG Range" min={0.0} max={100} step={1} bind:value={profileState.smb_delivery_ratio_bg_range} />
<Slider label="SMB Max Range Extension" min={1.0} max={5.0} step={0.1} bind:value={profileState.smb_max_range_extension} />
</Folder >
<Slider label="Auto ISF max" min={0} max={5} bind:value={profileState.autoISF_max} />
<Slider label="Auto ISF min" min={0} max={1} bind:value={profileState.autoISF_min} />
<Slider 
    label="IOB Threshold Percent" 
    min={10} 
    max={100} 
    step={1} 
    bind:value={profileState.iob_threshold_percent} 
/>
<Folder title="Non Autoisf">
<Slider label="ISF" min={0} max={300} bind:value={profileState.sens} />

<!-- <Slider label="target" min={0} max={300} bind:value={profileState.target_bg} /> -->
</Folder>
<Button title="Recalculate" on:click={()=>{
    console.log("clicked recalculate");
    onDataSaved($state.snapshot(profileState));
}} />

</div>
<style>
</style>