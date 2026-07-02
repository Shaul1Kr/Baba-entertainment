import { Response } from 'express';
import { AddToCart } from '../../../application/useCases/AddToCart.js';
import { RemoveFromCart } from '../../../application/useCases/RemoveFromCart.js';
import { GetCart } from '../../../application/useCases/GetCart.js';
import { AuthedRequest } from '../middleware/authMiddleware.js';

export class CartController {
  constructor(
    private readonly addToCart: AddToCart,
    private readonly removeFromCart: RemoveFromCart,
    private readonly getCart: GetCart,
  ) {}

  add = async (req: AuthedRequest, res: Response): Promise<void> => {
    const { itemId, qty } = req.body ?? {};
    const result = await this.addToCart.execute({
      userId: req.userId!,
      itemId,
      qty: qty ?? 1,
    });
    res.json(result);
  };

  remove = async (req: AuthedRequest, res: Response): Promise<void> => {
    const { itemId } = req.body ?? {};
    const result = await this.removeFromCart.execute({
      userId: req.userId!,
      itemId,
    });
    res.json(result);
  };

  get = async (req: AuthedRequest, res: Response): Promise<void> => {
    const cart = await this.getCart.execute(req.userId!);
    res.json(cart);
  };
}
