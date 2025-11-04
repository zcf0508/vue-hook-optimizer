import React, { useEffect, useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  const [isEven, setIsEven] = useState(true);
  const [status, setStatus] = useState('normal');

  useEffect(() => {
    setIsEven(count % 2 === 0);
    setStatus(count > 10
      ? '很大'
      : count < 0
        ? '负数'
        : '正常');
  }, [count]);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(0);

  return (
    <div className="counter">
      <h2>React 函数组件计数器</h2>
      <p className="count">
        计数:
        {count}
      </p>
      <div className="status-info">
        <p>
          状态:
          {isEven
            ? '偶数'
            : '奇数'}
        </p>
        <p>
          数值:
          {status}
        </p>
      </div>
      <div className="controls">
        <button onClick={increment} className="btn btn-primary">
          增加
        </button>
        <button onClick={decrement} className="btn btn-secondary">
          减少
        </button>
        <button onClick={reset} className="btn btn-danger">
          重置
        </button>
      </div>
      <p className="info">React Hooks 示例</p>
      <style jsx>
        {`
        .counter {
          text-align: center;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        .count {
          font-size: 24px;
          font-weight: bold;
          margin: 20px 0;
        }
        .status-info {
          margin: 15px 0;
          color: #666;
        }
        .controls {
          margin: 20px 0;
        }
        .btn {
          padding: 8px 16px;
          margin: 0 5px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-primary {
          background-color: #61dafb;
          color: #282c34;
        }
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        .btn-danger {
          background-color: #dc3545;
          color: white;
        }
        .info {
          color: #666;
          font-style: italic;
        }
      `}
      </style>
    </div>
  );
}
