/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import PieSocket from 'piesocket-js';
import { 
  Terminal as TerminalIcon, 
  Play, 
  Square, 
  Send, 
  Database, 
  RefreshCw, 
  Trash2, 
  Copy, 
  Check, 
  HelpCircle, 
  ArrowRightLeft, 
  ExternalLink,
  Settings as SettingsIcon,
  Layers,
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';

interface TerminalLine {
  type: 'input' | 'output' | 'system' | 'error' | 'success';
  text: string;
  timestamp: string;
  isPrefixCmd?: boolean;
}

import { StableWebSocket } from '@/lib/websocket-handler';

export default function WscatModule() {
  // Tabs and PieSocket SDK options
  const [activeTab, setActiveTab] = useState<'wscat' | 'piesocket_sdk' | 'echo_test'>('wscat');
  const [clusterId, setClusterId] = useState('demo');
  const [apiKey, setApiKey] = useState('ZC6aeOdzacSmOxJfgfuCUtk2ip1A2EMSjqgx31gV');
  const [apiSecret, setApiSecret] = useState('O6PN3Y4mo5WtEsw6zvzhESL4STWdfqfg');
  const [channelRoom, setChannelRoom] = useState('room_1');
  const [psNotifySelf, setPsNotifySelf] = useState(true);
  
  const [pieSocketClient, setPieSocketClient] = useState<any | null>(null);
  const [pieChannel, setPieChannel] = useState<any | null>(null);
  const [pieSocketStatus, setPieSocketStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  // Connection states
  const [url, setUrl] = useState('wss://echo.websocket.org');
  const [socket, setSocket] = useState<StableWebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [protocol, setProtocol] = useState('');
  const [customHeaders, setCustomHeaders] = useState('');
  
  // Stats
  const [sentCount, setSentCount] = useState(0);
  const [recvCount, setRecvCount] = useState(0);
  const [lastPingTime, setLastPingTime] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // Command-line state
  const [wscatInstalled, setWscatInstalled] = useState(() => {
    return localStorage.getItem('adalah-wscat-installed') === 'true';
  });
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { type: 'system', text: 'مختبر الاتصال الفوري ونظام تكامل واجهات العمليات (WSCat CLI Emulator)', timestamp: getFormattedTime() },
    { type: 'output', text: 'مرحباً بك في نظام محاكاة منافذ Websocket الفورية لربط الأنظمة الموحدة.', timestamp: getFormattedTime() },
    { type: 'output', text: 'امسح الشاشة بـ "clear"، أو قم بتثبيت الأداة وبدء الاتصال بالخادم.', timestamp: getFormattedTime() },
    { type: 'system', text: 'سياق الأوامر المتاحة:', timestamp: getFormattedTime() },
    { type: 'output', text: '  - npm install -g wscat           (تثبيت أداة المحاكاة لبروتوكول WebSocket)', timestamp: getFormattedTime() },
    { type: 'output', text: '  - wscat -c "wss://free.blr2.piesocket.com/v3/1?api_key=ZC6aeOdzacSmOxJfgfuCUtk2ip1A2EMSjqgx31gV&notify_self=1"  (بدء الاتصال بقناة العدالة الفورية)', timestamp: getFormattedTime() },
    { type: 'input', text: 'نوع الأمر واضغط Enter لبدء التجربة...', timestamp: getFormattedTime() },
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalTheme, setTerminalTheme] = useState<'matrix' | 'classic' | 'amber' | 'dracula'>('dracula');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Quick message presets
  const [payloadType, setPayloadType] = useState<'text' | 'json'>('text');
  const [messageInput, setMessageInput] = useState('Hello from wscat!');
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isManualDisconnectRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<any>(null);

  const isPieManualDisconnectRef = useRef(false);
  const pieReconnectAttemptsRef = useRef(0);
  const pieReconnectTimeoutRef = useRef<any>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  // Clean sockets on unmount
  useEffect(() => {
    return () => {
      isManualDisconnectRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        try {
          if (socket.getReadyState() === WebSocket.OPEN) {
            socket.close();
          }
        } catch (e) {}
      }
      
      isPieManualDisconnectRef.current = true;
      if (pieReconnectTimeoutRef.current) {
        clearTimeout(pieReconnectTimeoutRef.current);
      }
      if (pieSocketClient) {
        try {
          if (pieChannel && typeof pieChannel.unsubscribe === 'function') {
            pieChannel.unsubscribe();
          }
        } catch (e) {
          // ignore
        }
      }
    };
  }, [socket, pieSocketClient, pieChannel]);

  function getFormattedTime() {
    const d = new Date();
    return d.toTimeString().split(' ')[0];
  }

  // Handle command submissions
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCmd = terminalInput.trim();
    if (!cleanCmd) return;

    // Add to history
    const updatedHistory = [cleanCmd, ...commandHistory.filter(c => c !== cleanCmd)].slice(0, 50);
    setCommandHistory(updatedHistory);
    setHistoryIndex(-1);

    // Echo input to terminal
    setTerminalLines(prev => [...prev, {
      type: 'input',
      text: `${socket ? '' : '$ '}${cleanCmd}`,
      timestamp: getFormattedTime(),
      isPrefixCmd: true
    }]);

    setTerminalInput('');

    // If socket is connected, command prompt acts as direct frame sender
    if (socket && connectionStatus === 'connected') {
      sendSocketMessage(cleanCmd);
      return;
    }

    // Process local command shell
    processLocalCommand(cleanCmd);
  };

  const processLocalCommand = (cmd: string) => {
    const lowerCmd = cmd.toLowerCase().trim();

    if (lowerCmd === 'clear') {
      setTerminalLines([]);
      return;
    }

    if (lowerCmd === 'help' || lowerCmd === '?') {
      setTerminalLines(prev => [
        ...prev,
        { type: 'system', text: '--- المساعد الفني للمنفذ المباشر ---', timestamp: getFormattedTime() },
        { type: 'output', text: 'npm install -g wscat : تثبيت أداة الاتصال التفاعلية العالمية', timestamp: getFormattedTime() },
        { type: 'output', text: 'wscat -c [URL]         : ربط اتصال فوري مع خادم WebSocket المحدد', timestamp: getFormattedTime() },
        { type: 'output', text: 'clear                  : مسح نافذة مخرجات المبنى البرمجي', timestamp: getFormattedTime() },
        { type: 'output', text: 'system-status          : جلب المؤشرات الإحصائية العامة للربط السحابي', timestamp: getFormattedTime() },
        { type: 'output', text: '--- تفضل بطلبك لإجراء المزامنة ---', timestamp: getFormattedTime() }
      ]);
      return;
    }

    if (lowerCmd === 'system-status') {
      setTerminalLines(prev => [
        ...prev,
        { type: 'system', text: `معالج الجهاز الافتراضي: نشط دائمًا (Active)`, timestamp: getFormattedTime() },
        { type: 'output', text: `الأداة wscat: ${wscatInstalled ? 'مثبتة بنجاح (Installed)' : 'غير مثبتة (Not Installed)'}`, timestamp: getFormattedTime() },
        { type: 'output', text: `الاتصال الحالي: ${connectionStatus.toUpperCase()}`, timestamp: getFormattedTime() },
        { type: 'output', text: `إجمالي الحزم الصادرة: ${sentCount} | الواردة: ${recvCount}`, timestamp: getFormattedTime() },
      ]);
      return;
    }

    // Command: npm install -g wscat
    if (lowerCmd === 'npm install -g wscat') {
      if (wscatInstalled) {
        setTerminalLines(prev => [
          ...prev,
          { type: 'success', text: 'wscat is already installed. Use "wscat -c <url>" to connect!', timestamp: getFormattedTime() }
        ]);
        return;
      }

      setIsInstalling(true);
      setTerminalLines(prev => [
        ...prev,
        { type: 'system', text: 'sh: fetching dependencies from registry.npmjs.org...', timestamp: getFormattedTime() },
        { type: 'output', text: '░░░░░░░░░░ 0% - downloading binary headers', timestamp: getFormattedTime() }
      ]);

      // Phase 1 update
      setTimeout(() => {
        setTerminalLines(prev => [
          ...prev,
          { type: 'output', text: '▓▓▓▓░░░░░░ 40% - writing package wscat@5.2.0 to local global bin', timestamp: getFormattedTime() }
        ]);
      }, 800);

      // Phase 2 update
      setTimeout(() => {
        setTerminalLines(prev => [
          ...prev,
          { type: 'output', text: '▓▓▓▓▓▓▓▓░░ 80% - registering WebSocket client drivers and symlinks', timestamp: getFormattedTime() }
        ]);
      }, 1500);

      // Final complete
      setTimeout(() => {
        setWscatInstalled(true);
        localStorage.setItem('adalah-wscat-installed', 'true');
        setIsInstalling(false);
        setTerminalLines(prev => [
          ...prev,
          { type: 'success', text: '✔ success: installed wscat@5.2.0 package globally.', timestamp: getFormattedTime() },
          { type: 'success', text: '✔ added 1 package and audited 36 packages in 2.2s', timestamp: getFormattedTime() },
          { type: 'system', text: 'أصبح بإمكانك الآن تشغيل أمر الاتصال: wscat -c wss://echo.websocket.org', timestamp: getFormattedTime() }
        ]);
      }, 2200);

      return;
    }

    // Command: wscat -c websocket-url
    if (lowerCmd.startsWith('wscat -c ') || lowerCmd.startsWith('wscat -c')) {
      if (!wscatInstalled) {
        setTerminalLines(prev => [
          ...prev,
          { type: 'error', text: 'sh: command not found: wscat. (الرجاء تثبيت الأداة أولاً عن طريق الأمر: npm install -g wscat)', timestamp: getFormattedTime() }
        ]);
        return;
      }

      const args = cmd.split('-c');
      let targetUrl = args[1] ? args[1].trim() : 'wss://echo.websocket.org';
      if ((targetUrl.startsWith('"') && targetUrl.endsWith('"')) || (targetUrl.startsWith("'") && targetUrl.endsWith("'"))) {
        targetUrl = targetUrl.slice(1, -1);
      }
      
      setTerminalLines(prev => [
        ...prev,
        { type: 'system', text: `جاري الاتصال بـ ${targetUrl}...`, timestamp: getFormattedTime() }
      ]);
      
      initiateConnection(targetUrl);
      return;
    }

    // Fallback error
    setTerminalLines(prev => [
      ...prev,
      { type: 'error', text: `bash: ${cmd}: command not found. اكتب help للقائمة المتاحة.`, timestamp: getFormattedTime() }
    ]);
  };

  // Setup actual WebSocket connection
  const initiateConnection = (targetUrl: string) => {
    if (socket) {
      socket.close();
      setSocket(null);
    }

    setConnectionStatus('connecting');
    setUrl(targetUrl);

    try {
      const startTime = Date.now();
      
      const ws = new StableWebSocket(targetUrl, {
        timeout: 10000,
        maxRetries: 7,
        onOpen: (event: any) => {
          setConnectionStatus('connected');
          // @ts-ignore
          setProtocol(event?.target?.protocol || 'Default (No specific protocol)');
          setLatency(Date.now() - startTime);

          setTerminalLines(prev => [
            ...prev,
            { type: 'success', text: `Connected to ${targetUrl} (البث الفوري نشط الآن) 🟢`, timestamp: getFormattedTime() },
            { type: 'system', text: `Session Active. StableWebSocket is managing connection with auto-reconnects.`, timestamp: getFormattedTime() },
            { type: 'system', text: `Enter messages to send. Type Ctrl+C or 'exit' command to close connection.`, timestamp: getFormattedTime() }
          ]);
        },
        onMessage: (event: any) => {
          setRecvCount(p => p + 1);
          const receivedText = typeof event.data === 'string' ? event.data : '[Binary FrameData]';
          
          // Output inline
          setTerminalLines(prev => [
            ...prev,
            { type: 'output', text: `< ${receivedText}`, timestamp: getFormattedTime() }
          ]);
        },
        onError: (event: any) => {
          setConnectionStatus('error');
          setTerminalLines(prev => [
            ...prev,
            { type: 'error', text: `WebSocket Connection Error: تعذر الاتصال بـ ${targetUrl} أو فقد الاتصال مؤقتاً. StableWS سيحاول المعالجة.`, timestamp: getFormattedTime() }
          ]);
        },
        onClose: (event: any) => {
          setConnectionStatus('disconnected');
          let detail = '';
          if (event && event.code) {
            detail = ` (كود الإغلاق: ${event.code}${event.reason ? ` - السبب: ${event.reason}` : ''})`;
          }
          setTerminalLines(prev => [
            ...prev,
            { type: 'system', text: `Disconnected from ${targetUrl} (تم فصل قناة الاتصال الإلكتروني)${detail} 🛑`, timestamp: getFormattedTime() }
          ]);
        }
      });
      
      ws.connect();
      setSocket(ws);

    } catch (err: any) {
      setConnectionStatus('error');
      setTerminalLines(prev => [
        ...prev,
        { type: 'error', text: `Invalid URL configuration: ${err.message}`, timestamp: getFormattedTime() }
      ]);
    }
  };

  // Disconnect manually
  const handleDisconnect = () => {
    isManualDisconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socket) {
      try {
        if (socket.getReadyState() === WebSocket.OPEN) {
          socket.close();
        }
      } catch (e) {}
    }
  };

  // Send message
  const sendSocketMessage = (textToSend: string) => {
    if (!socket || socket.getReadyState() !== WebSocket.OPEN) {
      setTerminalLines(prev => [
        ...prev,
        { type: 'error', text: `Error: Cannot send message. Connection is closed.`, timestamp: getFormattedTime() }
      ]);
      return;
    }

    socket.send(textToSend);
    setSentCount(p => p + 1);

    // Scroll to new items will trigger automatically via state updates
  };

  // Quick helper to dispatch preset payloads
  const triggerQuickSend = () => {
    let finalPayload = messageInput;
    if (payloadType === 'json') {
      try {
        // Try validating dynamic JSON
        const parsed = JSON.parse(messageInput);
        finalPayload = JSON.stringify(parsed, null, 2);
      } catch (err) {
        setTerminalLines(prev => [
          ...prev,
          { type: 'error', text: `Warning: Payload failed JSON structure validation. Sent as string.`, timestamp: getFormattedTime() }
        ]);
      }
    }

    setTerminalLines(prev => [
      ...prev,
      { type: 'input', text: `> ${finalPayload}`, timestamp: getFormattedTime(), isPrefixCmd: false }
    ]);
    sendSocketMessage(finalPayload);
  };

  // PieSocket SDK health dispatcher & reconnect action
  const handlePieSocketDisconnectEvent = (isManual: boolean) => {
    if (isManual) {
      isPieManualDisconnectRef.current = true;
      pieReconnectAttemptsRef.current = 0;
      if (pieReconnectTimeoutRef.current) {
        clearTimeout(pieReconnectTimeoutRef.current);
        pieReconnectTimeoutRef.current = null;
      }
      return;
    }

    if (!isPieManualDisconnectRef.current) {
      if (pieReconnectAttemptsRef.current < 5) {
        const delay = Math.min(30000, Math.pow(2, pieReconnectAttemptsRef.current) * 2000 + (Math.random() * 1000));
        pieReconnectAttemptsRef.current += 1;

        setTerminalLines(prev => [
          ...prev,
          { type: 'system', text: `[SDK إعادة محاولة] ⚡ انقطع اتصال حزمة PieSocket JS. محاولة إعادة الاشتراك تلقائياً ${pieReconnectAttemptsRef.current}/5 بعد ${Math.round(delay / 100) / 10} ثانية... ⏳`, timestamp: getFormattedTime() }
        ]);

        setPieSocketStatus('connecting');

        pieReconnectTimeoutRef.current = setTimeout(() => {
          connectPieSocketSDK(true);
        }, delay);
      } else {
        setPieSocketStatus('error');
        setTerminalLines(prev => [
          ...prev,
          { type: 'error', text: `[SDK إعادة محاولة] 🛑 استنفدت حزمة PieSocket المحاولات الـ 5 المتاحة لإعادة الاتصال التلقائي.`, timestamp: getFormattedTime() }
        ]);
      }
    }
  };

  // PieSocket SDK integration methods
  const connectPieSocketSDK = async (isReconnect = false) => {
    if (pieSocketClient && !isReconnect) {
      disconnectPieSocketSDK();
      return;
    }

    if (!isReconnect) {
      isPieManualDisconnectRef.current = false;
      pieReconnectAttemptsRef.current = 0;
      if (pieReconnectTimeoutRef.current) {
        clearTimeout(pieReconnectTimeoutRef.current);
        pieReconnectTimeoutRef.current = null;
      }
    }

    setPieSocketStatus('connecting');
    setTerminalLines(prev => [
      ...prev,
      { type: 'system', text: `[SDK] تهيئة عميل PieSocket لـ Cluster: "${clusterId}" ومفتاح API: "${apiKey}"...`, timestamp: getFormattedTime() }
    ]);

    try {
      // @ts-ignore
      let PieConstructor = PieSocket;
      if (PieConstructor && (PieConstructor as any).default) {
        PieConstructor = (PieConstructor as any).default;
      }

      if (!PieConstructor) {
        throw new Error('PieSocket SDK export not found');
      }

      const client = new PieConstructor({
        clusterId: clusterId,
        apiKey: apiKey,
        notifySelf: psNotifySelf,
      });

      setPieSocketClient(client);

      setTerminalLines(prev => [
        ...prev,
        { type: 'system', text: `[SDK] العميل مهيأ. جاري الاشتراك في القناة: "${channelRoom}"...`, timestamp: getFormattedTime() }
      ]);

      const subscribedChannel = await client.subscribe(channelRoom);
      setPieChannel(subscribedChannel);
      setPieSocketStatus('connected');
      pieReconnectAttemptsRef.current = 0; // reset attempts on success

      setTerminalLines(prev => [
        ...prev,
        { type: 'success', text: `[SDK] 🟢 تم الاشتراك بنجاح في القناة: "${channelRoom}"!`, timestamp: getFormattedTime() },
        { type: 'system', text: `[SDK] يمكنك الآن نشر الأحداث واسترداد التحديثات المباشرة. قنوات الاستماع المتاحة: 'new_message' و 'judicial_event'.`, timestamp: getFormattedTime() }
      ]);

      // Hook raw websocket close event if exposed
      const innerWs = client.socket || client.websocket || (subscribedChannel && subscribedChannel.websocket);
      if (innerWs) {
        const originalOnClose = innerWs.onclose;
        innerWs.onclose = (event: any) => {
          if (originalOnClose) {
            try { originalOnClose(event); } catch (e) { console.error(e); }
          }
          handlePieSocketDisconnectEvent(false);
        };
        const originalOnError = innerWs.onerror;
        innerWs.onerror = (event: any) => {
          if (originalOnError) {
            try { originalOnError(event); } catch (e) { console.error(e); }
          }
          console.warn("[SDK] PieSocket connection error occurred.");
        };
      }

      // Event listener for general messages
      subscribedChannel.listen('message', (data: any, meta: any) => {
        setRecvCount(p => p + 1);
        const formattedMsg = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
        setTerminalLines(prev => [
          ...prev,
          { type: 'output', text: `📩 [استقبال رسالة] < ${formattedMsg}`, timestamp: getFormattedTime() }
        ]);
      });

      // Event listener for chat/messages event
      subscribedChannel.listen('new_message', (data: any, meta: any) => {
        setRecvCount(p => p + 1);
        const formattedMsg = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
        const sender = (meta && meta.from) ? meta.from : 'طرف خارجي';
        setTerminalLines(prev => [
          ...prev,
          { type: 'success', text: `🔔 [حدث جديد: new_message] من ${sender} < ${formattedMsg}`, timestamp: getFormattedTime() }
        ]);
      });

      // Event listener for court judicial operations
      subscribedChannel.listen('judicial_event', (data: any, meta: any) => {
        setRecvCount(p => p + 1);
        const formattedMsg = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
        setTerminalLines(prev => [
          ...prev,
          { type: 'success', text: `⚖️ [الحدث القضائي المباشر] < ${formattedMsg}`, timestamp: getFormattedTime() }
        ]);
      });

    } catch (err: any) {
      setPieSocketStatus('error');
      setTerminalLines(prev => [
        ...prev,
        { type: 'error', text: `[SDK ❌] فشل التثبيت والتكامل لتطبيق البث: ${err.message}`, timestamp: getFormattedTime() }
      ]);
      // Trigger auto reconnect on connection init failure
      handlePieSocketDisconnectEvent(false);
    }
  };

  const disconnectPieSocketSDK = () => {
    handlePieSocketDisconnectEvent(true);
    if (pieSocketClient) {
      try {
        if (pieChannel && typeof pieChannel.unsubscribe === 'function') {
          pieChannel.unsubscribe();
        }
      } catch (e) {
        console.error(e);
      }
      setPieChannel(null);
      setPieSocketClient(null);
      setPieSocketStatus('disconnected');
      setTerminalLines(prev => [
        ...prev,
        { type: 'system', text: `[SDK] تم فصل وإلغاء الاشتراك من القناة بنجاح 🛑`, timestamp: getFormattedTime() }
      ]);
    }
  };

  const publishPieSocketEvent = (eventName: string, dataPayload: any) => {
    if (!pieChannel) {
      setTerminalLines(prev => [
        ...prev,
        { type: 'error', text: `[SDK ❌] لا يمكن النشر: يرجى الاشتراك في قناة البث أولاً.`, timestamp: getFormattedTime() }
      ]);
      return;
    }

    try {
      pieChannel.publish(eventName, dataPayload);
      setSentCount(p => p + 1);
      
      const payloadString = typeof dataPayload === 'object' ? JSON.stringify(dataPayload) : String(dataPayload);
      setTerminalLines(prev => [
        ...prev,
        { type: 'input', text: `🚀 [نشر الحدث: ${eventName}] > ${payloadString}`, timestamp: getFormattedTime(), isPrefixCmd: false }
      ]);
    } catch (e: any) {
      setTerminalLines(prev => [
        ...prev,
        { type: 'error', text: `[SDK ❌] فشل إرسال الحدث: ${e.message}`, timestamp: getFormattedTime() }
      ]);
    }
  };

  // Connect via GUI Trigger
  const handleGuiConnect = () => {
    if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
      handleDisconnect();
    } else {
      if (!wscatInstalled) {
        // Auto unlock to provide great UX
        setWscatInstalled(true);
        localStorage.setItem('adalah-wscat-installed', 'true');
      }
      initiateConnection(url);
    }
  };

  // Theme styling configurations
  const getThemeColors = () => {
    switch (terminalTheme) {
      case 'matrix':
        return {
          bg: 'bg-black border-emerald-900',
          text: 'text-emerald-400 font-mono',
          input: 'text-emerald-300 placeholder-emerald-700 font-mono',
          badge: 'bg-emerald-950 border-emerald-800 text-emerald-400',
          cursor: 'bg-emerald-400',
          inputLine: 'text-emerald-500'
        };
      case 'amber':
        return {
          bg: 'bg-[#1c120c] border-[#78350f]',
          text: 'text-amber-500 font-mono',
          input: 'text-amber-300 placeholder-amber-800 font-mono',
          badge: 'bg-amber-950/50 border-amber-800 text-amber-500',
          cursor: 'bg-amber-500',
          inputLine: 'text-amber-400 font-black'
        };
      case 'classic':
        return {
          bg: 'bg-zinc-950 border-zinc-800',
          text: 'text-zinc-100 font-mono',
          input: 'text-white placeholder-zinc-700 font-mono',
          badge: 'bg-zinc-900 border-zinc-700 text-white font-bold',
          cursor: 'bg-zinc-100',
          inputLine: 'text-white font-bold'
        };
      case 'dracula':
      default:
        return {
          bg: 'bg-[#181524] border-[#312e81]',
          text: 'text-indigo-200 font-mono',
          input: 'text-cyan-300 placeholder-indigo-900/50 font-mono',
          badge: 'bg-indigo-950/60 border-indigo-800 text-cyan-400',
          cursor: 'bg-cyan-400',
          inputLine: 'text-indigo-400'
        };
    }
  };

  const themeColors = getThemeColors();

  // Export session data
  const exportLogHistory = () => {
    const header = `--- WSCAT TERMINAL LOG HISTORY ---\nExported at: ${new Date().toISOString()}\n\n`;
    const logs = terminalLines.map(line => `[${line.timestamp}] ${line.type === 'input' ? '>' : '<'} ${line.text}`).join('\n');
    const blob = new Blob([header + logs], { type: 'text/plain;charset=utf-8' });
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = `wscat-session-log.txt`;
    a.click();
    URL.revokeObjectURL(dlUrl);
  };

  const copyTextToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).catch(e => console.error(e));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center">
              <TerminalIcon className="w-5 h-5 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight font-sans">
              مكتبة الاختبار والأجهزة الافتراضية
            </h1>
            <span className="bg-amber-400/10 text-amber-400 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/25">
              مطور النظام (DevMode)
            </span>
          </div>
          <p className="text-xs text-slate-200 font-bold">
            مُحاكي بروتوكولات الربط المباشر الموحد (wscat) للاتصال وقنوات البث ثنائية الاتجاه مع بوابات الأنظمة والوزارات.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/50 text-xs text-white font-bold transition-all font-sans"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            دليل الأوامر السريعة
          </button>
          
          <button
            onClick={() => {
              setWscatInstalled(false);
              localStorage.removeItem('adalah-wscat-installed');
              setTerminalLines(prev => [
                ...prev,
                { type: 'system', text: 'تمت إزالة تثبيت wscat وإرجاع بيئة العمل الافتراضية.', timestamp: getFormattedTime() }
              ]);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-950 text-red-400 bg-red-950/20 text-xs transition-all font-sans"
          >
            إعادة تصفير البيئة
          </button>
        </div>
      </div>

      {/* Tab Selectors for Raw WebSocket vs PieSocket SDK */}
      <div className="flex border-b border-slate-800 gap-6 px-1">
        <button
          onClick={() => setActiveTab('wscat')}
          className={`pb-3 text-xs md:text-sm font-semibold transition-all relative ${
            activeTab === 'wscat'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-slate-200 font-bold'
          }`}
        >
          محاكي وطرفية wscat (الربط والاتصال الفوري الخام)
        </button>
        <button
          onClick={() => setActiveTab('piesocket_sdk')}
          className={`pb-3 text-xs md:text-sm font-semibold transition-all relative ${
            activeTab === 'piesocket_sdk'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-slate-200 font-bold'
          }`}
        >
          بوابة حزمة PieSocket SDK المتكاملة ✨
        </button>
      </div>

      {/* Main Grid: Control Station & CLI emulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Right Side: Command Console (7 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold text-white font-bold font-sans">طرفية wscat التفاعلية</span>
            </div>
            
            {/* Terminal Theme Select */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-700 font-sans">النمط:</span>
              <button 
                onClick={() => setTerminalTheme('dracula')}
                className={`w-3 h-3 rounded-full bg-indigo-600 border ${terminalTheme === 'dracula' ? 'border-white scale-125' : 'border-slate-900'} transition-transform`}
                title="Dracula Theme"
              />
              <button 
                onClick={() => setTerminalTheme('matrix')}
                className={`w-3 h-3 rounded-full bg-emerald-500 border ${terminalTheme === 'matrix' ? 'border-white scale-125' : 'border-slate-900'} transition-transform`}
                title="Matrix Green"
              />
              <button 
                onClick={() => setTerminalTheme('amber')}
                className={`w-3 h-3 rounded-full bg-amber-500 border ${terminalTheme === 'amber' ? 'border-white scale-125' : 'border-slate-900'} transition-transform`}
                title="Fallout Amber"
              />
              <button 
                onClick={() => setTerminalTheme('classic')}
                className={`w-3 h-3 rounded-full bg-zinc-200 border ${terminalTheme === 'classic' ? 'border-indigo-500 scale-125' : 'border-slate-900'} transition-transform`}
                title="Clean Gray"
              />
            </div>
          </div>

          {/* Actual Terminal Window Box */}
          <div className={`flex flex-col h-[520px] rounded-3xl border ${themeColors.bg} p-6 shadow-2xl relative overflow-hidden transition-all duration-300`}>
            {/* Window Top Buttons Decor */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 z-10">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="absolute top-4 right-6 text-[10px] opacity-40 font-mono select-none" dir="ltr">
              wscat --version 5.2.0
            </div>

            {/* Scrollable Output Screen */}
            <div 
              className="flex-1 overflow-y-auto space-y-2 mt-4 mb-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent select-text"
              dir="ltr"
            >
              {terminalLines.map((line, idx) => {
                let colorClass = themeColors.text;
                if (line.type === 'system') colorClass = 'text-sky-400 font-semibold';
                if (line.type === 'error') colorClass = 'text-red-400 font-medium font-sans';
                if (line.type === 'success') colorClass = 'text-emerald-400 font-medium';
                if (line.type === 'input') colorClass = line.isPrefixCmd ? 'text-yellow-300 font-semibold' : 'text-slate-200 font-bold italic';
                
                return (
                  <div key={idx} className="group relative py-0.5 rounded px-1 transition-all duration-150">
                    <div className="flex items-start gap-2.5">
                      <span className="text-[10px] text-slate-200 font-bold select-none font-mono mt-1 opacity-60">
                        [{line.timestamp}]
                      </span>
                      <pre className={`flex-1 text-xs whitespace-pre-wrap ${colorClass}`}>
                        {line.text}
                      </pre>
                    </div>

                    {/* Copy Hover Link */}
                    <button 
                      onClick={() => copyTextToClipboard(line.text, idx)}
                      className="absolute right-2 top-0.5 opacity-0 bg-slate-800/80 text-white rounded p-1 transition"
                      title="نسخ السطر"
                    >
                      {copiedIndex === idx ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })}

              {isInstalling && (
                <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs pl-12 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>برجاء الانتظار، جاري تنزيل الملفات البرمجية من السحابة...</span>
                </div>
              )}
              
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Input Line Form */}
            <form onSubmit={handleCommandSubmit} className="mt-auto border-t border-slate-800/50 pt-4 flex items-center">
              <span className={`text-md font-bold font-mono mr-2 z-10 ${themeColors.inputLine} select-none`}>
                {socket && connectionStatus === 'connected' ? 'ws_msg >' : '$'}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder={
                  socket && connectionStatus === 'connected'
                    ? "اكتب الرسالة المراد إرسالها واضغط Enter..."
                    : !wscatInstalled 
                      ? "جرب كتابة: npm install -g wscat واضغط Enter"
                      : "جرب: wscat -c wss://echo.websocket.org"
                }
                className={`flex-1 bg-transparent border-0 outline-none p-0 text-xs focus:ring-0 ${themeColors.input} relative z-10`}
                dir="ltr"
              />
              <button 
                type="submit" 
                className="p-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-bold text-xs transition z-10"
              >
                {!socket ? 'تنفيذ الأوامر' : 'إرسال'}
              </button>
            </form>
          </div>
        </div>

        {/* Left Side: Controller Station GUI (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {activeTab === 'piesocket_sdk' ? (
            <>
              {/* GUI connection HUD for PieSocket SDK */}
              <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-white font-sans flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-indigo-400" />
                    لوحة تحكم حزمة PieSocket SDK 🚀
                  </h2>
                  <p className="text-[11px] text-slate-200 font-bold">
                    تهيّئ حزمة التوصيل الرسمية PieSocket JS مع غرف الاستماع المخصصة وتجاوز أخطاء البث.
                  </p>
                </div>

                {/* Cluster ID and Custom API inputs */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 text-right">
                      <label className="text-[10px] font-medium text-white font-bold block font-sans">معرف العنقود (Cluster ID):</label>
                      <input
                        type="text"
                        value={clusterId}
                        onChange={(e) => setClusterId(e.target.value)}
                        placeholder="e.g. free.blr2"
                        disabled={pieSocketStatus === 'connected' || pieSocketStatus === 'connecting'}
                        className="w-full bg-slate-950 border border-slate-800/80 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500 disabled:opacity-50"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1 text-right">
                      <label className="text-[10px] font-medium text-white font-bold block font-sans">اسم قناة البث (Channel/Room):</label>
                      <input
                        type="text"
                        value={channelRoom}
                        onChange={(e) => setChannelRoom(e.target.value)}
                        placeholder="chat-room"
                        disabled={pieSocketStatus === 'connected' || pieSocketStatus === 'connecting'}
                        className="w-full bg-[#05070f] border border-slate-800/80 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500 disabled:opacity-50"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-right">
                    <label className="text-[10px] font-medium text-white font-bold block font-sans text-right">مفتاح المنصة (API Key):</label>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="PieSocket API Key"
                      disabled={pieSocketStatus === 'connected' || pieSocketStatus === 'connecting'}
                      className="w-full bg-slate-950 border border-slate-800/80 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500 disabled:opacity-50"
                      dir="ltr"
                    />
                  </div>

                  <div className="flex items-center justify-between pb-1 text-right">
                    <span className="text-[10px] text-slate-200 font-bold font-sans">إرسال الحدث والرسالة لذات المرسِل:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={psNotifySelf} 
                        onChange={(e) => setPsNotifySelf(e.target.checked)}
                        disabled={pieSocketStatus === 'connected' || pieSocketStatus === 'connecting'}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:left-[2px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0a1628] after:border-[#1e3a5f] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <button
                    onClick={() => connectPieSocketSDK()}
                    className={`w-full py-2.5 rounded-xl font-sans text-xs flex items-center justify-center gap-1.5 font-bold transition-all ${
                      pieSocketStatus === 'connected' || pieSocketStatus === 'connecting'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : 'bg-indigo-600 border border-indigo-500 text-white shadow-lg shadow-indigo-600/15'
                    }`}
                  >
                    {pieSocketStatus === 'connected' || pieSocketStatus === 'connecting' ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        فصل عميل الـ SDK
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        تشغيل قناة حزمة الـ SDK ⚡
                      </>
                    )}
                  </button>
                </div>

                {/* Connection Status Badge HUD */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/65 grid grid-cols-2 gap-4">
                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] text-slate-700 block">حالة عميل SDK:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        pieSocketStatus === 'connected' ? 'bg-emerald-500' :
                        pieSocketStatus === 'connecting' ? 'bg-indigo-400 animate-bounce' :
                        pieSocketStatus === 'error' ? 'bg-red-500' : 'bg-slate-600'
                      }`} />
                      <span className="text-[11px] font-bold text-white capitalize">
                        {pieSocketStatus === 'connected' ? 'مشترك' :
                         pieSocketStatus === 'connecting' ? 'يتصل...' :
                         pieSocketStatus === 'error' ? 'فشل الاتصال' : 'غير نشط'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] text-slate-700 block">المستمعين المتاحين:</span>
                    <span className="text-xs font-bold text-slate-350 font-mono">
                      {pieSocketStatus === 'connected' ? '1 (مستمع نشط)' : '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* PieSocket Event Publisher */}
              <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                    <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                    نشر حدث عبر قناة PieSocket (Publish)
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="text-right">
                    <label className="text-[10px] font-medium text-white font-bold block mb-1 font-sans">اسم الحدث المراد نشره (Event Name):</label>
                    <select
                      id="pie-event-select"
                      defaultValue="new_message"
                      className="w-full bg-[#05070f] border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-sans outline-none focus:border-indigo-500"
                    >
                      <option value="new_message">رسالة عامة (new_message)</option>
                      <option value="judicial_event">إشعار قضائي ذكي (judicial_event)</option>
                    </select>
                  </div>

                  <div className="text-right">
                    <label className="text-[10px] font-medium text-white font-bold block mb-1 font-sans font-sans text-right">محتوى البيانات (Payload JSON):</label>
                    <textarea
                      id="pie-payload-textarea"
                      defaultValue={JSON.stringify({ message: "مستند قضائي فوري جاهز للتوريد", case_status: "مكتمل", sender: "مدير منصة العدالة" }, null, 2)}
                      rows={4}
                      className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-indigo-500"
                      dir="ltr"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const selectEl = document.getElementById('pie-event-select') as HTMLSelectElement;
                      const textareaEl = document.getElementById('pie-payload-textarea') as HTMLTextAreaElement;
                      const eventName = selectEl ? selectEl.value : 'new_message';
                      let payload: any = textareaEl ? textareaEl.value : '{}';
                      try {
                        payload = JSON.parse(payload);
                      } catch (e) {
                        // Stay as string
                      }
                      publishPieSocketEvent(eventName, payload);
                    }}
                    disabled={pieSocketStatus !== 'connected'}
                    className="w-full bg-indigo-600 border border-indigo-500 text-white font-bold py-2 rounded-xl text-xs font-sans flex items-center justify-center gap-1.5 transition disabled:opacity-40 shadow-lg shadow-indigo-600/10"
                  >
                    <Send className="w-3.5 h-3.5" />
                    نشر الحدث اللحظي عبر العنقود
                  </button>
                </div>

                {/* Metrics indicators */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/50">
                  <div className="bg-slate-950/50 p-2 text-center rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-700 block">مرسل عبر SDK:</span>
                    <span className="text-xs font-black text-indigo-400 font-mono inline-block">{sentCount}</span>
                  </div>
                  <div className="bg-slate-950/50 p-2 text-center rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-700 block">مستقبل عبر SDK:</span>
                    <span className="text-xs font-black text-emerald-400 font-mono inline-block">{recvCount}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* GUI connection HUD */}
              <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md space-y-6">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-white font-sans flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-amber-500" />
                    لوحة تحكم الاتصال التفاعلية
                  </h2>
                  <p className="text-[11px] text-slate-200 font-bold">
                    أدخل الرابط يدوياً أو اختر من الخوادم التجريبية المعدة مسبقاً.
                  </p>
                </div>

                {/* Input target URL */}
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-white font-bold block font-sans">
                    رابط خادم البث الفوري (WebSocket URL):
                  </label>
                  <div className="flex gap-2" dir="ltr">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="wss://..."
                      disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
                      className="flex-1 bg-slate-950 border border-slate-800/80 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 disabled:opacity-50"
                    />
                    
                    <button
                      onClick={handleGuiConnect}
                      className={`px-4 rounded-xl font-sans text-xs flex items-center gap-1.5 font-medium transition-all ${
                        connectionStatus === 'connected' || connectionStatus === 'connecting'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : 'bg-primary border border-primary-hover text-slate-950 font-bold shadow-lg shadow-amber-500/10'
                      }`}
                    >
                      {connectionStatus === 'connected' || connectionStatus === 'connecting' ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          فصل
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          ربط
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Connection Status Badge HUD */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/60 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-700 block">حالة الاتصال الالكترونية:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                        connectionStatus === 'connecting' ? 'bg-amber-400 animate-bounce' :
                        connectionStatus === 'error' ? 'bg-red-500' : 'bg-slate-600'
                      }`} />
                      <span className="text-xs font-bold text-white capitalize">
                        {connectionStatus === 'connected' ? 'نشط (Active)' :
                         connectionStatus === 'connecting' ? 'جاري الاتصال...' :
                         connectionStatus === 'error' ? 'حدث خطأ' : 'غير متصل'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-700 block">استجابة البث (Latency):</span>
                    <span className="text-xs font-bold text-slate-350 font-mono">
                      {latency !== null ? `${latency}ms` : '--'}
                    </span>
                  </div>
                </div>

                {/* Quick Presets Select Buttons */}
                <div className="space-y-2">
                  <span className="text-[11px] font-medium text-white font-bold block font-sans">
                    خوادم ومنافذ الربط الجاهزة للاختبار:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { name: 'بث منصة العدالة الموحد (PieSocket Primary)', desc: 'اتصال البث الفوري من خلال مفتاح المنصة الأصلي القدير لتبادل الإشعارات وصكوك الأحكام ومحاضر الجلسات.', url: 'wss://free.blr2.piesocket.com/v3/1?api_key=ZC6aeOdzacSmOxJfgfuCUtk2ip1A2EMSjqgx31gV&notify_self=1' },
                      { name: 'قناة الربط الاحتياطية (PieSocket Secondary)', desc: 'قناة بث رديفة مشفرة لتبادل البيانات والمحاضر اللحظية.', url: 'wss://free.blr2.piesocket.com/v3/1?api_key=hqFf68rqKOotayVv8DHxiCvrIc7Louwhju0FDgZh&notify_self=1' },
                      { name: 'خادم صدى الويب (Echo Test Server)', desc: 'يعيد إرسال أي رسالة تصدر منك بشكل آلي وآمن للتأكد من حالة اتصال الشبكة بنجاح.', url: 'wss://echo.websocket.org' }
                    ].map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (connectionStatus !== 'connected' && connectionStatus !== 'connecting') {
                            setUrl(preset.url);
                            setTerminalLines(prev => [
                              ...prev,
                              { type: 'system', text: `تم اختيار قالب خادم الاستجابة: ${preset.name}`, timestamp: getFormattedTime() }
                            ]);
                          }
                        }}
                        disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
                        className="flex flex-col items-start text-right p-3 rounded-xl border border-slate-800 bg-slate-950/40 transition disabled:opacity-40"
                      >
                        <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {preset.name}
                        </span>
                        <span className="text-[10px] text-slate-700 mt-0.5">{preset.desc}</span>
                        <span className="text-[11px] text-slate-200 font-bold font-mono mt-1 break-all" dir="ltr">{preset.url}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Prompt GUI Sender (Only shown/interactive when connected) */}
              <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                    <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                    لوحة إرسال الرسائل والصكوك الفورية
                  </h3>
                  
                  <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800" dir="ltr">
                    <button
                      type="button"
                      onClick={() => setPayloadType('text')}
                      className={`px-2 py-0.5 rounded text-[10px] font-sans ${payloadType === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-200 font-bold'}`}
                    >
                      TEXT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPayloadType('json');
                        setMessageInput(JSON.stringify({ event: "ping", data: { client: "wscat-client", timeMs: Date.now() } }, null, 2));
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-sans ${payloadType === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-200 font-bold'}`}
                    >
                      JSON
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={payloadType === 'json' ? '{\n  "key": "value"\n}' : 'أدخل محتوى الرسالة...'}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 placeholder-slate-600"
                    dir={payloadType === 'json' || url.includes('binance') ? 'ltr' : 'rtl'}
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={triggerQuickSend}
                      disabled={connectionStatus !== 'connected'}
                      className="flex-1 bg-emerald-600 border border-emerald-500 text-white font-bold py-2 rounded-xl text-xs font-sans flex items-center justify-center gap-1.5 transition disabled:opacity-40 shadow-lg shadow-emerald-500/10"
                    >
                      <Send className="w-3.5 h-3.5" />
                      إرسال الطرد الإلكتروني
                    </button>

                    <button
                      onClick={() => {
                        setSentCount(0);
                        setRecvCount(0);
                        setTerminalLines(prev => [
                          ...prev,
                          { type: 'system', text: 'تمت إعادة تعيين عدد مخرجات البيانات الإحصائية للصفر.', timestamp: getFormattedTime() }
                        ]);
                      }}
                      title="تصفير الإحصائية"
                      className="p-2 border border-slate-850 bg-slate-950 rounded-xl text-slate-200 font-bold transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics indicators */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/50">
                  <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-850 text-center">
                    <span className="text-[10px] text-slate-700 block">الباقات الصادرة (Sent):</span>
                    <span className="text-sm font-black text-indigo-400 font-mono mt-0.5 inline-block">{sentCount}</span>
                  </div>
                  <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-850 text-center">
                    <span className="text-[10px] text-slate-700 block">الباقات الواردة (Recv):</span>
                    <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 inline-block">{recvCount}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Quick Logs Exporter */}
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/55 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-200 font-bold" />
              <span className="text-xs font-sans text-white font-bold">سجل البيانات المتدفقة</span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={exportLogHistory}
                className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-800 bg-slate-900 text-[10px] font-sans text-white font-bold transition"
              >
                <Download className="w-3 h-3" />
                تحميل السجل (.txt)
              </button>
              <button
                onClick={() => setTerminalLines([])}
                className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-800 bg-slate-900 text-[10px] font-sans text-white font-bold transition"
              >
                تفريغ الشاشة
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modern Documentation section at the bottom */}
      <div className="bg-slate-900/20 p-6 rounded-3xl border border-slate-800/40 space-y-4">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
          <Sparkles className="w-4 h-4 text-amber-400" />
          حول بروتوكول البث والاستدعاء الذكي في الأنظمة القضائية
        </h3>
        <p className="text-xs text-slate-200 font-bold leading-relaxed font-sans">
          تعتمد المنصات الرقمية الكبرى (مثل بوابة ناجز السحابية ونظام معين لديوان المظالم بالمملكة) على الربط ثنائي الاتجاه من خلال 
          بروتوكول WebSocket لتمكين التنبيهات الفورية، التحديثات المباشرة لجدول الجلسات، والمزامنة اللحظية لعقود الضمان والدفوع القضائية. 
          تساعدك أداة <code className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-amber-400 text-[11px]">wscat</code> كمهندس نظام على إجراء الاتصالات الفورية واختبار قنوات الربط للتأكد من سلامة نقل الصكوك والمستندات قبل تفعيل قنوات الإنتاج الفعلية.
        </p>
      </div>

      {/* Interactive Command help Modal Dialog */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 relative text-right">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <TerminalIcon className="w-5 h-5 text-amber-400" />
              دليل تشغيل واجهات wscat
            </h3>
            
            <p className="text-xs text-slate-200 font-bold leading-relaxed font-sans">
              يمكنك محاكاة الخطوات البرمجية الدقيقة المذكورة في طلب التكامل كالتالي:
            </p>

            <div className="space-y-3 font-mono text-left" dir="ltr">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 relative group">
                <span className="text-[10px] text-slate-700 block mb-1 font-sans text-right">خطوة 1: تثبيت الحزمة على الخادم:</span>
                <code className="text-emerald-400 text-xs">npm install -g wscat</code>
                <button 
                  onClick={() => copyTextToClipboard('npm install -g wscat', 999)}
                  className="absolute right-2 top-2 bg-slate-900 rounded p-1 text-slate-200 font-bold"
                >
                  {copiedIndex === 999 ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 relative group">
                <span className="text-[10px] text-slate-700 block mb-1 font-sans text-right">خطوة 2: تشغيل الاتصال والربط:</span>
                <code className="text-emerald-400 text-xs">wscat -c wss://echo.websocket.org</code>
                <button 
                  onClick={() => copyTextToClipboard('wscat -c wss://echo.websocket.org', 998)}
                  className="absolute right-2 top-2 bg-slate-900 rounded p-1 text-slate-200 font-bold"
                >
                  {copiedIndex === 998 ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs transition font-sans"
              >
                إغلاق وجهة المساعد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
