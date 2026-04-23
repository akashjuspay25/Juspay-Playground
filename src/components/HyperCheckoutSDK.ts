/**
 * HyperCheckout SDK Simulation
 * Mimics the real Android SDK behavior for testing integration
 */

export type SDKEvent =
  | 'initiate_started'
  | 'initiate_result'
  | 'process_started'
  | 'show_loader'
  | 'hide_loader'
  | 'process_result'
  | 'terminate';

export type PaymentStatus =
  | 'charged'
  | 'pending'
  | 'authentication_failed'
  | 'authorization_failed'
  | 'cancelled'
  | 'pending_vbv';

export interface SDKResponse {
  event: SDKEvent;
  payload?: {
    status?: PaymentStatus | 'success' | 'error';
    orderId?: string;
    transactionId?: string;
    amount?: string;
    currency?: string;
    paymentMethod?: string;
    errorMessage?: string;
    errorCode?: string;
    sdkPayload?: any;
  };
  error?: {
    message: string;
    code: string;
  };
}

export type SDKCallback = (response: SDKResponse) => void;

export class HyperServices {
  private callback: SDKCallback | null = null;
  private isInitialized = false;
  private isProcessing = false;
  private currentPayload: any = null;
  private merchantId: string = '';
  private clientId: string = '';
  private environment: 'sandbox' | 'production' = 'sandbox';

  /**
   * Set callback listener for SDK events
   * Equivalent to: hyperServices.setCallbackListener(callback)
   */
  setCallbackListener(callback: SDKCallback): void {
    this.callback = callback;
    this.log('sdk', 'Callback listener registered');
  }

  /**
   * Pre-fetch SDK configuration
   * Equivalent to: HyperCheckout.preFetch(context, clientId)
   */
  static preFetch(merchantId: string, clientId: string): void {
    console.log('[HyperCheckout] Pre-fetching SDK config:', { merchantId, clientId });
  }

  /**
   * Initiate the SDK
   * Equivalent to: hyperServices.initiate(activity, initiatePayload)
   */
  initiate(payload: any): void {
    this.log('info', 'HyperServices.initiate() called');

    if (!this.callback) {
      console.error('[HyperCheckout] No callback listener set. Call setCallbackListener first.');
      return;
    }

    this.currentPayload = payload;
    this.merchantId = payload?.payload?.merchantId || '';
    this.clientId = payload?.payload?.clientId || '';
    this.environment = payload?.payload?.environment || 'sandbox';

    // Emit initiate_started event
    this.emit({
      event: 'initiate_started',
      payload: { status: 'success' }
    });

    // Simulate SDK initialization delay
    this.log('info', 'Initializing HyperCheckout SDK...');
    this.log('sdk', 'SDK Config', JSON.stringify({
      merchantId: this.merchantId,
      clientId: this.clientId,
      environment: this.environment,
      sdkVersion: '2.2.5'
    }, null, 2));

    setTimeout(() => {
      this.isInitialized = true;
      this.log('success', 'SDK initialized successfully');

      // Emit initiate_result event
      this.emit({
        event: 'initiate_result',
        payload: {
          status: 'success',
          sdkPayload: {
            merchantId: this.merchantId,
            clientId: this.clientId,
            environment: this.environment
          }
        }
      });
    }, 800);
  }

  /**
   * Process payment
   * Equivalent to: hyperServices.process(activity, processPayload)
   */
  process(payload: any): void {
    this.log('info', 'HyperServices.process() called');

    if (!this.isInitialized) {
      this.log('error', 'SDK not initialized. Call initiate() first.');
      this.emit({
        event: 'process_result',
        error: {
          message: 'SDK not initialized',
          code: 'SDK_NOT_INITIALIZED'
        }
      });
      return;
    }

    if (this.isProcessing) {
      this.log('warning', 'Payment already in progress');
      return;
    }

    this.isProcessing = true;
    this.currentPayload = payload;

    const orderId = payload?.payload?.orderId;
    const amount = payload?.payload?.amount;

    this.log('sdk', 'Process Payload', JSON.stringify({
      requestId: payload?.requestId,
      service: payload?.service,
      orderId: orderId,
      amount: amount,
      action: payload?.payload?.action
    }, null, 2));

    // Emit process_started
    this.emit({
      event: 'process_started',
      payload: { orderId, amount }
    });

    // Show loader
    setTimeout(() => {
      this.emit({ event: 'show_loader' });
      this.log('info', 'Loading payment page...');
    }, 100);

    // Hide loader and show payment UI
    setTimeout(() => {
      this.emit({ event: 'hide_loader' });
      this.log('success', 'Payment page ready');
    }, 600);
  }

