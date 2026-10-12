# Arquitetura — Chave Direta 1.3

## Objetivo da versão

A versão 1.3 amplia a demonstração de locação para uma jornada de aluguel e
compra. A vitrine continua pública, enquanto propostas de compra exigem uma
identidade protegida e ficam vinculadas ao usuário autenticado.

## Componentes

| Componente | Responsabilidade |
| --- | --- |
| `app/page.tsx` | Interface de aluguel, venda, garantias, consórcio e painéis |
| `app/chatgpt-auth.ts` | Leitura segura da identidade fornecida pela hospedagem |
| `app/api/account/route.ts` | Estado de autenticação e caminhos de entrada/saída |
| `app/api/demo-state/route.ts` | Estado anônimo de favoritos, caução e histórico |
| `app/api/purchase-offers/route.ts` | Validação e persistência das propostas de compra |
| `app/sale-properties.ts` | Catálogo acadêmico dos imóveis à venda |
| `db/schema.ts` | Sessões, perfis e propostas no banco D1 |
| `drizzle/` | Migrações versionadas do banco |

## Identidade e acesso

O site permanece público para navegação e pesquisa. A entrada usa a identidade
protegida disponibilizada pela própria plataforma de hospedagem. Uma pessoa que
criou ou acessa sua conta do ChatGPT com Google utiliza essa mesma conta, sem a
aplicação armazenar senha ou implementar um OAuth paralelo.

As propostas de compra exigem autenticação. O servidor utiliza o identificador
da conta recebido em cabeçalho protegido e nunca aceita um identificador enviado
pelo navegador.

## Fluxo de compra

1. A pessoa seleciona um imóvel da vitrine pública.
2. Se necessário, entra com a conta do ChatGPT.
3. Informa valor e uma das formas de aquisição: à vista, financiamento ou carta
   de consórcio contemplada.
4. Registra uma garantia financeira demonstrativa, sem cobrança real.
5. Aceita que a proposta depende da garantia documental do imóvel: matrícula,
   certidões, ônus, IPTU e titularidade.
6. A API valida os limites, vincula a proposta à identidade e grava no D1.
7. O painel lista apenas as propostas do usuário autenticado.

## Modelo de dados

### `demo_sessions` e `demo_states`

Mantêm o fluxo acadêmico anônimo da V1.2 para favoritos, reserva caução,
propostas de aluguel e histórico.

### `user_profiles`

- `id`: identificador protegido da plataforma;
- `email` e `full_name`: informações básicas da conta;
- `created_at` e `updated_at`: rastreabilidade.

### `purchase_offers`

- referência ao usuário e ao imóvel;
- valor anunciado e valor ofertado;
- forma de aquisição;
- valor da garantia financeira demonstrativa;
- dados da carta quando a opção for consórcio;
- aceite da garantia documental;
- status e datas de criação/atualização.

## Segurança e limites

- navegação pública e mutações de compra autenticadas;
- identidade obtida somente de cabeçalhos confiáveis da hospedagem;
- validação server-side de método, valores, imóvel e campos obrigatórios;
- consultas filtradas pelo identificador do usuário;
- cookie anônimo `HttpOnly`, `SameSite=Lax` e `Secure` em produção;
- nenhuma senha, dado bancário ou documento é armazenado;
- nenhuma transferência de dinheiro, aprovação de crédito ou verificação
  cartorial é realizada.

## Limitações conhecidas

- imóveis e valores são exemplos acadêmicos;
- garantia financeira é apenas um registro demonstrativo;
- garantia documental é um compromisso/checklist, não uma análise jurídica;
- financiamento e consórcio não consultam bancos ou administradoras;
- não há upload protegido de documentos nesta versão.

## Evolução recomendada

Uma versão de produção deve incluir autorização por função, cadastro real de
imóveis, auditoria, política de privacidade, tratamento adequado à LGPD, upload
protegido, antifraude e integrações homologadas com bancos, administradoras,
cartórios e assinatura eletrônica.
