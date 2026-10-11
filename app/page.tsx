"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type View = "inicio" | "imoveis" | "reserva" | "painel";
type Profile = "inquilino" | "proprietario";
type DashboardSection = "visao" | "propostas" | "contratos" | "pagamentos" | "caucao" | "avaliacoes" | "historico";
type ProposalStatus = "pendente" | "aceita" | "recusada";

const properties = [
  { id: 1, title: "Apartamento iluminado", place: "Vila Mariana, São Paulo", price: 1850, fees: 430, rooms: 2, deposit: 2, image: "/property-1.png", tag: "Mais compatível" },
  { id: 2, title: "Casa com quintal", place: "Tatuapé, São Paulo", price: 2200, fees: 120, rooms: 2, deposit: 1, image: "/property-2.png", tag: "Caução flexível" },
  { id: 3, title: "Studio com varanda", place: "Pinheiros, São Paulo", price: 2450, fees: 510, rooms: 1, deposit: 3, image: "/property-3.png", tag: "Perfil verificado" },
];

const steps = ["Visita", "Proposta", "Caução", "Contrato", "Mudança"];

function Logo() {
  return <div className="logo" aria-label="Chave Direta"><span className="logo-mark"><i>C</i><b>D</b><em>●</em></span><span>Chave <strong>Direta</strong></span></div>;
}

function Icon({ children }: { children: ReactNode }) { return <span className="icon">{children}</span>; }

