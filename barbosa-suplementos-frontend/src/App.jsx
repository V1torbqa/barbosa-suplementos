import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import logoClaro from './assets/logosupclaro.png';
import logoEscuro from './assets/logosupescuro.png';
import './App.css';

/* ===================== CLIENTE DE API ===================== */
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('barbosa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('barbosa_token');
      localStorage.removeItem('barbosa_usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* ===================== CONTEXTO DE AUTENTICAÇÃO ===================== */
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('barbosa_usuario');
    return salvo ? JSON.parse(salvo) : null;
  });

  async function login(email, senha) {
    const { data } = await api.post('/auth/login', { email, senha });
    localStorage.setItem('barbosa_token', data.token);
    localStorage.setItem('barbosa_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }

  function logout() {
    localStorage.removeItem('barbosa_token');
    localStorage.removeItem('barbosa_usuario');
    setUsuario(null);
  }

  return <AuthContext.Provider value={{ usuario, login, logout }}>{children}</AuthContext.Provider>;
}

function useAuth() {
  return useContext(AuthContext);
}

/* ===================== CONTEXTO DE TEMA ===================== */
const ThemeContext = createContext(null);

function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => localStorage.getItem('barbosa_tema') || 'claro');

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema);
    localStorage.setItem('barbosa_tema', tema);
  }, [tema]);

  function alternarTema() {
    setTema((atual) => (atual === 'claro' ? 'escuro' : 'claro'));
  }

  return <ThemeContext.Provider value={{ tema, alternarTema }}>{children}</ThemeContext.Provider>;
}

function useTheme() {
  return useContext(ThemeContext);
}

/* ===================== ÍCONES (SVG) ===================== */
const propsIcone = (tamanho) => ({
  width: tamanho,
  height: tamanho,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
});

