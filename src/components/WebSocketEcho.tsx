import React, { useState, useEffect, useRef } from 'react';

export default function WebSocketEcho() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to the WebSocket echo server
    const socket = new WebSocket('wss://echo.websocket.org');
    socketRef.current = socket;

    // Connection opened
    socket.addEventListener('open', (event) => {
      console.log('Connected to echo server');
      setIsConnected(true);
      setMessages(prev => [...prev, 'Connected to echo server']);

      // Send a test message
      socket.send('Hello, WebSocket Echo Server!');

      // Send JSON data
      socket.send(
        JSON.stringify({
          type: 'test',
          timestamp: Date.now(),
          message: 'Testing echo functionality',
        })
      );
    });

    // Listen for echoed messages
    socket.addEventListener('message', (event) => {
      console.log('Echoed back:', event.data);
      setMessages(prev => [...prev, `Echoed back: ${event.data}`]);

      // Parse JSON if needed
      try {
        const data = JSON.parse(event.data);
        console.log('Received JSON:', data);
      } catch (e) {
        console.log('Received text:', event.data);
      }
    });

    // Handle errors
    socket.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
      setMessages(prev => [...prev, 'WebSocket error occurred']);
    });

    // Connection closed
    socket.addEventListener('close', (event) => {
      console.log('Disconnected from echo server');
      console.log('Close code:', event.code);
      console.log('Close reason:', event.reason);
      setIsConnected(false);
      setMessages(prev => [...prev, 'Disconnected from echo server']);
    });

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto my-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl shadow-sm overflow-hidden font-sans">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">WebSocket Echo Test</h3>
      </div>
      <div className="p-6">
        <div className="mb-4 text-sm text-slate-700 dark:text-slate-300">
          Status: <span className={isConnected ? "text-green-500 font-bold" : "text-red-500 font-bold ml-1"}>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className="bg-slate-900 text-green-400 p-4 rounded-md h-64 overflow-y-auto font-mono text-sm leading-relaxed">
          {messages.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
