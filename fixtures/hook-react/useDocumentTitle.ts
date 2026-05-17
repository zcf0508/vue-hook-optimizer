import { useEffect, useRef } from 'react'

export function useDocumentTitle(title: string) {
  const prevTitle = useRef(document.title)

  useEffect(() => {
    document.title = title
  }, [title])

  useEffect(() => {
    return () => {
      document.title = prevTitle.current
    }
  }, [])

  return title
}
