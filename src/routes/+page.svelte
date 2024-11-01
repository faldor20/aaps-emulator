<script lang="ts">
    import { importedLog, initializeAapsState, results } from "$lib/mainState";



    import MainView from "$lib/mainView.svelte";
  import { onMount } from "svelte";

  onMount(async () => {
   
  });

  const handleFileSelect = async (event: Event) => {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      // Sort files by name
      const sortedFiles = Array.from(files).sort((a: File, b: File) => 
        a.name.localeCompare(b.name)
      );
      
     
      
      // Read files sequentially using Promise.all
      const logs = await Promise.all(
        sortedFiles.map(async (file) => {
          const text = await file.text();
          return text;
        })
      );

      const logContents = logs.join('\n');
      // Combine all logs and initialize state
      initializeAapsState(logContents);
    }
  };
</script>

<div class="app">
  {#if $importedLog}
    <MainView  />
  {:else}
    <div>
        <p>Please select one or more log files:</p>
        <input type="file" accept=".log" on:change={handleFileSelect} multiple />
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
