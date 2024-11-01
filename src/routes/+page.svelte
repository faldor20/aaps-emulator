<script lang="ts">
    import { importedLog, initializeAapsState } from "$lib/mainState";
    import MainView from "$lib/mainView.svelte";
    import { onMount } from "svelte";
    import { logDB, type LogMetadata } from "$lib/indexdb";

    let savedLogs: LogMetadata[] = [];

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
            
            await logDB.addLog({ name, content: logContents });
            await refreshLogList();
            
            initializeAapsState(logContents);
        }
    };

    const loadSavedLog = async (name: string) => {
        try {
            const content = await logDB.getLogContent(name);
            initializeAapsState(content);
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
</style>
