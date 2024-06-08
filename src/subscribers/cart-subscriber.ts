import { CartService, EventBusService, PaymentProviderService } from '@medusajs/medusa';
import FourG12hsProviderService from '../services/4g12hs';

class CartSubscriber {
  private paymentProviderService_: PaymentProviderService;
  private cartService_: CartService;

  constructor({
    eventBusService,
    cartService,
    paymentProviderService
  }: {
    eventBusService: EventBusService;
    cartService: CartService;
    paymentProviderService: PaymentProviderService;
  }) {
    this.cartService_ = cartService;
    this.paymentProviderService_ = paymentProviderService;
    eventBusService.subscribe('cart.updated', this.handleCartUpdate);
  }

  handleCartUpdate = async (data: { id: string }): Promise<void> => {
    const cartId = data.id;
    const cart = await this.cartService_.retrieve(cartId, {
      select: ['subtotal', 'tax_total', 'shipping_total', 'discount_total', 'total'],
      relations: [
        'items',
        'billing_address',
        'shipping_address',
        'region',
        'region.payment_providers',
        'payment_sessions',
        'customer'
      ]
    });

    if (cart.payment_sessions?.length) {
      const fourG12hsPaymentSession = cart.payment_sessions.find(
        (ps) => ps.provider_id === FourG12hsProviderService.identifier
      );

      if (fourG12hsPaymentSession) {
        await this.paymentProviderService_.updateSession(fourG12hsPaymentSession, cart);
      }
    }
  };
}

export default CartSubscriber;