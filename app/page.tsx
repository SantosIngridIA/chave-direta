"use client";

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { saleProperties, type SaleProperty } from "./sale-properties";

type View = "inicio" | "imoveis" | "reserva" | "painel";
type Profile = "inquilino" | "proprietario";
type DashboardSection = "visao" | "propostas" | "compras" | "contratos" | "pagamentos" | "caucao" | "avaliacoes" | "historico";
type ProposalStatus = "pendente" | "aceita" | "recusada";
type Transaction = "aluguel" | "compra";
type AcquisitionMethod = "avista" | "financiamento" | "consorcio";
type Account = { authenticated: boolean; user: { id: string; displayName: string; email: string; fullName: string | null } | null; signInPath: string; signOutPath: string };
type PurchaseOffer = { id: string; propertyTitle: string; askingPrice: number; offerAmount: number; acquisitionMethod: AcquisitionMethod; financialGuaranteeAmount: number; consortiumAdministrator: string | null; documentaryGuaranteeAccepted: boolean; status: string; createdAt: string };

const rentals = [
  { id: 1, title: "Apartamento iluminado", place: "Vila Mariana, São Paulo", price: 1850, fees: 430, rooms: 2, deposit: 2, area: 52, image: "/property-1.png", tag: "Mais compatível" },
  { id: 2, title: "Casa com quintal", place: "Tatuapé, São Paulo", price: 2200, fees: 120, rooms: 2, deposit: 1, area: 74, image: "/property-2.png", tag: "Caução flexível" },
  { id: 3, title: "Studio com varanda", place: "Pinheiros, São Paulo", price: 2450, fees: 510, rooms: 1, deposit: 3, area: 39, image: "/property-3.png", tag: "Perfil verificado" },
];
const rentalSteps = ["Visita", "Proposta", "Caução", "Contrato", "Mudança"];
const methodLabels: Record<AcquisitionMethod, string> = { avista: "À vista", financiamento: "Financiamento imobiliário", consorcio: "Carta de consórcio contemplada" };

function Logo() { return <div className="logo" aria-label="Chave Direta"><span className="logo-mark"><i>C</i><b>D</b><em>●</em></span><span>Chave <strong>Direta</strong></span></div>; }
function Icon({ children }: { children: ReactNode }) { return <span className="icon">{children}</span>; }
function money(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }); }

