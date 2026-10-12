# Chave Direta

Plataforma acadêmica de locação residencial direta, criada para aproximar
proprietários e inquilinos e tornar a jornada de aluguel mais simples,
transparente e organizada.

🌐 **Aplicação publicada:** [chave-direta.diasingrid56.chatgpt.site](https://chave-direta.diasingrid56.chatgpt.site)

> **Aviso:** este projeto é uma demonstração acadêmica. Ele não movimenta
> dinheiro real, não consulta o Gov.br e não gera contratos com validade
> jurídica.

## Versão atual — 1.3

- vitrine pública de imóveis para aluguel e venda;
- acesso protegido com a conta do ChatGPT, inclusive quando ela usa o Google;
- proposta de compra vinculada à identidade autenticada;
- aquisição à vista, por financiamento ou carta de consórcio contemplada;
- garantia financeira demonstrativa da proposta, sem cobrança real;
- aceite da garantia documental do imóvel e checklist de análise;
- painel individual das propostas de compra;
- favoritos persistentes;
- simulação e acompanhamento de caução;
- painel de propostas com aceite ou recusa;
- histórico de atividades e solicitação de visitas;
- persistência real em Cloudflare D1;
- isolamento dos dados por sessão anônima do navegador;
- interface responsiva para computador e celular;
- mensagens de estado para carregamento e salvamento.

## Tecnologias

- Next.js 16 e React 19;
- TypeScript;
- Vinext e Vite;
- Cloudflare Workers e D1;
- Drizzle ORM;
- CSS responsivo;
- ESLint e testes com Node.js.

## Arquitetura

O navegador acessa a vitrine pública e recebe uma sessão acadêmica anônima por
cookie `HttpOnly`. Favoritos, caução e histórico continuam disponíveis nessa
sessão. Para enviar uma proposta de compra, a plataforma exige identidade
autenticada e grava as condições e garantias no D1 com isolamento por usuário.

Mais detalhes estão em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Executando localmente

Requisitos:

- Node.js 22.13 ou superior;
- npm.

```bash
npm ci
npm run dev
```

O ambiente de produção utiliza uma vinculação D1 chamada `DB`. A configuração
de hospedagem está em `.openai/hosting.json`.

## Verificações

```bash
npx tsc --noEmit
npm run lint
npm test
```

## Estrutura principal

```text
app/                  Interface e rota da API
db/                   Esquema e acesso ao banco D1
drizzle/              Migrações do banco
docs/                 Documentação acadêmica e técnica
public/               Imagens e recursos visuais
tests/                Testes automatizados
worker/               Entrada do Cloudflare Worker
```

## Documentação acadêmica

- [Relatório parcial do projeto](docs/Relatorio_Parcial_Chave_Direta%20(1).pdf)
- [Arquitetura da versão 1.3](docs/ARQUITETURA.md)

## Próximas etapas

- cadastro e gerenciamento real de imóveis;
- perfis e permissões por tipo de usuário;
- envio protegido de documentos para análise;
- notificações e agenda de visitas;
- integrações financeiras e jurídicas somente após análise de segurança,
  privacidade e conformidade.

## Licença e uso

Projeto desenvolvido para fins acadêmicos. Antes de reutilizar o código em um
serviço comercial, revise requisitos legais, segurança, privacidade e regras de
tratamento de dados pessoais.
