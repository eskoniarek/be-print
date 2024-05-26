import axios from 'axios';
import * as crypto from 'crypto';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  Cart,
  Data,
  Payment,
  PaymentSession,
  PaymentSessionStatus,
  TransactionBaseService
} from '@medusajs/medusa';

interface FourG12hsPaymentPluginOptions {
  merchantId: string;
  testMode?: boolean;
  callbackUrl?: string;
}

class FourG12hsProviderService extends TransactionBaseService {
  static identifier = '4g12hs';
  protected manager_: EntityManager;
  protected transactionManager_: EntityManager;
  protected options_: FourG12hsPaymentPluginOptions;

  constructor(container: any, options: FourG12hsPaymentPluginOptions) {
    super(container);
    this.manager_ = container.manager;
    this.transactionManager_ = container.transactionManager;
    this.options_ = options;
  }

  private generateSignature(params: Record<string, string | undefined>, includeEmpty: boolean = false): string {
    const filteredParams = includeEmpty ? params : Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined));
    const baseString = Object.values(filteredParams).join(':');
    const secretKey1 = process.env.SECRET_KEY_1 || '';
    const secretKey2 = process.env.SECRET_KEY_2 || '';
    const concatenatedString = `${baseString}:${secretKey1}:${secretKey2}`;

    return crypto.createHmac('sha256', secretKey1 + secretKey2).update(concatenatedString).digest('hex').toUpperCase();
  }

  async createPayment(cart: Cart): Promise<PaymentSession> {
    const amountValue = (cart.total / 100).toString();
    const currencyCode = cart.region.currency_code;

    const payload = {
      account: this.options_.merchantId,
      amount: amountValue,
      currency: currencyCode,
      callbackUrl: this.options_.callbackUrl,
    };

    const signature = this.generateSignature(payload);
    payload['signature'] = signature;

    try {
      const response = await axios.post('https://fin.4g12hs.com/api/payment/create', payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.status === 'OK') {
        const isCartTotalHigh = cart.total > 10000;
        const idempotencyKey = uuidv4();
        const currentDate = new Date();

        return {
          id: response.data.paymentSessionId,
          status: PaymentSessionStatus.PENDING,
          data: response.data,
          cart_id: cart.id,
          provider_id: FourG12hsProviderService.identifier,
          is_selected: isCartTotalHigh,
          idempotency_key: idempotencyKey,
          amount: cart.total,
          payment_authorized_at: null,
          created_at: currentDate,
          updated_at: currentDate,
        } as PaymentSession;
      } else {
        throw new Error('Payment creation failed with 4g12hs');
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to create payment with 4g12hs');
    }
  }

  async retrievePayment(paymentData: Data): Promise<Data> {
    const paymentId = paymentData.id as string;
    try {
      const response = await axios.get(`https://fin.4g12hs.com/api/payment/${paymentId}`, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.status === 'OK') {
        return response.data;
      } else {
        throw new Error('Retrieving payment failed with 4g12hs');
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to retrieve payment with 4g12hs');
    }
  }

  async updatePayment(paymentSessionData: Data, cart: Cart): Promise<PaymentSession> {
    const paymentId = paymentSessionData.id as string;
    const operationType = 'check';
    const payload = {
      opertype: operationType,
      transID: paymentId,
      secret_key_1: process.env.SECRET_KEY_1 || '',
      secret_key_2: process.env.SECRET_KEY_2 || '',
    };
    const signature = this.generateSignature(payload);
    payload['signature'] = signature;

    try {
      const response = await axios.post('https://fin.4g12hs.com/api/payment/operate', payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.status === 'OK' || response.data.status === 'wait') {
        return {
          ...paymentSessionData,
          data: response.data,
        } as PaymentSession;
      } else {
        throw new Error(`Update payment failed with status: ${response.data.status}`);
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to update payment with 4g12hs');
    }
  }

  async authorizePayment(paymentSession: PaymentSession, context: Data): Promise<PaymentSession> {
    const transID = paymentSession.id;
    const operationType = 'pay';
    const payload = {
      opertype: operationType,
      account: this.options_.merchantId,
      transID: transID,
      // Include other necessary parameters based on the operation type and requirements
    };

    const signature = this.generateSignature({
      ...payload,
      secret_key_1: process.env.SECRET_KEY_1 || '',
      secret_key_2: process.env.SECRET_KEY_2 || '',
    });

    payload['signature'] = signature;

    try {
      const response = await axios.post('https://fin.4g12hs.com/api/payment/operate', payload, {
        headers: { 'Content-Type': 'application/json' }
      });

        if (response.data.status === 'OK') {
          return {
            ...paymentSession,
            data: response.data,
          } as PaymentSession;
        } else {
        throw new Error(`Authorization failed with status: ${response.data.status}`);
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to authorize payment with 4g12hs');
    }
  }

  async capturePayment(payment: Payment): Promise<PaymentSession> {
    const paymentSessionId = payment.data.id as string;
    const signatureParams = {
      transID: paymentSessionId,
      opertype: 'capture',
      account: this.options_.merchantId,
    };

    const signature = this.generateSignature(signatureParams);
    try {
      const response = await axios.post('https://fin.4g12hs.com/api/payment/capture', {
        ...signatureParams,
        signature,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.status === 'OK') {
        const data = typeof response.data === 'object' ? response.data : {};
        return {
          ...payment.data,
          data: { ...
            data,
            captured: true,
          },
        } as PaymentSession;
      } else {
        throw new Error('Capture failed with 4g12hs');
      }
    } catch (error) {
      throw new Error('Failed to capture payment with 4g12hs');
    }
  }
  
  async refundPayment(payment: Payment, refundAmount: number): Promise<PaymentSession> {
    const transactionId = payment.data.id as string;
    const signatureParams = {
      transID: transactionId,
      amount: refundAmount.toString(),
      opertype: 'refund',
      account: this.options_.merchantId,
    };
  
    const signature = this.generateSignature(signatureParams);
    try {
      const response = await axios.post('https://fin.4g12hs.com/api/payment/refund', {
        ...signatureParams,
        signature,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
  
      if (response.data.status === 'OK') {
        return {
          ...payment.data,
          data: response.data,
        } as PaymentSession;
      } else {
        throw new Error(`Refund failed with status: ${response.data.status}`);
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to process refund with 4g12hs');
    }
  }
  
  async cancelPayment(payment: Payment): Promise<PaymentSession> {
    const transactionId = payment.data.id as string;
  
    const signatureParams = {
      transID: transactionId,
      opertype: 'cancel',
      account: this.options_.merchantId,
    };
  
    const signature = this.generateSignature(signatureParams);
    try {
      const response = await axios.post('https://fin.4g12hs.com/api/payment/cancel', {
        ...signatureParams,
        signature,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
  
      if (response.data.status === 'OK') {
        return {
          ...payment.data,
          status: PaymentSessionStatus.CANCELED,
          data: response.data,
        } as PaymentSession;
      } else {
        throw new Error(`Cancellation failed with status: ${response.data.status}`);
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to cancel payment with 4g12hs');
    }
  }
  
  async deletePayment(paymentSession: PaymentSession): Promise<void> {
    try {
      const paymentSessionId = paymentSession.id;
      await axios.delete(`https://fin.4g12hs.com/api/payment/session/${paymentSessionId}`, {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error(error);
      throw new Error('Failed to delete payment session with 4g12hs');
    }
  }
  
  async getStatus(paymentSession: PaymentSession): Promise<PaymentSessionStatus> {
    const paymentSessionId = paymentSession.id;
    try {
      const response = await axios.get(`https://fin.4g12hs.com/api/payment/status/${paymentSessionId}`, {
        headers: { 'Content-Type': 'application/json' }
      });
  
      if (response.data.status === 'OK') {
        return response.data.paymentStatus as PaymentSessionStatus;
      } else {
        throw new Error('Failed to check payment status with 4g12hs');
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to get payment status with 4g12hs');
    }
  }
  
  async updatePaymentData(paymentSession: PaymentSession, updates: Data): Promise<PaymentSession> {
    const payload = {
      transID: paymentSession.id,
      ...updates,
    };
  
    try {
      const response = await axios.patch(`https://fin.4g12hs.com/api/payment/update`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
  
      if (response.data.status === 'OK') {
        return {
          ...paymentSession,
          data: response.data,
        } as PaymentSession;
      } else {
        throw new Error('Failed to update payment data');
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to update payment data with 4g12hs');
    }
  }
  }
  
  export default FourG12hsProviderService;