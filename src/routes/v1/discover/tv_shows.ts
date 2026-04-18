import { Router } from 'express';

const tvShowsRouter = Router();

// TODO: update function to have non-default response
tvShowsRouter.get('/', (req, res) => {
  res.json({ message: 'discover tv shows' });
});

export { tvShowsRouter };
