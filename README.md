# Dinhericiar - back-end (em desenvolvimento)

O Dinhericiar tem o objetivo de ajudar as pessoas a gerenciar suas finanças pessoais.

Eu também aproveitei a ideia para aplicar tudo que venho estudando a nível técnico nos últimos anos conforme comentei abaixo.

## Principais recursos

### Clean Architecture

A [Clean Architecture (arquitetura limpa)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) permite criar aplicações escaláveis, de fácil manutenção e de baixo acoplamento, tornando-a flexível o suficiente para trocar qualquer dependência / tecnologia externa de forma segura, sem a necessidade de modificar o alicerce da aplicação com as regras de negócio da problemática que está sendo resolvida.

<img 
  src="https://blog.cleancoder.com/uncle-bob/images/2012-08-13-the-clean-architecture/CleanArchitecture.jpg" 
  alt="Clean Architecture"
/>

### Troféu de testes

A clássica [pirâmide de testes](https://martinfowler.com/bliki/TestPyramid.html) prioriza testes unitários tanto para economizar dinheiro e priorizar a performance dos testes, mas essa abordagem costuma ser problemática por alguns motivos que vivenciei e que também já foram expostos pela comunidade:

- Com um foco em testes unitários, eu deixo em segundo plano validar como uma unidade funciona trabalhando em conjunto com outras unidades (o que é de fato como o usuário utiliza a aplicação).
- Abordagens como [InMemoryTestDatabase](https://martinfowler.com/bliki/InMemoryTestDatabase.html) ajudam a escrever os testes unitários, mas várias vezes em minhas próprias experiências, com tantos mocks e distanciação dos serviços realmente utilizados em produção, minhas aplicações se encontrava com diversos erros mesmo com todos os testes passando.
- O tempo é muito precioso. Ter gastando tanto esforço com testes unitários e ainda assim encontrar diversos erros nos meus projetos me deixou frustrado com o tempo que gastei.

O peso em testes de integração é uma [abordagem utilizada em algumas aplicações do Spotify](https://engineering.atspotify.com/2018/01/testing-of-microservices/) e [indicada pelo CEO da Vercel](https://x.com/rauchg/status/807626710350839808). No [troféu de testes](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications), há justamente esse foco, onde é priorizado testar o conjunto das unidades funcionando e consequentemente, anulando diversos mocks, trazendo os serviços reais que são realmente usados pelos usuários.

<img 
  src="https://pbs.twimg.com/media/DVUoM94VQAAzuws?format=jpg&name=900x900" 
  alt="Testing Trophy"
/>

No Dinhericiar, esse é um atual preview da cobertura dos testes de integração (13/10/2024):

<img 
  src="https://github.com/user-attachments/assets/480812cd-0b60-4076-9280-338396a9d394" 
  alt="Dinhericiar testing coverage"
/>

### Principais tecnologias

- [NestJS](https://nestjs.com/)
- [Drizzle ORM](https://orm.drizzle.team/) (finalmente posso escrever SQL puro)
- [Vitest](https://vitest.dev/)

### Inspirações

- [TabNews](https://github.com/filipedeschamps/tabnews.com.br)
- [Rocketseat nest-clean](https://github.com/rocketseat-education/05-nest-clean)

## Rode localmente

### Dependências globais

Você precisa ter duas principais dependências instaladas:

- [Node.js](https://nodejs.org/en/download/package-manager) 20.5.1 (ou qualquer versão superior)
- [Docker](https://www.docker.com/products/docker-desktop/) 24.0.6 (ou qualquer versão superior)
- [PNPM](https://pnpm.io/installation) 9.1.1 (ou qualquer versão superior) - opcional

### Clone o projeto

```bash
# git
git clone https://github.com/Leo-Henrique/dinhericiar-back-end.git

# GitHub CLI
gh repo clone Leo-Henrique/dinhericiar-back-end
```

### Instalar dependências

```bash
pnpm install
```

### Rodar os serviços

```bash
pnpm services:up
```

### Rodar migrações do banco de dados

```bash
pnpm migrate:dev
```

### Rode o projeto

```bash
pnpm start:dev
```

### Rode os testes

```bash
# unitários
pnpm test:unit

# integração
pnpm test:integration

# cobertura dos testes de integração
pnpm test:integration:coverage
```
