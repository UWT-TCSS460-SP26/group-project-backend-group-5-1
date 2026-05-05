import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

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

  if (!title && !description) {
    errors.push('A title or description is required');
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