export default function Home() {
  const [view, setView] = useState<View>("inicio");
  const [profile, setProfile] = useState<Profile>("inquilino");
  const [transaction, setTransaction] = useState<Transaction>("aluguel");
  const [liked, setLiked] = useState<number[]>([1]);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [deposit, setDeposit] = useState(1620);
  const [maxPrice, setMaxPrice] = useState(2500);
  const [depositMonths, setDepositMonths] = useState(0);
  const [section, setSection] = useState<DashboardSection>("visao");
  const [proposalStatus, setProposalStatus] = useState<Record<string, ProposalStatus>>({ "Mariana Souza": "pendente", "Carlos Nunes": "pendente" });
  const [history, setHistory] = useState(["Proposta aceita para o Apartamento iluminado", "Visita realizada em 9 de outubro de 2026", "Imóvel adicionado aos favoritos"]);
  const [persistence, setPersistence] = useState<"carregando" | "salvo" | "salvando" | "temporario">("carregando");
  const [account, setAccount] = useState<Account | null>(null);
  const [offers, setOffers] = useState<PurchaseOffer[]>([]);
  const [selectedSale, setSelectedSale] = useState<SaleProperty | null>(null);
  const [offerAmount, setOfferAmount] = useState(0);
  const [method, setMethod] = useState<AcquisitionMethod>("avista");
  const [guaranteeAmount, setGuaranteeAmount] = useState(0);
  const [administrator, setAdministrator] = useState("");
  const [creditAmount, setCreditAmount] = useState(0);
  const [contemplated, setContemplated] = useState(false);
  const [documentAccepted, setDocumentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const depositGoal = 3700;

  const filteredRentals = useMemo(() => rentals.filter((item) => `${item.title} ${item.place}`.toLowerCase().includes(query.toLowerCase()) && item.price <= maxPrice && (depositMonths === 0 || item.deposit === depositMonths)), [query, maxPrice, depositMonths]);
  const filteredSales = useMemo(() => saleProperties.filter((item) => `${item.title} ${item.place}`.toLowerCase().includes(query.toLowerCase()) && item.price <= maxPrice), [query, maxPrice]);
  const visibleCount = transaction === "aluguel" ? filteredRentals.length : filteredSales.length;
  const displayName = account?.user?.fullName || account?.user?.displayName || "Visitante";
  const initials = account?.authenticated ? displayName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() : "ID";

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(""), 3000); }

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/demo-state", { credentials: "same-origin" }).then((response) => response.ok ? response.json() : Promise.reject()),
      fetch("/api/account", { credentials: "same-origin" }).then((response) => response.json()),
    ]).then(([demo, currentAccount]) => {
      if (!active) return;
      setDeposit(demo.state.deposit); setLiked(demo.state.liked); setProposalStatus(demo.state.proposalStatus); setHistory(demo.state.history); setPersistence("salvo"); setAccount(currentAccount);
      if (currentAccount.authenticated) fetch("/api/purchase-offers", { credentials: "same-origin" }).then((response) => response.ok ? response.json() : { offers: [] }).then((data) => active && setOffers(data.offers ?? []));
    }).catch(() => active && setPersistence("temporario"));
    return () => { active = false; };
  }, []);

  async function saveState(next: { deposit?: number; liked?: number[]; proposalStatus?: Record<string, ProposalStatus>; history?: string[] }) {
    setPersistence("salvando");
    try {
      const response = await fetch("/api/demo-state", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deposit: next.deposit ?? deposit, liked: next.liked ?? liked, proposalStatus: next.proposalStatus ?? proposalStatus, history: next.history ?? history }) });
      if (!response.ok) throw new Error(); setPersistence("salvo");
    } catch { setPersistence("temporario"); notify("Alteração mantida apenas nesta tela. Tente novamente."); }
  }

  function toggleFavorite(id: number) { const next = liked.includes(id) ? liked.filter((item) => item !== id) : [...liked, id]; setLiked(next); void saveState({ liked: next }); }
  function addDeposit(amount: number) { const nextDeposit = deposit + amount; const nextHistory = [`Aporte demonstrativo de ${money(amount)} na Reserva Caução`, ...history].slice(0, 50); setDeposit(nextDeposit); setHistory(nextHistory); void saveState({ deposit: nextDeposit, history: nextHistory }); notify(`Depósito demonstrativo: + ${money(amount)}`); }
  function recordHistory(event: string) { const next = [event, ...history].slice(0, 50); setHistory(next); void saveState({ history: next }); }
  function updateProposal(name: string, status: ProposalStatus) { const statuses = { ...proposalStatus, [name]: status }; const nextHistory = [`Proposta de ${name} ${status === "aceita" ? "aceita" : "recusada"}`, ...history].slice(0, 50); setProposalStatus(statuses); setHistory(nextHistory); void saveState({ proposalStatus: statuses, history: nextHistory }); notify(`Proposta de ${name} atualizada.`); }
  function openDashboard(nextProfile: Profile, nextSection: DashboardSection = "visao") { setProfile(nextProfile); setSection(nextSection); setView("painel"); }
  function changeTransaction(next: Transaction) { setTransaction(next); setQuery(""); setDepositMonths(0); setMaxPrice(next === "aluguel" ? 2500 : 800000); }

  function openOffer(property: SaleProperty) {
    if (!account?.authenticated) { if (account?.signInPath) window.location.assign(account.signInPath); else notify("Carregando acesso seguro. Tente novamente."); return; }
    setSelectedSale(property); setOfferAmount(property.price); setGuaranteeAmount(Math.round(property.price * .02)); setMethod("avista"); setAdministrator(""); setCreditAmount(property.price); setContemplated(false); setDocumentAccepted(false);
  }

  async function submitPurchaseOffer(event: FormEvent) {
    event.preventDefault(); if (!selectedSale) return; setSubmitting(true);
    const response = await fetch("/api/purchase-offers", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: selectedSale.id, offerAmount, acquisitionMethod: method, financialGuaranteeAmount: guaranteeAmount, consortiumAdministrator: administrator, consortiumCreditAmount: creditAmount, consortiumContemplated: contemplated, documentaryGuaranteeAccepted: documentAccepted }) });
    const data = await response.json(); setSubmitting(false);
    if (response.status === 401 && account?.signInPath) { window.location.assign(account.signInPath); return; }
    if (!response.ok) { notify(data.error ?? "Não foi possível enviar a proposta."); return; }
    setOffers((current) => [data.offer, ...current]); setSelectedSale(null); setSection("compras"); setView("painel"); notify("Proposta de compra enviada e registrada.");
  }

  return <main>
    <header className="topbar">
      <button className="brand-button" onClick={() => setView("inicio")}><Logo /></button>
      <nav aria-label="Navegação principal"><button className={view === "inicio" ? "active" : ""} onClick={() => setView("inicio")}>Início</button><button className={view === "imoveis" ? "active" : ""} onClick={() => setView("imoveis")}>Encontrar imóvel</button><button className={view === "reserva" ? "active" : ""} onClick={() => setView("reserva")}>Reserva Caução</button><button className={view === "painel" ? "active" : ""} onClick={() => setView("painel")}>Meu painel</button></nav>
      <select className="mobile-nav" aria-label="Navegar para" value={view} onChange={(event) => setView(event.target.value as View)}><option value="inicio">Início</option><option value="imoveis">Encontrar imóvel</option><option value="reserva">Reserva Caução</option><option value="painel">Meu painel</option></select>
      <div className="header-actions"><button className="outline" onClick={() => openDashboard("proprietario")}>Anunciar imóvel</button>{account?.authenticated ? <button className="account-chip" onClick={() => openDashboard(profile)}><span>{initials}</span><small>{displayName}</small></button> : <a className="login-button" href={account?.signInPath ?? "/signin-with-chatgpt?return_to=%2F"}>Entrar com ChatGPT</a>}</div>
    </header>
    <div className="demo-notice" role="note"><strong>V1.3 • Ambiente acadêmico</strong><span>Não realiza pagamentos, análise de crédito, validação jurídica ou movimentação financeira real.</span><em className={`persistence-${persistence}`}>{persistence === "carregando" ? "Conectando…" : persistence === "salvando" ? "Salvando…" : persistence === "salvo" ? "✓ Dados salvos" : "Modo temporário"}</em></div>

    {view === "inicio" && <HomeView setView={setView} openDashboard={openDashboard} />}
    {view === "imoveis" && <PropertiesView transaction={transaction} changeTransaction={changeTransaction} query={query} setQuery={setQuery} maxPrice={maxPrice} setMaxPrice={setMaxPrice} depositMonths={depositMonths} setDepositMonths={setDepositMonths} deposit={deposit} visibleCount={visibleCount} rentals={filteredRentals} sales={filteredSales} liked={liked} toggleFavorite={toggleFavorite} recordHistory={recordHistory} notify={notify} openOffer={openOffer} />}
    {view === "reserva" && <ReserveView deposit={deposit} depositGoal={depositGoal} addDeposit={addDeposit} notify={notify} setView={setView} changeTransaction={changeTransaction} />}
    {view === "painel" && <DashboardView profile={profile} setProfile={setProfile} section={section} setSection={setSection} account={account} displayName={displayName} initials={initials} offers={offers} liked={liked} deposit={deposit} history={history} proposalStatus={proposalStatus} updateProposal={updateProposal} setView={setView} changeTransaction={changeTransaction} notify={notify} />}
    {selectedSale && <OfferModal property={selectedSale} method={method} setMethod={setMethod} offerAmount={offerAmount} setOfferAmount={setOfferAmount} guaranteeAmount={guaranteeAmount} setGuaranteeAmount={setGuaranteeAmount} administrator={administrator} setAdministrator={setAdministrator} creditAmount={creditAmount} setCreditAmount={setCreditAmount} contemplated={contemplated} setContemplated={setContemplated} documentAccepted={documentAccepted} setDocumentAccepted={setDocumentAccepted} submitting={submitting} onClose={() => setSelectedSale(null)} onSubmit={submitPurchaseOffer} />}
    <footer><Logo /><p>Aluguel e compra com mais clareza.</p><div><a href="#">Segurança</a><a href="#">Como funciona</a><a href="#">Ajuda</a></div></footer>
    <div className="sr-only" aria-live="polite">{toast}</div>{toast && <div className="toast" role="status">✓ {toast}</div>}
  </main>;
}

