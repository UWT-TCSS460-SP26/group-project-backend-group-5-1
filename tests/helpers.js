"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authHeader = exports.mintToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mintToken = (claims) => {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('JWT_SECRET must be set before minting test tokens');
    return jsonwebtoken_1.default.sign({
        sub: claims.sub,
        email: claims.email ?? `user${claims.sub}@dev.local`,
        role: claims.role ?? 'user',
    }, secret, { expiresIn: '1h' });
};
exports.mintToken = mintToken;
const authHeader = (claims) => ({
    Authorization: `Bearer ${(0, exports.mintToken)(claims)}`,
});
exports.authHeader = authHeader;
//# sourceMappingURL=helpers.js.map