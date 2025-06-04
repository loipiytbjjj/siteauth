import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');

  const params = new URLSearchParams();
  params.append('client_id', process.env.CLIENT_ID);
  params.append('client_secret', process.env.CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', process.env.REDIRECT_URI);

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const tokenData = await tokenRes.json();
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    const user = await userRes.json();

    // Envoie vers ton bot Pterodactyl
    await fetch(`http://${process.env.BOT_IP}/save-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        username: user.username,
        access_token: tokenData.access_token
      })
    });

    return res.redirect('https://tonpseudo.github.io/ton-site/');
  } catch (e) {
    console.error(e);
    return res.status(500).send('Erreur OAuth');
  }
});

app.listen(10000, () => {
  console.log('✅ Callback en ligne sur port 10000');
});
