import jwt from "jsonwebtoken";

const DEFAULT_EXP = Number(process.env.JWT_EXPIRES_IN ?? 3600);
const SECRET = process.env.JWT_SECRET ?? "secret_code";

export function issueAccessToken(params: { userId: string; role: "ADMIN" | "USER" | "ASSISTANT"; expiresInSec?: number }) {
    const exp = params.expiresInSec ?? DEFAULT_EXP;

    const accessToken = jwt.sign(
        { sub: params.userId, role: params.role },
        SECRET,
        { expiresIn: exp }
    );

    return {
        accessToken,
        tokenType: "Bearer" as const,
        expiresIn: exp
    }
}