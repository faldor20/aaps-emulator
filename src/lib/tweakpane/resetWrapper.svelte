<script lang="ts">
    import type { Snippet } from "svelte";
    import { Button } from "svelte-tweakpane-ui";

    let { children, resetValue }:{children:Snippet,resetValue:()=>void} = $props();
    
</script>
<div class="reset-wrapper">
    {@render children()}<Button title="↺" on:click={resetValue} />
</div>

<style>
    
    :global(.reset-wrapper){
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
        
    }
    :global(.reset-wrapper > *){
            flex: 1; 
    }
        
    :global(.reset-wrapper :has(.tp-btnv)){
        flex-grow: 1;
        width: 2.5em;
        max-width: 2.5em;
        flex-grow: 0;
    }

</style>
