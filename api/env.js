export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript');

  res.status(200).send(`
    window.__ENV__ = {
      SUPABASE_URL: "${process.env.SUPABASE_URL}",
      SUPABASE_ANON_KEY: "${process.env.SUPABASE_ANON_KEY}"
    };
  `);
}