function IconeEstoque({ tamanho = 20 }) {
  return (
    <svg {...propsIcone(tamanho)}>
      <path d="M3 8l9-5 9 5-9 5-9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

function IconeEntrada({ tamanho = 20 }) {
  return (
    <svg {...propsIcone(tamanho)}>
      <path d="M6 2h9l3 3v17H6V2Z" />
      <path d="M15 2v3h3" />
      <path d="M9 11h6" />
      <path d="M9 14.5h6" />
      <path d="M9 18h3.5" />
    </svg>
  );
}

function IconeRepasse({ tamanho = 20 }) {
  return (
    <svg {...propsIcone(tamanho)}>
      <path d="M4 7h11l-3-3" />
      <path d="M20 17H9l3 3" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconeVender({ tamanho = 20 }) {
  return (
    <svg {...propsIcone(tamanho)}>
      <circle cx="9" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <path d="M2.5 3h2.5l2.6 12.3a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.6L21.5 8H6" />
    </svg>
  );
}

function IconeExtrato({ tamanho = 20 }) {
  return (
    <svg {...propsIcone(tamanho)}>
      <path d="M4 20V10" />
      <path d="M11 20V4" />
      <path d="M18 20v-7" />
      <path d="M2 20h20" />
    </svg>
  );
}

function IconeSol({ tamanho = 18 }) {
  return (
    <svg {...propsIcone(tamanho)}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2" />
      <path d="M12 19.3v2.2" />
      <path d="M4.6 4.6l1.6 1.6" />
      <path d="M17.8 17.8l1.6 1.6" />
      <path d="M2.5 12h2.2" />
      <path d="M19.3 12h2.2" />
      <path d="M4.6 19.4l1.6-1.6" />
      <path d="M17.8 6.2l1.6-1.6" />
    </svg>
  );
}

function IconeLua({ tamanho = 18 }) {
  return (
    <svg {...propsIcone(tamanho)}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

function IconeSair({ tamanho = 18 }) {
  return (
    <svg {...propsIcone(tamanho)}>
      <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function IconePerfil({ tamanho = 20 }) {
  return (
    <svg {...propsIcone(tamanho)}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.4-3.6 4.4-5.4 7.5-5.4s6.1 1.8 7.5 5.4" />
    </svg>
  );
}

function IconeOlho({ tamanho = 18 }) {
  return (
    <svg {...propsIcone(tamanho)}>
      <path d="M2 12c2.2-4.4 6-7 10-7s7.8 2.6 10 7c-2.2 4.4-6 7-10 7s-7.8-2.6-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconeOlhoFechado({ tamanho = 18 }) {
  return (
    <svg {...propsIcone(tamanho)}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c4 0 7.8 2.6 10 7-1 2-2.3 3.6-3.8 4.8" />
      <path d="M6.6 6.6C4.8 7.8 3.3 9.6 2 12c2.2 4.4 6 7 10 7 1.3 0 2.5-.3 3.7-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

/* ===================== COMPONENTES REUTILIZÁVEIS ===================== */

function Logo({ tamanho = 25 }) {
  const { tema } = useTheme();
  const logo = tema === 'escuro' ? logoEscuro : logoClaro;
  return <img src={logo} alt="Barbosa Suplementos" style={{ height: tamanho, width: 'auto', objectFit: 'contain' }} />;
}

function AlternadorTema({ className = '' }) {
  const { tema, alternarTema } = useTheme();
  return (
    <button
      type="button"
      className={`alternador-tema ${className}`}
      data-tema-atual={tema}
      onClick={alternarTema}
      aria-label="Alternar tema"
      title={tema === 'claro' ? 'Ativar tema escuro' : 'Ativar tema claro'}
    >
      <span className="alternador-tema-indicador" />
      <span className="alternador-tema-opcao"><IconeSol tamanho={14} /></span>
      <span className="alternador-tema-opcao"><IconeLua tamanho={14} /></span>
    </button>
  );
}

function ModalSucesso({ aberto, mensagem, aoFechar }) {
  useEffect(() => {
    if (!aberto) return;
    document.body.style.overflow = 'hidden';
    const tempo = setTimeout(() => aoFechar(), 1800);
    return () => {
      document.body.style.overflow = '';
      clearTimeout(tempo);
    };
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div className="modal-fundo">
      <div className="modal-sucesso cartao">
        <svg className="check-svg" viewBox="0 0 52 52">
          <circle className="check-circulo" cx="26" cy="26" r="24" fill="none" />
          <path className="check-marca" fill="none" d="M14 27l7 7 16-16" />
        </svg>
        <p>{mensagem}</p>
      </div>
    </div>
  );
}

/* ===================== UTIL: PDF DE REPASSE ===================== */
function formatarData(valor) {
  return new Date(valor).toLocaleDateString('pt-BR');
}

/* ===================== UTIL: MÁSCARA DE MOEDA (estilo Pix) ===================== */
// Guarda o valor internamente em centavos (inteiro) e formata como "1.234,56" ao exibir.
function centavosParaTexto(centavos) {
  const valor = (Number(centavos) || 0) / 100;
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function textoParaCentavos(texto) {
  const somenteDigitos = String(texto).replace(/\D/g, '');
  return somenteDigitos ? Number(somenteDigitos) : 0;
}

function centavosParaReais(centavos) {
  return (Number(centavos) || 0) / 100;
}

// Campo de valor em reais que formata sozinho enquanto o usuário digita (como no Pix):
// digitar "2" "0" "0" vira R$ 2,00, mais um dígito vira R$ 20,00, e assim por diante.
function CampoMoeda({ label, valorCentavos, aoAlterar, obrigatorio = true }) {
  return (
    <div className="campo">
      <label>{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={`R$ ${centavosParaTexto(valorCentavos)}`}
        onChange={(e) => aoAlterar(textoParaCentavos(e.target.value))}
        required={obrigatorio}
      />
    </div>
  );
}

function gerarPdfRepasse(repasse) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const corPrimaria = '#5EA627';
  const corTexto = '#14170F';
  const corSuave = '#5B6357';

  doc.setFillColor(corPrimaria);
  doc.rect(0, 0, 595, 90, 'F');

  doc.setTextColor('#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('BARBOSA SUPLEMENTOS', 48, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Comprovante de Repasse', 48, 66);

  doc.setTextColor(corTexto);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Detalhes do repasse', 48, 130);

  const linhas = [
    ['Período', `${formatarData(repasse.periodo_inicio)} a ${formatarData(repasse.periodo_fim)}`],
    ['Valor total devido', `R$ ${Number(repasse.valor_total_devido).toFixed(2)}`],
    ['Status', repasse.status === 'pago' ? 'Pago' : 'Pendente'],
    ['Data de pagamento', repasse.data_pagamento ? formatarData(repasse.data_pagamento) : '—']
  ];

  let y = 160;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  linhas.forEach(([rotulo, valor]) => {
    doc.setTextColor(corSuave);
    doc.text(rotulo, 48, y);
    doc.setTextColor(corTexto);
    doc.setFont('helvetica', 'bold');
    doc.text(String(valor), 220, y);
    doc.setFont('helvetica', 'normal');
    y += 26;
  });

  doc.setDrawColor('#E5E7E0');
  doc.line(48, y + 6, 547, y + 6);
  doc.setTextColor(corSuave);
  doc.setFontSize(9);
  doc.text(`Emitido em ${formatarData(new Date())}`, 48, y + 26);

  doc.save(`repasse-${repasse.periodo_inicio}-a-${repasse.periodo_fim}.pdf`);
}

/* ===================== LAYOUT (sidebar + topo + menu mobile) ===================== */
const abasAdmin = [
  { caminho: '/admin/estoque', rotulo: 'Estoque', Icone: IconeEstoque },
  { caminho: '/admin/entradas', rotulo: 'Entradas', Icone: IconeEntrada },
  { caminho: '/admin/repasses', rotulo: 'Repasses', Icone: IconeRepasse },
  { caminho: '/admin/perfil', rotulo: 'Perfil', Icone: IconePerfil }
];

const abasLojista = [
  { caminho: '/loja/vender', rotulo: 'Vender', Icone: IconeVender },
  { caminho: '/loja/extrato', rotulo: 'Extrato', Icone: IconeExtrato },
  { caminho: '/loja/perfil', rotulo: 'Perfil', Icone: IconePerfil }
];

function Layout({ abas, children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nomePapel = usuario?.papel === 'admin' ? 'Admin' : 'Lojista';

  const navRef = useRef(null);
  const itemRefs = useRef({});
  const [indicador, setIndicador] = useState({ left: 0, width: 0, pronto: false });

  function medirIndicador() {
    const ativo = itemRefs.current[location.pathname];
    const nav = navRef.current;
    if (!ativo || !nav) return;
    const retNav = nav.getBoundingClientRect();
    const retItem = ativo.getBoundingClientRect();
    setIndicador({ left: retItem.left - retNav.left, width: retItem.width, pronto: true });
  }

  useEffect(() => {
    medirIndicador();
    window.addEventListener('resize', medirIndicador);
    return () => window.removeEventListener('resize', medirIndicador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, abas]);

  function sair() {
    logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar superficie-vidro">
        <div className="sidebar-topo"><Logo tamanho={25} /></div>

        <nav className="sidebar-nav">
          {abas.map((aba) => (
            <NavLink
              key={aba.caminho}
              to={aba.caminho}
              className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item-ativo' : ''}`}
            >
              <span className="sidebar-icone"><aba.Icone tamanho={19} /></span>
              <span>{aba.rotulo}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-rodape">
          <div className="sidebar-usuario">
            <div className="sidebar-usuario-nome">{usuario?.nome}</div>
            <div className="sidebar-usuario-papel">{nomePapel === 'Admin' ? 'Administrador' : 'Lojista'}</div>
          </div>
          <button className="botao botao-secundario" onClick={sair}>
            <IconeSair tamanho={16} />
            Sair
          </button>
        </div>
      </aside>

      <div className="area-principal">
        <header className="topo">
          <div className="topo-usuario">
            <span className="topo-usuario-nome">{usuario?.nome}</span>
            <span className="topo-usuario-separador">·</span>
            <span className="topo-usuario-papel">{nomePapel}</span>
          </div>
          <AlternadorTema />
        </header>

        <main className="conteudo">
          <div key={location.pathname} className="pagina-transicao">{children}</div>
        </main>
      </div>

      <nav className="menu-inferior superficie-vidro" ref={navRef}>
        {indicador.pronto && (
          <span
            className="menu-inferior-indicador-wrap"
            style={{ transform: `translateX(${indicador.left}px)`, width: indicador.width }}
          >
            <span key={location.pathname} className="menu-inferior-indicador" />
          </span>
        )}
        {abas.map((aba) => (
          <NavLink
            key={aba.caminho}
            to={aba.caminho}
            ref={(el) => { itemRefs.current[aba.caminho] = el; }}
            className={({ isActive }) => `menu-inferior-item ${isActive ? 'menu-inferior-item-ativo' : ''}`}
          >
            <span className="menu-inferior-icone"><aba.Icone tamanho={19} /></span>
            <span className="menu-inferior-rotulo">{aba.rotulo}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function RotaProtegida({ papeisPermitidos, children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (papeisPermitidos && !papeisPermitidos.includes(usuario.papel)) {
    return <Navigate to={usuario.papel === 'admin' ? '/admin/estoque' : '/loja/vender'} replace />;
  }
  return children;
}

/* ===================== PÁGINA: LOGIN ===================== */
function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const usuario = await login(email, senha);
      navigate(usuario.papel === 'admin' ? '/admin/estoque' : '/loja/vender');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível entrar. Confira email e senha.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="pagina-login">
      <div className="cartao superficie-vidro cartao-login">
        <AlternadorTema className="cartao-login-alternador" />

        <div className="cartao-login-logo"><Logo tamanho={25} /></div>
        <p className="cartao-login-subtitulo">Controle de repasse e consignação</p>

        <form onSubmit={aoEnviar} className="form-login">
          <div className="campo">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@exemplo.com" required autoFocus />
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <div className="campo-senha-wrap">
              <input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="campo-senha-olho"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
                tabIndex={-1}
              >
                {mostrarSenha ? <IconeOlhoFechado tamanho={18} /> : <IconeOlho tamanho={18} />}
              </button>
            </div>
          </div>

          {erro && <div className="mensagem-erro">{erro}</div>}

          <button type="submit" className="botao botao-primario" disabled={carregando} style={{ marginTop: 8 }}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ===================== PÁGINA: ESTOQUE (ADMIN) ===================== */
function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [custoCentavos, setCustoCentavos] = useState(0);
  const [multiplicador, setMultiplicador] = useState('2');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    const [resProdutos, resEstoque] = await Promise.all([api.get('/produtos'), api.get('/estoque')]);
    setProdutos(resProdutos.data);
    setEstoque(resEstoque.data);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function estoqueDoProduto(produtoId) {
    return estoque.find((e) => e.produto_id === produtoId)?.estoque_disponivel ?? 0;
  }

  async function aoSalvarProduto(evento) {
    evento.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await api.post('/produtos', {
        nome,
        marca,
        custo_unitario: centavosParaReais(custoCentavos),
        multiplicador_venda: Number(multiplicador)
      });
      setNome(''); setMarca(''); setCustoCentavos(0); setMultiplicador('2');
      setMostrarForm(false);
      setSucesso(true);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao cadastrar produto');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <div className="pagina-cabecalho">
        <div>
          <h1 className="pagina-titulo">Estoque</h1>
          <p className="pagina-subtitulo">Produtos cadastrados e disponibilidade atual</p>
        </div>
        <button className="botao botao-primario" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? 'Cancelar' : '+ Novo produto'}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={aoSalvarProduto} className="cartao form-cartao">
          <div className="form-linha">
            <div className="campo" style={{ flex: 2 }}>
              <label>Nome do produto</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Creatina 300g" />
            </div>
            <div className="campo" style={{ flex: 1.4 }}>
              <label>Marca</label>
              <input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ex: Dark Lab" />
            </div>
          </div>
          <div className="form-linha">
            <div style={{ flex: 1 }}>
              <CampoMoeda label="Custo unitário" valorCentavos={custoCentavos} aoAlterar={setCustoCentavos} />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label>Multiplicador de venda</label>
              <input type="number" step="0.1" min="1" value={multiplicador} onChange={(e) => setMultiplicador(e.target.value)} required />
            </div>
          </div>
          {erro && <div className="mensagem-erro">{erro}</div>}
          <button type="submit" className="botao botao-primario" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar produto'}
          </button>
        </form>
      )}

      {carregando ? (
        <p className="pagina-subtitulo">Carregando...</p>
      ) : produtos.length === 0 ? (
        <div className="cartao cartao-vazio">
          <p>Nenhum produto cadastrado ainda. Cadastre o primeiro produto pra começar a lançar entradas de estoque.</p>
        </div>
      ) : (
        <div className="grade-produtos">
          {produtos.map((produto) => (
            <div key={produto.id} className="cartao card-produto">
              <h3 className="card-produto-nome">{produto.nome}</h3>
              {produto.marca && <span className="pilula pilula-sucesso card-produto-marca">{produto.marca}</span>}
              <div className="card-produto-linha">
                <span className="card-produto-rotulo">Custo</span>
                <span>R$ {Number(produto.custo_unitario).toFixed(2)}</span>
              </div>
              <div className="card-produto-linha">
                <span className="card-produto-rotulo">Preço de venda</span>
                <span>R$ {Number(produto.preco_venda).toFixed(2)}</span>
              </div>
              <div className="card-produto-linha">
                <span className="card-produto-rotulo">Em estoque</span>
                <span className={`pilula ${estoqueDoProduto(produto.id) > 0 ? 'pilula-sucesso' : 'pilula-pendente'}`}>
                  {estoqueDoProduto(produto.id)} un.
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalSucesso aberto={sucesso} mensagem="Produto cadastrado!" aoFechar={() => setSucesso(false)} />
    </div>
  );
}

/* ===================== PÁGINA: ENTRADA DE ESTOQUE (ADMIN) ===================== */
function EntradaEstoque() {
  const [produtos, setProdutos] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [numeroNota, setNumeroNota] = useState('');
  const [itens, setItens] = useState([{ produto_id: '', quantidade: '', custoCentavos: 0 }]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  async function carregar() {
    const [resProdutos, resEntradas] = await Promise.all([api.get('/produtos'), api.get('/entradas-estoque')]);
    setProdutos(resProdutos.data);
    setEntradas(resEntradas.data);
  }

  useEffect(() => { carregar(); }, []);

  function atualizarItem(indice, campo, valor) {
    setItens((atual) => atual.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)));
  }

  // Ao escolher o produto, já preenche o custo com o valor mais recente conhecido
  // (o usuário pode ajustar se o preço dessa compra for diferente).
  function selecionarProduto(indice, produtoId) {
    const produto = produtos.find((p) => String(p.id) === String(produtoId));
    const custoCentavos = produto ? Math.round(Number(produto.custo_unitario) * 100) : 0;
    setItens((atual) =>
      atual.map((item, i) => (i === indice ? { ...item, produto_id: produtoId, custoCentavos } : item))
    );
  }

  function adicionarLinha() {
    setItens((atual) => [...atual, { produto_id: '', quantidade: '', custoCentavos: 0 }]);
  }

  function removerLinha(indice) {
    setItens((atual) => atual.filter((_, i) => i !== indice));
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await api.post('/entradas-estoque', {
        numero_nota_fiscal: numeroNota,
        itens: itens.map((item) => ({
          produto_id: Number(item.produto_id),
          quantidade: Number(item.quantidade),
          custo_unitario_registrado: centavosParaReais(item.custoCentavos)
        }))
      });
      setNumeroNota('');
      setItens([{ produto_id: '', quantidade: '', custoCentavos: 0 }]);
      setSucesso(true);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao lançar entrada de estoque');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h1 className="pagina-titulo">Entrada de Estoque</h1>
      <p className="pagina-subtitulo-bloco">Lance a nota fiscal e os produtos que chegaram</p>

      <form onSubmit={aoEnviar} className="cartao form-cartao">
        <div className="campo">
          <label>Número da nota fiscal</label>
          <input value={numeroNota} onChange={(e) => setNumeroNota(e.target.value)} required placeholder="Ex: 000123" />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--cor-texto-suave)', display: 'block', marginBottom: 8 }}>
            Produtos da nota
          </label>
          {itens.map((item, indice) => (
            <div key={indice} className="linha-item-entrada">
              <select
                value={item.produto_id}
                onChange={(e) => selecionarProduto(indice, e.target.value)}
                required
                className="select-item-entrada"
              >
                <option value="">Selecione o produto</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>{p.marca ? `${p.marca} — ${p.nome}` : p.nome}</option>
                ))}
              </select>
              <input
                type="number" min="1" placeholder="Qtd"
                value={item.quantidade}
                onChange={(e) => atualizarItem(indice, 'quantidade', e.target.value)}
                required className="input-item-entrada"
              />
              <input
                type="text" inputMode="numeric" placeholder="Custo un."
                value={`R$ ${centavosParaTexto(item.custoCentavos)}`}
                onChange={(e) => atualizarItem(indice, 'custoCentavos', textoParaCentavos(e.target.value))}
                required className="input-item-entrada"
              />
              {itens.length > 1 && (
                <button type="button" className="botao botao-secundario" onClick={() => removerLinha(indice)} style={{ padding: '10px 14px' }}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="botao botao-secundario" onClick={adicionarLinha} style={{ marginTop: 8 }}>
            + Adicionar produto
          </button>
        </div>

        {erro && <div className="mensagem-erro">{erro}</div>}

        <button type="submit" className="botao botao-primario" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Lançar entrada'}
        </button>
      </form>

      <h2 className="pagina-subtitulo-secao">Últimas entradas</h2>
      {entradas.length === 0 ? (
        <p className="pagina-subtitulo">Nenhuma entrada lançada ainda.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entradas.map((entrada) => (
            <div key={entrada.id} className="cartao card-entrada">
              <div className="card-entrada-cabecalho">
                <strong>NF {entrada.numero_nota_fiscal}</strong>
                <span className="card-entrada-data">{formatarData(entrada.data_entrada)}</span>
              </div>
              <div className="card-entrada-itens">
                {entrada.itens.map((item, i) => {
                  const produto = produtos.find((p) => p.id === item.produto_id);
                  return <span key={i} className="card-entrada-tag">{produto?.nome || 'Produto'} × {item.quantidade}</span>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalSucesso aberto={sucesso} mensagem="Entrada de estoque lançada!" aoFechar={() => setSucesso(false)} />
    </div>
  );
}

/* ===================== PÁGINA: REPASSES (ADMIN) ===================== */
function Repasses() {
  const [pendentes, setPendentes] = useState([]);
  const [repasses, setRepasses] = useState([]);
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  async function carregar() {
    const [resPendentes, resRepasses] = await Promise.all([api.get('/repasses/pendentes'), api.get('/repasses')]);
    setPendentes(resPendentes.data);
    setRepasses(resRepasses.data);
  }

  useEffect(() => { carregar(); }, []);

  const totalPendente = pendentes.reduce((soma, v) => soma + Number(v.valor_devido_grupo), 0);

  async function aoFecharRepasse(evento) {
    evento.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await api.post('/repasses', { periodo_inicio: periodoInicio, periodo_fim: periodoFim });
      setPeriodoInicio(''); setPeriodoFim('');
      setSucesso('Repasse fechado!');
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao fechar repasse');
    } finally {
      setSalvando(false);
    }
  }

  async function marcarPago(id) {
    await api.put(`/repasses/${id}/pagar`, {});
    setSucesso('Repasse marcado como pago!');
    carregar();
  }

  return (
    <div>
      <h1 className="pagina-titulo">Repasses</h1>
      <p className="pagina-subtitulo-bloco">Controle do que o lojista deve repassar ao grupo Barbosa</p>

      <div className="cartao card-resumo">
        <span className="card-resumo-rotulo">Vendas pendentes de repasse</span>
        <strong className="card-resumo-valor">R$ {totalPendente.toFixed(2)}</strong>
        <span className="card-resumo-rotulo">{pendentes.length} venda(s) ainda não incluída(s) em um repasse fechado</span>
      </div>

      <form onSubmit={aoFecharRepasse} className="cartao form-cartao">
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>Fechar novo repasse</h3>
        <div className="form-linha">
          <div className="campo" style={{ flex: 1 }}>
            <label>Período — início</label>
            <input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} required />
          </div>
          <div className="campo" style={{ flex: 1 }}>
            <label>Período — fim</label>
            <input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} required />
          </div>
        </div>
        {erro && <div className="mensagem-erro">{erro}</div>}
        <button type="submit" className="botao botao-primario" disabled={salvando}>
          {salvando ? 'Fechando...' : 'Fechar repasse do período'}
        </button>
      </form>

      <h2 className="pagina-subtitulo-secao">Histórico de repasses</h2>
      {repasses.length === 0 ? (
        <p className="pagina-subtitulo">Nenhum repasse fechado ainda.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {repasses.map((repasse) => (
            <div key={repasse.id} className="cartao card-repasse">
              <div>
                <strong>{formatarData(repasse.periodo_inicio)} a {formatarData(repasse.periodo_fim)}</strong>
                <div className="card-repasse-valor">R$ {Number(repasse.valor_total_devido).toFixed(2)}</div>
              </div>
              <div className="card-repasse-acoes">
                <span className={`pilula ${repasse.status === 'pago' ? 'pilula-sucesso' : 'pilula-pendente'}`}>
                  {repasse.status === 'pago' ? 'Pago' : 'Pendente'}
                </span>
                <button className="botao botao-secundario" onClick={() => gerarPdfRepasse(repasse)}>Imprimir PDF</button>
                {repasse.status !== 'pago' && (
                  <button className="botao botao-secundario" onClick={() => marcarPago(repasse.id)}>Marcar como pago</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalSucesso aberto={!!sucesso} mensagem={sucesso} aoFechar={() => setSucesso('')} />
    </div>
  );
}

/* ===================== PÁGINA: VENDER (LOJISTA) ===================== */
function Vender() {
  const [estoque, setEstoque] = useState([]);
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  async function carregar() {
    const { data } = await api.get('/estoque');
    setEstoque(data.filter((p) => p.estoque_disponivel > 0));
  }

  useEffect(() => { carregar(); }, []);

  const produtoSelecionado = estoque.find((p) => String(p.produto_id) === produtoId);
  const totalVenda = produtoSelecionado ? Number(produtoSelecionado.preco_venda) * Number(quantidade || 0) : 0;

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await api.post('/saidas-venda', { produto_id: Number(produtoId), quantidade: Number(quantidade) });
      setProdutoId(''); setQuantidade('1');
      setSucesso(true);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao registrar venda');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h1 className="pagina-titulo">Registrar venda</h1>
      <p className="pagina-subtitulo-bloco">Selecione o produto vendido e a quantidade</p>

      <form onSubmit={aoEnviar} className="cartao form-cartao" style={{ maxWidth: 420 }}>
        <div className="campo">
          <label>Produto</label>
          <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)} required>
            <option value="">Selecione o produto</option>
            {estoque.map((p) => (
              <option key={p.produto_id} value={p.produto_id}>
                {p.marca ? `${p.marca} — ${p.nome}` : p.nome} — {p.estoque_disponivel} disponíveis
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label>Quantidade vendida</label>
          <input
            type="number" min="1" max={produtoSelecionado?.estoque_disponivel || undefined}
            value={quantidade} onChange={(e) => setQuantidade(e.target.value)} required
          />
        </div>

        {produtoSelecionado && (
          <div className="previa-venda">
            <div className="previa-venda-linha">
              <span>Preço unitário</span>
              <strong>R$ {Number(produtoSelecionado.preco_venda).toFixed(2)}</strong>
            </div>
            <div className="previa-venda-linha">
              <span>Total a cobrar do cliente</span>
              <strong className="previa-venda-total">R$ {totalVenda.toFixed(2)}</strong>
            </div>
          </div>
        )}

        {erro && <div className="mensagem-erro">{erro}</div>}

        <button type="submit" className="botao botao-primario" disabled={salvando}>
          {salvando ? 'Registrando...' : 'Confirmar venda'}
        </button>
      </form>

      {estoque.length === 0 && (
        <div className="cartao cartao-vazio" style={{ marginTop: 20 }}>
          <p>Nenhum produto disponível em estoque no momento.</p>
        </div>
      )}

      <ModalSucesso aberto={sucesso} mensagem="Produto vendido!" aoFechar={() => setSucesso(false)} />
    </div>
  );
}

/* ===================== PÁGINA: EXTRATO (LOJISTA) ===================== */
function Extrato() {
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get('/saidas-venda').then(({ data }) => {
      setVendas(data);
      setCarregando(false);
    });
  }, []);

  const totalVendido = vendas.reduce((soma, v) => soma + Number(v.valor_total_venda), 0);
  const totalARepassar = vendas.reduce((soma, v) => soma + Number(v.valor_devido_grupo), 0);
  const totalLucroLojista = vendas.reduce((soma, v) => soma + Number(v.valor_lojista), 0);

  return (
    <div>
      <h1 className="pagina-titulo">Meu extrato</h1>
      <p className="pagina-subtitulo-bloco">Resumo das suas vendas e do que deve ser repassado</p>

      <div className="grade-resumo-extrato">
        <div className="cartao card-resumo-extrato">
          <span className="card-resumo-rotulo">Total vendido</span>
          <strong className="card-resumo-extrato-valor">R$ {totalVendido.toFixed(2)}</strong>
        </div>
        <div className="cartao card-resumo-extrato">
          <span className="card-resumo-rotulo">A repassar ao grupo</span>
          <strong className="card-resumo-extrato-valor" style={{ color: 'var(--cor-aviso)' }}>R$ {totalARepassar.toFixed(2)}</strong>
        </div>
        <div className="cartao card-resumo-extrato">
          <span className="card-resumo-rotulo">Seu lucro</span>
          <strong className="card-resumo-extrato-valor" style={{ color: 'var(--cor-primaria)' }}>R$ {totalLucroLojista.toFixed(2)}</strong>
        </div>
      </div>

      <h2 className="pagina-subtitulo-secao">Histórico de vendas</h2>
      {carregando ? (
        <p className="pagina-subtitulo">Carregando...</p>
      ) : vendas.length === 0 ? (
        <div className="cartao cartao-vazio"><p>Nenhuma venda registrada ainda.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {vendas.map((venda) => (
            <div key={venda.id} className="cartao card-venda">
              <div>
                <strong>{venda.produto_nome}</strong>
                <div className="card-venda-data">{venda.quantidade} un. · {formatarData(venda.data_venda)}</div>
              </div>
              <div className="card-venda-valores">
                <span>Total: R$ {Number(venda.valor_total_venda).toFixed(2)}</span>
                <span className="card-venda-repasse">Repassar: R$ {Number(venda.valor_devido_grupo).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== PÁGINA: PERFIL ===================== */
function Perfil() {
  const { usuario, logout } = useAuth();
  const { tema, alternarTema } = useTheme();
  const navigate = useNavigate();
  const nomePapel = usuario?.papel === 'admin' ? 'Administrador' : 'Lojista';

  function sair() {
    logout();
    navigate('/login');
  }

  return (
    <div>
      <h1 className="pagina-titulo">Perfil</h1>
      <p className="pagina-subtitulo-bloco">Suas informações de acesso</p>

      <div className="cartao card-perfil">
        <div className="card-perfil-avatar">{usuario?.nome?.charAt(0).toUpperCase()}</div>
        <div>
          <div className="card-perfil-nome">{usuario?.nome}</div>
          <div className="card-perfil-papel">{nomePapel}</div>
        </div>
      </div>

      <div className="cartao card-perfil-opcao">
        <div>
          <div className="card-perfil-opcao-titulo">Tema do aplicativo</div>
          <div className="card-perfil-opcao-descricao">{tema === 'claro' ? 'Claro' : 'Escuro'}</div>
        </div>
        <AlternadorTema />
      </div>

      <button className="botao botao-secundario" style={{ width: '100%', marginTop: 20 }} onClick={sair}>
        <IconeSair tamanho={16} />
        Sair da conta
      </button>
    </div>
  );
}


function RedirecionamentoInicial() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  return <Navigate to={usuario.papel === 'admin' ? '/admin/estoque' : '/loja/vender'} replace />;
}

/* ===================== APP (ROTEAMENTO) ===================== */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RedirecionamentoInicial />} />
            <Route path="/login" element={<Login />} />

            <Route path="/admin/estoque" element={
              <RotaProtegida papeisPermitidos={['admin']}><Layout abas={abasAdmin}><Estoque /></Layout></RotaProtegida>
            } />
            <Route path="/admin/entradas" element={
              <RotaProtegida papeisPermitidos={['admin']}><Layout abas={abasAdmin}><EntradaEstoque /></Layout></RotaProtegida>
            } />
            <Route path="/admin/repasses" element={
              <RotaProtegida papeisPermitidos={['admin']}><Layout abas={abasAdmin}><Repasses /></Layout></RotaProtegida>
            } />
            <Route path="/admin/perfil" element={
              <RotaProtegida papeisPermitidos={['admin']}><Layout abas={abasAdmin}><Perfil /></Layout></RotaProtegida>
            } />

            <Route path="/loja/vender" element={
              <RotaProtegida papeisPermitidos={['lojista', 'admin']}><Layout abas={abasLojista}><Vender /></Layout></RotaProtegida>
            } />
            <Route path="/loja/extrato" element={
              <RotaProtegida papeisPermitidos={['lojista', 'admin']}><Layout abas={abasLojista}><Extrato /></Layout></RotaProtegida>
            } />
            <Route path="/loja/perfil" element={
              <RotaProtegida papeisPermitidos={['lojista', 'admin']}><Layout abas={abasLojista}><Perfil /></Layout></RotaProtegida>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}