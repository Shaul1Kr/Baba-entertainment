import { Request, Response } from 'express';
import { LoginUser } from '../../../application/useCases/LoginUser.js';

/**
 * Thin controller: parse request -> call use case -> format response.
 * No business logic here.
 */
export class AuthController {
  constructor(private readonly loginUser: LoginUser) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const { name } = req.body ?? {};
    const result = await this.loginUser.execute({ name });
    res.json(result);
  };
}