  /**
   * Submit payment with selected method
   * This simulates the actual payment processing
   */
  submitPayment(paymentMethod: string, paymentDetails?: any): Promise<SDKResponse> {
    return new Promise((resolve) => {
      if (!this.isProcessing) {
        resolve({
          event: 'process_result',
          error: { message: 'No active payment session', code: 'NO_ACTIVE_SESSION' }
        });
        return;
      }

      this.log('info', `Processing ${paymentMethod} payment...`);
      this.emit({ event: 'show_loader' });

      const orderId = this.currentPayload?.payload?.orderId;
      const amount = this.currentPayload?.payload?.amount;

      // Simulate processing delay
      setTimeout(() => {
        this.emit({ event: 'hide_loader' });

        // Determine success/failure (90% success rate for demo)
        const isSuccess = Math.random() > 0.1;

        if (isSuccess) {
          const response: SDKResponse = {
            event: 'process_result',
            payload: {
              status: 'charged',
              orderId,
              transactionId: `TXN_${Date.now()}`,
              amount,
              currency: 'INR',
              paymentMethod
            }
          };
          this.log('success', 'Payment charged successfully');
          this.log('sdk', 'process_result', JSON.stringify(response.payload, null, 2));
          this.isProcessing = false;
          resolve(response);
          this.emit(response);
        } else {
          const errors = [
            { code: 'AUTH_FAILURE', message: 'Authentication failed' },
            { code: 'INSUFFICIENT_FUNDS', message: 'Insufficient funds' },
            { code: 'TIMEOUT', message: 'Transaction timeout' },
            { code: 'CANCELLED', message: 'Payment cancelled by user' }
          ];
          const error = errors[Math.floor(Math.random() * errors.length)];

          const response: SDKResponse = {
            event: 'process_result',
            payload: {
              status: error.code === 'CANCELLED' ? 'cancelled' : 'authorization_failed',
              orderId,
              errorCode: error.code,
              errorMessage: error.message
            }
          };
          this.log('error', `Payment failed: ${error.message}`);
          this.isProcessing = false;
          resolve(response);
          this.emit(response);
        }
      }, 2000);
    });
  }

  /**
   * Terminate SDK
   * Equivalent to: hyperServices.terminate()
   */
  terminate(): void {
    this.log('info', 'HyperServices.terminate() called');
    this.isInitialized = false;
    this.isProcessing = false;
    this.callback = null;
    this.currentPayload = null;
    this.emit({ event: 'terminate' });
  }

  /**
   * Check if SDK is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if payment is in progress
   */
  isPaymentInProgress(): boolean {
    return this.isProcessing;
  }

  /**
   * Get current payload
   */
  getCurrentPayload(): any {
    return this.currentPayload;
  }

  /**
   * Private helper to emit events
   */
  private emit(response: SDKResponse): void {
    if (this.callback) {
      // Simulate Android's callback on main thread
      setTimeout(() => this.callback?.(response), 0);
    }
  }

  /**
   * Private helper for logging
   */
  private log(type: 'info' | 'success' | 'error' | 'warning' | 'sdk', message: string, details?: string): void {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });

    const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
    console.log(prefix, message);

    // Dispatch custom event for UI consumption
    window.dispatchEvent(new CustomEvent('hypercheckout-log', {
      detail: { timestamp, type, message, details }
    }));
  }
}

/**
 * HyperCheckout static class simulation
 * Equivalent to: HyperCheckout.initiate(), HyperCheckout.process(), etc.
 */
export class HyperCheckout {
  private static instance: HyperServices | null = null;
  private static callback: SDKCallback | null = null;

  /**
   * Set callback listener globally
   */
  static setHyperCheckoutCallback(callback: SDKCallback): void {
    this.callback = callback;
    if (this.instance) {
      this.instance.setCallbackListener(callback);
    }
  }

  /**
   * Pre-fetch SDK configuration
   */
  static preFetch(context: any, clientId: string): void {
    console.log('[HyperCheckout] Pre-fetching for client:', clientId);
  }

  /**
   * Initiate SDK
   */
  static initiate(context: any, payload: any): void {
    if (!this.instance) {
      this.instance = new HyperServices();
      if (this.callback) {
        this.instance.setCallbackListener(this.callback);
      }
    }
    this.instance.initiate(payload);
  }

  /**
   * Process payment
   */
  static process(context: any, payload: any): void {
    if (!this.instance) {
      console.error('[HyperCheckout] SDK not initialized. Call initiate() first.');
      return;
    }
    this.instance.process(payload);
  }

  /**
   * Terminate SDK
   */
  static terminate(): void {
    this.instance?.terminate();
    this.instance = null;
  }

  /**
   * Get instance (for advanced usage)
   */
  static getInstance(): HyperServices | null {
    return this.instance;
  }
}

export default HyperServices;
