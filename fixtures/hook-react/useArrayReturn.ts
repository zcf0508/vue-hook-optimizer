import { useState, useCallback } from 'react'

export function useArrayReturn(initial: number = 0) {
  const [count, setCount] = useState(initial)
  const increment = useCallback(() => setCount(c => c + 1), [])
  const decrement = useCallback(() => setCount(c => c - 1), [])

  return [count, increment, decrement]
}
