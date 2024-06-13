import { AbstractPaymentProcessor, Cart, Data, Payment, PaymentContext, PaymentProcessorContext, PaymentProcessorError,PaymentSession, PaymentSessionStatus, PaymentProcessorSessionResponse } from '@medusajs/medusa';
import { EntityManager } from 'typeorm';
import axios from 'axios';
import crypto from 'crypto';

class FourG12hsProviderService extends AbstractPaymentProcessor {

  static identifier = '4g12hs';
  protected manager_: EntityManager;
  protected transactionManager_: EntityManager;
  
  async initiatePayment(context: PaymentProcessorContext): Promise<PaymentProcessorSessionResponse | PaymentProcessorError> {
    const {
      email,
      context: cart_context,
      currency_code,
      amount,
      resource_id,
      customer,
    } = context;
  
    const description = (cart_context.payment_description) as string;
  
    const session_data = {
      amount: (amount / 100).toFixed(2),
      amountcurr: currency_code,
      currency: 'MBC',
      number: crypto.randomBytes(6).toString('hex').slice(0, 12),
      description: encodeURIComponent(description),
      trtype: '1',
      account: this.getAccountId(),
      paytoken: '',
      email: email,
      backURL: this.getBackUrl(),
      cf1: '',
      cf2: '',
      cf3: '',
      signature: this.generateSignature({
        amount: (amount / 100).toFixed(2),
        amountcurr: currency_code,
        currency: 'MBC',
        number: crypto.randomBytes(6).toString('hex').slice(0, 12),
        description: encodeURIComponent(description),
        trtype: '1',
        account: this.getAccountId(),
        backURL: this.getBackUrl(),
      }),
    };
  
    try {
      const response = await axios.post('https://fin.test.4g12hs.com/api/payment/start', session_data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      });
  
      if (response.data) {
        return {
          session_data: {
            id: response.data,
          },
          update_requests: customer?.metadata?.stripe_id
            ? undefined
            : {
                customer_metadata: {
                  stripe_id: response.data,
                },
              },
        };
      } else {
        throw new Error('Unexpected response from payment processor');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      return {
        error: 'Failed to initiate payment',
      };
    }
  }
  // async initiatePayment(context: PaymentProcessorContext): Promise<PaymentProcessorSessionResponse | PaymentProcessorError> {
  //   throw new Error('Method not implemented.');
  // }

  async deletePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
    throw new Error('Method not implemented.');
  }

  async getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus> {
    throw new Error('Method not implemented.');
  }

  async updatePaymentData(sessionId: string, data: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
    throw new Error('Method not implemented.');
  }
  
  constructor(container: any) {
    super(container);
    this.manager_ = container.manager;
    this.transactionManager_ = container.transactionManager;
  }

  private getSecretKey1(): string {
    return process.env.SECRET_KEY_1 || '';
  }

  private getSecretKey2(): string {
    return process.env.SECRET_KEY_2 || '';
  }

  private getAccountId(): string {
    return process.env.ACCOUNT_ID || '';
  }

  private getBackUrl(): string {
    return process.env.BACK_URL || '';
  }

  private generateSignature(params: Record<string, string | undefined>, includeEmpty: boolean = false): string {
    const filteredParams = includeEmpty ? params : Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined));
    const baseString = Object.values(filteredParams).join(':');
    const secretKey1 = this.getSecretKey1();
    const secretKey2 = this.getSecretKey2();
    const concatenatedString = `${baseString}:${secretKey1}:${secretKey2}`;

    return crypto.createHmac('sha256', secretKey1 + secretKey2).update(concatenatedString).digest('hex').toUpperCase();
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
      transID: paymentId,
      account: this.getAccountId(),
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

  async updatePayment(
    context: PaymentProcessorContext
  ): Promise<
    void |
    PaymentProcessorError |
    PaymentProcessorSessionResponse
  > {
    const { paymentSessionData } = context;
    const transID = paymentSessionData.id as string;
    const payload = {
      transID,
      account: this.getAccountId(),
      // Include other necessary parameters based on the update requirements
    };
  
    const signature = this.generateSignature(payload);
    payload['signature'] = signature;
  
    try {
      const response = await axios.post('https://fin.test.4g12hs.com/api/payment/update', payload, {
        headers: { 'Content-Type': 'application/json' }
      });
  
      if (response.data.status === 'OK') {
        return {
          session_data: {
            ...paymentSessionData,
            data: response.data as Record<string, unknown>,
          },
        };
      } else {
        throw new Error(`Update failed with status: ${response.data.status}`);
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to update payment with 4g12hs');
    }
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | 
    { status: PaymentSessionStatus; data: Record<string, unknown> }
  > {
    const transID = paymentSessionData.id as string;
    const payload = {
      transID: transID,
      account: this.getAccountId(),
  // Include other necessary parameters based on the authorization requirements
};

const signature = this.generateSignature(payload);
payload['signature'] = signature;

try {
  const response = await axios.post('https://fin.4g12hs.com/api/payment/authorize', payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  if (response.data.status === 'OK') {
    return {
      status: 'authorized' as PaymentSessionStatus,
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

async capturePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
  const transactionId = paymentSessionData.id as string;
  const signatureParams = {
    transID: transactionId,
    account: this.getAccountId(),
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
      return {
        ...paymentSessionData,
        ...response.data,
        captured: true,
      };
    } else {
      throw new Error(`Capture failed with status: ${response.data.status}`);
    }
  } catch (error) {
    console.error(error);
    return {
      error: 'Failed to capture payment with 4g12hs',
    };
  }
}

async refundPayment(paymentSessionData: Record<string, unknown>, refundAmount: number): Promise<Record<string, unknown> | PaymentProcessorError> {
  const payment = new Payment();
  const transactionId = payment.data.id as string;
  const signatureParams = {
    transID: transactionId,
    account: this.getAccountId(),
    amount: (refundAmount / 100).toString(),
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
        ...paymentSessionData,
        ...response.data,
      };
    } else {
      throw new Error(`Refund failed with status: ${response.data.status}`);
    }
  } catch (error) {
    console.error(error);
    return {
      error: 'Failed to process refund with 4g12hs',
    };
  }
}

async cancelPayment(
  paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    const transID = paymentSessionData.id

    const signatureParams = {
      transID: transID as string,
      account: this.getAccountId(),
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
          id: transID,
          ...response.data,
        };
      } else {
        throw new Error(`Cancel failed with status: ${response.data.status}`);
      }
    } catch (error) {
      console.error(error);
      return {
        error: 'Failed to cancel payment with 4g12hs',
      };
    }
    }
  }



export default FourG12hsProviderService;
