import { Router } from 'express';
import { getPeopleSearch } from '../../controllers/people';

const peopleRouter = Router();

peopleRouter.get('/search', getPeopleSearch);

export { peopleRouter };
