"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../src/app");
const prisma_1 = require("../../src/lib/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
jest.mock('../../src/lib/prisma', () => ({
    prisma: {
        user: {
            upsert: jest.fn(),
        },
    },
}));
const mockUser = prisma_1.prisma.user;
beforeEach(() => {
    jest.clearAllMocks();
});
describe('POST /auth/dev-login', () => {
    it('returns a token for a valid username', async () => {
        mockUser.upsert.mockResolvedValueOnce({
            id: 1,
            username: 'evin',
            email: 'evin@dev.local',
            role: 'user',
        });
        const response = await (0, supertest_1.default)(app_1.app).post('/auth/dev-login').send({ username: 'evin' });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
    });
    it('returns 400 when username is missing', async () => {
        const response = await (0, supertest_1.default)(app_1.app).post('/auth/dev-login').send({});
        expect(response.status).toBe(400);
    });
    it('defaults email to username@dev.local when not provided', async () => {
        mockUser.upsert.mockResolvedValueOnce({
            id: 1,
            username: 'evin',
            email: 'evin@dev.local',
            role: 'user',
        });
        const response = await (0, supertest_1.default)(app_1.app).post('/auth/dev-login').send({ username: 'evin' });
        expect(response.status).toBe(200);
        expect(mockUser.upsert).toHaveBeenCalledWith(expect.objectContaining({
            create: expect.objectContaining({ email: 'evin@dev.local' }),
        }));
    });
    it('token contains correct sub, email and role', async () => {
        mockUser.upsert.mockResolvedValueOnce({
            id: 1,
            username: 'evin',
            email: 'evin@dev.local',
            role: 'user',
        });
        const response = await (0, supertest_1.default)(app_1.app).post('/auth/dev-login').send({ username: 'evin' });
        const decoded = jsonwebtoken_1.default.verify(response.body.token, process.env.JWT_SECRET);
        expect(decoded.sub).toBe(1);
        expect(decoded.email).toBe('evin@dev.local');
        expect(decoded.role).toBe('user');
    });
    it('accepts optional email in request body', async () => {
        mockUser.upsert.mockResolvedValueOnce({
            id: 2,
            username: 'carson',
            email: 'carson@example.com',
            role: 'user',
        });
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/auth/dev-login')
            .send({ username: 'carson', email: 'carson@example.com' });
        expect(response.status).toBe(200);
        expect(mockUser.upsert).toHaveBeenCalledWith(expect.objectContaining({
            create: expect.objectContaining({ email: 'carson@example.com' }),
        }));
    });
});
//# sourceMappingURL=dev-login.test.js.map