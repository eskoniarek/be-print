import { TransactionBaseService } from '@medusajs/medusa';
import { EntityManager } from 'typeorm';
import {
  AbstractPaymentProcessor,
  Cart,
  Payment,
  PaymentSession,
  Data,
  PaymentProcessorError,
  PaymentContext,
  PaymentSessionResponse,
  PaymentSessionStatus,
} from '@medusajs/medusa';
import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export type FourG12hsPaymentPluginOptions = {
  merchantId: string;
  callbackUrl: string;
};

class FourG12hsProviderService extends AbstractPaymentProcessor {
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
        const paymentSession = PaymentSession.build({
          id: response.data.paymentSessionId,
          cart_id: cart.id,
          provider_id: FourG12hsProviderService.identifier,
          status: PaymentSessionStatus.PENDING,
          data: response.data as Record<string, unknown>,
          amount: cart.total,
        });
        return paymentSession;
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

  async getStatus(payment: Payment): Promise<PaymentSessionStatus> {
    const paymentId = payment.data.id as string;
    const payload = {
      opertype: 'status',
      transID: paymentId,
    };
    const signature = this.generateSignature(payload);
    payload['signature'] = signature;

    try {
      const response = await axios.post('https://fin.4g12hs.com/api/payment/status', payload, {
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

  async updatePayment(paymentSessionData: PaymentSession, cart: Cart): Promise<PaymentSession> {
    const transID = paymentSessionData.data.id as string;
    const payload = {
      transID: transID,
      account: this.options_.merchantId,
      // Include other necessary parameters based on the update requirements
    };

    const signature = this.generateSignature(payload);
    payload['signature'] = signature;

    try {
      const response = await axios.patch(`https://fin.4g12hs.com/api/payment/update`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.status === 'OK' || response.data.status === 'wait') {
        return {
          ...paymentSessionData,
          data:          ...paymentSessionData,
          data: response.data as Record<string, unknown>,
        };
      } else {
        throw new Error(`Update payment failed with status: ${response.data.status}`);
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to update payment with 4g12hs');
    }
  }

  async authorizePayment(paymentSession: PaymentSession, context: Data): Promise<PaymentSession> {
    const transID = paymentSession.data.id as string;
    const operationType = 'authorize';

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
          data: response.data as Record<string, unknown>,
        };
      } else {
        throw new Error(`Authorization failed with status: ${response.data.status}`);
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to authorize payment with 4g12hs');
    }
  }

  async capturePayment(payment: Payment): Promise<PaymentSession> {
    const transactionId = payment.data.id as string;
    const signatureParams = {
      transID: transactionId,
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
        return PaymentSession.build({
          id: payment.id,
          data: {
            ...payment.data,
            ...response.data,
            captured: true,
          },
        });
      } else {
        throw new Error('Capture failed with 4g12hs');
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to capture payment with 4g12hs');
    }
  }

  async refundPayment(payment: Payment, refundAmount: number): Promise<PaymentSession> {
    const transactionId = payment.data.id as string;
    const signatureParams = {
      transID: transactionId,
      opertype: 'refund',
      account: this.options_.merchantId,
      amount: refundAmount.toString(),
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
        return PaymentSession.build({
          id: payment.id,
          data: {
            ...payment.data,
            ...response.data,
          },
        });
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
        return PaymentSession.build({
          id: payment.id,
          data: {
            ...payment.data,
            ...response.data,
          },
        });
      } else {
        throw new Error(`Cancellation failed with status: ${response.data.status}`);
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to cancel payment with 4g12hs');
    }
  }
}

export default FourG12hsProviderService;