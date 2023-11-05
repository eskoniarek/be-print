import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const emailService = req.scope.resolve("emailService");
  const order = req.body.order;
  const downloadLink = req.body.downloadLink;
  
  try {
    await emailService.sendOrderConfirmationEmail(order, downloadLink);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Failed to send email:", error);
    res.status(500).json({ message: "Failed to send email", error: error.message });
  }
};
