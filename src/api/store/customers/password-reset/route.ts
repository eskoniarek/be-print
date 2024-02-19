// src/api/routes/store/customers/password-reset.ts

import { Router } from "express";
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { UserService } from "@medusajs/medusa/dist/services"; // Import UserService type

const router = Router();

router.put("/", async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const userService: UserService = req.scope.resolve("userService");

  const user = await userService.setPassword_(
    req.body.token,
    req.body.password
  );

  res.json({ user });
});

export default router;
