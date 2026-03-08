import * as jose from "jose";

export type JwtPayload = { userId: number; username: string };

export async function signToken(
  payload: JwtPayload,
  secret: string
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(key);
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<JwtPayload | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, key);
    const userId = payload.userId as number;
    const username = payload.username as string;
    if (typeof userId !== "number" || typeof username !== "string") return null;
    return { userId, username };
  } catch {
    return null;
  }
}
