import { Response } from 'express';
import { Checkout } from '../../../application/useCases/Checkout.js';
import { AuthedRequest } from '../middleware/authMiddleware.js';

export class CheckoutController {
  constructor(private readonly checkout: Checkout) {}

  create = async (req: AuthedRequest, res: Response): Promise<void> => {
    const order = await this.checkout.execute({ userId: req.userId! });
    res.status(201).json(order);
  };
}
