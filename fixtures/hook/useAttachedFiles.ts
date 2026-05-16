import type { FileInfo } from 'shared'
import { getFileSystemPathKey } from '@renderer/utils/drop-paths'
import { useFolderPicker } from './useFolderPicker'

export function useAttachedFiles() {
  const { rpc } = useRpc()
  const { refresh: refreshFolderPicker } = useFolderPicker()
  const files = ref<FileInfo[]>([])

  function addFiles(newFiles: FileInfo[]) {
    const existingPaths = new Set(files.value.map(f => getFileSystemPathKey(f.path)))
    const unique = newFiles.filter((file) => {
      const key = getFileSystemPathKey(file.path)
      if (existingPaths.has(key)) { return false }
      existingPaths.add(key)
      return true
    })
    files.value = [...files.value, ...unique]
  }

  async function selectFiles() {
    if (!rpc) { return }
    const selected = await rpc.selectFiles()
    addFiles(selected)
  }

  async function selectFolders() {
    if (!rpc) { return }
    const selected = await rpc.selectFolders()
    addFiles(selected)
    void refreshFolderPicker(true)
  }

  function removeFile(filePath: string) {
    const key = getFileSystemPathKey(filePath)
    files.value = files.value.filter(f => getFileSystemPathKey(f.path) !== key)
  }

  function clearFiles() {
    files.value = []
  }

  function setFiles(newFiles: FileInfo[]) {
    files.value = [...newFiles]
  }

  async function handleDrop(paths: string[]) {
    if (!rpc) { return }
    const infos = await rpc.getFileInfos(paths)
    addFiles(infos)
  }

  async function addPastedImage(data: ArrayBuffer, mimeType: string) {
    if (!rpc) { return }
    const file = await rpc.savePastedImage(data, mimeType)
    if (file) {
      addFiles([file])
    }
  }

  async function attachFolder(file: FileInfo) {
    addFiles([file])
  }

  return {
    files: readonly(files),
    selectFiles,
    selectFolders,
    attachFolder,
    removeFile,
    clearFiles,
    setFiles,
    handleDrop,
    addPastedImage,
  }
}
