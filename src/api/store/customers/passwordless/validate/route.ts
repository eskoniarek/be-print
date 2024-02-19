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
export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
  ) => {{
    const configModule = req.scope.resolve<MyConfigModule>(
      "configModule"
    );
  
    const corsOptions = {
      origin: configModule.projectConfig.store_cors?.split(","),
      credentials: true,
    };
  
    req.app.use(cors(corsOptions));
  
    try {
      const { token } = req.query;
  
      if (!token) {
        return res.status(403).json({ message: 'The user cannot be verified' });
      }
  
      const passwordLessService = req.scope.resolve('passwordLessService');
      
      const loggedCustomer = await passwordLessService.validateMagicLink(token);
  
      req.session.jwt_store = jwt.sign(
        { customer_id: loggedCustomer.id },
        configModule.projectConfig.jwt_secret,
        { expiresIn: '30d' }
      );
  
      return res.status(200).json({ ...loggedCustomer });
    } catch (error) {{
      return res.status(403).json({ message: 'The user cannot be verified' });
    }}
  }};
  
  