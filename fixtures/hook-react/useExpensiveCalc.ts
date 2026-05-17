import { useMemo, useState } from 'react'

export function useExpensiveCalc(items: number[]) {
  const [filter, setFilter] = useState('')
  const sorted = useMemo(() => {
    return [...items].sort()
  }, [items])

  const filtered = useMemo(() => {
    if (!filter) {
      return sorted
    }
    return sorted.filter(i => i.toString().includes(filter))
  }, [sorted, filter])

  return { sorted, filtered, filter, setFilter }
}
