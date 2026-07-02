import { Request, Response } from 'express';
import { ListItems } from '../../../application/useCases/ListItems.js';

export class ItemsController {
  constructor(private readonly listItems: ListItems) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.listItems.execute();
    res.json(items);
  };
}
