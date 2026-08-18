require('dotenv').config();
const bcrypt = require('bcryptjs');
const readline = require('readline');
const pool = require('../src/db');

// Script interativo pra criar um usuário (admin ou lojista) com senha já em hash.
// Rodar com: node scripts/seedUsuario.js

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function perguntar(pergunta) {
  return new Promise((resolve) => rl.question(pergunta, resolve));
}

async function main() {
  console.log('=== Criar novo usuário (Barbosa Suplementos) ===\n');

  const nome = await perguntar('Nome: ');
  const email = await perguntar('Email: ');
  const senha = await perguntar('Senha: ');
  let papel = (await perguntar('Papel (admin/lojista): ')).trim().toLowerCase();

  if (!['admin', 'lojista'].includes(papel)) {
    console.log('Papel inválido, usando "lojista" como padrão.');
    papel = 'lojista';
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  try {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, papel)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, email, papel`,
      [nome, email, senhaHash, papel]
    );
    console.log('\nUsuário criado com sucesso:');
    console.log(rows[0]);
  } catch (err) {
    console.error('\nErro ao criar usuário:', err.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

main();
