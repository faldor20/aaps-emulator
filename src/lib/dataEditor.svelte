<script lang="ts">
    import { Button, Slider } from 'svelte-tweakpane-ui';
    import type { AutoISFProfile } from './types';
    let {profile,onDataSaved}:{profile:AutoISFProfile,onDataSaved:(profile:AutoISFProfile)=>void} = $props();
    
    let profileState= $state($state.snapshot(profile));
    

</script>
  
<div>
<Slider label="BG Accel ISF Weight" min={0} max={1} bind:value={profileState.bgAccel_ISF_weight} />
<Slider label="BG brake ISF Weight" min={0} max={1} bind:value={profileState.bgBrake_ISF_weight} />
<Slider label="Dura isf weight" min={0} max={5} bind:value={profileState.dura_ISF_weight} />
<Slider label="ISF" min={0} max={300} bind:value={profileState.sens} />
<Slider label="Auto ISF max" min={0} max={5} bind:value={profileState.autoISF_max} />
<Slider label="Auto ISF min" min={0} max={1} bind:value={profileState.autoISF_min} />
<Slider label="target" min={0} max={300} bind:value={profileState.target_bg} />
<Button title="Recalculate" on:click={()=>{
    onDataSaved($state.snapshot(profileState));
}} />

</div>