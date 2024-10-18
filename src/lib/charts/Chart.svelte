<script lang="ts">
  import type {
    init as baseInit,
    EChartsType as BaseEchartsType,
    EChartsOption,
    SetOptionOpts,
  } from 'echarts'
  import type { init as coreInit, EChartsType as CoreEchartsType } from 'echarts/core'
  import type { EChartsInitOpts } from 'echarts'
  import { EVENT_NAMES, type EventHandlers } from './events'
    import { createEventDispatcher } from 'svelte';

  let { 
    init,
    theme = $bindable('light'),
    initOptions = $bindable({}),
    options,
    notMerge = $bindable(true),
    lazyUpdate = $bindable(false),
    silent = $bindable(false),
    replaceMerge = $bindable(undefined),
    transition = $bindable(undefined),
    chart = $bindable<(BaseEchartsType | CoreEchartsType) | undefined>(undefined),
    ...restProps  
  } = $props<{
    init: typeof baseInit | typeof coreInit,
    theme?: string | object | null,
    initOptions?: EChartsInitOpts,
    options: EChartsOption,
    notMerge?: SetOptionOpts['notMerge'],
    lazyUpdate?: SetOptionOpts['lazyUpdate'],
    silent?: SetOptionOpts['silent'],
    replaceMerge?: SetOptionOpts['replaceMerge'],
    transition?: SetOptionOpts['transition'],
    chart?: (BaseEchartsType | CoreEchartsType) | undefined,
    [key: string]: any  // Add this line to allow for additional props
  }>();
  

  let element: HTMLDivElement;

  $effect(() => {
    if (chart) chart.setOption(options, { notMerge, lazyUpdate, silent, replaceMerge, transition });
  });

  const dispatch = createEventDispatcher<EventHandlers>();

  function initChart() {
    if (chart) chart.dispose();

    chart = init(element, theme, initOptions);

    EVENT_NAMES.forEach((eventName) => {
      // @ts-expect-error
      chart!.on(eventName, (event) => dispatch(eventName, event));
    });
  }

  $effect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (!chart) initChart();
      else chart.resize();
    });
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      chart?.dispose();
    };
  });
</script>

<div bind:this={element} style="width: 100%; height: 100%" {...restProps} />