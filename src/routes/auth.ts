import { Context, Hono } from "hono";
import { OAuth2Client } from "google-auth-library";
import { upsertUser, User } from "../database/user";
import jwt from "jsonwebtoken";
import { createProtectedRouter } from "../middleware/jwt";

const JWT_SECRET: string = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be defined");
}

function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export const authRouter = new Hono();
const protectedRoutes = createProtectedRouter(authRouter);
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://app.lifemetrics.io/login"
);

protectedRoutes.get("/validate", async (c: Context) => {
  const user = c.get("user");
  return c.json({
    id: user.id,
    email: user.email,
  });
});

authRouter.get("/google", (c) => {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["email", "profile"],
  });

  return c.json({ url: authorizeUrl });
});

authRouter.post("/google/callback", async (c) => {
  const { code } = await c.req.json();

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return c.json({ error: "Invalid token payload" }, 400);
    }

    const { email, sub: google_id, name, picture } = payload;
    if (!email || !google_id || !name) {
      return c.json({ error: "Missing required user data" }, 400);
    }

    const user = await upsertUser({
      email,
      google_id,
      name,
      picture_url: picture,
    });

    const token = generateToken(user);

    return c.json({
      user,
      token,
    });
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
});
