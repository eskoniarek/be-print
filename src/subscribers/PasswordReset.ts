import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/medusa";
import { CustomerService } from "@medusajs/medusa";

export default async function handlePasswordReset({
  data, eventName, container, pluginOptions,
}: SubscriberArgs<{ id: string; token: string; email: string; first_name?: string; last_name?: string }>) {
  const sendGridService = container.resolve("sendgridService");

  // Assuming `data` includes the customer ID, reset token, and email
  // first_name and last_name are optional based on your provided structure
  const { id, token, email, first_name, last_name } = data;

  sendGridService.sendEmail({
    templateId: "d-2b05bd8a51ec44b5ac7592f7f462baf3",
    from: "support@printinc.shop",
    to: email,
    dynamic_template_data: {
      reset_link: `https://printinc.shop/resetPassword?token=${token}`,
      // Assuming you might want to use first_name and last_name in the template
      first_name,
      last_name,
      // You can include other dynamic data needed by your template
    },
  });
}

export const config: SubscriberConfig = {
  event: CustomerService.Events.PASSWORD_RESET,
  context: {
    subscriberId: "customer-password-reset-handler",
  },
};