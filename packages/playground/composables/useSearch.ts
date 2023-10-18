export function useSearch(
  searchInputRef: Ref<HTMLInputElement | undefined>, 
  chartRef: Ref<HTMLElement | undefined>
) {
  const showSearchInput = ref(false);

  const { isOutside } = useMouseInElement(chartRef);
  onKeyStroke(['F', 'f', 'Command', 'Ctrl'], (e) => {
    // 判断是不是同时按下
    if (!e.metaKey && !e.ctrlKey) return;

    if (isOutside.value) return;
    e.preventDefault();
    showSearchInput.value = true;
    nextTick(() => {
      if(searchInputRef.value) {
        searchInputRef.value.focus();
      }
    });
  });

  const searchkey = ref('');

  function closeSearch() {
    searchkey.value = '';
    showSearchInput.value = false;
  }

  return {
    showSearchInput,
    searchkey,
    closeSearch,
  };
}