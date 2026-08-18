const { Pool } = require('pg');

// Conexão com o banco (Supabase via pooler) — compartilhada pelo servidor (index.js)
// e pelo script de seed (scripts/seedUsuario.js).
const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 6543,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'postgres',
  ssl: process.env.PGHOST?.includes('localhost') ? false : { rejectUnauthorized: false }
});

module.exports = pool;