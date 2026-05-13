import { Router } from 'express';
import { moviesRouter } from './movies';
import { tvRouter } from './tv';
import { ratingsRouter } from './ratings';
import { reviewsRouter } from './reviews';
import { issuesRouter } from './issues';
import { discoveryRouter } from './discovery';
import { validateIntBody } from '../../middleware/validateIntBody';
import { validateIntQuery } from '../../middleware/validateIntQuery';

const v1Routes = Router();

// express.json() runs at the app level before this router, so req.body is always parsed here.
// validateIntBody and validateIntQuery work here because req.body and req.query are populated
// before any router runs. validateIntParam (path params) must be registered via router.param()
// on each sub-router instead — see each router file — because req.params is only populated
// after a sub-router matches its route, which is after this middleware would have already run.
v1Routes.use(validateIntBody);
v1Routes.use(validateIntQuery);

v1Routes.use('/ratings', ratingsRouter);
v1Routes.use('/movies', moviesRouter);
v1Routes.use('/tv', tvRouter);
v1Routes.use('/issues', issuesRouter);
v1Routes.use('/reviews', reviewsRouter);
v1Routes.use('/discover', discoveryRouter);

export { v1Routes };
