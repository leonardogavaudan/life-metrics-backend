import { Context, Hono } from "hono";
import { OAuth2Client } from "google-auth-library";
import { upsertUser, User } from "../database/user";
import jwt from "jsonwebtoken";
import { jwtMiddleware } from "../middleware/jwt";

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
const getRedirectUri = (c: Context) => {
  const isDevelopment = c.req.header("X-Environment") === "development";
  return isDevelopment
    ? "http://localhost:5173/login"
    : "https://app.lifemetrics.io/login";
};

const oAuth2Client = (c: Context) =>
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri(c)
  );

authRouter.get("/validate", jwtMiddleware, async (c: Context) => {
  const user = c.get("user");
  return c.json({
    id: user.id,
    email: user.email,
  });
});

authRouter.get("/google", (c) => {
  const authorizeUrl = oAuth2Client(c).generateAuthUrl({
    access_type: "offline",
    scope: ["email", "profile"],
  });

  return c.json({ url: authorizeUrl });
});

authRouter.post("/google/callback", async (c) => {
  const { code } = await c.req.json();

  try {
    const client = oAuth2Client(c);
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
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
