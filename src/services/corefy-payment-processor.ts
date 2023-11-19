/* import {
    AbstractPaymentProcessor,
    PaymentProcessorContext,
    PaymentProcessorError,
    PaymentProcessorSessionResponse,
    PaymentSessionStatus
  } from "@medusajs/medusa";
  import CorefySDK from '@paycore/merchant-sdk-js';
  
  
  class CorefyPaymentProcessor extends AbstractPaymentProcessor {
    retrievePayment(paymentSessionData: Record<string, unknown>): Promise<PaymentProcessorError | Record<string, unknown>> {
        throw new Error("Method not implemented.");
    }
    static identifier = "corefy";
    private corefyClient: CorefySDK;
  
    constructor(container, options) {
      super(container);
      this.corefyClient = new CorefySDK({
        apiKey: options.apiKey,
        // other initialization parameters
      });
    }
  
    private handleError(error: any): PaymentProcessorError {
        return {
          error: error.message || 'An unknown error occurred',
          detail: error
        };
      }
  
    async initiatePayment(context: PaymentProcessorContext): Promise<PaymentProcessorSessionResponse> {
      try {
        const response = await this.corefyClient.makePaymentPrerequest(context.currency_code);
        return { session_data: response };
      } catch (error) {
        return { error: this.handleError(error) };
      }
    }
  
    async capturePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown>> {
      try {
        const paymentId = paymentSessionData.paymentId;
        const response = await this.corefyClient.capturePayment(paymentId);
        return response;
      } catch (error) {
        return { error: this.handleError(error) };
      }
    }
  
    async refundPayment(paymentSessionData: Record<string, unknown>, refundAmount: number): Promise<Record<string, unknown>> {
      try {
        const paymentId = paymentSessionData.paymentId;
        const response = await this.corefyClient.refundPayment(paymentId, refundAmount);
        return response;
      } catch (error) {
        return { error: this.handleError(error) };
      }
    }
  
    async getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus> {
      try {
        const paymentId = paymentSessionData.paymentId;
        const response = await this.corefyClient.getPaymentStatus(paymentId);
        return response.status; // Map to PaymentSessionStatus enum
      } catch (error) {
        throw this.handleError(error);
      }
    }
  
    async authorizePayment(paymentSessionData: Record<string, unknown>, context: Record<string, unknown>): Promise<{ status: PaymentSessionStatus; data: Record<string, unknown>; }> {
      try {
        const paymentId = paymentSessionData.paymentId;
        const response = await this.corefyClient.authorizePayment(paymentId);
        return { status: response.status, data: response.data };
      } catch (error) {
        return { error: this.handleError(error) };
      }
    }
  
    async cancelPayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown>> {
      try {
        const paymentId = paymentSessionData.paymentId;
        const response = await this.corefyClient.cancelPayment(paymentId);
        return response;
      } catch (error) {
        return { error: this.handleError(error) };
      }
    }
  
    async deletePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown>> {
      try {
        const paymentId = paymentSessionData.paymentId;
        const response = await this.corefyClient.deletePaymentSession(paymentId);
        return response;
      } catch (error) {
        return { error: this.handleError(error) };
      }
    }
  
    async updatePayment(context: PaymentProcessorContext): Promise<void | PaymentProcessorSessionResponse> {
      try {
        // Example: Update the payment session based on context
        // Implement logic to update the payment session here
        // This might involve updating the amount, currency, etc.
        return; // Return updated session data or void
      } catch (error) {
        return { error: this.handleError(error) };
      }
    }
  
    async updatePaymentData(sessionId: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
      try {
        // Example: Update payment data
        // Implement logic to update the payment data here
        // This might involve updating specific transaction details
        return data; // Return the updated data
      } catch (error) {
        return { error: this.handleError(error) };
      }
    }
  }
  
  export default CorefyPaymentProcessor;
   */