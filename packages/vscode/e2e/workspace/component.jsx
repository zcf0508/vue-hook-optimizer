import React, { useState, useEffect, useMemo } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  const doubled = useMemo(() => count * 2, [count])

  useEffect(() => {
    document.title = `Count: ${count}`
  }, [count])

  return (
    <div>
      <span>{count}</span>
      <span>{doubled}</span>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  )
}