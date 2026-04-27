export declare const mintToken: (claims: {
    sub: number;
    email?: string;
    role?: string;
}) => string;
export declare const authHeader: (claims: {
    sub: number;
    email?: string;
    role?: string;
}) => {
    Authorization: string;
};
