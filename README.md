# 🎯 Roleta Russa de Atividades

Sabe aquele momento clássico da faculdade em que você abre sua lista de pendências — **22 questões de PAA, um artigo de 3 horas de CG, lista de GABD...** — e passa 40 minutos só encarando a tela tentando decidir por onde começar (e acaba indo jogar um jogo de gatinhos e sopas)?

A **Roleta Russa de Atividades** nasceu exatamente pra resolver isso: **em vez de sofrer escolhendo o que fazer, você entrega o seu destino à roleta.** 🎡

Girou? Caiu? Agora é só dar o play no cronômetro, aceitar a missão e mandar ver!

---

## ✨ O que essa roleta faz por você

- 🎡 **Sorteio sem dor de cabeça:** gira uma roleta animada (com barulhinho satisfatório e tudo!) pra escolher sua próxima tarefa.
- 🔗 **Respeita atividades sequenciais:** algumas tarefas precisam ser feitas na ordem (tipo `L3-questão1` → `L3-questão2` → ...). Quando o modo **Sequencial** está ligado, só a próxima atividade desbloqueada entra na roleta. Concluiu uma? A próxima já entra automaticamente no sorteio! *(E se quiser liberar tudo de uma vez, é só virar a chavinha.)*
- ⏱️ **Cronômetro embutido:** já carrega o tempo estimado da atividade, mostra a contagem regressiva na aba do navegador, toca alarme quando o tempo acaba e entra em **hora extra** se você passar do estimado.
  - Tem botão de **`Pop-up`** flutuante (Picture-in-Picture) pra deixar o cronômetro sempre visível na tela do computador mesmo fora do navegador (com controles de play/pause, `+5m` e concluir direto no pop-up!).
  - Tem botão de **`+5 min`** (o famoso *"só mais cinco minutinhos"*).
  - Deu pra cansar no meio de um chefão de 180 minutos (alô, `CG • Artigo`)? Clica em **Pausar e Devolver à Roleta** que o tempo já trabalhado fica salvo pra você continuar depois.
- 🎛️ **Filtros pra vida real:** só tem 30 minutinhos livres antes da aula? Filtra por **tempo máximo**, escolhe uma **disciplina** específica ou ativa o modo **Priorizar prazo próximo** pra dar mais chance às tarefas que vencem logo.
- 📋 **Cola direto da planilha:** dá pra cadastrar atividades uma por uma ou copiar sua tabela do Excel / Google Sheets e colar direto em **Importar Tabela**.
- 💾 **Tudo salvo no navegador:** seu progresso fica guardado no `localStorage`, sem precisar criar conta nem configurar banco de dados.

---

## 🤖 Sim, foi feito com IA!

Este projeto foi criado com ajuda de **Inteligência Artificial**! 🧠⚡

A ideia foi bem prática: em vez de gastar horas codando uma ferramenta de produtividade enquanto os prazos das listas corriam perigo, a IA entrou em campo pra montar a roleta, o cronômetro, os efeitos sonoros e a lógica de dependências sequenciais em HTML, CSS e JavaScript puro — tudo rapidinho e sem frescura, pra sobrar mais tempo pro que realmente importa (fazer as atividades antes da data limite 😅).

---

## 🚀 Como usar

Sem `npm install`, sem build, sem dor de cabeça:

1. **Jeito mais fácil:** baixa o repositório e abre o arquivo [`index.html`](index.html) direto no seu navegador.
2. **Ou roda um servidor local** na pasta do projeto:
   ```bash
   python3 -m http.server 8000
   ```
   E acessa `http://localhost:8000`.
3. **Dica extra:** funciona perfeitamente no **GitHub Pages** se quiser deixar aberto no celular ou no PC de qualquer lugar!

---

## 📁 Estrutura do projeto

- `index.html` — Estrutura da página, roleta, cronômetro e modais.
- `styles.css` — Visual dark mode, anel de progresso e responsividade.
- `data.js` — Atividades iniciais, cores das disciplinas e leitor de tabelas coladas.
- `sound.js` — Efeitos sonoros gerados direto no navegador via Web Audio API.
- `pip.js` — Pop-up flutuante sempre visível (Document Picture-in-Picture, Video PiP em Canvas e fallback para mini janela).
- `app.js` — Lógica da roleta em Canvas, dependências sequenciais, cronômetro e salvamento local.

---

Boa sorte nos giros — e que a roleta seja piedosa com os seus prazos! 🍀🎓
