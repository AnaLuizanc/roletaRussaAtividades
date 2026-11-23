(function () {
  'use strict';

  const {
    createInitialTasks,
    getDisciplineColor,
    formatDateBR,
    getDaysUntil,
    formatDurationMinutes,
    formatClock,
    parseTableText,
  } = window.RoletaData;

  const sound = window.RoletaSound;
  const STORAGE_KEY = 'roleta_estudos_state_v1';
  const RING_RADIUS = 106;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  // --- Application State ---
  let state = {
    tasks: [],
    activeTaskId: null,
    soundEnabled: true,
    filters: {
      discipline: 'ALL',
      maxTime: 0,
      weightMode: 'uniform',
      statusTab: 'all',
      search: '',
    },
  };

  // Runtime (non-persisted) state
  let wheelRotation = 0;
  let isSpinning = false;
  let timerInterval = null;
  let timerRunning = false;
  let runStartedAt = null;
  let elapsedAtRunStart = 0;
  let alarmFiredForTask = false;
  let lastPersistTick = 0;
  let currentSlices = [];

  // --- DOM Elements ---
  const el = {
    statProgress: document.getElementById('statProgress'),
    statRemaining: document.getElementById('statRemaining'),
    statStudied: document.getElementById('statStudied'),
    btnToggleSound: document.getElementById('btnToggleSound'),
    iconSoundOn: document.getElementById('iconSoundOn'),
    iconSoundOff: document.getElementById('iconSoundOff'),
    btnOpenImport: document.getElementById('btnOpenImport'),
    btnOpenAdd: document.getElementById('btnOpenAdd'),

    eligibleCountBadge: document.getElementById('eligibleCountBadge'),
    filterDiscipline: document.getElementById('filterDiscipline'),
    filterMaxTime: document.getElementById('filterMaxTime'),
    filterWeightMode: document.getElementById('filterWeightMode'),
    rouletteCanvas: document.getElementById('rouletteCanvas'),
    wheelPointer: document.querySelector('.wheel-pointer'),
    btnSpinCenter: document.getElementById('btnSpinCenter'),
    btnSpin: document.getElementById('btnSpin'),
    btnSpinFromEmpty: document.getElementById('btnSpinFromEmpty'),
    eligibleChips: document.getElementById('eligibleChips'),
    eligibleHint: document.getElementById('eligibleHint'),

    timerStatusBadge: document.getElementById('timerStatusBadge'),
    timerEmpty: document.getElementById('timerEmpty'),
    timerActive: document.getElementById('timerActive'),
    activeDiscBadge: document.getElementById('activeDiscBadge'),
    activeDeadlineBadge: document.getElementById('activeDeadlineBadge'),
    activeTaskTitle: document.getElementById('activeTaskTitle'),
    activeTaskUnlock: document.getElementById('activeTaskUnlock'),
    timerRingProgress: document.getElementById('timerRingProgress'),
    timerClock: document.getElementById('timerClock'),
    timerSublabel: document.getElementById('timerSublabel'),
    timerElapsed: document.getElementById('timerElapsed'),
    btnTimerToggle: document.getElementById('btnTimerToggle'),
    iconPlay: document.getElementById('iconPlay'),
    iconPause: document.getElementById('iconPause'),
    labelTimerToggle: document.getElementById('labelTimerToggle'),
    btnTimerPlus5: document.getElementById('btnTimerPlus5'),
    btnTimerReset: document.getElementById('btnTimerReset'),
    btnCompleteActive: document.getElementById('btnCompleteActive'),
    btnReturnToPool: document.getElementById('btnReturnToPool'),

    searchTasks: document.getElementById('searchTasks'),
    statusTabs: document.querySelectorAll('[data-status-filter]'),
    btnResetDefaults: document.getElementById('btnResetDefaults'),
    disciplineGroups: document.getElementById('disciplineGroups'),

    taskModal: document.getElementById('taskModal'),
    taskModalTitle: document.getElementById('taskModalTitle'),
    taskForm: document.getElementById('taskForm'),
    taskIdInput: document.getElementById('taskIdInput'),
    taskDiscInput: document.getElementById('taskDiscInput'),
    disciplinesDatalist: document.getElementById('disciplinesDatalist'),
    taskTimeInput: document.getElementById('taskTimeInput'),
    taskNameInput: document.getElementById('taskNameInput'),
    taskDeadlineInput: document.getElementById('taskDeadlineInput'),
    taskDependsInput: document.getElementById('taskDependsInput'),

    importModal: document.getElementById('importModal'),
    importForm: document.getElementById('importForm'),
    importTextarea: document.getElementById('importTextarea'),
    importChainCheckbox: document.getElementById('importChainCheckbox'),
    importReplaceCheckbox: document.getElementById('importReplaceCheckbox'),

    toastContainer: document.getElementById('toastContainer'),
  };

  // --- Persistence ---
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.tasks)) {
          state.tasks = parsed.tasks.map((t) => ({
            id: t.id,
            disciplina: String(t.disciplina || 'Geral'),
            nome: String(t.nome || 'Sem nome'),
            tempoMin: Math.max(1, Number(t.tempoMin) || 15),
            dataLimite: t.dataLimite || '',
            dependsOn: t.dependsOn || null,
            completed: Boolean(t.completed),
            completedAt: t.completedAt || null,
            elapsedSeconds: Math.max(0, Number(t.elapsedSeconds) || 0),
            extraSeconds: Math.max(0, Number(t.extraSeconds) || 0),
          }));
          state.activeTaskId = parsed.activeTaskId || null;
          state.soundEnabled = parsed.soundEnabled !== false;
          if (parsed.filters) {
            state.filters = { ...state.filters, ...parsed.filters };
          }
          // Ensure activeTaskId is still valid & unlocked
          const active = getTaskById(state.activeTaskId);
          if (!active || active.completed || !isTaskUnlocked(active)) {
            state.activeTaskId = null;
          }
          return;
        }
      }
    } catch (_) {}
    state.tasks = createInitialTasks();
    state.activeTaskId = null;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  // --- Task & Sequential Dependency Helpers ---
  function getTaskById(id) {
    if (!id) return null;
    return state.tasks.find((t) => t.id === id) || null;
  }

  function isTaskUnlocked(task) {
    if (!task || task.completed) return false;
    if (!task.dependsOn) return true;
    const prereq = getTaskById(task.dependsOn);
    if (!prereq) return true; // Guard against orphaned reference
    return Boolean(prereq.completed);
  }

  function getDirectDependents(taskId) {
    return state.tasks.filter((t) => t.dependsOn === taskId);
  }

  function wouldCreateCycle(taskId, candidatePrereqId) {
    if (!taskId || !candidatePrereqId) return false;
    if (taskId === candidatePrereqId) return true;
    const visited = new Set([taskId]);
    let curr = getTaskById(candidatePrereqId);
    while (curr && curr.dependsOn) {
      if (visited.has(curr.dependsOn)) return true;
      visited.add(curr.dependsOn);
      curr = getTaskById(curr.dependsOn);
    }
    return false;
  }

  function getDisciplines() {
    const seen = new Set();
    const list = [];
    for (const t of state.tasks) {
      if (!seen.has(t.disciplina)) {
        seen.add(t.disciplina);
        list.push(t.disciplina);
      }
    }
    return list;
  }

  function isDisciplineSequential(disciplina) {
    const group = state.tasks.filter((t) => t.disciplina === disciplina);
    if (group.length < 2) return false;
    for (let i = 1; i < group.length; i++) {
      if (group[i].dependsOn !== group[i - 1].id) {
        return false;
      }
    }
    return true;
  }

  function setDisciplineSequential(disciplina, enabled) {
    const group = state.tasks.filter((t) => t.disciplina === disciplina);
    if (group.length < 2) return;

    const groupIds = new Set(group.map((t) => t.id));
    if (enabled) {
      group[0].dependsOn = null;
      for (let i = 1; i < group.length; i++) {
        group[i].dependsOn = group[i - 1].id;
      }
      // If active task just became locked, detach it safely
      const active = getTaskById(state.activeTaskId);
      if (active && !isTaskUnlocked(active)) {
        pauseTimer(true);
        state.activeTaskId = null;
        showToast(`"${active.nome}" agora aguarda uma atividade anterior e foi pausada.`, 'warning');
      } else {
        showToast(`${disciplina} configurado em modo sequencial.`, 'info');
      }
    } else {
      for (const t of group) {
        if (t.dependsOn && groupIds.has(t.dependsOn)) {
          t.dependsOn = null;
        }
      }
      showToast(`${disciplina} liberado: todas as atividades pendentes entraram na roleta.`, 'success');
    }

    saveState();
    renderAll();
  }

  function getEligibleTasks() {
    const { discipline, maxTime } = state.filters;
    return state.tasks.filter((t) => {
      if (!isTaskUnlocked(t)) return false;
      if (discipline !== 'ALL' && t.disciplina !== discipline) return false;
      if (maxTime > 0 && t.tempoMin > maxTime) return false;
      return true;
    });
  }

  function getTaskWeight(task) {
    if (state.filters.weightMode !== 'deadline') return 1;
    const days = getDaysUntil(task.dataLimite);
    if (days === null) return 1;
    if (days <= 0) return 6;
    if (days <= 3) return 4.5;
    if (days <= 7) return 3;
    if (days <= 14) return 2;
    return 1;
  }

  function buildWheelSlices(eligible) {
    if (!eligible.length) return [];
    const weights = eligible.map(getTaskWeight);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let angle = 0;
    return eligible.map((task, idx) => {
      const span = (weights[idx] / totalWeight) * Math.PI * 2;
      const slice = {
        task,
        weight: weights[idx],
        probability: (weights[idx] / totalWeight) * 100,
        startAngle: angle,
        endAngle: angle + span,
        color: getSliceColor(task, idx, eligible.length),
      };
      angle += span;
      return slice;
    });
  }

  function getSliceColor(task, idx, total) {
    const base = getDisciplineColor(task.disciplina).bg;
    // Slightly alternate luminance when adjacent slices share a discipline
    if (total > 1 && idx % 2 === 1) {
      return shadeHex(base, -14);
    }
    return base;
  }

  function shadeHex(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  function normalizeAngle(rad) {
    const twoPi = Math.PI * 2;
    return ((rad % twoPi) + twoPi) % twoPi;
  }

  // --- Roulette Canvas Renderer ---
  function drawWheel() {
    const canvas = el.rouletteCanvas;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displaySize = 420;
    if (canvas.width !== displaySize * dpr || canvas.height !== displaySize * dpr) {
      canvas.width = displaySize * dpr;
      canvas.height = displaySize * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    const cx = displaySize / 2;
    const cy = displaySize / 2;
    const radius = displaySize / 2 - 6;

    ctx.clearRect(0, 0, displaySize, displaySize);

    if (currentSlices.length === 0) {
      // Empty wheel state
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#141c2f';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.stroke();

      const pendingCount = state.tasks.filter((t) => !t.completed).length;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (pendingCount === 0 && state.tasks.length > 0) {
        ctx.fillText('Todas concluídas! 🎉', cx, cy - 52);
      } else {
        ctx.fillText('Nenhuma elegível com os filtros', cx, cy - 52);
      }
      ctx.restore();
      return;
    }

    const sliceCount = currentSlices.length;

    currentSlices.forEach((slice) => {
      const start = wheelRotation + slice.startAngle;
      const end = wheelRotation + slice.endAngle;
      const mid = (start + end) / 2;
      const span = end - start;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();

      ctx.fillStyle = slice.color;
      ctx.fill();

      ctx.lineWidth = sliceCount > 1 ? 2 : 0;
      ctx.strokeStyle = '#0b0f19';
      ctx.stroke();

      // Label inside slice
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(mid);

      const fontSize = sliceCount <= 4 ? 14 : sliceCount <= 10 ? 12 : sliceCount <= 16 ? 10.5 : 9;
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 4;

      const maxChars = sliceCount <= 5 ? 18 : sliceCount <= 12 ? 14 : 11;
      const shortName = truncateText(`${slice.task.disciplina} • ${slice.task.nome}`, maxChars);
      ctx.fillText(shortName, radius - 18, span > 0.32 ? -7 : 0);

      if (span > 0.32) {
        ctx.font = `500 ${Math.max(10, fontSize - 2.5)}px "JetBrains Mono", monospace`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(`${slice.task.tempoMin} min`, radius - 18, 9);
      }
      ctx.restore();
    });

    // Subtle glossy inner rim
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.stroke();

    // Outer peg dots for casino-wheel polish
    if (sliceCount > 1) {
      currentSlices.forEach((slice) => {
        const a = wheelRotation + slice.startAngle;
        const px = cx + Math.cos(a) * (radius - 7);
        const py = cy + Math.sin(a) * (radius - 7);
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fill();
      });
    }

    ctx.restore();
  }

  function truncateText(text, max) {
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
  }

  function getSliceIndexAtPointer(rotation) {
    if (!currentSlices.length) return -1;
    const localAngle = normalizeAngle(-Math.PI / 2 - rotation);
    for (let i = 0; i < currentSlices.length; i++) {
      if (localAngle >= currentSlices[i].startAngle && localAngle < currentSlices[i].endAngle) {
        return i;
      }
    }
    return currentSlices.length - 1;
  }

  function spinRoulette() {
    if (isSpinning) return;
    const eligible = getEligibleTasks();
    if (!eligible.length) {
      showToast('Nenhuma atividade disponível para sortear com os filtros atuais.', 'warning');
      return;
    }

    // Pause current running timer if spinning for a new one
    if (timerRunning) {
      pauseTimer(true);
    }

    currentSlices = buildWheelSlices(eligible);

    // Weighted random selection
    const totalWeight = currentSlices.reduce((sum, s) => sum + s.weight, 0);
    let r = Math.random() * totalWeight;
    let winningSlice = currentSlices[currentSlices.length - 1];
    for (const s of currentSlices) {
      r -= s.weight;
      if (r <= 0) {
        winningSlice = s;
        break;
      }
    }

    const span = winningSlice.endAngle - winningSlice.startAngle;
    const targetLocal = winningSlice.startAngle + (0.18 + Math.random() * 0.64) * span;
    const desiredMod = normalizeAngle(-Math.PI / 2 - targetLocal);
    const currentMod = normalizeAngle(wheelRotation);
    const deltaMod = normalizeAngle(desiredMod - currentMod);
    const extraTurns = (5 + Math.floor(Math.random() * 3)) * Math.PI * 2;

    const startRotation = wheelRotation;
    const totalDelta = extraTurns + deltaMod;
    const duration = 3800 + Math.random() * 600;
    const startTime = performance.now();

    isSpinning = true;
    updateSpinButtons();
    sound.ensureContext();

    let lastPointerSlice = getSliceIndexAtPointer(startRotation);
    let pointerTimeout = null;

    function frame(now) {
      const t = Math.min(1, (now - startTime) / duration);
      // Quartic ease-out for crisp realistic deceleration
      const eased = 1 - Math.pow(1 - t, 4);
      wheelRotation = startRotation + totalDelta * eased;
      drawWheel();

      const idx = getSliceIndexAtPointer(wheelRotation);
      if (idx !== lastPointerSlice && currentSlices.length > 1) {
        lastPointerSlice = idx;
        sound.playTick(0.95 + (1 - t) * 0.25);
        el.wheelPointer.classList.add('tick');
        clearTimeout(pointerTimeout);
        pointerTimeout = setTimeout(() => el.wheelPointer.classList.remove('tick'), 75);
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        wheelRotation = normalizeAngle(wheelRotation);
        isSpinning = false;
        el.wheelPointer.classList.remove('tick');
        drawWheel();
        updateSpinButtons();
        selectActiveTask(winningSlice.task.id, true);
        sound.playWin();
        showToast(
          `Sorteada: ${winningSlice.task.disciplina} • ${winningSlice.task.nome} (${winningSlice.task.tempoMin} min)`,
          'accent'
        );
      }
    }

    requestAnimationFrame(frame);
  }

  function updateSpinButtons() {
    const disabled = isSpinning || currentSlices.length === 0;
    el.btnSpin.disabled = disabled;
    el.btnSpinCenter.disabled = disabled;
    el.btnSpinFromEmpty.disabled = disabled;
  }

  // --- Timer Engine (Drift-Free) ---
  function getCurrentElapsedSeconds(task) {
    if (!task) return 0;
    if (timerRunning && state.activeTaskId === task.id && runStartedAt !== null) {
      return elapsedAtRunStart + (Date.now() - runStartedAt) / 1000;
    }
    return task.elapsedSeconds || 0;
  }

  function getTargetSeconds(task) {
    if (!task) return 0;
    return task.tempoMin * 60 + (task.extraSeconds || 0);
  }

  function selectActiveTask(taskId, autoFocusTimer = false) {
    const task = getTaskById(taskId);
    if (!task) return;
    if (!isTaskUnlocked(task)) {
      const prereq = getTaskById(task.dependsOn);
      showToast(
        `Bloqueada! Conclua "${prereq ? prereq.nome : 'o pré-requisito'}" primeiro.`,
        'warning'
      );
      return;
    }

    if (timerRunning) {
      pauseTimer(true);
    }

    state.activeTaskId = task.id;
    alarmFiredForTask = getCurrentElapsedSeconds(task) >= getTargetSeconds(task);
    saveState();
    renderAll();

    if (autoFocusTimer && window.innerWidth <= 980) {
      el.timerActive.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function startTimer() {
    const task = getTaskById(state.activeTaskId);
    if (!task || timerRunning) return;

    sound.ensureContext();
    timerRunning = true;
    runStartedAt = Date.now();
    elapsedAtRunStart = task.elapsedSeconds || 0;
    lastPersistTick = Date.now();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(onTimerTick, 250);
    renderTimer();
    renderStats();
  }

  function pauseTimer(silent = false) {
    if (!timerRunning) return;
    const task = getTaskById(state.activeTaskId);
    if (task && runStartedAt !== null) {
      task.elapsedSeconds = Math.floor(elapsedAtRunStart + (Date.now() - runStartedAt) / 1000);
    }
    timerRunning = false;
    runStartedAt = null;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    saveState();
    updateDocumentTitle();
    if (!silent) {
      renderTimer();
      renderStats();
      renderDisciplineGroups();
    }
  }

  function onTimerTick() {
    const task = getTaskById(state.activeTaskId);
    if (!task) {
      pauseTimer(true);
      return;
    }

    const elapsed = getCurrentElapsedSeconds(task);
    const target = getTargetSeconds(task);

    if (!alarmFiredForTask && elapsed >= target) {
      alarmFiredForTask = true;
      sound.playAlarm();
      showToast(
        `⏰ Tempo estimado de "${task.nome}" finalizado! Continuando contagem em hora extra.`,
        'warning'
      );
    }

    // Periodically commit elapsed seconds to storage
    const now = Date.now();
    if (now - lastPersistTick >= 5000) {
      task.elapsedSeconds = Math.floor(elapsed);
      saveState();
      lastPersistTick = now;
      renderStats();
    }

    renderTimerDisplayOnly(task, elapsed, target);
    updateDocumentTitle(task, target - elapsed);
  }

  function resetActiveTimer() {
    const task = getTaskById(state.activeTaskId);
    if (!task) return;
    if (timerRunning) pauseTimer(true);
    task.elapsedSeconds = 0;
    task.extraSeconds = 0;
    alarmFiredForTask = false;
    saveState();
    renderAll();
    showToast('Cronômetro zerado para esta atividade.', 'info');
  }

  function addFiveMinutes() {
    const task = getTaskById(state.activeTaskId);
    if (!task) return;
    task.extraSeconds = (task.extraSeconds || 0) + 5 * 60;
    if (getCurrentElapsedSeconds(task) < getTargetSeconds(task)) {
      alarmFiredForTask = false;
    }
    saveState();
    renderTimer();
    showToast('+5 minutos adicionados ao cronômetro.', 'info');
  }

  function completeTask(taskId) {
    const task = getTaskById(taskId);
    if (!task) return;

    if (state.activeTaskId === task.id) {
      if (timerRunning) pauseTimer(true);
      state.activeTaskId = null;
    }

    task.completed = true;
    task.completedAt = new Date().toISOString();

    const newlyUnlocked = getDirectDependents(task.id).filter((dep) => isTaskUnlocked(dep));
    saveState();
    sound.playComplete();
    updateDocumentTitle();
    renderAll();

    if (newlyUnlocked.length > 0) {
      const names = newlyUnlocked.map((d) => d.nome).join(', ');
      showToast(`✅ "${task.nome}" concluída! Desbloqueada na roleta: ${names}`, 'success');
    } else {
      showToast(`✅ "${task.nome}" marcada como concluída!`, 'success');
    }
  }

  function uncompleteTask(taskId) {
    const task = getTaskById(taskId);
    if (!task) return;
    task.completed = false;
    task.completedAt = null;

    // If any currently active task depended on this one, detach it
    const active = getTaskById(state.activeTaskId);
    if (active && !isTaskUnlocked(active)) {
      pauseTimer(true);
      state.activeTaskId = null;
    }

    saveState();
    renderAll();
    showToast(`"${task.nome}" reaberta.`, 'info');
  }

  function returnActiveToPool() {
    const task = getTaskById(state.activeTaskId);
    if (!task) return;
    if (timerRunning) pauseTimer(true);
    state.activeTaskId = null;
    saveState();
    updateDocumentTitle();
    renderAll();
    showToast(`"${task.nome}" devolvida à roleta (tempo trabalhado foi salvo).`, 'info');
  }

  function updateDocumentTitle(task = null, remaining = 0) {
    if (timerRunning && task) {
      document.title = `${formatClock(remaining)} • ${task.nome} | Roleta de Estudos`;
    } else {
      document.title = 'Roleta de Estudos — Sorteio & Cronômetro';
    }
  }

  // --- Rendering ---
  function renderAll() {
    renderStats();
    renderFilterOptions();
    renderRoulette();
    renderTimer();
    renderDisciplineGroups();
    renderSoundButton();
  }

  function renderSoundButton() {
    sound.enabled = state.soundEnabled;
    el.iconSoundOn.classList.toggle('hidden', !state.soundEnabled);
    el.iconSoundOff.classList.toggle('hidden', state.soundEnabled);
  }

  function renderStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter((t) => t.completed).length;
    const remainingMin = state.tasks
      .filter((t) => !t.completed)
      .reduce((acc, t) => {
        const workedMin = Math.floor(getCurrentElapsedSeconds(t) / 60);
        return acc + Math.max(0, t.tempoMin - workedMin);
      }, 0);
    const totalStudiedSec = state.tasks.reduce((acc, t) => acc + getCurrentElapsedSeconds(t), 0);

    el.statProgress.textContent = `${completed} / ${total}`;
    el.statRemaining.textContent = formatDurationMinutes(remainingMin);
    el.statStudied.textContent = totalStudiedSec < 60
      ? `${Math.floor(totalStudiedSec)}s`
      : formatDurationMinutes(totalStudiedSec / 60);
  }

  function renderFilterOptions() {
    const disciplines = getDisciplines();
    const currentVal = state.filters.discipline;
    el.filterDiscipline.innerHTML = '<option value="ALL">Todas</option>';
    disciplines.forEach((d) => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      el.filterDiscipline.appendChild(opt);
    });
    if (currentVal !== 'ALL' && !disciplines.includes(currentVal)) {
      state.filters.discipline = 'ALL';
    }
    el.filterDiscipline.value = state.filters.discipline;
    el.filterMaxTime.value = String(state.filters.maxTime);
    el.filterWeightMode.value = state.filters.weightMode;

    // Update datalist for modal
    el.disciplinesDatalist.innerHTML = '';
    disciplines.forEach((d) => {
      const opt = document.createElement('option');
      opt.value = d;
      el.disciplinesDatalist.appendChild(opt);
    });
  }

  function renderRoulette() {
    const eligible = getEligibleTasks();
    currentSlices = buildWheelSlices(eligible);
    drawWheel();
    updateSpinButtons();

    const count = eligible.length;
    el.eligibleCountBadge.textContent = count === 1 ? '1 na roleta' : `${count} na roleta`;
    el.eligibleHint.textContent = state.filters.weightMode === 'deadline'
      ? 'Com peso por prazo'
      : 'Clique para iniciar direto';

    el.eligibleChips.innerHTML = '';
    if (count === 0) {
      const span = document.createElement('span');
      span.className = 'eligible-hint';
      span.textContent = state.tasks.every((t) => t.completed)
        ? 'Parabéns! Todas as atividades foram concluídas.'
        : 'Ajuste os filtros acima ou desbloqueie novas atividades.';
      el.eligibleChips.appendChild(span);
      return;
    }

    currentSlices.forEach((slice) => {
      const { task, probability } = slice;
      const color = getDisciplineColor(task.disciplina);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'pool-chip';
      chip.title = `Iniciar ${task.disciplina} • ${task.nome} (${Math.round(probability)}% de chance)`;
      const probText = state.filters.weightMode === 'deadline' ? ` • ${Math.round(probability)}%` : '';
      chip.innerHTML = `
        <span class="pool-chip-dot" style="background:${color.light}"></span>
        <span>${escapeHtml(task.disciplina)}: ${escapeHtml(task.nome)}</span>
        <span class="pool-chip-time">${task.tempoMin}m${probText}</span>
      `;
      chip.addEventListener('click', () => selectActiveTask(task.id, true));
      el.eligibleChips.appendChild(chip);
    });
  }

  function renderTimer() {
    const task = getTaskById(state.activeTaskId);
    if (!task) {
      el.timerEmpty.classList.remove('hidden');
      el.timerActive.classList.add('hidden');
      el.timerStatusBadge.textContent = 'Aguardando';
      el.timerStatusBadge.className = 'badge badge-status';
      return;
    }

    el.timerEmpty.classList.add('hidden');
    el.timerActive.classList.remove('hidden');

    const color = getDisciplineColor(task.disciplina);
    el.activeDiscBadge.textContent = task.disciplina;
    el.activeDiscBadge.style.background = color.soft;
    el.activeDiscBadge.style.color = color.light;
    el.activeDiscBadge.style.border = `1px solid ${color.border}`;

    el.activeTaskTitle.textContent = task.nome;
    renderDeadlineBadge(el.activeDeadlineBadge, task.dataLimite);

    const nextDeps = getDirectDependents(task.id).filter((d) => !d.completed);
    if (nextDeps.length > 0) {
      el.activeTaskUnlock.textContent = `🔓 Ao concluir, desbloqueia: ${nextDeps.map((d) => d.nome).join(', ')}`;
      el.activeTaskUnlock.classList.remove('hidden');
    } else {
      el.activeTaskUnlock.classList.add('hidden');
    }

    el.timerRingProgress.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;

    const elapsed = getCurrentElapsedSeconds(task);
    const target = getTargetSeconds(task);
    renderTimerDisplayOnly(task, elapsed, target);

    el.iconPlay.classList.toggle('hidden', timerRunning);
    el.iconPause.classList.toggle('hidden', !timerRunning);
    el.labelTimerToggle.textContent = timerRunning ? 'Pausar' : (elapsed > 0 ? 'Continuar' : 'Iniciar');
  }

  function renderTimerDisplayOnly(task, elapsed, target) {
    const remaining = target - elapsed;
    const isOvertime = remaining <= 0;

    el.timerClock.textContent = formatClock(remaining);
    el.timerClock.classList.toggle('overtime', isOvertime);

    const extraMin = Math.round((task.extraSeconds || 0) / 60);
    el.timerSublabel.textContent = isOvertime
      ? 'Tempo estimado excedido (hora extra)'
      : extraMin > 0
        ? `Estimado: ${task.tempoMin} min (+${extraMin}m)`
        : `Estimado: ${task.tempoMin} min`;

    el.timerElapsed.textContent = `Trabalhado: ${formatClock(elapsed)}`;

    const pct = target > 0 ? Math.min(1, elapsed / target) : 1;
    const offset = isOvertime ? 0 : RING_CIRCUMFERENCE * pct;
    el.timerRingProgress.style.strokeDashoffset = `${offset}`;
    el.timerRingProgress.classList.toggle('running', timerRunning && !isOvertime);
    el.timerRingProgress.classList.toggle('overtime', isOvertime);

    if (isOvertime) {
      el.timerStatusBadge.textContent = timerRunning ? 'Hora Extra' : 'Tempo Esgotado';
      el.timerStatusBadge.className = 'badge badge-status overtime';
    } else if (timerRunning) {
      el.timerStatusBadge.textContent = 'Em andamento';
      el.timerStatusBadge.className = 'badge badge-status running';
    } else if (elapsed > 0) {
      el.timerStatusBadge.textContent = 'Pausado';
      el.timerStatusBadge.className = 'badge badge-status paused';
    } else {
      el.timerStatusBadge.textContent = 'Pronto';
      el.timerStatusBadge.className = 'badge badge-status';
    }
  }

  function renderDeadlineBadge(node, isoDate) {
    node.className = 'deadline-badge';
    if (!isoDate) {
      node.textContent = 'Sem prazo';
      return;
    }
    const days = getDaysUntil(isoDate);
    const br = formatDateBR(isoDate);
    if (days < 0) {
      node.textContent = `Atrasada (${br})`;
      node.classList.add('urgent');
    } else if (days === 0) {
      node.textContent = `Vence hoje (${br})`;
      node.classList.add('urgent');
    } else if (days <= 5) {
      node.textContent = `Vence em ${days}d (${br})`;
      node.classList.add('urgent');
    } else if (days <= 10) {
      node.textContent = `Vence em ${days}d (${br})`;
      node.classList.add('soon');
    } else {
      node.textContent = `Prazo: ${br}`;
    }
  }

  function renderDisciplineGroups() {
    const disciplines = getDisciplines();
    const search = state.filters.search.trim().toLowerCase();
    const statusTab = state.filters.statusTab;

    el.disciplineGroups.innerHTML = '';

    if (disciplines.length === 0) {
      el.disciplineGroups.innerHTML = '<div class="empty-list-msg">Nenhuma atividade cadastrada. Clique em <strong>Nova Atividade</strong> ou <strong>Importar Tabela</strong>.</div>';
      return;
    }

    let renderedAnyGroup = false;

    disciplines.forEach((disciplina) => {
      const allInGroup = state.tasks.filter((t) => t.disciplina === disciplina);
      const filtered = allInGroup.filter((t) => {
        if (search) {
          const hay = `${t.disciplina} ${t.nome}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        const unlocked = isTaskUnlocked(t);
        if (statusTab === 'available' && !unlocked) return false;
        if (statusTab === 'locked' && (t.completed || unlocked)) return false;
        if (statusTab === 'completed' && !t.completed) return false;
        return true;
      });

      if (filtered.length === 0) return;
      renderedAnyGroup = true;

      const color = getDisciplineColor(disciplina);
      const completedCount = allInGroup.filter((t) => t.completed).length;
      const pct = allInGroup.length ? Math.round((completedCount / allInGroup.length) * 100) : 0;
      const remMin = allInGroup.filter((t) => !t.completed).reduce((s, t) => s + t.tempoMin, 0);
      const isSeq = isDisciplineSequential(disciplina);

      const groupEl = document.createElement('div');
      groupEl.className = 'disc-group';

      const header = document.createElement('div');
      header.className = 'disc-group-header';

      const seqControlHtml = allInGroup.length >= 2
        ? `
          <label class="seq-toggle" title="Quando ativo, apenas a próxima atividade pendente desta disciplina entra na roleta">
            <span>Sequencial</span>
            <span class="switch">
              <input type="checkbox" ${isSeq ? 'checked' : ''} data-seq-disc="${escapeAttr(disciplina)}" />
              <span class="switch-slider"></span>
            </span>
          </label>
        `
        : `<span class="task-dep-pill">Atividade única</span>`;

      header.innerHTML = `
        <div class="disc-group-left">
          <span class="disc-badge" style="background:${color.soft}; color:${color.light}; border:1px solid ${color.border};">
            ${escapeHtml(disciplina)}
          </span>
          <div class="disc-group-stats">
            <span><strong>${completedCount}/${allInGroup.length}</strong> concluídas</span>
            <div class="disc-progress-bar" aria-hidden="true">
              <div class="disc-progress-fill" style="width:${pct}%; background:${color.light};"></div>
            </div>
            <span>${formatDurationMinutes(remMin)} restantes</span>
          </div>
        </div>
        ${seqControlHtml}
      `;

      const seqCheckbox = header.querySelector('[data-seq-disc]');
      if (seqCheckbox) {
        seqCheckbox.addEventListener('change', (e) => {
          setDisciplineSequential(disciplina, e.target.checked);
        });
      }

      const listEl = document.createElement('div');
      listEl.className = 'task-list';

      filtered.forEach((task) => {
        const unlocked = isTaskUnlocked(task);
        const isActive = state.activeTaskId === task.id;
        const prereq = task.dependsOn ? getTaskById(task.dependsOn) : null;
        const workedSec = getCurrentElapsedSeconds(task);
        const targetSec = getTargetSeconds(task);
        const partialPct = targetSec > 0 ? Math.min(100, Math.round((workedSec / targetSec) * 100)) : 0;

        const row = document.createElement('div');
        row.className = 'task-row';
        if (isActive) row.classList.add('is-active');
        else if (task.completed) row.classList.add('is-completed');
        else if (!unlocked) row.classList.add('is-locked');

        let statusClass = 'status-available';
        let statusEmoji = '🔓';
        let statusTitle = 'Disponível na roleta';
        if (isActive) {
          statusClass = 'status-running';
          statusEmoji = '⏱';
          statusTitle = 'No cronômetro agora';
        } else if (task.completed) {
          statusClass = 'status-completed';
          statusEmoji = '✓';
          statusTitle = 'Concluída';
        } else if (!unlocked) {
          statusClass = 'status-locked';
          statusEmoji = '🔒';
          statusTitle = 'Bloqueada por pré-requisito';
        }

        let depHtml = '';
        if (prereq) {
          if (prereq.completed) {
            depHtml = `<span class="task-dep-pill unblocked">Após ${escapeHtml(prereq.nome)} ✓</span>`;
          } else {
            depHtml = `<span class="task-dep-pill">Aguarda: ${escapeHtml(prereq.nome)}</span>`;
          }
        }

        const partialHtml = !task.completed && workedSec > 0
          ? `<div class="task-partial-bar" title="Trabalhado: ${formatClock(workedSec)}"><div class="task-partial-fill" style="width:${partialPct}%"></div></div>`
          : '';

        const days = getDaysUntil(task.dataLimite);
        const deadlineShort = task.dataLimite ? formatDateBR(task.dataLimite) : 'Sem prazo';
        const deadlineStyle = !task.completed && days !== null && days <= 5
          ? 'color:#fda4af; border-color:rgba(251,113,133,0.35);'
          : '';

        row.innerHTML = `
          <div class="task-status-icon ${statusClass}" title="${statusTitle}">${statusEmoji}</div>
          <div class="task-info">
            <div class="task-name-line">
              <span class="task-name">${escapeHtml(task.nome)}</span>
              ${depHtml}
            </div>
            ${partialHtml}
          </div>
          <div class="task-meta-pills">
            <span class="meta-pill">${task.tempoMin} min</span>
            <span class="meta-pill" style="${deadlineStyle}">${escapeHtml(deadlineShort)}</span>
          </div>
          <div class="task-actions">
            <button type="button" class="icon-action play-btn" data-action="start" title="Carregar no cronômetro" ${!unlocked ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
            </button>
            <button type="button" class="icon-action done-btn" data-action="toggle-done" title="${task.completed ? 'Reabrir atividade' : 'Marcar como concluída'}">
              ${task.completed
                ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>'
                : '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'}
            </button>
            <button type="button" class="icon-action" data-action="edit" title="Editar atividade / pré-requisito">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <button type="button" class="icon-action delete-btn" data-action="delete" title="Excluir atividade">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6M14 11v6"></path></svg>
            </button>
          </div>
        `;

        row.querySelector('[data-action="start"]').addEventListener('click', () => {
          selectActiveTask(task.id, true);
        });
        row.querySelector('[data-action="toggle-done"]').addEventListener('click', () => {
          if (task.completed) uncompleteTask(task.id);
          else completeTask(task.id);
        });
        row.querySelector('[data-action="edit"]').addEventListener('click', () => {
          openTaskModal(task);
        });
        row.querySelector('[data-action="delete"]').addEventListener('click', () => {
          deleteTask(task.id);
        });

        listEl.appendChild(row);
      });

      groupEl.appendChild(header);
      groupEl.appendChild(listEl);
      el.disciplineGroups.appendChild(groupEl);
    });

    if (!renderedAnyGroup) {
      el.disciplineGroups.innerHTML = '<div class="empty-list-msg">Nenhuma atividade encontrada para este filtro.</div>';
    }
  }

  // --- CRUD & Modals ---
  function openTaskModal(taskToEdit = null) {
    el.taskForm.reset();
    el.taskIdInput.value = taskToEdit ? taskToEdit.id : '';
    el.taskModalTitle.textContent = taskToEdit ? 'Editar Atividade' : 'Nova Atividade';

    el.taskDiscInput.value = taskToEdit ? taskToEdit.disciplina : '';
    el.taskNameInput.value = taskToEdit ? taskToEdit.nome : '';
    el.taskTimeInput.value = taskToEdit ? taskToEdit.tempoMin : 30;
    el.taskDeadlineInput.value = taskToEdit ? taskToEdit.dataLimite : '';

    // Populate prerequisite dropdown (excluding self & cycle-inducing tasks)
    el.taskDependsInput.innerHTML = '<option value="">Nenhum (sempre disponível)</option>';
    state.tasks.forEach((candidate) => {
      if (taskToEdit && (candidate.id === taskToEdit.id || wouldCreateCycle(taskToEdit.id, candidate.id))) {
        return;
      }
      const opt = document.createElement('option');
      opt.value = candidate.id;
      opt.textContent = `${candidate.disciplina} • ${candidate.nome}${candidate.completed ? ' (concluída)' : ''}`;
      el.taskDependsInput.appendChild(opt);
    });
    el.taskDependsInput.value = taskToEdit && taskToEdit.dependsOn ? taskToEdit.dependsOn : '';

    el.taskModal.classList.remove('hidden');
    el.taskDiscInput.focus();
  }

  function closeModal(modalId) {
    const node = document.getElementById(modalId);
    if (node) node.classList.add('hidden');
  }

  function handleSaveTask(e) {
    e.preventDefault();
    const id = el.taskIdInput.value.trim();
    const disciplina = el.taskDiscInput.value.trim();
    const nome = el.taskNameInput.value.trim();
    const tempoMin = Math.max(1, parseInt(el.taskTimeInput.value, 10) || 15);
    const dataLimite = el.taskDeadlineInput.value || '';
    const dependsOn = el.taskDependsInput.value || null;

    if (!disciplina || !nome) return;

    if (id) {
      const task = getTaskById(id);
      if (!task) return;
      if (dependsOn && wouldCreateCycle(task.id, dependsOn)) {
        showToast('Esse pré-requisito criaria um ciclo infinito.', 'warning');
        return;
      }
      task.disciplina = disciplina;
      task.nome = nome;
      task.tempoMin = tempoMin;
      task.dataLimite = dataLimite;
      task.dependsOn = dependsOn;

      if (state.activeTaskId === task.id && !isTaskUnlocked(task)) {
        pauseTimer(true);
        state.activeTaskId = null;
      }
      showToast(`Atividade "${nome}" atualizada.`, 'success');
    } else {
      const newTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        disciplina,
        nome,
        tempoMin,
        dataLimite,
        dependsOn,
        completed: false,
        completedAt: null,
        elapsedSeconds: 0,
        extraSeconds: 0,
      };
      state.tasks.push(newTask);
      showToast(`Atividade "${nome}" adicionada!`, 'success');
    }

    saveState();
    closeModal('taskModal');
    renderAll();
  }

  function deleteTask(taskId) {
    const task = getTaskById(taskId);
    if (!task) return;
    if (!confirm(`Excluir a atividade "${task.disciplina} • ${task.nome}"?`)) return;

    if (state.activeTaskId === task.id) {
      pauseTimer(true);
      state.activeTaskId = null;
    }

    // Bridge sequential chain so dependents don't break
    state.tasks.forEach((t) => {
      if (t.dependsOn === task.id) {
        t.dependsOn = task.dependsOn || null;
      }
    });

    state.tasks = state.tasks.filter((t) => t.id !== task.id);
    saveState();
    renderAll();
    showToast(`Atividade "${task.nome}" excluída.`, 'info');
  }

  function handleImportSubmit(e) {
    e.preventDefault();
    const raw = el.importTextarea.value;
    const chain = el.importChainCheckbox.checked;
    const replace = el.importReplaceCheckbox.checked;

    const parsed = parseTableText(raw, chain);
    if (!parsed.length) {
      showToast('Nenhuma linha válida encontrada. Verifique o formato: Disciplina, Atividade, Tempo, DataLimite.', 'warning');
      return;
    }

    if (replace) {
      if (timerRunning) pauseTimer(true);
      state.tasks = parsed;
      state.activeTaskId = null;
    } else {
      state.tasks.push(...parsed);
    }

    saveState();
    closeModal('importModal');
    el.importForm.reset();
    el.importChainCheckbox.checked = true;
    renderAll();
    showToast(`${parsed.length} atividade(s) importada(s) com sucesso!`, 'success');
  }

  function handleResetDefaults() {
    if (!confirm('Restaurar a lista inicial de 27 atividades (PAA, CG e GABD)? Todo o progresso atual será zerado.')) {
      return;
    }
    if (timerRunning) pauseTimer(true);
    state.tasks = createInitialTasks();
    state.activeTaskId = null;
    state.filters.discipline = 'ALL';
    state.filters.maxTime = 0;
    state.filters.statusTab = 'all';
    state.filters.search = '';
    el.searchTasks.value = '';
    updateStatusTabUI();
    saveState();
    updateDocumentTitle();
    renderAll();
    showToast('Lista padrão restaurada.', 'info');
  }

  // --- Utilities ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(14px)';
      toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      setTimeout(() => toast.remove(), 220);
    }, 4000);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function updateStatusTabUI() {
    el.statusTabs.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.statusFilter === state.filters.statusTab);
    });
  }

  // --- Event Listeners ---
  function bindEvents() {
    el.btnToggleSound.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      sound.enabled = state.soundEnabled;
      renderSoundButton();
      saveState();
      if (state.soundEnabled) sound.playTick(1.1);
    });

    el.btnOpenAdd.addEventListener('click', () => openTaskModal(null));
    el.btnOpenImport.addEventListener('click', () => {
      el.importModal.classList.remove('hidden');
      el.importTextarea.focus();
    });

    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });

    [el.taskModal, el.importModal].forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.add('hidden');
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        el.taskModal.classList.add('hidden');
        el.importModal.classList.add('hidden');
      }
    });

    el.taskForm.addEventListener('submit', handleSaveTask);
    el.importForm.addEventListener('submit', handleImportSubmit);
    el.btnResetDefaults.addEventListener('click', handleResetDefaults);

    // Roulette controls
    el.btnSpin.addEventListener('click', spinRoulette);
    el.btnSpinCenter.addEventListener('click', spinRoulette);
    el.btnSpinFromEmpty.addEventListener('click', spinRoulette);

    el.filterDiscipline.addEventListener('change', (e) => {
      state.filters.discipline = e.target.value;
      saveState();
      renderRoulette();
    });

    el.filterMaxTime.addEventListener('change', (e) => {
      state.filters.maxTime = Number(e.target.value) || 0;
      saveState();
      renderRoulette();
    });

    el.filterWeightMode.addEventListener('change', (e) => {
      state.filters.weightMode = e.target.value;
      saveState();
      renderRoulette();
    });

    // Timer controls
    el.btnTimerToggle.addEventListener('click', () => {
      if (timerRunning) pauseTimer(false);
      else startTimer();
    });
    el.btnTimerPlus5.addEventListener('click', addFiveMinutes);
    el.btnTimerReset.addEventListener('click', resetActiveTimer);
    el.btnCompleteActive.addEventListener('click', () => {
      if (state.activeTaskId) completeTask(state.activeTaskId);
    });
    el.btnReturnToPool.addEventListener('click', returnActiveToPool);

    // Manager filters
    el.searchTasks.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      renderDisciplineGroups();
    });

    el.statusTabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.filters.statusTab = btn.dataset.statusFilter;
        updateStatusTabUI();
        saveState();
        renderDisciplineGroups();
      });
    });

    // Persist elapsed time cleanly if user closes tab while timer is running
    window.addEventListener('beforeunload', () => {
      if (timerRunning) {
        pauseTimer(true);
      }
    });
  }

  // --- Bootstrap ---
  function init() {
    loadState();
    el.searchTasks.value = state.filters.search || '';
    updateStatusTabUI();
    bindEvents();
    renderAll();
  }

  init();
})();
