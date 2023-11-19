// src/types/corefy-payment-processor.d.ts

import {
    AbstractPaymentProcessor,
    PaymentProcessorContext,
    PaymentProcessorSessionResponse,
    PaymentProcessorError,
    PaymentSessionStatus
  } from "@medusajs/medusa";
  
  declare module '@paycore/merchant-sdk-js' {
    export interface CorefySDKOptions {
      apiKey: string;
      // Add other initialization parameters as needed
    }
  
    export interface CorefyPaymentResponse {
      // Define the structure based on SDK's response
    }
  
    export default class CorefySDK {
      constructor(options: CorefySDKOptions);
  
      makePaymentPrerequest(currency_code: string): Promise<CorefyPaymentResponse>;
      capturePayment(paymentId: string): Promise<CorefyPaymentResponse>;
      refundPayment(paymentId: string, refundAmount: number): Promise<CorefyPaymentResponse>;
      getPaymentStatus(paymentId: string): Promise<{ status: PaymentSessionStatus }>;
      authorizePayment(paymentId: string): Promise<{ status: PaymentSessionStatus, data: Record<string, unknown> }>;
      cancelPayment(paymentId: string): Promise<CorefyPaymentResponse>;
      deletePaymentSession(paymentId: string): Promise<CorefyPaymentResponse>;
      // Add other methods as needed
    }
  }
  
  export class CorefyPaymentProcessor extends AbstractPaymentProcessor {
    static identifier: string;
    private corefyClient: CorefySDK;
  
    constructor(container: any, options: any);
    handleError(error: any): PaymentProcessorError;
  
    // Add other methods with their return types
    initiatePayment(context: PaymentProcessorContext): Promise<PaymentProcessorSessionResponse>;
    capturePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown>>;
    refundPayment(paymentSessionData: Record<string, unknown>, refundAmount: number): Promise<Record<string, unknown>>;
    getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus>;
    authorizePayment(paymentSessionData: Record<string, unknown>, context: Record<string, unknown>): Promise<{ status: PaymentSessionStatus; data: Record<string, unknown>; }>;
    cancelPayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown>>;
    deletePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown>>;
    updatePayment(context: PaymentProcessorContext): Promise<void | PaymentProcessorSessionResponse>;
    updatePaymentData(sessionId: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  }
  