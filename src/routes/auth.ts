import { Hono } from "hono";
import { OAuth2Client } from 'google-auth-library';

export const authRouter = new Hono()
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://app.lifemetrics.io/login"
);

authRouter.get('/google', (c) => {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['email', 'profile'],
  });

  return c.json({ url: authorizeUrl })
})

authRouter.post('/google/callback', async (c) => {
  const { code } = await c.req.json()

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    return c.json({
      email: payload?.email,
      name: payload?.name,
      picture: payload?.picture,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    });
  } catch (error) {
    return c.json({ error: 'Authentication failed' }, 401);
  }
})
