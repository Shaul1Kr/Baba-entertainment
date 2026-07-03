import { Request, Response } from 'express';
import { ListItems } from '../../../application/useCases/ListItems.js';

export class ItemsController {
  constructor(private readonly listItems: ListItems) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = req.query;
    const result = await this.listItems.execute({
      page: page as string | undefined,
      limit: limit as string | undefined,
    });
    res.json(result);
  };
}
