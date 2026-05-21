import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { IssueStatus } from '@prisma/client';

const VALID_STATUSES = ['Open', 'InProgress', 'Resolved', 'Closed'] as const;

const isString = (value: unknown): value is string => typeof value === 'string';

const normalizeText = (value: unknown): string | undefined => {
  if (!isString(value)) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

type IssuePayload = {
  title?: string;
  description?: string;
  reproSteps?: string;
  reporter?: string;
};

type IssueValidationResult = {
  errors: string[];
  data: IssuePayload;
};

const validateIssue = (body: unknown): IssueValidationResult => {
  const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const title = normalizeText(payload.title);
  const description = normalizeText(payload.description);
  const reproSteps = normalizeText(payload.reproSteps);
  const reporter = normalizeText(payload.reporter);

  const errors: string[] = [];

  if (body === null || typeof body !== 'object') {
    errors.push('Request body must be a JSON object');
  }

  if (!title) {
    errors.push('title is required');
  }
  if (!description) {
    errors.push('description is required');
  }

  if (payload.title !== undefined && payload.title !== null && !isString(payload.title)) {
    errors.push('title must be a string');
  }

  if (
    payload.description !== undefined &&
    payload.description !== null &&
    !isString(payload.description)
  ) {
    errors.push('description must be a string');
  }

  if (
    payload.reproSteps !== undefined &&
    payload.reproSteps !== null &&
    !isString(payload.reproSteps)
  ) {
    errors.push('reproSteps must be a string');
  }

  if (payload.reporter !== undefined && payload.reporter !== null && !isString(payload.reporter)) {
    errors.push('reporter must be a string');
  }

  return {
    errors,
    data: {
      title,
      description,
      reproSteps,
      reporter,
    },
  };
};

type IssueRow = {
  id: number;
  status: 'Open' | 'InProgress' | 'Resolved' | 'Closed';
  createdAt: Date;
};

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/** GET /issues — admin: paginated list with optional status filter and sort */
export const listIssues = async (req: Request, res: Response): Promise<void> => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
  const sort = req.query.sort === 'oldest' ? 'asc' : 'desc';

  let statusFilter: IssueStatus[] | undefined;
  if (req.query.status) {
    const raw = String(req.query.status)
      .split(',')
      .map((s) => s.trim());
    const invalid = raw.filter((s) => !VALID_STATUSES.includes(s as IssueStatus));
    if (invalid.length > 0) {
      res.status(400).json({
        error: 'Invalid status value(s)',
        details: `Unknown: ${invalid.join(', ')}. Allowed: ${VALID_STATUSES.join(', ')}`,
      });
      return;
    }
    statusFilter = raw as IssueStatus[];
  }

  try {
    const where = statusFilter ? { status: { in: statusFilter } } : {};
    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        orderBy: { createdAt: sort },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.issue.count({ where }),
    ]);

    res.json({
      issues,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
};

/** GET /issues/:id — admin: single issue detail */
export const getIssueById = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid issue id' });
    return;
  }

  try {
    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }
    res.json(issue);
  } catch {
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
};

/** PATCH /issues/:id — admin: update status only (partial update) */
export const updateIssue = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid issue id' });
    return;
  }

  const { status } = req.body ?? {};
  if (status === undefined) {
    res.status(400).json({ error: 'Request body must include a status field' });
    return;
  }
  if (!VALID_STATUSES.includes(status as IssueStatus)) {
    res.status(400).json({
      error: 'Invalid status value',
      details: `Allowed values: ${VALID_STATUSES.join(', ')}`,
    });
    return;
  }

  try {
    const existing = await prisma.issue.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const updated = await prisma.issue.update({ where: { id }, data: { status } });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update issue' });
  }
};

/** DELETE /issues/:id — admin: remove an issue; returns 204 No Content */
export const deleteIssue = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid issue id' });
    return;
  }

  try {
    const existing = await prisma.issue.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    await prisma.issue.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete issue' });
  }
};

export const createIssue = async (req: Request, res: Response): Promise<void> => {
  const { errors, data } = validateIssue(req.body);

  if (errors.length > 0) {
    res.status(400).json({ error: 'Invalid bug report', details: errors });
    return;
  }

  try {
    const issueRows = await prisma.$queryRaw<IssueRow[]>`
      INSERT INTO "Issue" ("title", "description", "reproSteps", "reporter", "status", "updatedAt")
      VALUES (${data.title}, ${data.description}, ${data.reproSteps}, ${data.reporter}, 'Open', NOW())
      RETURNING "id", "status", "createdAt"
    `;
    const issue = issueRows[0];

    res.status(201).json({
      issueId: issue.id,
      status: issue.status,
      message: 'Bug report submitted successfully',
      createdAt: issue.createdAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save issue';
    res.status(500).json({ error: 'Bug report is down' });
  }
};
