require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// ===================== BANCO DE DADOS =====================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

// ===================== APP =====================
const app = express();
app.use(cors());
app.use(express.json());

// ===================== MIDDLEWARES =====================

// Verifica se o token JWT é válido e anexa o usuário na requisição.
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não informado' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET); // { id, papel, nome }
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

// Restringe a rota a determinados papéis (ex: somente 'admin').
function permitirPapeis(...papeisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !papeisPermitidos.includes(req.usuario.papel)) {
      return res.status(403).json({ erro: 'Acesso negado para este perfil' });
    }
    next();
  };
}

// ===================== ROTA RAIZ =====================
app.get('/', (req, res) => {
  res.json({ status: 'ok', servico: 'Barbosa Suplementos API' });
});

// ===================== AUTH =====================

// POST /api/auth/login — Body: { email, senha }
app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe email e senha' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, nome, email, senha_hash, papel, ativo FROM usuarios WHERE email = $1',
      [email]
    );
    const usuario = rows[0];
    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, papel: usuario.papel },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, papel: usuario.papel } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao realizar login' });
  }
});

// ===================== PRODUTOS =====================

// GET /api/produtos — lista todos os produtos (admin e lojista podem ver)
app.get('/api/produtos', autenticar, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos WHERE ativo = TRUE ORDER BY nome');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar produtos' });
  }
});

// POST /api/produtos — cadastra um novo produto (somente admin)
// Body: { nome, marca, custo_unitario, multiplicador_venda }
app.post('/api/produtos', autenticar, permitirPapeis('admin'), async (req, res) => {
  const { nome, marca, custo_unitario, multiplicador_venda } = req.body;
  if (!nome || custo_unitario === undefined) {
    return res.status(400).json({ erro: 'Informe nome e custo_unitario' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO produtos (nome, marca, custo_unitario, multiplicador_venda)
       VALUES ($1, $2, $3, COALESCE($4, 2.00))
       RETURNING *`,
      [nome, marca, custo_unitario, multiplicador_venda]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cadastrar produto' });
  }
});

// PUT /api/produtos/:id — atualiza dados do produto (somente admin)
app.put('/api/produtos/:id', autenticar, permitirPapeis('admin'), async (req, res) => {
  const { id } = req.params;
  const { nome, marca, custo_unitario, multiplicador_venda, ativo } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE produtos SET
         nome = COALESCE($1, nome),
         marca = COALESCE($2, marca),
         custo_unitario = COALESCE($3, custo_unitario),
         multiplicador_venda = COALESCE($4, multiplicador_venda),
         ativo = COALESCE($5, ativo),
         atualizado_em = NOW()
       WHERE id = $6
       RETURNING *`,
      [nome, marca, custo_unitario, multiplicador_venda, ativo, id]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar produto' });
  }
});

// ===================== ESTOQUE =====================

// GET /api/estoque — estoque disponível por produto (admin e lojista)
app.get('/api/estoque', autenticar, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM vw_estoque_atual ORDER BY nome');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao consultar estoque' });
  }
});

// ===================== ENTRADAS DE ESTOQUE =====================

// POST /api/entradas-estoque — lança nota fiscal com itens (somente admin)
app.post('/api/entradas-estoque', autenticar, permitirPapeis('admin'), async (req, res) => {
  const { numero_nota_fiscal, arquivo_nota_fiscal_url, observacao, itens } = req.body;

  if (!numero_nota_fiscal || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'Informe numero_nota_fiscal e ao menos um item' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const entradaResult = await client.query(
      `INSERT INTO entradas_estoque (numero_nota_fiscal, arquivo_nota_fiscal_url, observacao, lancado_por)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [numero_nota_fiscal, arquivo_nota_fiscal_url, observacao, req.usuario.id]
    );
    const entradaId = entradaResult.rows[0].id;

    const itensInseridos = [];
    for (const item of itens) {
      const { produto_id, quantidade, custo_unitario_registrado } = item;
      if (!produto_id || !quantidade || custo_unitario_registrado === undefined) {
        throw new Error('Cada item precisa de produto_id, quantidade e custo_unitario_registrado');
      }

      const { rows } = await client.query(
        `INSERT INTO entradas_estoque_itens (entrada_id, produto_id, quantidade, custo_unitario_registrado)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [entradaId, produto_id, quantidade, custo_unitario_registrado]
      );

      await client.query(
        `UPDATE produtos SET custo_unitario = $1, atualizado_em = NOW() WHERE id = $2`,
        [custo_unitario_registrado, produto_id]
      );

      itensInseridos.push(rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ entrada_id: entradaId, itens: itensInseridos });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ erro: err.message || 'Erro ao registrar entrada de estoque' });
  } finally {
    client.release();
  }
});

// GET /api/entradas-estoque — histórico de notas fiscais lançadas (somente admin)
app.get('/api/entradas-estoque', autenticar, permitirPapeis('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*,
              json_agg(json_build_object(
                'produto_id', ei.produto_id,
                'quantidade', ei.quantidade,
                'custo_unitario_registrado', ei.custo_unitario_registrado,
                'subtotal', ei.subtotal
              )) AS itens
       FROM entradas_estoque e
       JOIN entradas_estoque_itens ei ON ei.entrada_id = e.id
       GROUP BY e.id
       ORDER BY e.data_entrada DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar entradas de estoque' });
  }
});

