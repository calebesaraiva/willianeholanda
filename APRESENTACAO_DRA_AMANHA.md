# Apresentacao para a Dra

## Acesso ao painel

- Painel admin:
  `/?admin=1`
- Cada pessoa deve entrar com o proprio usuario individual.
- Nao envie senhas em documentos, prints ou mensagens de grupo.
- Se alguem esquecer a senha, a administracao pode criar uma nova no painel.

## Roteiro de 2 minutos

1. Abrir o site publico e mostrar a identidade visual, fotos reais e o posicionamento profissional.
2. Entrar no painel da Dra e mostrar que ela mesma pode alterar textos, imagens e secoes do site.
3. Abrir a agenda e mostrar que somente a Dra libera os dias de atendimento.
4. Entrar com o perfil da equipe e mostrar que a secretaria consegue cadastrar paciente apenas em data liberada.
5. Mostrar que o cadastro exige nome completo, endereco e CPF.
6. Mostrar que os agendamentos ficam salvos, podem mudar de status e aparecem no painel executivo.
7. Mostrar rapidamente os acessos de usuarios, o backup e a trilha de auditoria para passar confianca.

## Frases curtas para apresentar

- "O site ficou com a sua identidade visual e pode ser atualizado sem mexer no codigo."
- "A senhora controla os dias de atendimento, e a equipe agenda somente dentro dessas datas."
- "O painel separa o acesso da Dra e o acesso operacional da secretaria."
- "Ja existe backup e historico das alteracoes principais para dar mais seguranca."

## Operacao local

### Frontend

`npm start`

### API

`npm run server`

### Build

`npm run build`

## Observacoes importantes

- Esta versao esta pronta para demo e uso controlado.
- Para producao 24h real ainda falta hospedar frontend, API e banco em servidor estavel com dominio.
- O banco atual fica em `server/data/database.sqlite`.
