import type { MedusaRequest as BaseMedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { ConfigModule } from "@medusajs/medusa";
import cors from "cors";
import jwt from "jsonwebtoken";

interface Session {
  jwt_store?: string;
}

interface MedusaRequest extends BaseMedusaRequest {
  session?: Session;
}

// Now use MedusaRequest instead of BaseMedusaRequest in your route handlers

type MyConfigModule = ConfigModule & {
  projectConfig: {
    store_cors?: string;
    jwt_secret?: string;
  };
};

// This corresponds to the '/auth/passwordless/sent' route
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const configModule = req.scope.resolve<MyConfigModule>(
    "configModule"
  );

  const corsOptions = {
    origin: configModule.projectConfig.store_cors?.split(","),
    credentials: true,
  };

  req.app.use(cors(corsOptions));

  // Your route logic here...
  try {
    const manager = req.scope.resolve("manager");
    const customerService = req.scope.resolve("customerService");
    const { email, isSignUp } = req.body;

    let customer = await customerService.retrieveRegisteredByEmail(email).catch(() => null);

    if (!customer && !isSignUp) {
             res.status(404).json({ message: `Customer with ${email} was not found. Please sign up instead.` })
         }
         if (!customer && isSignUp) {
          customer = await customerService.withTransaction(manager).create({
            email,
            first_name: '--',
            last_name: '--',
            has_account: true
          })
        }
      
        } catch (error) {
    res.status(500).json({ message: "Failed to process request." });
  }
};

