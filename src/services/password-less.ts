import { CustomerService, EventBusService, TransactionBaseService } from '@medusajs/medusa';
import { MedusaError } from 'medusa-core-utils';
import { EntityManager } from 'typeorm';
import jwt from 'jsonwebtoken';
import { ConfigModule } from "@medusajs/medusa";

type MyConfigModule = ConfigModule & {
  projectConfig: {
    jwt_secret?: string;
  };
};

class PasswordLessService extends TransactionBaseService {
  protected manager_: EntityManager;
  protected transactionManager_: EntityManager;
  private readonly customerService_: CustomerService;
  private readonly eventBus_: EventBusService;
  private readonly configModule_: MyConfigModule;

  constructor(container) {
    super(container);
    this.eventBus_ = container.eventBusService;
    this.customerService_ = container.customerService;
    this.configModule_ = container.configModule;
  }

  async sendMagicLink(email, isSignUp) {
    const token = jwt.sign({ email }, this.configModule_.projectConfig.jwt_secret, { expiresIn: '8h' });

    try {
      return await this.eventBus_.withTransaction(this.manager_)
        .emit('passwordless.login', { email, isSignUp, token });
    } catch (error) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `There was an error sending the email.`);
    }
  }

  async validateMagicLink(token) {
    let decoded;

    try {
      decoded = jwt.verify(token, this.configModule_.projectConfig.jwt_secret);
    } catch (err) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid auth credentials.`);
    }

    if (!decoded.hasOwnProperty('email') || !decoded.hasOwnProperty('exp')) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid auth credentials.`);
    }

    const customer = await this.customerService_.retrieveRegisteredByEmail(decoded.email).catch(() => null);

    if (!customer) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `There isn't a customer with email ${decoded.email}.`);
    }

    return customer;
  }
}

export default PasswordLessService;
