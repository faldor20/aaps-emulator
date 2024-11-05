<script lang="ts">

    import { Button, Slider,Folder ,Separator} from 'svelte-tweakpane-ui';
    import { overrideProfileInit, type AutoISFProfile, type OverrideProfile, type OverrideProfileConfig } from './types';
    import ResetWrapper from './tweakpane/resetWrapper.svelte';
    let {profile,onDataSaved}:{profile:AutoISFProfile,onDataSaved:(profile:OverrideProfile)=>void} = $props();

    let profileState:OverrideProfileConfig=$state(overrideProfileInit(profile));

    let debounceTimer: number | undefined;

    function removeUnchangedFields(original: OverrideProfileConfig, modified: OverrideProfileConfig): OverrideProfile {
        const result: OverrideProfile = {};

        // Type-safe way to iterate over OverrideProfile keys
        (Object.keys(modified) as Array<keyof OverrideProfile>).forEach(key => {
            if (modified[key] !== original[key]) {
                result[key] = modified[key];
            }
        });

        // Cast partial result back to OverrideProfile
        return result ;
    }

    function handleOnDataSaved(){
        const currentProfileState = $state.snapshot(profileState);
        onDataSaved(removeUnchangedFields(profile,currentProfileState));
    }

    $effect(() => {
        const currentProfileState = $state.snapshot(profileState);

        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            handleOnDataSaved();
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
<ResetWrapper resetValue={()=>{ profileState.bgAccel_ISF_weight=profile.bgAccel_ISF_weight;}} >
<Slider label="BG Accel ISF Weight" min={0} max={1} step={0.01} bind:value={profileState.bgAccel_ISF_weight} />
</ResetWrapper>
<ResetWrapper resetValue={()=>{ profileState.bgBrake_ISF_weight=profile.bgBrake_ISF_weight;}} >
<Slider label="BG Brake ISF Weight" min={0} max={1} step={0.01} bind:value={profileState.bgBrake_ISF_weight} />
</ResetWrapper>
<ResetWrapper resetValue={()=>{ profileState.pp_ISF_weight=profile.pp_ISF_weight;}} >
<Slider label="PP ISF Weight" min={0} max={1} step={0.01} bind:value={profileState.pp_ISF_weight} />
</ResetWrapper>

<ResetWrapper resetValue={()=>{ profileState.lower_ISFrange_weight=profile.lower_ISFrange_weight;}} >
<Slider label="Lower ISF Range Weight" min={0} max={5} step={0.01}  bind:value={profileState.lower_ISFrange_weight} />
</ResetWrapper>

<ResetWrapper resetValue={()=>{ profileState.higher_ISFrange_weight=profile.higher_ISFrange_weight;}} >
<Slider label="Higher ISF Range Weight" min={0} max={5} step={0.01} bind:value={profileState.higher_ISFrange_weight} />
</ResetWrapper>
<ResetWrapper resetValue={()=>{ profileState.dura_ISF_weight=profile.dura_ISF_weight;}} >
<Slider label="Dura isf weight" min={0} max={5} step={0.01} bind:value={profileState.dura_ISF_weight} />
</ResetWrapper>

<Separator />

<ResetWrapper resetValue={()=>{ profileState.smb_delivery_ratio=profile.smb_delivery_ratio;}} >
    <Slider label="SMB Delivery Ratio" min={0.01} max={1.0} step={0.01} bind:value={profileState.smb_delivery_ratio} />
</ResetWrapper>
<ResetWrapper resetValue={()=>{ profileState.smb_delivery_ratio_min=profile.smb_delivery_ratio_min;}} >
    <Slider label="SMB Delivery Ratio Min" min={0.01} max={1.0} step={0.01} bind:value={profileState.smb_delivery_ratio_min} />
</ResetWrapper>
<ResetWrapper resetValue={()=>{ profileState.smb_delivery_ratio_max=profile.smb_delivery_ratio_max;}} >
    <Slider label="SMB Delivery Ratio Max" min={0.5} max={1.0} step={0.01} bind:value={profileState.smb_delivery_ratio_max} />
</ResetWrapper>
<ResetWrapper resetValue={()=>{ profileState.smb_delivery_ratio_bg_range=profile.smb_delivery_ratio_bg_range;}} >
        <Slider label="SMB Delivery Ratio BG Range" min={0.0} max={100} step={1} bind:value={profileState.smb_delivery_ratio_bg_range} />
</ResetWrapper>
<ResetWrapper resetValue={()=>{ profileState.smb_max_range_extension=profile.smb_max_range_extension;}} >
    <Slider label="SMB Max Range Extension" min={1.0} max={5.0} step={0.01} bind:value={profileState.smb_max_range_extension} />
</ResetWrapper>

<Separator />

<ResetWrapper resetValue={()=>{ profileState.autoISF_max=profile.autoISF_max;}} >
<Slider label="Auto ISF max" min={0} max={5} step={0.01} bind:value={profileState.autoISF_max} />
</ResetWrapper>
<ResetWrapper resetValue={()=>{ profileState.autoISF_min=profile.autoISF_min;}} >
<Slider label="Auto ISF min" min={0} max={1} step={0.01} bind:value={profileState.autoISF_min} />
</ResetWrapper>
<ResetWrapper resetValue={()=>{ profileState.iob_threshold_percent=profile.iob_threshold_percent;}} >
<Slider
    label="IOB Threshold Percent"
    min={10}
    max={100}
    step={0.1}
    bind:value={profileState.iob_threshold_percent}
/>
</ResetWrapper>

<Separator />

<ResetWrapper resetValue={()=>{ profileState.sens=profile.sens;}} >
<Slider label="ISF" min={0} max={300} bind:value={profileState.sens} />
</ResetWrapper>
<ResetWrapper resetValue={()=>{ profileState.target_bg=profile.target_bg;}} >
<Slider label="target" min={0} max={300} bind:value={profileState.target_bg} />
</ResetWrapper>

<Button title="Recalculate" on:click={()=>{
    console.log("clicked recalculate");
    handleOnDataSaved();
}} />

</div>
