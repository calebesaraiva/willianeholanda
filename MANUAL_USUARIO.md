# Manual do sistema - Dra. Williane Holanda

Este manual explica o uso do site e do painel administrativo da clinica. Ele pode ser enviado para a equipe sem expor senhas.

## 1. Acesso

1. Abra o site da clinica.
2. Entre no painel pelo endereco combinado com a administracao.
3. Informe seu usuario e sua senha individual.
4. Clique em **Entrar**.

Regras importantes:

- Nao compartilhe usuario e senha.
- Cada pessoa deve usar o proprio acesso.
- Em caso de esquecimento de senha, solicite a redefinicao para a administracao.
- Ao terminar o uso em computador compartilhado, clique em **Sair**.

## 2. Perfis de usuario

O sistema separa as permissoes por perfil.

**Administracao**

- Edita textos e secoes do site.
- Libera ou bloqueia dias de atendimento.
- Cadastra e remove horarios disponiveis.
- Cria e gerencia usuarios da equipe.
- Acessa backup, diagnostico e historico.

**Recepcao / equipe**

- Visualiza datas e horarios liberados.
- Cadastra novos pacientes.
- Consulta pacientes agendados.
- Abre o modal de detalhes do paciente.
- Confirma, conclui, remarca ou cancela agendamentos.
- Atualiza a propria senha.

## 3. Fluxo da agenda

A agenda funciona em duas etapas:

1. A administracao libera os dias e os horarios de atendimento.
2. A recepcao agenda pacientes apenas dentro das vagas liberadas.

O sistema bloqueia automaticamente horarios ocupados. Quando um agendamento e cancelado ou remarcado, o horario antigo volta a ficar livre.

## 4. Cadastrar paciente

1. Entre com o perfil da recepcao.
2. Clique em **Novo agendamento** ou **Abrir proxima vaga**.
3. Escolha um horario disponivel.
4. Preencha nome completo, CPF e endereco.
5. Se necessario, adicione procedimento e observacoes internas.
6. Clique em **Confirmar agendamento**.

Campos obrigatorios:

- Nome completo
- CPF
- Endereco
- Data
- Horario

## 5. Consultar paciente

Na recepcao, use as areas **Proximos pacientes** ou **Pacientes**.

Ao clicar no nome de um paciente, abre um modal com:

- dados do paciente
- CPF
- endereco
- telefone, quando existir
- data e horario do agendamento
- procedimento
- origem do agendamento
- observacoes internas
- status atual

## 6. Remarcar paciente

1. Clique no nome do paciente.
2. No modal, clique em **Remarcar paciente**.
3. Escolha a nova data.
4. Escolha o novo horario.
5. Confira a mensagem de confirmacao da nova data e horario.
6. Clique em **Salvar novo horario**.

O sistema mostra apenas horarios livres. O horario anterior volta a ficar disponivel depois que a remarcacao e salva.

## 7. Cancelar agendamento

1. Clique no nome do paciente.
2. No modal, clique em **Cancelar agendamento**.

Ao cancelar, o paciente fica marcado como cancelado e o horario volta a ficar livre para outro atendimento.

## 8. Confirmar ou concluir atendimento

Dentro do modal do paciente:

- Use **Confirmar** quando o atendimento estiver confirmado.
- Use **Concluir** quando o atendimento ja tiver sido realizado.

Esses status ajudam a equipe a acompanhar o andamento dos pacientes.

## 9. Resumo de desempenho

O painel possui um resumo automatico por periodo:

- **Semana**: mostra os dados da semana atual.
- **Quinzena**: mostra a primeira ou segunda quinzena do mes atual.
- **Mes**: mostra os dados do mes atual.

Cada periodo mostra:

- total de agendamentos
- atendimentos realizados
- atendimentos confirmados
- agendamentos cancelados
- pacientes unicos
- vagas liberadas
- ocupacao da agenda
- agendamentos vindos pelo WhatsApp

Esses numeros ajudam a acompanhar o movimento da clinica sem precisar contar pacientes manualmente.

## 10. Atualizacao automatica de data e mes

O painel atualiza a data do sistema automaticamente. A lista de proximos pacientes e o destaque de **Hoje** acompanham a data atual.

O calendario tambem acompanha o mes atual quando a equipe esta usando a visualizacao do dia. Se a pessoa navegar manualmente para outro mes, o painel respeita essa escolha.

## 11. Liberar dias e horarios

Disponivel para a administracao.

1. Abra a area **Agenda da Dra**.
2. Escolha o dia no calendario.
3. Clique em **Liberar dia**.
4. Adicione horarios manualmente ou use **Aplicar horarios padrao**.
5. Salve a agenda.

Para bloquear um dia, selecione a data e clique em **Bloquear dia**. O sistema protege horarios que ja possuem paciente ativo.

## 12. Conteudo do site

Disponivel para a administracao.

O painel permite alterar conteudos do site sem mexer no codigo. Depois de editar, clique em **Salvar conteudo**.

Antes de alterar textos importantes, revise com calma. O site publico usa essas informacoes diretamente.

## 13. Usuarios e seguranca

Disponivel para a administracao.

Boas praticas:

- Crie um acesso para cada pessoa da equipe.
- Desative usuarios que nao trabalham mais na clinica.
- Evite senhas simples.
- Nunca envie senhas junto com prints do painel.
- Use a troca de senha sempre que houver duvida sobre compartilhamento indevido.

## 14. Backup e diagnostico

O painel possui recursos de apoio:

- **Backup**: gera uma copia das informacoes principais.
- **Teste do sistema**: verifica login, agenda, painel e integracoes.
- **Historico**: ajuda a acompanhar alteracoes importantes.

Use esses recursos antes de mudancas grandes ou quando algo parecer fora do normal.

## 15. WhatsApp

Quando configurado, o WhatsApp pode receber comandos de agendamento, cancelamento e consulta. A recepcao deve continuar conferindo a agenda pelo painel, porque ele mostra a visao mais organizada dos horarios e pacientes.

## 16. Suporte

Ao relatar um problema, envie:

- o que estava tentando fazer
- nome do paciente envolvido, se houver
- data e horario do ocorrido
- print da tela sem mostrar senhas
- mensagem de erro exibida pelo sistema

Isso ajuda a resolver mais rapido e com menos retrabalho.
