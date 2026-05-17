import { useState } from 'react'

export function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)
  const double = count * 2

  function increment() {
    setCount(c => c + 1)
  }

  function decrement() {
    setCount(c => c - 1)
  }

  return { count, setCount, double, increment, decrement }
}
