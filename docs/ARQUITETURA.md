# Arquitetura — Chave Direta 1.2

## Objetivo da versão

A versão 1.2 transforma o protótipo visual em uma demonstração com persistência
real. As ações do painel continuam disponíveis após atualizar a página, sem
simular operações financeiras ou jurídicas reais.

## Componentes

| Componente | Responsabilidade |
| --- | --- |
| `app/page.tsx` | Interface, filtros, favoritos, propostas, caução e histórico |
| `app/api/demo-state/route.ts` | Leitura, validação e gravação do estado da demonstração |
| `db/schema.ts` | Definição das tabelas `demo_sessions` e `demo_states` |
| `db/index.ts` | Conexão do Drizzle ORM com a vinculação D1 `DB` |
| `drizzle/` | Migração versionada do banco de dados |
| `worker/index.ts` | Entrada da aplicação no Cloudflare Worker |

## Fluxo dos dados

1. Ao abrir o site, o navegador consulta `GET /api/demo-state`.
2. A API recupera a sessão pelo cookie seguro ou cria um identificador anônimo.
3. Se ainda não houver estado salvo, a API cria os dados demonstrativos iniciais.
4. Cada ação relevante envia o estado validado por `POST /api/demo-state`.
5. O banco D1 atualiza o registro associado àquela sessão.
6. A interface informa se o conteúdo foi salvo ou se está operando temporariamente.

## Modelo de dados

### `demo_sessions`

- `id`: identificador UUID da sessão;
- `created_at`: data de criação;
- `updated_at`: última atividade.

### `demo_states`

- `session_id`: chave primária e referência da sessão;
- `deposit`: valor demonstrativo da caução;
- `liked_json`: identificadores dos imóveis favoritos;
- `proposal_status_json`: estado das propostas;
- `history_json`: histórico acadêmico das ações;
- `updated_at`: última gravação.

## Segurança e limites

- cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção;
- validação de tipos, tamanhos e valores no servidor;
- sessão confirmada no banco antes de qualquer gravação;
- limites para quantidade de favoritos, propostas e eventos;
- nenhuma senha ou dado bancário é armazenado;
- nenhuma transferência de dinheiro é realizada.

## Limitações conhecidas

- a identidade é vinculada ao navegador, não a uma conta com e-mail e senha;
- limpar os cookies inicia uma nova sessão demonstrativa;
- os imóveis exibidos são exemplos estáticos;
- não há integração real com Gov.br, Pix, boleto, assinatura ou seguradoras.

## Evolução recomendada

Para uma futura versão de produção, o projeto deverá adotar autenticação,
controle de acesso por função, cadastro normalizado de pessoas e imóveis,
auditoria, política de privacidade, tratamento adequado à LGPD e integrações
financeiras homologadas.
