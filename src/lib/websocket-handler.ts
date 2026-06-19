
/**
 * PieSocket Stability Handler
 * Manages WebSocket connections with exponential backoff, timeouts, and state tracking
 * to avoid "WebSocket closed without opened" errors.
 */

interface StableSocketOptions {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  timeout?: number;
  maxRetries?: number;
}

export class StableWebSocket {
  private url: string;
  private socket: WebSocket | null = null;
  private options: StableSocketOptions;
  private retryCount: number = 0;
  private reconnectTimer: any = null;
  private connectionTimeoutTimer: any = null;
  private isConnecting: boolean = false;
  private wasPurposefullyClosed: boolean = false;

  constructor(url: string, options: StableSocketOptions = {}) {
    this.url = url;
    this.options = {
      timeout: 10000, // 10 seconds default timeout
      maxRetries: 10,
      ...options
    };
  }

  connect() {
    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.wasPurposefullyClosed = false;

    // Clear existing timers
    if (this.connectionTimeoutTimer) clearTimeout(this.connectionTimeoutTimer);

    try {
      this.socket = new WebSocket(this.url);

      // Timeout logic: if connection takes too long, close and retry
      this.connectionTimeoutTimer = setTimeout(() => {
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
          console.warn(`[StableWS] Connection timeout reached for ${this.url}. Retrying...`);
          this.closeAndRetry();
        }
      }, this.options.timeout);

      this.socket.onopen = (e) => {
        this.isConnecting = false;
        this.retryCount = 0;
        if (this.connectionTimeoutTimer) clearTimeout(this.connectionTimeoutTimer);
        console.log(`[StableWS] Connected successfully to ${this.url}`);
        this.options.onOpen?.(e);
      };

      this.socket.onmessage = (e) => {
        this.options.onMessage?.(e);
      };

      this.socket.onclose = (e) => {
        this.isConnecting = false;
        if (this.connectionTimeoutTimer) clearTimeout(this.connectionTimeoutTimer);
        
        if (!this.wasPurposefullyClosed) {
          console.warn(`[StableWS] Connection closed unexpectedly. Reason: ${e.reason || 'No reason'}`);
          this.scheduleReconnect();
        }
        
        this.options.onClose?.(e);
      };

      this.socket.onerror = (e) => {
        this.isConnecting = false;
        console.error(`[StableWS] WebSocket error:`, e);
        this.options.onError?.(e);
      };

    } catch (err) {
      this.isConnecting = false;
      console.error(`[StableWS] Failed to initiate connection:`, err);
      this.scheduleReconnect();
    }
  }

  private closeAndRetry() {
    if (this.socket) {
      this.socket.onclose = null; // Prevent onclose loop
      this.socket.close();
    }
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.retryCount >= (this.options.maxRetries || 10)) {
      console.error(`[StableWS] Max retries reached (${this.retryCount}). Stopping reconnection.`);
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s... max 30s
    const delay = Math.min(30000, Math.pow(2, this.retryCount) * 1000);
    this.retryCount++;

    console.log(`[StableWS] Scheduling reconnection try #${this.retryCount} in ${delay}ms`);
    
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.warn(`[StableWS] Cannot send message: Socket is not open (State: ${this.socket?.readyState})`);
    }
  }

  close() {
    this.wasPurposefullyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.connectionTimeoutTimer) clearTimeout(this.connectionTimeoutTimer);
    if (this.socket) {
      this.socket.close();
    }
  }

  getReadyState() {
    return this.socket ? this.socket.readyState : WebSocket.CLOSED;
  }
}