function HomeView({ setView, openDashboard }: { setView: (view: View) => void; openDashboard: (profile: Profile) => void }) {
  return <>
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow">ALUGUEL E COMPRA, DIRETO AO PONTO</span><h1>Encontre. Negocie.<br />Conquiste. <span>É seu.</span></h1><p>Uma jornada transparente para alugar ou comprar, com propostas registradas, garantias claras e todas as opções de aquisição.</p><div className="hero-buttons"><button className="primary" onClick={() => setView("imoveis")}>Encontrar meu imóvel <span>→</span></button><button className="soft" onClick={() => openDashboard("proprietario")}>Quero anunciar</button></div><div className="trust-row"><span>✓ Conta protegida</span><span>✓ Garantias registradas</span><span>✓ Consórcio contemplado</span></div></div>
      <div className="hero-visual" aria-label="Prévia da jornada imobiliária"><div className="door-shape"><span>⌂</span></div><div className="floating-card match-card"><small>NOVA POSSIBILIDADE</small><strong>Compra ou aluguel</strong><span>Escolha o melhor caminho</span></div><div className="floating-card verified-card"><i>✓</i><div><strong>Proposta registrada</strong><span>Garantias em análise</span></div></div><div className="key-orbit">⌕</div></div>
    </section>
    <section className="journey"><div className="section-heading"><span>COMO FUNCIONA</span><h2>Da busca às chaves, tudo em um só lugar.</h2><p>Menos burocracia e mais clareza para compradores, inquilinos e proprietários.</p></div><div className="journey-grid">{[["01", "⌕", "Encontre", "Compare imóveis para compra e aluguel."], ["02", "◇", "Negocie", "Registre valor, forma de aquisição e garantia financeira."], ["03", "▤", "Confira", "Acompanhe a garantia documental do imóvel."], ["04", "⌂", "Conquiste", "Siga para contrato com todas as condições organizadas."]].map(([number, icon, title, text]) => <article key={number}><small>{number}</small><Icon>{icon}</Icon><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="dual-cta"><div className="tenant-cta"><span>PARA QUEM BUSCA</span><h2>Alugue hoje ou planeje a compra.</h2><p>Pesquise, favorite e escolha entre pagamento à vista, financiamento ou carta de consórcio contemplada.</p><button onClick={() => setView("imoveis")}>Explorar imóveis →</button></div><div className="owner-cta"><span>PARA QUEM ANUNCIA</span><h2>Venda ou alugue com condições claras.</h2><p>Receba propostas completas, com garantias registradas e forma de aquisição identificada.</p><button onClick={() => openDashboard("proprietario")}>Anunciar imóvel →</button></div></section>
  </>;
}

type Rental = (typeof rentals)[number];
function PropertiesView(props: { transaction: Transaction; changeTransaction: (next: Transaction) => void; query: string; setQuery: (value: string) => void; maxPrice: number; setMaxPrice: (value: number) => void; depositMonths: number; setDepositMonths: (value: number) => void; deposit: number; visibleCount: number; rentals: Rental[]; sales: readonly SaleProperty[]; liked: number[]; toggleFavorite: (id: number) => void; recordHistory: (event: string) => void; notify: (message: string) => void; openOffer: (property: SaleProperty) => void }) {
  const { transaction, changeTransaction, query, setQuery, maxPrice, setMaxPrice, depositMonths, setDepositMonths, deposit, visibleCount, liked } = props;
  return <section className="page-shell">
    <div className="page-title"><div><span>ENCONTRE SEU PRÓXIMO IMÓVEL</span><h1>Um lugar para morar. Um caminho para conquistar.</h1><p>Escolha entre aluguel e compra e compare condições de forma transparente.</p></div><div className="compatibility"><strong>{transaction === "aluguel" ? money(deposit) : "3 opções"}</strong><span>{transaction === "aluguel" ? "reservados para caução" : "de aquisição disponíveis"}</span></div></div>
    <div className="transaction-switch" role="group" aria-label="Tipo de negociação"><button className={transaction === "aluguel" ? "active" : ""} onClick={() => changeTransaction("aluguel")}>Quero alugar</button><button className={transaction === "compra" ? "active" : ""} onClick={() => changeTransaction("compra")}>Quero comprar</button></div>
    <div className="search-panel"><label><span>Onde você quer morar?</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bairro, cidade ou região" /></label><label><span>{transaction === "aluguel" ? "Aluguel até" : "Compra até"}</span><select value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))}>{transaction === "aluguel" ? <><option value="2000">R$ 2.000</option><option value="2500">R$ 2.500</option><option value="3000">R$ 3.000</option></> : <><option value="500000">R$ 500 mil</option><option value="650000">R$ 650 mil</option><option value="800000">R$ 800 mil</option><option value="1000000">R$ 1 milhão</option></>}</select></label>{transaction === "aluguel" ? <label><span>Caução aceita</span><select value={depositMonths} onChange={(event) => setDepositMonths(Number(event.target.value))}><option value="0">Todos</option><option value="1">1 mês</option><option value="2">2 meses</option><option value="3">3 meses</option></select></label> : <label><span>Forma de aquisição</span><select aria-label="Forma de aquisição"><option>Todas</option><option>À vista</option><option>Financiamento</option><option>Consórcio contemplado</option></select></label>}<button className="primary" onClick={() => props.notify(`${visibleCount} imóveis encontrados`)}>Buscar imóveis</button></div>
    <div className="results-head"><p><strong>{visibleCount} imóveis</strong> encontrados em São Paulo</p><button className="filter-chip">☷ Mais filtros</button></div>
    {transaction === "aluguel" ? <div className="property-grid">{props.rentals.map((property) => <article className="property-card" key={property.id}><div className="property-image" style={{ backgroundImage: `url(${property.image})` }}><span>{property.tag}</span><button aria-label={liked.includes(property.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"} onClick={() => props.toggleFavorite(property.id)}>{liked.includes(property.id) ? "♥" : "♡"}</button></div><div className="property-body"><small>LOCAÇÃO • IDENTIDADE VERIFICADA ✓</small><h3>{property.title}</h3><p>⌖ {property.place}</p><div className="features"><span>▱ {property.rooms} quarto{property.rooms > 1 ? "s" : ""}</span><span>▦ 1 vaga</span><span>◫ {property.area} m²</span></div><div className="price"><div><strong>{money(property.price)}</strong><span>/mês + R$ {property.fees}</span></div><em>{property.deposit} {property.deposit === 1 ? "mês" : "meses"} de caução</em></div><button onClick={() => { props.recordHistory(`Visita solicitada para ${property.title}`); props.notify("Visita solicitada! O proprietário será avisado."); }}>Ver imóvel e agendar visita</button></div></article>)}</div> : <div className="property-grid">{props.sales.map((property) => <article className="property-card sale-card" key={property.id}><div className="property-image" style={{ backgroundImage: `url(${property.image})` }}><span>{property.tag}</span><b>VENDA</b></div><div className="property-body"><small>VENDA • PROPRIETÁRIO IDENTIFICADO</small><h3>{property.title}</h3><p>⌖ {property.place}</p><div className="features"><span>▱ {property.rooms} quarto{property.rooms > 1 ? "s" : ""}</span><span>▦ 1 vaga</span><span>◫ {property.area} m²</span></div><div className="sale-methods"><span>À vista</span><span>Financiamento</span><span>Consórcio</span></div><div className="price"><div><strong>{money(property.price)}</strong><span>valor anunciado</span></div><em>2 garantias</em></div><button onClick={() => props.openOffer(property)}>Fazer proposta de compra</button></div></article>)}</div>}
    {visibleCount === 0 && <div className="empty-state"><Icon>⌕</Icon><h2>Nenhum imóvel encontrado</h2><p>Ajuste o valor ou a localização para ampliar a busca.</p></div>}
  </section>;
}

function ReserveView({ deposit, depositGoal, addDeposit, notify, setView, changeTransaction }: { deposit: number; depositGoal: number; addDeposit: (value: number) => void; notify: (message: string) => void; setView: (view: View) => void; changeTransaction: (next: Transaction) => void }) {
  return <section className="page-shell reserve-page"><div className="page-title"><div><span>RESERVA CAUÇÃO</span><h1>Seu próximo lar começa aqui.</h1><p>Guarde no seu ritmo e acompanhe a meta demonstrativa de aluguel.</p></div><button className="outline" onClick={() => notify("Extrato preparado para visualização")}>Ver extrato</button></div><div className="reserve-layout"><article className="balance-card"><div className="balance-top"><div><small>SALDO DA RESERVA</small><h2>{money(deposit)}</h2><span>+ R$ 18,42 em rendimentos demonstrativos</span></div><Icon>♙</Icon></div><div className="goal-row"><span>Meta para o imóvel favoritado</span><strong>{Math.round((deposit / depositGoal) * 100)}%</strong></div><div className="progress"><i style={{ width: `${Math.min(100, deposit / depositGoal * 100)}%` }} /></div><div className="goal-values"><span>{money(deposit)}</span><span>Meta: {money(depositGoal)}</span></div><div className="reserve-actions"><button className="primary" onClick={() => addDeposit(300)}>Adicionar R$ 300</button><button className="soft" onClick={() => notify("Meta ajustável na demonstração")}>Ajustar meta</button></div></article><article className="linked-home"><span>IMÓVEL VINCULADO À META</span><div className="mini-property"><div className="mini-image" style={{ backgroundImage: "url(/property-1.png)" }} /><div><h3>Apartamento iluminado</h3><p>Vila Mariana, São Paulo</p><strong>R$ 1.850/mês</strong><small>2 meses de caução • R$ 3.700</small></div></div><button onClick={() => setView("imoveis")}>Trocar imóvel favoritado</button></article><article className="projection-card"><span>PROJEÇÃO DA META</span><h3>Faltam {money(Math.max(0, depositGoal - deposit))}</h3><p>Depositando <strong>R$ 300 por mês</strong>, a meta será atingida em:</p><div className="projection-date"><Icon>◷</Icon><div><strong>{Math.max(0, Math.ceil((depositGoal - deposit) / 300))} meses</strong><span>Estimativa demonstrativa</span></div></div></article></div><div className="protection-banner"><Icon>♡</Icon><div><span>COMPRA TAMBÉM DISPONÍVEL</span><h2>Do aluguel à casa própria, no mesmo ambiente.</h2><p>As propostas de compra registram garantia financeira demonstrativa e garantia documental.</p></div><button onClick={() => { changeTransaction("compra"); setView("imoveis"); }}>Ver imóveis à venda</button></div></section>;
}

function DashboardView(props: { profile: Profile; setProfile: (profile: Profile) => void; section: DashboardSection; setSection: (section: DashboardSection) => void; account: Account | null; displayName: string; initials: string; offers: PurchaseOffer[]; liked: number[]; deposit: number; history: string[]; proposalStatus: Record<string, ProposalStatus>; updateProposal: (name: string, status: ProposalStatus) => void; setView: (view: View) => void; changeTransaction: (next: Transaction) => void; notify: (message: string) => void }) {
  const { account, section, setSection, profile, setProfile } = props;
  return <section className="dashboard"><aside>
    <div className="profile-card"><div className="profile-avatar">{props.initials}</div><strong>{props.displayName}</strong><span>{account?.authenticated ? "Conta protegida ✓" : "Acesso público"}</span><small>{account?.user?.email ?? "Entre para enviar propostas de compra"}</small></div>
    <div className="profile-switch"><button className={profile === "inquilino" ? "active" : ""} onClick={() => { setProfile("inquilino"); setSection("visao"); }}>Alugo / compro</button><button className={profile === "proprietario" ? "active" : ""} onClick={() => { setProfile("proprietario"); setSection("visao"); }}>Sou proprietário</button></div>
    <nav aria-label="Seções do painel">{[["visao", "⌂ Visão geral"], ["propostas", "◇ Propostas de aluguel"], ["compras", "⌑ Propostas de compra"], ["contratos", "▤ Contratos"], ["pagamentos", "◷ Pagamentos"], ["caucao", "♙ Caução"], ["avaliacoes", "♡ Avaliações"], ["historico", "≡ Histórico"]].map(([key, label]) => <button key={key} className={section === key ? "active" : ""} onClick={() => setSection(key as DashboardSection)}>{label}</button>)}</nav>
    {account?.authenticated && <a className="signout-link" href={account.signOutPath}>Sair da conta</a>}
  </aside><div className="dashboard-main">
    {section === "compras" ? <PurchaseDashboard {...props} /> : section === "historico" ? <><div className="dash-head"><div><span>RASTREABILIDADE</span><h1>Histórico da jornada.</h1></div></div><article className="timeline-card">{props.history.map((event, index) => <div className="timeline-row" key={`${event}-${index}`}><i>{index + 1}</i><div><strong>{event}</strong><span>{index === 0 ? "Agora" : `${index + 1} etapas atrás`}</span></div></div>)}</article></> : section !== "visao" ? <><div className="dash-head"><div><span>{section.toUpperCase()}</span><h1>{section === "caucao" ? "Reserva e garantia." : "Acompanhamento da locação."}</h1></div></div><article className="module-card"><div className="module-status"><span>STATUS ATUAL</span><strong>{section === "propostas" ? "1 proposta em andamento" : section === "contratos" ? "Aguardando condições" : section === "pagamentos" ? "Nenhuma cobrança vencida" : section === "caucao" ? "Meta em andamento" : "Perfil avaliado em 4,9"}</strong><p>Este módulo mantém a situação demonstrativa visível para as partes.</p></div></article></> : profile === "inquilino" ? <BuyerOverview {...props} /> : <OwnerOverview {...props} />}
  </div></section>;
}

function PurchaseDashboard(props: Parameters<typeof DashboardView>[0]) {
  return <><div className="dash-head"><div><span>COMPRA DE IMÓVEL</span><h1>Suas propostas de compra.</h1></div><button className="primary" onClick={() => { props.changeTransaction("compra"); props.setView("imoveis"); }}>Encontrar imóveis</button></div>
    {!props.account?.authenticated ? <article className="module-card"><div className="module-status"><span>ACESSO PROTEGIDO</span><strong>Entre para enviar e acompanhar propostas</strong><p>Contas do ChatGPT criadas ou acessadas com Google podem usar o mesmo acesso.</p></div><a className="primary button-link" href={props.account?.signInPath ?? "/signin-with-chatgpt?return_to=%2F"}>Entrar com ChatGPT</a></article> : props.offers.length === 0 ? <div className="empty-state"><Icon>⌑</Icon><h2>Nenhuma proposta de compra</h2><p>Escolha um imóvel e registre condições de aquisição e garantias.</p></div> : <div className="purchase-list">{props.offers.map((offer) => <article key={offer.id}><div><small>EM ANÁLISE</small><h3>{offer.propertyTitle}</h3><p>Proposta: <strong>{money(offer.offerAmount)}</strong> • {methodLabels[offer.acquisitionMethod]}</p></div><div className="guarantee-summary"><span>✓ Garantia financeira: {money(offer.financialGuaranteeAmount)}</span><span>✓ Garantia documental aceita</span>{offer.consortiumAdministrator && <span>✓ Carta: {offer.consortiumAdministrator}</span>}</div></article>)}</div>}
  </>;
}

function BuyerOverview(props: Parameters<typeof DashboardView>[0]) {
  return <><div className="dash-head"><div><span>OLÁ, {props.displayName.toUpperCase()}</span><h1>Sua jornada está avançando.</h1></div><button className="primary" onClick={() => props.setView("imoveis")}>Encontrar imóveis</button></div><div className="status-card"><div className="status-title"><div><span>PROCESSO DE ALUGUEL</span><h2>Apartamento iluminado</h2><p>Vila Mariana, São Paulo</p></div><strong>Proposta aceita</strong></div><div className="stepper">{rentalSteps.map((step, index) => <div key={step} className={index < 2 ? "done" : index === 2 ? "current" : ""}><i>{index < 2 ? "✓" : index + 1}</i><span>{step}</span></div>)}</div><div className="next-action"><div><small>NOVA POSSIBILIDADE</small><strong>Agora você também pode comprar</strong><span>À vista, financiamento ou carta de consórcio contemplada.</span></div><button onClick={() => { props.changeTransaction("compra"); props.setView("imoveis"); }}>Ver imóveis à venda →</button></div></div><div className="metric-grid"><article><Icon>♙</Icon><span>Reserva Caução</span><strong>{money(props.deposit)}</strong><small>Meta demonstrativa</small></article><article><Icon>♡</Icon><span>Imóveis favoritos</span><strong>{props.liked.length}</strong><small>Preferências salvas</small></article><article><Icon>⌑</Icon><span>Propostas de compra</span><strong>{props.offers.length}</strong><small>{props.account?.authenticated ? "Vinculadas à sua conta" : "Entre para começar"}</small></article></div></>;
}

function OwnerOverview(props: Parameters<typeof DashboardView>[0]) {
  return <><div className="dash-head"><div><span>PAINEL DO PROPRIETÁRIO</span><h1>Venda ou alugue. Você decide.</h1></div><button className="primary" onClick={() => props.notify("Cadastro de imóvel iniciado")}>+ Anunciar imóvel</button></div><div className="owner-stats"><article><span>Imóveis ativos</span><strong>3</strong><small>2 para aluguel • 1 para venda</small></article><article><span>Propostas de aluguel</span><strong>{Object.values(props.proposalStatus).filter((status) => status === "pendente").length}</strong><small>Perfis identificados</small></article><article><span>Propostas de compra</span><strong>1</strong><small>Garantias registradas</small></article></div><article className="proposals-card"><div className="card-head"><div><span>PROPOSTAS RECENTES DE ALUGUEL</span><h2>Casa com quintal</h2></div></div>{[["Mariana Souza", "⭐ 4,9", "R$ 6.600 reservados", "3 meses"], ["Carlos Nunes", "⭐ 4,7", "R$ 4.400 reservados", "2 meses"]].map((row) => <div className="proposal-row" key={row[0]}><div className="tiny-avatar">{row[0][0]}</div><div><strong>{row[0]}</strong><span>{row[1]} • Perfil verificado</span></div><div><strong>{row[2]}</strong><span>Caução disponível</span></div><em className={`status-${props.proposalStatus[row[0]]}`}>{props.proposalStatus[row[0]] === "pendente" ? row[3] : props.proposalStatus[row[0]]}</em><div className="proposal-actions">{props.proposalStatus[row[0]] === "pendente" ? <><button onClick={() => props.updateProposal(row[0], "aceita")}>Aceitar</button><button className="danger" onClick={() => props.updateProposal(row[0], "recusada")}>Recusar</button></> : <button onClick={() => props.setSection("historico")}>Ver histórico</button>}</div></div>)}</article></>;
}

function OfferModal(props: { property: SaleProperty; method: AcquisitionMethod; setMethod: (value: AcquisitionMethod) => void; offerAmount: number; setOfferAmount: (value: number) => void; guaranteeAmount: number; setGuaranteeAmount: (value: number) => void; administrator: string; setAdministrator: (value: string) => void; creditAmount: number; setCreditAmount: (value: number) => void; contemplated: boolean; setContemplated: (value: boolean) => void; documentAccepted: boolean; setDocumentAccepted: (value: boolean) => void; submitting: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) props.onClose(); }}><section className="offer-modal" role="dialog" aria-modal="true" aria-labelledby="offer-title"><button className="modal-close" onClick={props.onClose} aria-label="Fechar">×</button><div className="modal-heading"><span>PROPOSTA DE COMPRA • V1.3</span><h2 id="offer-title">{props.property.title}</h2><p>{props.property.place} • anunciado por {money(props.property.price)}</p></div><form onSubmit={props.onSubmit}>
    <div className="form-grid"><label><span>Valor da proposta</span><input type="number" min="50000" max="100000000" step="1000" value={props.offerAmount} onChange={(event) => props.setOfferAmount(Number(event.target.value))} required /></label><label><span>Forma de aquisição</span><select value={props.method} onChange={(event) => props.setMethod(event.target.value as AcquisitionMethod)}><option value="avista">À vista</option><option value="financiamento">Financiamento imobiliário</option><option value="consorcio">Carta de consórcio contemplada</option></select></label></div>
    {props.method === "consorcio" && <fieldset className="consortium-fields"><legend>Dados da carta de consórcio</legend><div className="form-grid"><label><span>Administradora</span><input value={props.administrator} onChange={(event) => props.setAdministrator(event.target.value)} maxLength={100} required /></label><label><span>Crédito disponível</span><input type="number" min="50000" step="1000" value={props.creditAmount} onChange={(event) => props.setCreditAmount(Number(event.target.value))} required /></label></div><label className="check-row"><input type="checkbox" checked={props.contemplated} onChange={(event) => props.setContemplated(event.target.checked)} required /><span>Confirmo que a carta está contemplada e sujeita à verificação da administradora.</span></label></fieldset>}
    <div className="guarantee-grid"><article><span>GARANTIA 1</span><h3>Financeira da proposta</h3><p>Valor demonstrativo reservado para sinalizar compromisso. Nenhuma cobrança é realizada nesta versão.</p><label><span>Valor da garantia</span><input type="number" min="500" max={props.offerAmount || undefined} step="100" value={props.guaranteeAmount} onChange={(event) => props.setGuaranteeAmount(Number(event.target.value))} required /></label></article><article><span>GARANTIA 2</span><h3>Documental do imóvel</h3><p>Matrícula atualizada, certidões, ônus, IPTU e titularidade deverão ser verificados antes do contrato.</p><label className="check-row"><input type="checkbox" checked={props.documentAccepted} onChange={(event) => props.setDocumentAccepted(event.target.checked)} required /><span>Concordo que a proposta depende da análise documental.</span></label></article></div>
    <div className="legal-note">Esta demonstração registra intenções e condições. Não aprova crédito, não valida documentos e não substitui banco, administradora de consórcio, cartório ou assessoria jurídica.</div><button className="primary submit-offer" disabled={props.submitting}>{props.submitting ? "Enviando…" : "Enviar proposta com as duas garantias"}</button>
  </form></section></div>;
}
