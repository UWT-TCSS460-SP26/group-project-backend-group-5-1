import { Router } from 'express';
import { getTv, getPopularTv, getTvById } from '../../controllers/tv';
import { validateLimit, trimFields } from '../../middleware/movies';
import { validateTvId } from '../../middleware/tv';
import { TV_SUMMARY_FIELDS } from '../../mappers/tv';

const tvRouter = Router();

tvRouter.get('/', validateLimit, trimFields(TV_SUMMARY_FIELDS), getTv);
tvRouter.get('/popular', validateLimit, trimFields(TV_SUMMARY_FIELDS), getPopularTv);
tvRouter.get('/:id', validateTvId, getTvById);

export { tvRouter };
