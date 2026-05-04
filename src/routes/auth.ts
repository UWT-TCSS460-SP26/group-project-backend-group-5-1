import { Router } from 'express';
import { devLogin } from '../controllers/auth';

const authRouter = Router();

authRouter.post('/dev-login', devLogin);

export { authRouter };
