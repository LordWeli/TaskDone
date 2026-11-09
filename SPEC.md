# TaskDone — Product Spec

> Fonte da verdade do produto. Escrito pelo dono (Wesley). Se algo aqui conflitar com uma ideia sua, o spec vence. Se algo estiver ambíguo, use o default marcado em "Decisões abertas" e avise.

## 1. Objetivo

Dashboard diário para visualizar tarefas a fazer, concluí-las rapidamente e acompanhar o andamento do dia, com gamificação leve para aumentar a aderência.

- Usuário: inicialmente só o dono (uso pessoal).
- Interface em **inglês** (o dono usa o app para praticar inglês). Código, commits e comentários também em inglês.

## 2. Funcionalidades

### Essenciais (v1)

- Adicionar tarefa (campo sempre visível, foco fácil, Enter para adicionar)
- Marcar/desmarcar tarefa como concluída (checkbox)
- Apagar tarefa
- Lista de tarefas do dia
- Gráfico de andamento do dia (anel ou barra de progresso: concluídas / total)
- Gamificação: **streak diário, XP e níveis, conquistas (badges)**
- Sincronização entre dispositivos (Firebase) com funcionamento offline
- Login por e-mail e senha, mínimo necessário para sincronizar (decidido em 2026-11-09: o link de e-mail abria no Safari e não logava o app instalado no iPhone)

### Depois (fora da v1, NÃO implementar agora)

- Definir tempo/duração para uma tarefa
- Separar tarefas por horário/hora do dia
- Histórico de tarefas
- Customizações (temas, cores, preferências)
- Múltiplos usuários com separação de dados além do login do dono

### O que NÃO deve fazer

- Não fugir da ideia do projeto nem adicionar funcionalidades muito distintas do definido.
- Se surgir uma ideia nova, **não implemente**: registre em `IDEAS.md` (título + uma linha de justificativa) e avise o dono ao final, para ele decidir se faz sentido no futuro.
- Sem importação/exportação de dados. Sem integrações externas na v1.

## 3. Fluxo

**Telas:** praticamente uma única tela (dashboard) + tela de login.

Dashboard, de cima para baixo (mobile first):

1. Cabeçalho compacto: nível, barra de XP, streak
2. Campo de nova tarefa (o elemento que mais chama atenção)
3. Gráfico de andamento do dia
4. Lista de tarefas com checkboxes (abertas primeiro, concluídas depois)

**Caminho principal:** abrir → digitar a tarefa → Enter → ela aparece na lista → marcar o checkbox quando concluir.

**Ações diárias (precisam ser rápidas, 1 toque ou menos):** adicionar, concluir, apagar.

- Apagar deve ter desfazer (snackbar "Undo") em vez de diálogo de confirmação.

## 4. Dados

- Guarda: tarefas e as estatísticas de gamificação.
- Local primeiro, sincronizado: funciona offline e sincroniza entre dispositivos quando houver conexão. A nuvem é o backup.
- Sem importação/exportação. Dados não sensíveis.

## 5. Uso

- Principalmente celular, instalado como PWA (ícone na tela inicial). Também funciona bem em desktop.
- Uso diário, várias vezes ao dia, em sessões curtas.
- Deve abrir rápido e funcionar offline.
- Observação: um PWA não vira widget de tela inicial de verdade (iOS) e tem suporte limitado no Android. O alvo é "app instalável e instantâneo". Não gastar tempo tentando widget nativo.

## 6. Interface

- Clima: bonito e vivo, que chame atenção para **adicionar nova tarefa** e para **concluir as abertas**. Referências: Apple Notes e Google Keep (simplicidade e cards limpos).
- Tema: **claro** (o dono usa tema escuro no dia a dia, então o claro destaca mais). Não implementar tema escuro na v1.
- Cores e fonte: não definidas. Apresentar **2 a 3 opções de paleta + par de fontes** (com swatches e uma prévia real do dashboard) e esperar a escolha do dono antes de travar o design.
- Nível de visual: ferramenta funcional e rápida, **com animações** (microinterações ao concluir, adicionar e apagar; celebração ao completar o dia e ao subir de nível). Sem exagero de site de impacto.

## 7. Gamificação (v1)

Regras iniciais (ajustáveis, centralizadas em um único módulo de config):

- **XP:** +10 XP por tarefa concluída. Bônus de +25 XP ao completar todas as tarefas do dia (mínimo 3 tarefas no dia).
- **Desfazer conclusão:** desmarcar uma tarefa remove o XP que ela concedeu (guardar `xpAwarded` na tarefa). Apagar uma tarefa já concluída não altera o XP.
- **Nível:** `level = floor(sqrt(totalXp / 50)) + 1` (nível 2 em 50 XP, nível 3 em 200, nível 4 em 450).
- **Streak diário:** dia que conta = pelo menos 1 tarefa concluída, usando o fuso horário local do dispositivo. Perde o streak se passar um dia inteiro sem concluir nada. Guardar também o maior streak.
- **Conquistas (badges), v1:** First Task, 10 Tasks, 100 Tasks, Perfect Day (todas as tarefas do dia), 3-Day Streak, 7-Day Streak, 30-Day Streak.
- Feedback visual de cada ganho (+XP flutuando, barra de XP enchendo, badge com toast). Respeitar `prefers-reduced-motion`.
- Tom motivador, nunca punitivo: perder streak não deve gerar mensagem de culpa.

## 8. Critérios de pronto

O dono testa estas 3 coisas, e todas devem funcionar sem fricção:

1. Adicionar uma tarefa (Enter no campo, aparece na hora, também offline)
2. Concluir uma tarefa (checkbox, XP, gráfico e streak atualizam)
3. Apagar uma tarefa (com desfazer)

Além disso:

- Abrir o app em outro dispositivo logado mostra as mesmas tarefas.
- Funciona offline e sincroniza ao voltar a conexão.
- Instalável como PWA no celular.
- Passa no checklist de acessibilidade do `CLAUDE.md`.

## 9. Onde vive

- Código em repositório Git.
- Frontend: React + Vite + TypeScript, PWA.
- Dados e login: Firebase (Firestore + Authentication por e-mail e senha).
- Hospedagem: a definir com o dono (Firebase Hosting, Vercel ou Cloudflare Pages).

## Decisões abertas (use o default e avise)

| Decisão                                        | Default                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| Tarefas não concluídas viram o dia seguinte?   | Sim, continuam na lista (carry over) e contam no progresso de hoje |
| Quando conta como "dia" para o streak/gráfico? | Virada à meia-noite no fuso local                                  |
| Limite de tamanho do texto da tarefa           | 200 caracteres                                                     |
| Ordem da lista                                 | Abertas por criação (mais novas no topo), concluídas abaixo        |
