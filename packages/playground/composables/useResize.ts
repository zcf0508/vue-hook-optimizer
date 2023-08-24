export function useResize(containerRef: Ref<HTMLElement | null>) {
  const state = reactive({
    dragging: false,
    split: 50,
  });

  const boundSplit = computed(() => {
    const { split } = state;
    return split < 10 ? 10 : split > 50 ? 50 : split;
  });

  let startPosition = 0;
  let startSplit = 0;

  function dragStart(e: MouseEvent) {
    state.dragging = true;
    startPosition = e.pageX;
    startSplit = boundSplit.value;
  }

  function dragMove(e: MouseEvent) {
    if (state.dragging) {
      const position = e.pageX;
      const totalSize = containerRef.value!.offsetWidth;
      const dp = position - startPosition;
      state.split = startSplit + ~~((dp / totalSize) * 100);
    }
  }

  function dragEnd() {
    state.dragging = false;
  }

  return {
    boundSplit,
    dragStart,
    dragMove,
    dragEnd,
  };
}
