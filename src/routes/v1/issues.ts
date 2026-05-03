import { Router } from 'express';
import { createIssue } from '../../controllers/issues';

const issuesRouter = Router();

issuesRouter.post('/', createIssue);

export { issuesRouter };