export default function Home() {
  const [view, setView] = useState<View>("inicio");
  const [profile, setProfile] = useState<Profile>("inquilino");
  const [liked, setLiked] = useState<number[]>([1]);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [deposit, setDeposit] = useState(1620);
  const [maxPrice, setMaxPrice] = useState(2500);
  const [depositMonths, setDepositMonths] = useState(0);
  const [dashboardSection, setDashboardSection] = useState<DashboardSection>("visao");
  const [proposalStatus, setProposalStatus] = useState<Record<string, ProposalStatus>>({ "Mariana Souza": "pendente", "Carlos Nunes": "pendente" });
  const [history, setHistory] = useState(["Proposta aceita para o Apartamento iluminado", "Visita realizada em 9 de outubro de 2026", "Imóvel adicionado aos favoritos"]);
  const [persistence, setPersistence] = useState<"carregando" | "salvo" | "salvando" | "temporario">("carregando");
  const depositGoal = 3700;
  const filtered = useMemo(() => properties.filter((p) => {
    const matchesText = `${p.title} ${p.place}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && p.price <= maxPrice && (depositMonths === 0 || p.deposit === depositMonths);
  }), [query, maxPrice, depositMonths]);

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(""), 2600); }

  useEffect(() => {
    let active = true;
    fetch("/api/demo-state", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Banco indisponível");
        return response.json();
      })
      .then(({ state }) => {
        if (!active || !state) return;
        setDeposit(state.deposit);
        setLiked(state.liked);
        setProposalStatus(state.proposalStatus);
        setHistory(state.history);
        setPersistence("salvo");
      })
      .catch(() => active && setPersistence("temporario"));
    return () => { active = false; };
  }, []);

  async function saveState(next: {
    deposit?: number;
    liked?: number[];
    proposalStatus?: Record<string, ProposalStatus>;
    history?: string[];
  }) {
    setPersistence("salvando");
    try {
      const response = await fetch("/api/demo-state", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deposit: next.deposit ?? deposit,
          liked: next.liked ?? liked,
          proposalStatus: next.proposalStatus ?? proposalStatus,
          history: next.history ?? history,
        }),
      });
      if (!response.ok) throw new Error("Falha ao salvar");
      setPersistence("salvo");
    } catch {
      setPersistence("temporario");
      notify("Alteração mantida apenas nesta tela. Tente novamente.");
    }
  }

  function updateProposal(name: string, status: ProposalStatus) {
    const nextProposalStatus = { ...proposalStatus, [name]: status };
    const action = status === "aceita" ? "aceita" : "recusada";
    const nextHistory = [`Proposta de ${name} ${action}`, ...history].slice(0, 50);
    setProposalStatus(nextProposalStatus);
    setHistory(nextHistory);
    void saveState({ proposalStatus: nextProposalStatus, history: nextHistory });
    notify(`Proposta de ${name} ${action}. Histórico atualizado.`);
  }

  function toggleFavorite(propertyId: number) {
    const nextLiked = liked.includes(propertyId) ? liked.filter((id) => id !== propertyId) : [...liked, propertyId];
    setLiked(nextLiked);
    void saveState({ liked: nextLiked });
  }

  function addDeposit(amount: number) {
    const nextDeposit = deposit + amount;
    const nextHistory = [`Aporte demonstrativo de R$ ${amount.toLocaleString("pt-BR")} na Reserva Caução`, ...history].slice(0, 50);
    setDeposit(nextDeposit);
    setHistory(nextHistory);
    void saveState({ deposit: nextDeposit, history: nextHistory });
    notify(`Depósito demonstrativo: + R$ ${amount.toLocaleString("pt-BR")}`);
  }

  function recordHistory(event: string) {
    const nextHistory = [event, ...history].slice(0, 50);
    setHistory(nextHistory);
    void saveState({ history: nextHistory });
  }

  function openDashboard(profileType: Profile, section: DashboardSection = "visao") {
    setProfile(profileType);
    setDashboardSection(section);
    setView("painel");
  }

  return (
    <main>
      <header className="topbar">
        <button className="brand-button" onClick={() => setView("inicio")}><Logo /></button>
        <nav aria-label="Navegação principal">
          <button className={view === "inicio" ? "active" : ""} onClick={() => setView("inicio")}>Início</button>
          <button className={view === "imoveis" ? "active" : ""} onClick={() => setView("imoveis")}>Encontrar imóvel</button>
          <button className={view === "reserva" ? "active" : ""} onClick={() => setView("reserva")}>Reserva Caução</button>
          <button className={view === "painel" ? "active" : ""} onClick={() => setView("painel")}>Meu painel</button>
        </nav>
        <select className="mobile-nav" aria-label="Navegar para" value={view} onChange={(event) => setView(event.target.value as View)}><option value="inicio">Início</option><option value="imoveis">Encontrar imóvel</option><option value="reserva">Reserva Caução</option><option value="painel">Meu painel</option></select>
        <div className="header-actions"><button className="outline" onClick={() => openDashboard("proprietario")}>Anunciar imóvel</button><button className="avatar" onClick={() => openDashboard(profile)} aria-label="Abrir perfil">ID</button></div>
      </header>

      <div className="demo-notice" role="note"><strong>Ambiente acadêmico de demonstração</strong><span>Não realiza pagamentos, assinatura jurídica ou movimentação financeira real.</span><em className={`persistence-${persistence}`}>{persistence === "carregando" ? "Conectando ao banco…" : persistence === "salvando" ? "Salvando…" : persistence === "salvo" ? "✓ Dados salvos" : "Modo temporário"}</em></div>

      {view === "inicio" && <>
        <section className="hero">
          <div className="hero-copy"><span className="eyebrow">LOCAÇÃO DIRETA, DO SEU JEITO</span><h1>Encontre. Negocie.<br />Assine. <span>Morou.</span></h1><p>Uma jornada segura e transparente para quem busca um lar e para quem tem um imóvel para anunciar.</p><div className="hero-buttons"><button className="primary" onClick={() => setView("imoveis")}>Encontrar meu lar <span>→</span></button><button className="soft" onClick={() => { setProfile("proprietario"); setView("painel"); }}>Quero anunciar</button></div><div className="trust-row"><span>✓ Perfis verificados</span><span>✓ Contrato digital</span><span>✓ Pagamento protegido</span></div></div>
          <div className="hero-visual" aria-label="Prévia da jornada de locação"><div className="door-shape"><span>⌂</span></div><div className="floating-card match-card"><small>SEU MATCH</small><strong>94% compatível</strong><span>2 meses de caução</span></div><div className="floating-card verified-card"><i>✓</i><div><strong>Proposta aceita</strong><span>Próximo passo: contrato</span></div></div><div className="key-orbit">⌕</div></div>
        </section>
        <section className="journey"><div className="section-heading"><span>COMO FUNCIONA</span><h2>Da busca às chaves, tudo em um só lugar.</h2><p>Menos burocracia. Mais clareza para os dois lados.</p></div><div className="journey-grid">{[["01", "⌕", "Encontre", "Imóveis compatíveis com seu perfil, renda e garantia disponível."], ["02", "◇", "Negocie", "Agende visitas e envie propostas com todas as condições registradas."], ["03", "▤", "Assine", "Contrato e vistoria digitais, com histórico protegido para as partes."], ["04", "⌂", "Morou", "Pagamentos, caução e manutenção acompanhados com transparência."]].map(([n, icon, title, text]) => <article key={n}><small>{n}</small><Icon>{icon}</Icon><h3>{title}</h3><p>{text}</p></article>)}</div></section>
        <section className="dual-cta"><div className="tenant-cta"><span>PARA QUEM ALUGA</span><h2>Sua caução está crescendo.<br />Seu próximo lar também.</h2><p>Crie uma meta, acompanhe seu progresso e encontre imóveis que combinam com o valor que você já reservou.</p><button onClick={() => setView("reserva")}>Comece sua reserva →</button></div><div className="owner-cta"><span>PARA QUEM ANUNCIA</span><h2>Seu imóvel, sua escolha,<br />uma locação mais segura.</h2><p>Receba propostas completas, escolha a garantia e acompanhe o contrato sem perder a autonomia.</p><button onClick={() => { setProfile("proprietario"); setView("painel"); }}>Anuncie seu imóvel →</button></div></section>
      </>}

      {view === "imoveis" && <section className="page-shell">
        <div className="page-title"><div><span>ENCONTRE SEU PRÓXIMO LAR</span><h1>Imóveis que combinam com você.</h1><p>Comparamos localização, orçamento e caução para facilitar sua escolha.</p></div><div className="compatibility"><strong>R$ 1.620</strong><span>já reservados para caução</span></div></div>
        <div className="search-panel"><label><span>Onde você quer morar?</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Bairro, cidade ou região" /></label><label><span>Aluguel até</span><select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}><option value="2000">R$ 2.000</option><option value="2500">R$ 2.500</option><option value="3000">R$ 3.000</option></select></label><label><span>Caução aceita</span><select value={depositMonths} onChange={(e) => setDepositMonths(Number(e.target.value))}><option value="0">Todos</option><option value="1">1 mês</option><option value="2">2 meses</option><option value="3">3 meses</option></select></label><button className="primary" onClick={() => notify(`${filtered.length} imóveis encontrados`)}>Buscar imóveis</button></div>
        <div className="results-head"><p><strong>{filtered.length} imóveis</strong> encontrados em São Paulo</p><button className="filter-chip">☷ Mais filtros</button></div>
        {filtered.length === 0 ? <div className="empty-state"><Icon>⌕</Icon><h2>Nenhum imóvel encontrado</h2><p>Ajuste o valor, a caução ou a localização para ampliar a busca.</p><button className="soft" onClick={() => { setQuery(""); setMaxPrice(3000); setDepositMonths(0); }}>Limpar filtros</button></div> : <div className="property-grid">{filtered.map((p) => <article className="property-card" key={p.id}><div className="property-image" style={{ backgroundImage: `url(${p.image})` }}><span>{p.tag}</span><button aria-label={liked.includes(p.id) ? "Remover imóvel dos favoritos" : "Adicionar imóvel aos favoritos"} aria-pressed={liked.includes(p.id)} onClick={() => toggleFavorite(p.id)}>{liked.includes(p.id) ? "♥" : "♡"}</button></div><div className="property-body"><small>IDENTIDADE VERIFICADA ✓</small><h3>{p.title}</h3><p>⌖ {p.place}</p><div className="features"><span>▱ {p.rooms} quarto{p.rooms > 1 ? "s" : ""}</span><span>▦ 1 vaga</span><span>◫ 52 m²</span></div><div className="price"><div><strong>R$ {p.price.toLocaleString("pt-BR")}</strong><span>/mês + R$ {p.fees}</span></div><em>{p.deposit} {p.deposit === 1 ? "mês" : "meses"} de caução</em></div><button onClick={() => { recordHistory(`Visita solicitada para ${p.title}`); notify("Visita solicitada! O proprietário será avisado."); }}>Ver imóvel e agendar visita</button></div></article>)}</div>}
      </section>}

      {view === "reserva" && <section className="page-shell reserve-page">
        <div className="page-title"><div><span>RESERVA CAUÇÃO</span><h1>Seu próximo lar começa aqui.</h1><p>Guarde no seu ritmo, acompanhe o rendimento e use quando encontrar o imóvel certo.</p></div><button className="outline" onClick={() => notify("Extrato preparado para visualização")}>Ver extrato</button></div>
        <div className="reserve-layout"><article className="balance-card"><div className="balance-top"><div><small>SALDO DA RESERVA</small><h2>R$ {deposit.toLocaleString("pt-BR")}</h2><span>+ R$ 18,42 em rendimentos demonstrativos</span></div><Icon>♙</Icon></div><div className="goal-row"><span>Meta para o imóvel favoritado</span><strong>{Math.round((deposit / depositGoal) * 100)}%</strong></div><div className="progress"><i style={{ width: `${Math.min(100, deposit / depositGoal * 100)}%` }} /></div><div className="goal-values"><span>R$ {deposit.toLocaleString("pt-BR")}</span><span>Meta: R$ {depositGoal.toLocaleString("pt-BR")}</span></div><div className="reserve-actions"><button className="primary" onClick={() => addDeposit(300)}>Adicionar R$ 300</button><button className="soft" onClick={() => notify("Meta mensal ajustável no protótipo completo")}>Ajustar meta</button></div></article><article className="linked-home"><span>IMÓVEL VINCULADO À META</span><div className="mini-property"><div className="mini-image" style={{ backgroundImage: "url(/property-1.png)" }} /><div><h3>Apartamento iluminado</h3><p>Vila Mariana, São Paulo</p><strong>R$ 1.850/mês</strong><small>2 meses de caução • R$ 3.700</small></div></div><button onClick={() => setView("imoveis")}>Trocar imóvel favoritado</button></article><article className="projection-card"><span>PROJEÇÃO DA META</span><h3>Faltam R$ {Math.max(0, depositGoal - deposit).toLocaleString("pt-BR")}</h3><p>Depositando <strong>R$ 300 por mês</strong>, sua caução estará pronta em:</p><div className="projection-date"><Icon>◷</Icon><div><strong>{Math.max(0, Math.ceil((depositGoal - deposit) / 300))} meses</strong><span>Estimativa demonstrativa</span></div></div><small>Estimativa atualizada com base nos seus depósitos. Rendimentos podem antecipar a conclusão.</small></article></div>
        <div className="protection-banner"><Icon>♡</Icon><div><span>PAGAMENTO E PROTEÇÃO</span><h2>Um mês difícil não precisa encerrar uma boa locação.</h2><p>Durante o contrato, solicite o uso parcial da caução para completar o aluguel e programe a recomposição com transparência.</p></div><button onClick={() => notify("Simulação de pagamento híbrido aberta")}>Simular proteção</button></div>
      </section>}

      {view === "painel" && <section className="dashboard"><aside><div className="profile-card"><div className="profile-avatar">ID</div><strong>Ingrid Dias</strong><span>Identidade verificada ✓</span><small>⭐ 4,9 • 3 avaliações</small></div><div className="profile-switch"><button className={profile === "inquilino" ? "active" : ""} onClick={() => { setProfile("inquilino"); setDashboardSection("visao"); }}>Sou inquilino</button><button className={profile === "proprietario" ? "active" : ""} onClick={() => { setProfile("proprietario"); setDashboardSection("visao"); }}>Sou proprietário</button></div><nav aria-label="Seções do painel">{[["visao", "⌂ Visão geral"], ["propostas", "◇ Propostas"], ["contratos", "▤ Contratos"], ["pagamentos", "◷ Pagamentos"], ["caucao", "♙ Caução"], ["avaliacoes", "♡ Avaliações"], ["historico", "≡ Histórico"]].map(([section, label]) => <button key={section} className={dashboardSection === section ? "active" : ""} onClick={() => setDashboardSection(section as DashboardSection)}>{label}</button>)}</nav></aside><div className="dashboard-main">
        {dashboardSection === "historico" ? <>
          <div className="dash-head"><div><span>RASTREABILIDADE</span><h1>Histórico da locação.</h1></div></div>
          <article className="timeline-card"><p className="section-help">Ações demonstrativas registradas neste dispositivo durante a sessão.</p>{history.map((event, index) => <div className="timeline-row" key={`${event}-${index}`}><i>{index + 1}</i><div><strong>{event}</strong><span>{index === 0 ? "Agora" : `${index + 1} etapas atrás`}</span></div></div>)}</article>
        </> : dashboardSection !== "visao" ? <>
          <div className="dash-head"><div><span>{dashboardSection.toUpperCase()}</span><h1>{dashboardSection === "caucao" ? "Reserva e garantia." : `${dashboardSection[0].toUpperCase()}${dashboardSection.slice(1)} da locação.`}</h1></div></div>
          <article className="module-card"><div className="module-status"><span>STATUS ATUAL</span><strong>{dashboardSection === "propostas" ? "1 proposta em andamento" : dashboardSection === "contratos" ? "Aguardando conclusão da caução" : dashboardSection === "pagamentos" ? "Nenhuma cobrança vencida" : dashboardSection === "caucao" ? "44% da meta concluída" : "Perfil avaliado em 4,9"}</strong><p>Este módulo reúne informações do fluxo demonstrativo e mantém a situação visível para as duas partes.</p></div><button className="primary" onClick={() => dashboardSection === "caucao" ? setView("reserva") : notify("Detalhes carregados no modo de demonstração")}>{dashboardSection === "caucao" ? "Abrir Reserva Caução" : "Ver detalhes"}</button></article>
        </> : profile === "inquilino" ? <>
          <div className="dash-head"><div><span>BOA TARDE, INGRID</span><h1>Sua jornada está avançando.</h1></div><button className="primary" onClick={() => setView("imoveis")}>Encontrar imóveis</button></div>
          <div className="status-card"><div className="status-title"><div><span>PROCESSO EM ANDAMENTO</span><h2>Apartamento iluminado</h2><p>Vila Mariana, São Paulo</p></div><strong>Proposta aceita</strong></div><div className="stepper">{steps.map((s, i) => <div key={s} className={i < 2 ? "done" : i === 2 ? "current" : ""}><i>{i < 2 ? "✓" : i + 1}</i><span>{s}</span></div>)}</div><div className="next-action"><div><small>PRÓXIMA AÇÃO</small><strong>Complete a caução até 18 de outubro</strong><span>Faltam R$ 2.080 para atingir a meta deste imóvel.</span></div><button onClick={() => setView("reserva")}>Ver minha reserva →</button></div></div>
          <div className="metric-grid"><article><Icon>♙</Icon><span>Reserva Caução</span><strong>R$ 1.620</strong><small>44% da meta concluída</small></article><article><Icon>♡</Icon><span>Imóveis favoritos</span><strong>{liked.length}</strong><small>1 com alta compatibilidade</small></article><article><Icon>◷</Icon><span>Próximo vencimento</span><strong>—</strong><small>Contrato ainda não iniciado</small></article></div>
        </> : <>
          <div className="dash-head"><div><span>PAINEL DO PROPRIETÁRIO</span><h1>Seu imóvel, suas decisões.</h1></div><button className="primary" onClick={() => notify("Cadastro de imóvel iniciado")}>+ Anunciar imóvel</button></div>
          <div className="owner-stats"><article><span>Imóveis ativos</span><strong>2</strong><small>1 disponível • 1 alugado</small></article><article><span>Novas propostas</span><strong>{Object.values(proposalStatus).filter((status) => status === "pendente").length}</strong><small>Perfis verificados</small></article><article><span>Recebimentos</span><strong>R$ 2.200</strong><small>Outubro confirmado ✓</small></article></div>
          <article className="proposals-card"><div className="card-head"><div><span>PROPOSTAS RECENTES</span><h2>Casa com quintal</h2></div><button className="filter-chip" onClick={() => setDashboardSection("propostas")}>Ver todas</button></div>{[["Mariana Souza", "⭐ 4,9", "R$ 6.600 reservados", "3 meses"], ["Carlos Nunes", "⭐ 4,7", "R$ 4.400 reservados", "2 meses"]].map((r) => <div className="proposal-row" key={r[0]}><div className="tiny-avatar">{r[0][0]}</div><div><strong>{r[0]}</strong><span>{r[1]} • Perfil verificado</span></div><div><strong>{r[2]}</strong><span>Caução disponível</span></div><em className={`status-${proposalStatus[r[0]]}`}>{proposalStatus[r[0]] === "pendente" ? r[3] : proposalStatus[r[0]]}</em><div className="proposal-actions">{proposalStatus[r[0]] === "pendente" ? <><button onClick={() => updateProposal(r[0], "aceita")}>Aceitar</button><button className="danger" onClick={() => updateProposal(r[0], "recusada")}>Recusar</button></> : <button onClick={() => setDashboardSection("historico")}>Ver histórico</button>}</div></div>)}</article>
          <div className="owner-bottom"><article><span>PRÓXIMO RECEBIMENTO</span><h3>R$ 2.200</h3><p>10 de novembro • Pix demonstrativo</p><div className="payment-ok">✓ Pagamento programado</div></article><article><span>REPUTAÇÃO DO PROPRIETÁRIO</span><h3>4,9 ⭐</h3><p>Comunicação, manutenção e cumprimento do contrato.</p><button onClick={() => setDashboardSection("avaliacoes")}>Ver avaliações</button></article></div>
        </>}
      </div></section>}

      <footer><Logo /><p>Locação direta, segura e transparente.</p><div><a href="#">Segurança</a><a href="#">Como funciona</a><a href="#">Ajuda</a></div></footer>
      <div className="sr-only" aria-live="polite">{toast}</div>{toast && <div className="toast" role="status">✓ {toast}</div>}
    </main>
  );
}
