(function (global) {
  'use strict';

  const DISCIPLINE_PALETTE = [
    { bg: '#6366f1', light: '#818cf8', soft: 'rgba(99, 102, 241, 0.16)', border: 'rgba(129, 140, 248, 0.35)' }, // Indigo
    { bg: '#f43f5e', light: '#fb7185', soft: 'rgba(244, 63, 94, 0.16)', border: 'rgba(251, 113, 133, 0.35)' }, // Rose
    { bg: '#10b981', light: '#34d399', soft: 'rgba(16, 185, 129, 0.16)', border: 'rgba(52, 211, 153, 0.35)' }, // Emerald
    { bg: '#f59e0b', light: '#fbbf24', soft: 'rgba(245, 158, 11, 0.16)', border: 'rgba(251, 191, 36, 0.35)' }, // Amber
    { bg: '#06b6d4', light: '#22d3ee', soft: 'rgba(6, 182, 212, 0.16)', border: 'rgba(34, 211, 238, 0.35)' }, // Cyan
    { bg: '#a855f7', light: '#c084fc', soft: 'rgba(168, 85, 247, 0.16)', border: 'rgba(192, 132, 252, 0.35)' }, // Purple
    { bg: '#ec4899', light: '#f472b6', soft: 'rgba(236, 72, 153, 0.16)', border: 'rgba(244, 114, 182, 0.35)' }, // Pink
    { bg: '#3b82f6', light: '#60a5fa', soft: 'rgba(59, 130, 246, 0.16)', border: 'rgba(96, 165, 250, 0.35)' }, // Blue
  ];

  const DEFAULT_DISCIPLINE_COLORS = {
    PAA: 0,
    CG: 1,
    GABD: 2,
  };

  function createInitialTasks() {
    const raw = [
      // PAA - Lista 3 (sequencial por padrão)
      { id: 'paa-l3-q1', disciplina: 'PAA', nome: 'L3-questão1', tempoMin: 15, dataLimite: '2026-11-30', dependsOn: null },
      { id: 'paa-l3-q2', disciplina: 'PAA', nome: 'L3-questão2', tempoMin: 15, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q1' },
      { id: 'paa-l3-q3', disciplina: 'PAA', nome: 'L3-questão3', tempoMin: 15, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q2' },
      { id: 'paa-l3-q4', disciplina: 'PAA', nome: 'L3-questão4', tempoMin: 15, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q3' },
      { id: 'paa-l3-q5', disciplina: 'PAA', nome: 'L3-questão5', tempoMin: 15, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q4' },
      { id: 'paa-l3-q6', disciplina: 'PAA', nome: 'L3-questão6', tempoMin: 20, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q5' },
      { id: 'paa-l3-q7', disciplina: 'PAA', nome: 'L3-questão7', tempoMin: 20, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q6' },
      { id: 'paa-l3-q8', disciplina: 'PAA', nome: 'L3-questão8', tempoMin: 20, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q7' },
      { id: 'paa-l3-q9', disciplina: 'PAA', nome: 'L3-questão9', tempoMin: 20, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q8' },
      { id: 'paa-l3-q10', disciplina: 'PAA', nome: 'L3-questão10', tempoMin: 20, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q9' },
      { id: 'paa-l3-q11', disciplina: 'PAA', nome: 'L3-questão11', tempoMin: 25, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q10' },
      { id: 'paa-l3-q12', disciplina: 'PAA', nome: 'L3-questão12', tempoMin: 25, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q11' },
      { id: 'paa-l3-q13', disciplina: 'PAA', nome: 'L3-questão13', tempoMin: 25, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q12' },
      { id: 'paa-l3-q14', disciplina: 'PAA', nome: 'L3-questão14', tempoMin: 25, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q13' },
      { id: 'paa-l3-q15', disciplina: 'PAA', nome: 'L3-questão15', tempoMin: 25, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q14' },
      { id: 'paa-l3-q16', disciplina: 'PAA', nome: 'L3-questão16', tempoMin: 25, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q15' },
      { id: 'paa-l3-q17', disciplina: 'PAA', nome: 'L3-questão17', tempoMin: 25, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q16' },
      { id: 'paa-l3-q18', disciplina: 'PAA', nome: 'L3-questão18', tempoMin: 25, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q17' },
      { id: 'paa-l3-q19', disciplina: 'PAA', nome: 'L3-questão19', tempoMin: 25, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q18' },
      { id: 'paa-l3-q20', disciplina: 'PAA', nome: 'L3-questão20', tempoMin: 30, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q19' },
      { id: 'paa-l3-q21', disciplina: 'PAA', nome: 'L3-questão21', tempoMin: 30, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q20' },
      { id: 'paa-l3-q22', disciplina: 'PAA', nome: 'L3-questão22', tempoMin: 30, dataLimite: '2026-11-30', dependsOn: 'paa-l3-q21' },

      // CG
      { id: 'cg-artigo', disciplina: 'CG', nome: 'Artigo', tempoMin: 180, dataLimite: '2026-11-28', dependsOn: null },

      // GABD - Lista 1 (sequencial por padrão)
      { id: 'gabd-l1-1', disciplina: 'GABD', nome: 'List1-1', tempoMin: 60, dataLimite: '2026-12-09', dependsOn: null },
      { id: 'gabd-l1-2', disciplina: 'GABD', nome: 'List1-2', tempoMin: 60, dataLimite: '2026-12-09', dependsOn: 'gabd-l1-1' },
      { id: 'gabd-l1-3', disciplina: 'GABD', nome: 'List1-3', tempoMin: 60, dataLimite: '2026-12-09', dependsOn: 'gabd-l1-2' },
      { id: 'gabd-l1-4', disciplina: 'GABD', nome: 'List1-4', tempoMin: 60, dataLimite: '2026-12-09', dependsOn: 'gabd-l1-3' },
    ];

    return raw.map((t) => ({
      ...t,
      completed: false,
      completedAt: null,
      elapsedSeconds: 0,
      extraSeconds: 0,
    }));
  }

  function getDisciplineColor(disciplina) {
    if (!disciplina) return DISCIPLINE_PALETTE[0];
    if (Object.prototype.hasOwnProperty.call(DEFAULT_DISCIPLINE_COLORS, disciplina)) {
      return DISCIPLINE_PALETTE[DEFAULT_DISCIPLINE_COLORS[disciplina]];
    }
    let hash = 0;
    for (let i = 0; i < disciplina.length; i++) {
      hash = (hash * 31 + disciplina.charCodeAt(i)) >>> 0;
    }
    return DISCIPLINE_PALETTE[hash % DISCIPLINE_PALETTE.length];
  }

  function parseDateBRorISO(str) {
    if (!str) return '';
    const trimmed = str.trim();
    const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brMatch) {
      const dd = brMatch[1].padStart(2, '0');
      const mm = brMatch[2].padStart(2, '0');
      const yyyy = brMatch[3];
      return `${yyyy}-${mm}-${dd}`;
    }
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return trimmed;
    return '';
  }

  function formatDateBR(isoDate) {
    if (!isoDate) return 'Sem prazo';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function getDaysUntil(isoDate) {
    if (!isoDate) return null;
    const parts = isoDate.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(parts[0], parts[1] - 1, parts[2]);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
  }

  function formatDurationMinutes(minutes) {
    const mins = Math.max(0, Math.round(minutes));
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }

  function formatClock(totalSeconds) {
    const negative = totalSeconds < 0;
    const abs = Math.floor(Math.abs(totalSeconds));
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    const prefix = negative ? '+' : '';
    if (h > 0) {
      return `${prefix}${String(h).padStart(2, '0')}:${mm}:${ss}`;
    }
    return `${prefix}${mm}:${ss}`;
  }

  function parseTableText(text, chainByDiscipline) {
    const lines = text.split(/\r?\n/);
    const imported = [];
    const lastIdByDiscipline = {};
    const nowStamp = Date.now();
    let idx = 0;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Split by tab first; fallback to semicolon or comma
      let cols = line.split('\t').map((c) => c.trim());
      if (cols.length < 3) {
        cols = line.split(';').map((c) => c.trim());
      }
      if (cols.length < 3) {
        cols = line.split(',').map((c) => c.trim());
      }
      if (cols.length < 3) continue;

      const [disciplina, nome, tempoStr, dataStr] = cols;
      if (!disciplina || !nome) continue;

      // Skip header row
      const lowerDisc = disciplina.toLowerCase();
      const lowerTempo = (tempoStr || '').toLowerCase();
      if (lowerDisc === 'disciplina' || lowerTempo.includes('tempo')) continue;

      const tempoMin = parseInt(tempoStr.replace(/[^\d]/g, ''), 10);
      if (isNaN(tempoMin) || tempoMin <= 0) continue;

      const id = `imp-${nowStamp}-${idx++}`;
      const dataLimite = parseDateBRorISO(dataStr || '');
      const dependsOn = chainByDiscipline && lastIdByDiscipline[disciplina]
        ? lastIdByDiscipline[disciplina]
        : null;

      imported.push({
        id,
        disciplina,
        nome,
        tempoMin,
        dataLimite,
        dependsOn,
        completed: false,
        completedAt: null,
        elapsedSeconds: 0,
        extraSeconds: 0,
      });

      lastIdByDiscipline[disciplina] = id;
    }

    return imported;
  }

  global.RoletaData = {
    DISCIPLINE_PALETTE,
    createInitialTasks,
    getDisciplineColor,
    parseDateBRorISO,
    formatDateBR,
    getDaysUntil,
    formatDurationMinutes,
    formatClock,
    parseTableText,
  };
})(window);
