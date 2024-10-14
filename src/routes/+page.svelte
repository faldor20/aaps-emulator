<script lang="ts">
    import { importedLog, initializeAapsState, results } from "$lib/mainState";



    import MainView from "$lib/mainView.svelte";
  import { onMount } from "svelte";

  onMount(async () => {
   
  });

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const log = e.target.result as string;
        initializeAapsState(log);
      };
      reader.readAsText(file);
    }
  };
</script>

<div class="app">
  {#if $importedLog}
    <MainView  />
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
