<script lang="ts">

  import { AapsStateManager  } from "$lib/mainState.svelte";
    import MainView from "$lib/mainView.svelte";
  import { onMount } from "svelte";
  let aapsState: AapsStateManager | undefined = undefined;
  onMount(async () => {
   
  });

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const log = e.target.result as string;
        aapsState = new AapsStateManager(log);
      };
      reader.readAsText(file);
    }
  };
</script>

<div class="app">
  {#if aapsState}
    <MainView {aapsState} />
  {:else}
    <div>
        <p>Please select a log file:</p>
        <input type="file" accept=".log" on:change={handleFileSelect} />
    </div>
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
