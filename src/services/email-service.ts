import { TransactionBaseService } from "@medusajs/medusa";
// @ts-ignore

import { SendgridService } from "@medusajs/medusa-plugin-sendgrid";

class EmailService extends TransactionBaseService {
  private readonly sendgridService: SendgridService;

  constructor(container) {
    super(container);
    this.sendgridService = container.resolve("sendgridService");
  }

  async sendOrderConfirmationEmail(order: any, downloadLink: string): Promise<void> {
    // Assuming the customer's name is stored in the order object as order.customerName
    const customerName = order.customerName || "Customer"; 

    const sendOptions = {
      templateId: "d-8b2d29402c67414fb7293a26f7992c65",
      from: "PrintInc <support@printinc.shop>",
      to: order.email,
      subject: `Order Confirmation: ${order.id}`,
      dynamic_template_data: {
        customerName: customerName,
        downloadLink: downloadLink,
        predefinedLink: "Your predefined link"
      },
    };

    try {
      await this.sendgridService.sendEmail(sendOptions);
    } catch (error) {
      console.error("Sendgrid Error:", error);
      throw new Error("Failed to send order confirmation email");
    }
  }
}

export default EmailService;
