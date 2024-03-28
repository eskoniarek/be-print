  import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/medusa";
  import { CustomerService } from "@medusajs/medusa";

  export default async function handlePasswordReset({
    data, eventName, container, pluginOptions,
  }: SubscriberArgs<{ id: string; token: string; email: string; first_name?: string; last_name?: string }>) {
    console.log(`[HandlePasswordReset] Start handling password reset for ID: ${data.id}`);
    try {
      const sendGridService = container.resolve("sendgridService");

      const { id, token, email, first_name, last_name } = data;

      console.log(`[HandlePasswordReset] Sending password reset email to: ${email}`);
      await sendGridService.sendEmail({
        templateId: "d-6787aaf90dc043c7975e0335d3096550",
        from: "hello@op-app.co",
        to: email,
        dynamic_template_data: {
          reset_link: `https://shop.op-app.co/account/resetPassword?token=${token}`,
          first_name,
          last_name,
        },
      });
      console.log(`[HandlePasswordReset] Password reset email sent to: ${email}`);
    } catch (error) {
      console.error("[HandlePasswordReset] An error occurred:", error);
      if (error.response && error.response.status) {
        const { status, data } = error.response;
        console.error(`HTTP Status: ${status}`, `Response Data: ${JSON.stringify(data)}`);
        if (status >= 400 && status < 500) {
          console.error("Client Error occurred:", error.message);
          // Optionally, log more details about the client error
        } else if (status >= 500) {
          console.error("Server Error occurred:", error.message);
          // Optionally, log more details about the server error
        }
      } else {
        // For errors that don't fit the above categories (no response status)
        console.error("Error handling password reset:", error.message);
        // Log the entire error if it might contain useful information for debugging
        console.error("Error details:", error);
      }
    }
  }

  export const config: SubscriberConfig = {
    event: CustomerService.Events.PASSWORD_RESET,
    context: {
      subscriberId: "customer-password-reset-handler",
    },
  };