// ===================== SAÍDAS / VENDAS =====================

// POST /api/saidas-venda — lojista (ou admin) lança uma venda
app.post('/api/saidas-venda', autenticar, permitirPapeis('lojista', 'admin'), async (req, res) => {
  const { produto_id, quantidade } = req.body;
  if (!produto_id || !quantidade || quantidade <= 0) {
    return res.status(400).json({ erro: 'Informe produto_id e quantidade válida' });
  }

  try {
    const produtoResult = await pool.query(
      'SELECT id, custo_unitario, preco_venda FROM produtos WHERE id = $1 AND ativo = TRUE',
      [produto_id]
    );
    const produto = produtoResult.rows[0];
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

    const estoqueResult = await pool.query(
      'SELECT estoque_disponivel FROM vw_estoque_atual WHERE produto_id = $1',
      [produto_id]
    );
    const estoqueDisponivel = estoqueResult.rows[0]?.estoque_disponivel ?? 0;
    if (quantidade > estoqueDisponivel) {
      return res.status(400).json({ erro: `Estoque insuficiente (disponível: ${estoqueDisponivel})` });
    }

    const { rows } = await pool.query(
      `INSERT INTO saidas_venda
         (produto_id, quantidade, preco_venda_unitario, custo_unitario_no_momento, lancado_por)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [produto_id, quantidade, produto.preco_venda, produto.custo_unitario, req.usuario.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao registrar venda' });
  }
});

// GET /api/saidas-venda — histórico de vendas (lojista vê só as próprias, admin vê tudo)
app.get('/api/saidas-venda', autenticar, async (req, res) => {
  try {
    const query = req.usuario.papel === 'admin'
      ? 'SELECT sv.*, p.nome AS produto_nome FROM saidas_venda sv JOIN produtos p ON p.id = sv.produto_id ORDER BY sv.data_venda DESC'
      : 'SELECT sv.*, p.nome AS produto_nome FROM saidas_venda sv JOIN produtos p ON p.id = sv.produto_id WHERE sv.lancado_por = $1 ORDER BY sv.data_venda DESC';
    const params = req.usuario.papel === 'admin' ? [] : [req.usuario.id];
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar vendas' });
  }
});

// ===================== REPASSES =====================

// GET /api/repasses/pendentes — vendas ainda não incluídas em nenhum repasse fechado (somente admin)
app.get('/api/repasses/pendentes', autenticar, permitirPapeis('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT sv.*, p.nome AS produto_nome
       FROM vw_vendas_pendentes_repasse sv
       JOIN produtos p ON p.id = sv.produto_id
       ORDER BY sv.data_venda`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar vendas pendentes de repasse' });
  }
});

// POST /api/repasses — fecha um repasse agrupando vendas pendentes de um período (somente admin)
app.post('/api/repasses', autenticar, permitirPapeis('admin'), async (req, res) => {
  const { periodo_inicio, periodo_fim } = req.body;
  if (!periodo_inicio || !periodo_fim) {
    return res.status(400).json({ erro: 'Informe periodo_inicio e periodo_fim' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const vendasResult = await client.query(
      `SELECT sv.id, sv.valor_devido_grupo
       FROM vw_vendas_pendentes_repasse sv
       WHERE sv.data_venda BETWEEN $1 AND $2`,
      [periodo_inicio, periodo_fim]
    );

    if (vendasResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ erro: 'Nenhuma venda pendente nesse período' });
    }

    const valorTotal = vendasResult.rows.reduce((soma, venda) => soma + Number(venda.valor_devido_grupo), 0);

    const repasseResult = await client.query(
      `INSERT INTO repasses (periodo_inicio, periodo_fim, valor_total_devido)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [periodo_inicio, periodo_fim, valorTotal]
    );
    const repasse = repasseResult.rows[0];

    for (const venda of vendasResult.rows) {
      await client.query(`INSERT INTO repasses_vendas (repasse_id, saida_venda_id) VALUES ($1, $2)`, [repasse.id, venda.id]);
    }

    await client.query('COMMIT');
    res.status(201).json(repasse);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ erro: 'Erro ao fechar repasse' });
  } finally {
    client.release();
  }
});

// PUT /api/repasses/:id/pagar — marca um repasse como pago (somente admin)
app.put('/api/repasses/:id/pagar', autenticar, permitirPapeis('admin'), async (req, res) => {
  const { id } = req.params;
  const { data_pagamento } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE repasses SET status = 'pago', data_pagamento = COALESCE($1, CURRENT_DATE) WHERE id = $2 RETURNING *`,
      [data_pagamento, id]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Repasse não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao marcar repasse como pago' });
  }
});

// GET /api/repasses — histórico de repasses (admin e lojista)
app.get('/api/repasses', autenticar, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM repasses ORDER BY periodo_inicio DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar repasses' });
  }
});

// ===================== INICIALIZAÇÃO =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Barbosa Suplementos API rodando na porta ${PORT}`);
});
