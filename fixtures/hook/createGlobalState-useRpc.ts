import { ref, readonly } from 'vue'
import { createGlobalState } from '@vueuse/core'
import type { FolderPickerItem } from 'shared'

const CACHE_TTL_MS = 20_000

const items = ref<FolderPickerItem[]>([])
const loadedAt = ref(0)
const loading = ref(false)
let inflight: Promise<FolderPickerItem[]> | null = null

export const useFolderPicker = createGlobalState(() => {
  const rpc = useRpc()

  function isCacheFresh() {
    return loadedAt.value > 0 && Date.now() - loadedAt.value < CACHE_TTL_MS
  }

  async function refresh(force = false): Promise<FolderPickerItem[]> {
    if (!rpc.value) {
      items.value = []
      loadedAt.value = Date.now()
      return items.value
    }
    if (!force && isCacheFresh()) {
      return items.value
    }
    if (inflight) {
      return inflight
    }

    loading.value = true
    inflight = rpc.value.listFolderPickerItems()
      .then((result) => {
        items.value = result
        loadedAt.value = Date.now()
        return result
      })
      .finally(() => {
        loading.value = false
        inflight = null
      })

    return inflight
  }

  async function remove(path: string) {
    if (!rpc.value) { return }
    await rpc.value.removeFolderPickerItem(path)
    items.value = items.value.filter(item => item.path !== path)
    loadedAt.value = Date.now()
  }

  function invalidate() {
    loadedAt.value = 0
  }

  async function handleChanged() {
    invalidate()
    await refresh(true)
  }

  return {
    items: readonly(items),
    loading: readonly(loading),
    refresh,
    remove,
    invalidate,
    handleChanged,
  }
})
