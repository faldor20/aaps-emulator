<script lang="ts">
import { parseLog} from "$lib/readaapslog";
    import { importedLog, initializeAapsState } from "$lib/mainState";
    import MainView from "$lib/mainView.svelte";
    import { onMount } from "svelte";
    import { logDB, type LogMetadata } from "$lib/indexdb";
    import StartupSettings from "$lib/startupSettings.svelte";
    import type { InsulinConfig } from "$lib/types";
    import { insulinConfigDB } from "$lib/indexDB/indexDB";
    let savedLogs: LogMetadata[] = $state([]);
    let insulinConfig = $state<InsulinConfig>({
        dia:9,
        peak:55,
        curve:"ultra-rapid",
        useCustomPeakTime:false,
        insulinPeakTime:55
    });
 
    const refreshLogList = async () => {
        savedLogs = (await logDB.getAllLogNames()).toReversed();
    };

    onMount(async () => {
      
        await logDB.initialize();
        await refreshLogList();
    });

    const handleFileSelect = async (event: Event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
            try{
            const sortedFiles = Array.from(files).sort((a: File, b: File) => 
                a.name.localeCompare(b.name)
            );
            
            const logs = await Promise.all(
                sortedFiles.map(async (file) => {
                    const text = await file.text();
                    return text;
                })
            );

            const logContents = logs.join('\n');
            const name = sortedFiles.length > 1 
                ? `${sortedFiles[0].name} - ${sortedFiles[sortedFiles.length - 1].name}` 
                : sortedFiles[0].name;
            const parsedData = parseLog(logContents);
            console.log("parsedData",parsedData);
            await logDB.addLog({ name, content: JSON.stringify(parsedData) });
            console.log("added log to db");
            // await refreshLogList();
          
          
                initializeAapsState(parsedData, $state.snapshot(insulinConfig));
            }catch(e){
                console.error("Error initializing state",e);
            }
        }
    };

    const loadSavedLog = async (name: string) => {
        try {
            const content = await logDB.getLogContent(name);
            initializeAapsState(JSON.parse(content), $state.snapshot(insulinConfig));
        } catch (error) {
            console.error('Error loading log:', error);
            // Handle error appropriately
        }
    };

    const keepLatestLogs = async () => {
        await logDB.keepOnlyLatest(5);
        await refreshLogList();
    };
</script>

<div class="app">
    {#if $importedLog}
        <MainView />
    {:else}
        <div>
            <p>Please select one or more log files:</p>
            <input type="file" accept=".log" on:change={handleFileSelect} multiple />
            <StartupSettings bind:insulinConfig />
            {#if savedLogs.length > 0}
                <div class="saved-logs">
                    <div class="saved-logs-header">
                        <h3>Previously imported logs:</h3>
                        <button 
                            class="cleanup-button" 
                            on:click={keepLatestLogs}
                            title="Keep only the 5 most recent logs">
                            Keep Latest 5
                        </button>
                    </div>
                    <ul>
                        {#each savedLogs as log}
                            <li>
                                <button on:click={() => loadSavedLog(log.name)}>
                                    {log.name}
                                </button>
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}

            <h2>Using the emulator:</h2>
            <p>1. select your log files (they must be the logs, not zip files, extract the logs from the zip files for older logs)</p>
            <p> Now you're looking at the graph of your data</p>
            <br> Click any data point to show the calculation and preditions at ithat point<br>
            Drag the pink line to a point. all points after that will be emulated.<br>
            Adjust the settings in the box to see how your iob and smb would have been different if you had been using a different settings.
            <br>
        
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
    .saved-logs {
        margin-top: 20px;
    }
    .saved-logs ul {
        list-style: none;
        padding: 0;
    }
    .saved-logs li {
        margin: 10px 0;
    }
    .saved-logs button {
        padding: 5px 10px;
        cursor: pointer;
    }
    .saved-logs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .cleanup-button {
        padding: 5px 10px;
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
    }

    .cleanup-button:hover {
        background-color: #e0e0e0;
    }
    StartupSettings{
        margin-top: 1em;
        max-width: 10em;
    }
</style>
