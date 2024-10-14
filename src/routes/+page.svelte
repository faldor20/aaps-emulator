<script lang="ts">

  import { AapsStateManager  } from "$lib/mainState.svelte";
    import MainView from "$lib/mainView.svelte";
  import { onMount } from "svelte";
  let aapsState: AapsStateManager | undefined = undefined;
  onMount(async () => {
    //fetch the static log
    const log = await fetch("/log.log").then((r) => r.text());

    aapsState = new AapsStateManager(log);
   
  });
</script>

<div class="app">
  {#if aapsState}
    <MainView {aapsState} />
  {:else}
    <p>Error loading log file</p>
  {/if}

</div>

<style>
  .app {
    width: 98vw;
    height: 98vh;
  }
  :global(*) {
    box-sizing: border-box;
  }
</style>
