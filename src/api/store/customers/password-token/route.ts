// src/api/routes/store/customers/password-token.ts

import { Router } from "express";
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { UserService } from "@medusajs/medusa/dist/services"; // Import UserService type

const router = Router();

router.post("/", async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const userService: UserService = req.scope.resolve("userService");

  await userService.generateResetPasswordToken(req.body.email); // Adjusted method name
  res.sendStatus(204);
});

export default router;
