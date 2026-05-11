import { Router } from 'express';
import {
  createIssue,
  listIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} from '../../controllers/issues';
import { requireAuth, requireRoleAtLeast } from '../../middleware/requireAuth';
import { requireNonNegativeIds } from '../../middleware/validateId';

/**
 * Issues route contract
 *
 * POST   /issues          — public; submit a bug report
 * GET    /issues          — Admin+; paginated list
 *                           ?page=1 &limit=20 (max 100)
 *                           ?status=Open,InProgress  (comma-separated; allowed: Open|InProgress|Resolved|Closed)
 *                           ?sort=newest (default) | oldest
 * GET    /issues/:id      — Admin+; single report detail
 * PATCH  /issues/:id      — Admin+; partial update — only { status } accepted; unknown status → 400
 * DELETE /issues/:id      — Admin+; 204 No Content on success
 *
 * "Admin+" means role is Admin, SuperAdmin, or Owner (requireRoleAtLeast('Admin')).
 */

const issuesRouter = Router();

issuesRouter.post('/', createIssue);

issuesRouter.get('/', requireAuth, requireRoleAtLeast('Admin'), listIssues);
issuesRouter.get(
  '/:id',
  requireAuth,
  requireRoleAtLeast('Admin'),
  requireNonNegativeIds('id'),
  getIssueById
);
issuesRouter.patch(
  '/:id',
  requireAuth,
  requireRoleAtLeast('Admin'),
  requireNonNegativeIds('id'),
  updateIssue
);
issuesRouter.delete(
  '/:id',
  requireAuth,
  requireRoleAtLeast('Admin'),
  requireNonNegativeIds('id'),
  deleteIssue
);

export { issuesRouter };
