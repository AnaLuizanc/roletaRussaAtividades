(function (global) {
  'use strict';

  const CANVAS_WIDTH = 640;
  const CANVAS_HEIGHT = 320;

  const POPUP_CSS = `
    :root {
      --bg: #0b0f19;
      --surface: #151d2e;
      --surface-hover: #1b263b;
      --surface-muted: #0e1422;
      --border: rgba(148, 163, 184, 0.16);
      --border-strong: rgba(148, 163, 184, 0.28);
      --text: #f1f5f9;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --accent: #f43f5e;
      --success: #10b981;
      --warning: #f59e0b;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background:
        radial-gradient(circle at 12% 0%, rgba(99, 102, 241, 0.18), transparent 46%),
        radial-gradient(circle at 88% 100%, rgba(244, 63, 94, 0.12), transparent 44%),
        var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      -webkit-font-smoothing: antialiased;
      user-select: none;
    }

    .hidden {
      display: none !important;
    }

    .pip-shell {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 12px 14px 13px;
      gap: 8px;
      border-top: 3px solid var(--accent-line, var(--primary));
      transition: border-color 0.25s ease, box-shadow 0.25s ease;
    }

    .pip-shell.is-running {
      --accent-line: #34d399;
    }

    .pip-shell.is-overtime {
      --accent-line: #f43f5e;
      box-shadow: inset 0 0 28px rgba(244, 63, 94, 0.18);
    }

    .pip-shell.overtime-pulse {
      animation: pipOvertimePulse 0.75s ease-in-out 4;
    }

    @keyframes pipOvertimePulse {
      0%, 100% { box-shadow: inset 0 0 24px rgba(244, 63, 94, 0.18); }
      50% { box-shadow: inset 0 0 46px rgba(244, 63, 94, 0.55); }
    }

    .pip-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 26px;
    }

    .pip-badges {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      flex-wrap: nowrap;
      overflow: hidden;
    }

    .pip-disc {
      display: inline-flex;
      align-items: center;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      white-space: nowrap;
      flex-shrink: 0;
      background: rgba(99, 102, 241, 0.16);
      color: #a5b4fc;
      border: 1px solid rgba(129, 140, 248, 0.35);
    }

    .pip-status {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 0.69rem;
      font-weight: 700;
      white-space: nowrap;
      background: rgba(148, 163, 184, 0.14);
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }

    .pip-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      flex-shrink: 0;
    }

    .pip-status.running {
      background: rgba(16, 185, 129, 0.16);
      color: #34d399;
      border-color: rgba(52, 211, 153, 0.35);
    }

    .pip-status.running .pip-status-dot {
      animation: pipDotBlink 1.4s ease-in-out infinite;
    }

    .pip-status.paused {
      background: rgba(245, 158, 11, 0.16);
      color: #fbbf24;
      border-color: rgba(251, 191, 36, 0.35);
    }

    .pip-status.overtime {
      background: rgba(239, 68, 68, 0.18);
      color: #fb7185;
      border-color: rgba(248, 113, 113, 0.4);
    }

    .pip-status.overtime .pip-status-dot {
      animation: pipDotBlink 0.9s ease-in-out infinite;
    }

    @keyframes pipDotBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .pip-icon-btn {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-secondary);
      display: grid;
      place-items: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
    }

    .pip-icon-btn:hover {
      background: var(--surface-hover);
      color: var(--text);
      border-color: var(--border-strong);
    }

    .pip-active,
    .pip-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 0;
      gap: 8px;
    }

    .pip-task-title {
      margin: 0;
      font-size: 0.98rem;
      font-weight: 700;
      letter-spacing: -0.015em;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
    }

    .pip-clock-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
      margin: auto 0;
    }

    .pip-clock {
      font-family: var(--font-mono);
      font-size: 2.85rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      color: #ffffff;
    }

    .pip-clock.is-long {
      font-size: 2.25rem;
    }

    .pip-clock.overtime {
      color: #fb7185;
      text-shadow: 0 0 22px rgba(244, 63, 94, 0.35);
    }

    .pip-progress-track {
      width: 100%;
      height: 7px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.16);
      overflow: hidden;
    }

    .pip-progress-fill {
      height: 100%;
      width: 0%;
      border-radius: 999px;
      background: linear-gradient(90deg, #6366f1, #818cf8);
      transition: width 0.28s linear, background 0.2s ease;
    }

    .pip-progress-fill.running {
      background: linear-gradient(90deg, #10b981, #34d399);
    }

    .pip-progress-fill.overtime {
      background: linear-gradient(90deg, #e11d48, #fb7185);
    }

    .pip-meta-row {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 0.72rem;
      color: var(--text-secondary);
    }

    .pip-meta-mono {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--text-muted);
    }

    .pip-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .pip-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      border: 1px solid transparent;
      border-radius: 9px;
      padding: 8px 11px;
      font-family: inherit;
      font-size: 0.79rem;
      font-weight: 700;
      cursor: pointer;
      color: var(--text);
      background: var(--surface-hover);
      white-space: nowrap;
      transition: transform 0.12s ease, background 0.15s ease, filter 0.15s ease;
    }

    .pip-btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .pip-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .pip-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .pip-btn-primary {
      flex: 1.25;
      background: var(--primary);
      color: #fff;
      box-shadow: 0 5px 14px rgba(99, 102, 241, 0.3);
    }

    .pip-btn-primary:hover:not(:disabled) {
      background: var(--primary-hover);
    }

    .pip-btn-accent {
      flex: 1.2;
      background: linear-gradient(135deg, #f43f5e, #e11d48);
      color: #fff;
      box-shadow: 0 5px 14px rgba(244, 63, 94, 0.3);
    }

    .pip-btn-accent:hover:not(:disabled) {
      filter: brightness(1.08);
    }

    .pip-btn-secondary {
      background: var(--surface-hover);
      border-color: var(--border-strong);
      color: var(--text);
    }

    .pip-btn-secondary:hover:not(:disabled) {
      background: #24324d;
    }

    .pip-btn-ghost {
      background: rgba(255, 255, 255, 0.03);
      border-color: var(--border);
      color: var(--text-secondary);
      padding: 8px 9px;
    }

    .pip-btn-ghost:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text);
    }

    .pip-btn-success {
      flex: 1;
      background: var(--success);
      color: #042f2e;
      box-shadow: 0 5px 14px rgba(16, 185, 129, 0.25);
    }

    .pip-btn-success:hover:not(:disabled) {
      background: #34d399;
    }

    .pip-empty-center {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 6px;
      padding: 6px 4px;
    }

    .pip-empty-title {
      margin: 0;
      font-size: 0.96rem;
      font-weight: 700;
      color: var(--text);
    }

    .pip-empty-sub {
      margin: 0;
      font-size: 0.78rem;
      color: var(--text-secondary);
    }

    .pip-standalone-tip {
      font-size: 0.68rem;
      color: var(--text-muted);
      text-align: center;
      line-height: 1.3;
      padding-top: 2px;
      border-top: 1px solid rgba(148, 163, 184, 0.1);
    }

    @media (max-height: 210px) {
      .pip-shell { padding: 8px 10px 9px; gap: 5px; }
      .pip-clock { font-size: 2.25rem; }
      .pip-clock.is-long { font-size: 1.85rem; }
      .pip-btn { padding: 6px 8px; font-size: 0.74rem; }
      .pip-standalone-tip { display: none; }
    }

    @media (max-height: 160px) {
      .pip-meta-row { display: none; }
      .pip-task-title { font-size: 0.84rem; }
      .pip-clock { font-size: 1.85rem; }
      .pip-btn-label-hide-sm { display: none; }
    }

    @media (max-width: 285px) {
      .pip-btn-label-hide-sm { display: none; }
      .pip-clock { font-size: 2.15rem; }
      .pip-clock.is-long { font-size: 1.75rem; }
    }
  `;

  class FloatingTimerController {
    constructor() {
      this.callbacks = null;
      this.mode = 'none'; // 'none' | 'document-pip' | 'video-pip' | 'popup-window' | 'firefox-bridge'
      this.bridgeBackgrounded = false;

      // Interactive window (Document PiP or standalone window.open)
      this.childWin = null;
      this.childDom = null;
      this.childTickInterval = null;

      // Video PiP / Canvas stream resources
      this.canvas = null;
      this.ctx = null;
      this.stream = null;
      this.hiddenVideo = null;
      this.activeVideo = null;
      this.lastCanvasKey = '';
      this.suppressVideoEvents = false;
      this.pauseFlushTimeout = null;
      this.warmupTimeout = null;

      // Fallback modal DOM refs
      this.modalEl = null;
      this.fallbackVideoEl = null;
      this.btnCloseModal = null;
      this.btnKeepBackground = null;
      this.btnOpenPopupWindow = null;
      this.btnStopFallback = null;

      this.boundOnLeaveVideoPip = this._handleLeaveVideoPip.bind(this);
      this.boundOnVideoPlay = this._handleVideoPlay.bind(this);
      this.boundOnVideoPause = this._handleVideoPause.bind(this);
      this.boundOnMainUnload = this._handleMainUnload.bind(this);
    }

    init(callbacks) {
      this.callbacks = callbacks;

      this.modalEl = document.getElementById('pipFallbackModal');
      this.fallbackVideoEl = document.getElementById('pipFallbackVideo');
      this.btnCloseModal = document.getElementById('btnClosePipModal');
      this.btnKeepBackground = document.getElementById('btnKeepPipBackground');
      this.btnOpenPopupWindow = document.getElementById('btnOpenPopupWindow');
      this.btnStopFallback = document.getElementById('btnStopPipFallback');

      if (this.btnCloseModal) {
        this.btnCloseModal.addEventListener('click', () => this.close());
      }
      if (this.btnStopFallback) {
        this.btnStopFallback.addEventListener('click', () => this.close());
      }
      if (this.btnKeepBackground) {
        this.btnKeepBackground.addEventListener('click', () => this._minimizeBridgeModal());
      }
      if (this.btnOpenPopupWindow) {
        this.btnOpenPopupWindow.addEventListener('click', () => {
          this._stopCanvasStream(true);
          this._hideBridgeModalFully();
          this.mode = 'none';
          this.bridgeBackgrounded = false;
          this._openStandalonePopup();
        });
      }
      if (this.modalEl) {
        this.modalEl.addEventListener('click', (e) => {
          if (e.target === this.modalEl && !this.bridgeBackgrounded) {
            this.close();
          }
        });
      }

      window.addEventListener('beforeunload', this.boundOnMainUnload);
      window.addEventListener('pagehide', this.boundOnMainUnload);

      this._emitState();
    }

    getState() {
      return {
        open: this.mode !== 'none',
        mode: this.mode,
        backgrounded: this.bridgeBackgrounded,
      };
    }

    isOpen() {
      return this.mode !== 'none';
    }

    supportsDocumentPiP() {
      return Boolean(
        window.documentPictureInPicture &&
        typeof window.documentPictureInPicture.requestWindow === 'function'
      );
    }

    supportsVideoPiP() {
      return Boolean(
        document.pictureInPictureEnabled &&
        typeof HTMLVideoElement !== 'undefined' &&
        typeof HTMLVideoElement.prototype.requestPictureInPicture === 'function' &&
        this.supportsCanvasStream()
      );
    }

    supportsCanvasStream() {
      if (typeof HTMLCanvasElement === 'undefined') return false;
      return Boolean(
        typeof HTMLCanvasElement.prototype.captureStream === 'function' ||
        typeof HTMLCanvasElement.prototype.mozCaptureStream === 'function'
      );
    }

    async toggle() {
      if (this.mode === 'firefox-bridge') {
        if (this.bridgeBackgrounded) {
          this._restoreBridgeModal();
          return;
        }
        this.close();
        return;
      }

      if (this.mode !== 'none') {
        this.close();
        return;
      }

      await this.open();
    }

    async open() {
      // Tier 1: Document Picture-in-Picture (Interactive + Always-on-Top outside browser)
      if (this.supportsDocumentPiP()) {
        try {
          const pipWin = await window.documentPictureInPicture.requestWindow({
            width: 356,
            height: 256,
            disallowReturnToOpener: false,
          });
          this._setupInteractiveWindow(pipWin, 'document-pip');
          this._notify('Pop-up flutuante ativo! Ele permanece visível mesmo fora do navegador.', 'success');
          return;
        } catch (_) {
          // Fall through cleanly to Tier 2 (e.g. if restricted on file://)
        }
      }

      // Tier 2: Canvas-to-Video Picture-in-Picture (Always-on-Top outside browser)
      if (this.supportsVideoPiP()) {
        const opened = await this._openVideoPiP();
        if (opened) {
          this._notify('Cronômetro fixado em Picture-in-Picture! Permanece na tela mesmo fora do navegador.', 'success');
          return;
        }
      }

      // Tier 3: Firefox native PiP bridge modal (Always-on-Top via Firefox PiP + Interactive Popup option)
      if (this.supportsCanvasStream() && this.modalEl && this.fallbackVideoEl) {
        const started = await this._openFirefoxBridge();
        if (started) return;
      }

      // Final fallback: Interactive standalone popup window
      this._openStandalonePopup();
    }

    close() {
      if (this.mode === 'document-pip' || this.mode === 'popup-window') {
        const win = this.childWin;
        this._teardownInteractiveWindow();
        if (win && !win.closed) {
          try { win.close(); } catch (_) {}
        }
      } else if (this.mode === 'video-pip') {
        const wasInPip = document.pictureInPictureElement && document.pictureInPictureElement === this.activeVideo;
        this._stopCanvasStream(true);
        if (wasInPip && typeof document.exitPictureInPicture === 'function') {
          document.exitPictureInPicture().catch(() => {});
        }
      } else if (this.mode === 'firefox-bridge') {
        this._stopCanvasStream(true);
        this._hideBridgeModalFully();
      }

      this.mode = 'none';
      this.bridgeBackgrounded = false;
      this._emitState();
    }

    handleEscape() {
      if (this.mode === 'firefox-bridge' && !this.bridgeBackgrounded) {
        this.close();
        return true;
      }
      return false;
    }

    sync(snapshot) {
      if (!snapshot) return;

      if ((this.mode === 'document-pip' || this.mode === 'popup-window') && this.childWin) {
        if (this.childWin.closed) {
          this._teardownInteractiveWindow();
          this.mode = 'none';
          this._emitState();
          return;
        }
        this._renderInteractiveDom(snapshot);
      }

      if (this.mode === 'video-pip' || this.mode === 'firefox-bridge') {
        const repainted = this._renderCanvasIfNeeded(snapshot, false);
        if (this.mode === 'video-pip') {
          this._syncVideoPlaybackState(snapshot, repainted);
          this._updateMediaSession(snapshot);
        }
      }
    }

    notifyOvertime() {
      if ((this.mode === 'document-pip' || this.mode === 'popup-window') && this.childDom) {
        const shell = this.childDom.shell;
        shell.classList.remove('overtime-pulse');
        void shell.offsetWidth;
        shell.classList.add('overtime-pulse');
      }
      if (this.mode === 'video-pip' || this.mode === 'firefox-bridge') {
        const snap = this.callbacks ? this.callbacks.getSnapshot() : null;
        if (snap) this._renderCanvasIfNeeded(snap, true);
      }
    }

    // --- Interactive Window (Tier 1 Document PiP & Tier 3 Standalone Popup) ---
    _openStandalonePopup() {
      const features = 'popup=yes,width=364,height=284,resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no';
      let popupWin = null;
      try {
        popupWin = window.open('', 'roletaEstudosTimerPopup', features);
      } catch (_) {}

      if (!popupWin) {
        this._notify('O navegador bloqueou o pop-up. Libere pop-ups para esta página e tente novamente.', 'warning');
        return;
      }

      try {
        popupWin.document.open();
        popupWin.document.write(
          '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Cronômetro • Roleta de Estudos</title></head><body></body></html>'
        );
        popupWin.document.close();
      } catch (_) {}

      this._setupInteractiveWindow(popupWin, 'popup-window');
      try { popupWin.focus(); } catch (_) {}
      this._notify('Mini janela aberta! Dica: clique com o botão direito na barra dela → Sempre acima.', 'info');
    }

    _setupInteractiveWindow(win, modeName) {
      this._teardownInteractiveWindow();
      this.childWin = win;
      this.mode = modeName;

      const doc = win.document;
      doc.title = 'Cronômetro • Roleta de Estudos';

      // Copy Google Fonts stylesheet links if available (non-blocking)
      document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]').forEach((link) => {
        try {
          const clone = doc.createElement('link');
          clone.rel = 'stylesheet';
          clone.href = link.href;
          doc.head.appendChild(clone);
        } catch (_) {}
      });

      const styleEl = doc.createElement('style');
      styleEl.textContent = POPUP_CSS;
      doc.head.appendChild(styleEl);

      const isStandalone = modeName === 'popup-window';

      doc.body.innerHTML = `
        <div class="pip-shell" id="pipShell">
          <div class="pip-top">
            <div class="pip-badges">
              <span class="pip-disc" id="pipDisc">Roleta</span>
              <span class="pip-status" id="pipStatus">
                <span class="pip-status-dot"></span>
                <span id="pipStatusText">Aguardando</span>
              </span>
            </div>
            <button type="button" class="pip-icon-btn" id="pipBtnFocus" title="Voltar para a janela principal" aria-label="Voltar para a janela principal">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </button>
          </div>

          <div class="pip-active hidden" id="pipActive">
            <h2 class="pip-task-title" id="pipTaskTitle">Atividade</h2>
            <div class="pip-clock-block">
              <div class="pip-clock" id="pipClock">00:00</div>
              <div class="pip-progress-track" aria-hidden="true">
                <div class="pip-progress-fill" id="pipProgressFill"></div>
              </div>
              <div class="pip-meta-row">
                <span class="pip-meta-mono" id="pipElapsed">Trabalhado: 00:00</span>
                <span id="pipSublabel">Estimado: 15 min</span>
              </div>
            </div>
            <div class="pip-controls">
              <button type="button" class="pip-btn pip-btn-primary" id="pipBtnToggle">
                <svg id="pipIconPlay" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <polygon points="6 4 20 12 6 20 6 4"></polygon>
                </svg>
                <svg id="pipIconPause" class="hidden" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
                <span id="pipToggleLabel">Iniciar</span>
              </button>
              <button type="button" class="pip-btn pip-btn-secondary" id="pipBtnPlus5" title="Adicionar 5 minutos">+5m</button>
              <button type="button" class="pip-btn pip-btn-ghost" id="pipBtnReset" title="Zerar cronômetro">↺</button>
              <button type="button" class="pip-btn pip-btn-success" id="pipBtnComplete" title="Concluir atividade">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span class="pip-btn-label-hide-sm">Concluir</span>
              </button>
            </div>
          </div>

          <div class="pip-empty" id="pipEmpty">
            <div class="pip-empty-center">
              <h2 class="pip-empty-title">Nenhuma atividade ativa</h2>
              <p class="pip-empty-sub" id="pipEmptySub">Gire a roleta para sortear a próxima tarefa</p>
            </div>
            <div class="pip-controls">
              <button type="button" class="pip-btn pip-btn-accent" id="pipBtnDraw">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <span>Sortear próxima</span>
              </button>
              <button type="button" class="pip-btn pip-btn-secondary" id="pipBtnGoMain">Abrir roleta</button>
            </div>
          </div>

          ${isStandalone ? '<div class="pip-standalone-tip">Dica: clique com o botão direito na barra superior → Sempre acima</div>' : ''}
        </div>
      `;

      this.childDom = {
        shell: doc.getElementById('pipShell'),
        disc: doc.getElementById('pipDisc'),
        status: doc.getElementById('pipStatus'),
        statusText: doc.getElementById('pipStatusText'),
        btnFocus: doc.getElementById('pipBtnFocus'),
        active: doc.getElementById('pipActive'),
        empty: doc.getElementById('pipEmpty'),
        emptySub: doc.getElementById('pipEmptySub'),
        taskTitle: doc.getElementById('pipTaskTitle'),
        clock: doc.getElementById('pipClock'),
        progressFill: doc.getElementById('pipProgressFill'),
        elapsed: doc.getElementById('pipElapsed'),
        sublabel: doc.getElementById('pipSublabel'),
        btnToggle: doc.getElementById('pipBtnToggle'),
        iconPlay: doc.getElementById('pipIconPlay'),
        iconPause: doc.getElementById('pipIconPause'),
        toggleLabel: doc.getElementById('pipToggleLabel'),
        btnPlus5: doc.getElementById('pipBtnPlus5'),
        btnReset: doc.getElementById('pipBtnReset'),
        btnComplete: doc.getElementById('pipBtnComplete'),
        btnDraw: doc.getElementById('pipBtnDraw'),
        btnGoMain: doc.getElementById('pipBtnGoMain'),
      };

      const cb = this.callbacks;
      this.childDom.btnFocus.addEventListener('click', () => cb && cb.onFocusMain());
      this.childDom.btnGoMain.addEventListener('click', () => cb && cb.onFocusMain());
      this.childDom.btnToggle.addEventListener('click', () => cb && cb.onTogglePlay());
      this.childDom.btnPlus5.addEventListener('click', () => cb && cb.onAddFive());
      this.childDom.btnReset.addEventListener('click', () => cb && cb.onReset());
      this.childDom.btnComplete.addEventListener('click', () => cb && cb.onComplete());
      this.childDom.btnDraw.addEventListener('click', () => cb && cb.onQuickDraw());

      doc.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target.tagName !== 'BUTTON') {
          e.preventDefault();
          if (cb) cb.onTogglePlay();
        }
      });

      // Keep the timer ticking smoothly even when the main browser window is minimized
      this.childTickInterval = win.setInterval(() => {
        if (this.callbacks) this.callbacks.onTickRequest();
      }, 250);

      const onClosed = () => {
        if (this.childWin !== win) return;
        this._teardownInteractiveWindow();
        this.mode = 'none';
        this._emitState();
      };
      win.addEventListener('pagehide', onClosed, { once: true });
      win.addEventListener('beforeunload', onClosed, { once: true });

      if (this.callbacks) {
        this._renderInteractiveDom(this.callbacks.getSnapshot());
      }
      this._emitState();
    }

    _teardownInteractiveWindow() {
      if (this.childTickInterval && this.childWin) {
        try { this.childWin.clearInterval(this.childTickInterval); } catch (_) {}
      }
      this.childTickInterval = null;
      this.childWin = null;
      this.childDom = null;
    }

    _renderInteractiveDom(snap) {
      const dom = this.childDom;
      if (!dom) return;

      dom.shell.classList.toggle('is-running', snap.hasTask && snap.isRunning && !snap.isOvertime);
      dom.shell.classList.toggle('is-overtime', snap.hasTask && snap.isOvertime);

      if (!snap.hasTask) {
        dom.active.classList.add('hidden');
        dom.empty.classList.remove('hidden');

        dom.disc.textContent = 'Roleta';
        dom.disc.style.background = 'rgba(99, 102, 241, 0.16)';
        dom.disc.style.color = '#a5b4fc';
        dom.disc.style.borderColor = 'rgba(129, 140, 248, 0.35)';
        dom.shell.style.removeProperty('--accent-line');

        dom.status.className = 'pip-status';
        dom.statusText.textContent = 'Aguardando';

        if (snap.eligibleCount > 0) {
          dom.emptySub.textContent = snap.eligibleCount === 1
            ? '1 atividade elegível na roleta'
            : `${snap.eligibleCount} atividades elegíveis na roleta`;
          dom.btnDraw.disabled = false;
        } else {
          dom.emptySub.textContent = 'Nenhuma atividade elegível no momento';
          dom.btnDraw.disabled = true;
        }

        if (this.childWin && !this.childWin.closed) {
          this.childWin.document.title = 'Cronômetro • Roleta de Estudos';
        }
        return;
      }

      dom.empty.classList.add('hidden');
      dom.active.classList.remove('hidden');

      dom.disc.textContent = snap.disciplina;
      dom.disc.style.background = snap.color.soft;
      dom.disc.style.color = snap.color.light;
      dom.disc.style.borderColor = snap.color.border;
      if (!snap.isRunning && !snap.isOvertime) {
        dom.shell.style.setProperty('--accent-line', snap.color.light);
      } else {
        dom.shell.style.removeProperty('--accent-line');
      }

      dom.status.className = `pip-status ${snap.statusKind !== 'idle' ? snap.statusKind : ''}`;
      dom.statusText.textContent = snap.statusLabel;

      dom.taskTitle.textContent = snap.nome;
      dom.taskTitle.title = `${snap.disciplina} • ${snap.nome}`;

      dom.clock.textContent = snap.clockText;
      dom.clock.classList.toggle('overtime', snap.isOvertime);
      dom.clock.classList.toggle('is-long', snap.clockText.length > 6);

      dom.progressFill.style.width = `${snap.progressPct}%`;
      dom.progressFill.classList.toggle('running', snap.isRunning && !snap.isOvertime);
      dom.progressFill.classList.toggle('overtime', snap.isOvertime);

      dom.elapsed.textContent = `Trabalhado: ${snap.elapsedText}`;
      dom.sublabel.textContent = snap.isOvertime
        ? 'Hora extra'
        : snap.extraMin > 0
          ? `Est.: ${snap.tempoMin}m (+${snap.extraMin}m)`
          : `Est.: ${snap.tempoMin} min`;

      dom.iconPlay.classList.toggle('hidden', snap.isRunning);
      dom.iconPause.classList.toggle('hidden', !snap.isRunning);
      dom.toggleLabel.textContent = snap.isRunning
        ? 'Pausar'
        : (snap.elapsedSeconds > 0 ? 'Continuar' : 'Iniciar');

      if (this.childWin && !this.childWin.closed) {
        this.childWin.document.title = `${snap.clockText} • ${snap.nome}`;
      }
    }

    // --- Tier 2: Canvas-to-Video Picture-in-Picture ---
    _ensureHiddenVideo() {
      if (this.hiddenVideo && document.body.contains(this.hiddenVideo)) {
        return this.hiddenVideo;
      }
      const video = document.createElement('video');
      video.className = 'pip-hidden-video';
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      document.body.appendChild(video);
      this.hiddenVideo = video;
      return video;
    }

    _ensureCanvas() {
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.ctx = this.canvas.getContext('2d');
      }
      return this.canvas;
    }

    async _startCanvasStreamOn(video) {
      this._stopCanvasStream(false);
      const canvas = this._ensureCanvas();
      const snap = this.callbacks ? this.callbacks.getSnapshot() : null;
      this.lastCanvasKey = '';
      if (snap) this._drawCanvas(snap);

      const stream = typeof canvas.captureStream === 'function'
        ? canvas.captureStream(10)
        : canvas.mozCaptureStream(10);

      this.stream = stream;
      this.activeVideo = video;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;

      this.suppressVideoEvents = true;
      try {
        await video.play();
      } finally {
        this.suppressVideoEvents = false;
      }

      // Draw a warm-up keyframe right after playback starts so the PiP window never starts blank
      clearTimeout(this.warmupTimeout);
      this.warmupTimeout = setTimeout(() => {
        if (this.mode === 'video-pip' || this.mode === 'firefox-bridge') {
          const latest = this.callbacks ? this.callbacks.getSnapshot() : null;
          if (latest) this._drawCanvas(latest);
        }
      }, 90);
    }

    _stopCanvasStream(clearMediaSession) {
      clearTimeout(this.pauseFlushTimeout);
      clearTimeout(this.warmupTimeout);
      this.pauseFlushTimeout = null;
      this.warmupTimeout = null;

      if (this.activeVideo) {
        this.activeVideo.removeEventListener('leavepictureinpicture', this.boundOnLeaveVideoPip);
        this.activeVideo.removeEventListener('play', this.boundOnVideoPlay);
        this.activeVideo.removeEventListener('pause', this.boundOnVideoPause);
        try {
          this.suppressVideoEvents = true;
          this.activeVideo.pause();
          this.activeVideo.srcObject = null;
        } catch (_) {} finally {
          this.suppressVideoEvents = false;
        }
        this.activeVideo = null;
      }

      if (this.stream) {
        try {
          this.stream.getTracks().forEach((track) => track.stop());
        } catch (_) {}
        this.stream = null;
      }

      this.lastCanvasKey = '';

      if (clearMediaSession && 'mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
          navigator.mediaSession.playbackState = 'none';
        } catch (_) {}
      }
    }

    async _openVideoPiP() {
      const video = this._ensureHiddenVideo();
      try {
        await this._startCanvasStreamOn(video);
        video.addEventListener('leavepictureinpicture', this.boundOnLeaveVideoPip);
        video.addEventListener('play', this.boundOnVideoPlay);
        video.addEventListener('pause', this.boundOnVideoPause);

        await video.requestPictureInPicture();

        this.mode = 'video-pip';
        const snap = this.callbacks ? this.callbacks.getSnapshot() : null;
        if (snap) {
          this._drawCanvas(snap);
          this._setupMediaSession(snap);
          this._syncVideoPlaybackState(snap, true);
        }
        this._emitState();
        return true;
      } catch (_) {
        this._stopCanvasStream(true);
        return false;
      }
    }

    _handleLeaveVideoPip() {
      if (this.mode !== 'video-pip') return;
      this._stopCanvasStream(true);
      this.mode = 'none';
      this._emitState();
    }

    _handleVideoPlay() {
      if (this.suppressVideoEvents || this.mode !== 'video-pip' || !this.callbacks) return;
      const snap = this.callbacks.getSnapshot();
      if (!snap.hasTask) {
        if (snap.eligibleCount > 0) {
          this.callbacks.onQuickDraw();
        }
        return;
      }
      if (!snap.isRunning) {
        this.callbacks.onTogglePlay();
      }
    }

    _handleVideoPause() {
      if (this.suppressVideoEvents || this.mode !== 'video-pip' || !this.callbacks) return;
      const snap = this.callbacks.getSnapshot();
      if (snap.hasTask && snap.isRunning) {
        this.callbacks.onTogglePlay();
      }
    }

    _setupMediaSession(snap) {
      if (!('mediaSession' in navigator)) return;
      try {
        navigator.mediaSession.setActionHandler('play', () => {
          if (!this.callbacks) return;
          const current = this.callbacks.getSnapshot();
          if (!current.hasTask && current.eligibleCount > 0) {
            this.callbacks.onQuickDraw();
            return;
          }
          if (current.hasTask && !current.isRunning) {
            this.callbacks.onTogglePlay();
          }
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          if (!this.callbacks) return;
          const current = this.callbacks.getSnapshot();
          if (current.hasTask && current.isRunning) {
            this.callbacks.onTogglePlay();
          }
        });
        this._updateMediaSession(snap);
      } catch (_) {}
    }

    _updateMediaSession(snap) {
      if (!('mediaSession' in navigator)) return;
      try {
        if (typeof MediaMetadata !== 'undefined') {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: snap.hasTask ? `${snap.clockText} • ${snap.nome}` : 'Roleta de Estudos',
            artist: snap.hasTask ? snap.disciplina : 'Cronômetro',
            album: 'Roleta de Estudos',
          });
        }
        navigator.mediaSession.playbackState = snap.hasTask && snap.isRunning ? 'playing' : 'paused';
      } catch (_) {}
    }

    _syncVideoPlaybackState(snap, repainted = false) {
      const video = this.activeVideo;
      if (!video || this.mode !== 'video-pip') return;

      const shouldPlay = Boolean(snap.hasTask && snap.isRunning);
      clearTimeout(this.pauseFlushTimeout);

      if (shouldPlay) {
        if (video.paused) {
          this.suppressVideoEvents = true;
          video.play().catch(() => {}).finally(() => {
            this.suppressVideoEvents = false;
          });
        }
      } else if (!video.paused || repainted) {
        // Briefly keep playing for a frame so the updated paused state flushes to the PiP display
        if (video.paused) {
          this.suppressVideoEvents = true;
          video.play().catch(() => {}).finally(() => {
            this.suppressVideoEvents = false;
          });
        }
        this.pauseFlushTimeout = setTimeout(() => {
          if (this.mode !== 'video-pip' || !this.activeVideo) return;
          const latest = this.callbacks ? this.callbacks.getSnapshot() : null;
          if (latest && latest.hasTask && latest.isRunning) return;
          this.suppressVideoEvents = true;
          try { this.activeVideo.pause(); } catch (_) {} finally {
            this.suppressVideoEvents = false;
          }
        }, 160);
      }
    }

    // --- Tier 3: Firefox Native PiP Bridge Modal ---
    async _openFirefoxBridge() {
      try {
        this.modalEl.classList.remove('hidden', 'pip-modal-backgrounded');
        this.modalEl.removeAttribute('aria-hidden');
        this.bridgeBackgrounded = false;
        this.mode = 'firefox-bridge';
        await this._startCanvasStreamOn(this.fallbackVideoEl);
        this._emitState();
        return true;
      } catch (_) {
        this._stopCanvasStream(false);
        this._hideBridgeModalFully();
        this.mode = 'none';
        this.bridgeBackgrounded = false;
        this._emitState();
        return false;
      }
    }

    _minimizeBridgeModal() {
      if (this.mode !== 'firefox-bridge' || !this.modalEl) return;
      // Keep the video element rendered offscreen (not display:none) so Firefox keeps PiP alive
      this.modalEl.classList.add('pip-modal-backgrounded');
      this.modalEl.setAttribute('aria-hidden', 'true');
      this.bridgeBackgrounded = true;
      this._emitState();
      this._notify('Transmissão do cronômetro mantida ativa para o Picture-in-Picture.', 'info');
    }

    _restoreBridgeModal() {
      if (this.mode !== 'firefox-bridge' || !this.modalEl) return;
      this.modalEl.classList.remove('pip-modal-backgrounded', 'hidden');
      this.modalEl.removeAttribute('aria-hidden');
      this.bridgeBackgrounded = false;
      this._emitState();
    }

    _hideBridgeModalFully() {
      if (!this.modalEl) return;
      this.modalEl.classList.remove('pip-modal-backgrounded');
      this.modalEl.classList.add('hidden');
      this.modalEl.removeAttribute('aria-hidden');
    }

    // --- Canvas Renderer for Video PiP ---
    _renderCanvasIfNeeded(snap, force) {
      const key = `${snap.hasTask}|${snap.taskId}|${snap.clockText}|${snap.elapsedText}|${snap.statusLabel}|${snap.isRunning}|${snap.isOvertime}|${Math.round(snap.progressPct)}|${snap.eligibleCount}|${snap.extraMin}`;
      if (!force && key === this.lastCanvasKey) return false;
      this.lastCanvasKey = key;
      this._drawCanvas(snap);
      return true;
    }

    _drawCanvas(snap) {
      const ctx = this.ctx;
      if (!ctx) return;

      const W = CANVAS_WIDTH;
      const H = CANVAS_HEIGHT;

      ctx.save();
      ctx.clearRect(0, 0, W, H);

      // Rich dark background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#0f1628');
      bgGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Ambient top glow
      const glowColor = !snap.hasTask
        ? 'rgba(99, 102, 241, 0.2)'
        : snap.isOvertime
          ? 'rgba(244, 63, 94, 0.28)'
          : snap.isRunning
            ? 'rgba(16, 185, 129, 0.22)'
            : 'rgba(99, 102, 241, 0.22)';
      const rad = ctx.createRadialGradient(W * 0.5, 0, 20, W * 0.5, 0, W * 0.72);
      rad.addColorStop(0, glowColor);
      rad.addColorStop(1, 'rgba(11, 15, 25, 0)');
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, W, H);

      // Top colored accent bar
      const accentColor = !snap.hasTask
        ? '#6366f1'
        : snap.isOvertime
          ? '#f43f5e'
          : snap.isRunning
            ? '#34d399'
            : snap.color.light;
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, 0, W, 7);

      if (!snap.hasTask) {
        this._drawPill(ctx, 28, 26, 'ROLETA DE ESTUDOS', 'rgba(99,102,241,0.18)', 'rgba(129,140,248,0.4)', '#a5b4fc', 'left');
        this._drawPill(ctx, W - 28, 26, 'AGUARDANDO', 'rgba(148,163,184,0.14)', 'rgba(148,163,184,0.3)', '#94a3b8', 'right');

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '700 28px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Nenhuma atividade ativa', W / 2, 126);

        ctx.fillStyle = '#475569';
        ctx.font = '700 72px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText('--:--', W / 2, 202);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 19px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        const sub = snap.eligibleCount > 0
          ? `${snap.eligibleCount} atividade(s) disponível(is) na roleta`
          : 'Todas as atividades concluídas!';
        ctx.fillText(sub, W / 2, 276);

        ctx.restore();
        return;
      }

      // Top pills: discipline & status
      this._drawPill(ctx, 28, 24, snap.disciplina, snap.color.soft, snap.color.border, snap.color.light, 'left');

      let stBg = 'rgba(148,163,184,0.15)';
      let stBorder = 'rgba(148,163,184,0.3)';
      let stColor = '#cbd5e1';
      let stText = snap.statusLabel.toUpperCase();
      if (snap.statusKind === 'running') {
        stBg = 'rgba(16,185,129,0.18)';
        stBorder = 'rgba(52,211,153,0.42)';
        stColor = '#34d399';
        stText = `● ${stText}`;
      } else if (snap.statusKind === 'paused') {
        stBg = 'rgba(245,158,11,0.18)';
        stBorder = 'rgba(251,191,36,0.42)';
        stColor = '#fbbf24';
        stText = `⏸ ${stText}`;
      } else if (snap.statusKind === 'overtime') {
        stBg = 'rgba(239,68,68,0.22)';
        stBorder = 'rgba(248,113,113,0.5)';
        stColor = '#fb7185';
        stText = `▲ ${stText}`;
      }
      this._drawPill(ctx, W - 28, 24, stText, stBg, stBorder, stColor, 'right');

      // Task Title (auto-truncated to fit cleanly)
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 28px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const fittedTitle = this._fitText(ctx, snap.nome, W - 64);
      ctx.fillText(fittedTitle, W / 2, 92);

      // Giant Monospace Clock
      const clockSize = snap.clockText.length > 6 ? 76 : 94;
      ctx.font = `700 ${clockSize}px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillStyle = snap.isOvertime ? '#fb7185' : (snap.isRunning ? '#ffffff' : '#e2e8f0');
      ctx.shadowColor = snap.isOvertime
        ? 'rgba(244, 63, 94, 0.45)'
        : snap.isRunning
          ? 'rgba(52, 211, 153, 0.25)'
          : 'rgba(0, 0, 0, 0)';
      ctx.shadowBlur = snap.isOvertime ? 24 : 16;
      ctx.fillText(snap.clockText, W / 2, 178);
      ctx.shadowBlur = 0;

      // Progress Bar
      const barX = 36;
      const barY = 238;
      const barW = W - 72;
      const barH = 12;
      this._fillRoundedRect(ctx, barX, barY, barW, barH, 6, 'rgba(148, 163, 184, 0.18)');

      const fillPct = Math.max(0, Math.min(100, snap.progressPct));
      if (fillPct > 0) {
        const fillW = Math.max(12, (barW * fillPct) / 100);
        const barGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
        if (snap.isOvertime) {
          barGrad.addColorStop(0, '#e11d48');
          barGrad.addColorStop(1, '#fb7185');
        } else if (snap.isRunning) {
          barGrad.addColorStop(0, '#10b981');
          barGrad.addColorStop(1, '#34d399');
        } else {
          barGrad.addColorStop(0, '#6366f1');
          barGrad.addColorStop(1, '#818cf8');
        }
        this._fillRoundedRect(ctx, barX, barY, fillW, barH, 6, barGrad);
      }

      // Footer Info
      ctx.textBaseline = 'middle';
      ctx.font = '600 18px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText(`Trabalhado: ${snap.elapsedText}`, barX, 282);

      ctx.font = '600 18px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = snap.isOvertime ? '#fda4af' : '#94a3b8';
      ctx.textAlign = 'right';
      const rightMeta = snap.isOvertime
        ? 'Tempo excedido (hora extra)'
        : snap.extraMin > 0
          ? `Estimado: ${snap.tempoMin} min (+${snap.extraMin}m)`
          : `Estimado: ${snap.tempoMin} min`;
      ctx.fillText(rightMeta, W - barX, 282);

      ctx.restore();
    }

    _drawPill(ctx, anchorX, y, label, bg, border, color, align) {
      ctx.save();
      ctx.font = '700 16px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const padX = 14;
      const height = 34;
      const textWidth = ctx.measureText(label).width;
      const width = textWidth + padX * 2;
      const x = align === 'right' ? anchorX - width : anchorX;

      this._fillRoundedRect(ctx, x, y, width, height, height / 2, bg);
      this._strokeRoundedRect(ctx, x, y, width, height, height / 2, border, 1.5);

      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + width / 2, y + height / 2 + 0.5);
      ctx.restore();
    }

    _fitText(ctx, text, maxWidth) {
      if (ctx.measureText(text).width <= maxWidth) return text;
      let trimmed = text;
      while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
        trimmed = trimmed.slice(0, -1);
      }
      return `${trimmed}…`;
    }

    _roundedRectPath(ctx, x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    _fillRoundedRect(ctx, x, y, w, h, r, fillStyle) {
      this._roundedRectPath(ctx, x, y, w, h, r);
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }

    _strokeRoundedRect(ctx, x, y, w, h, r, strokeStyle, lineWidth) {
      this._roundedRectPath(ctx, x, y, w, h, r);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }

    _handleMainUnload() {
      if (this.childWin && !this.childWin.closed) {
        try { this.childWin.close(); } catch (_) {}
      }
      this._stopCanvasStream(true);
    }

    _emitState() {
      if (this.callbacks && typeof this.callbacks.onStateChange === 'function') {
        this.callbacks.onStateChange(this.getState());
      }
    }

    _notify(message, type) {
      if (this.callbacks && typeof this.callbacks.onNotify === 'function') {
        this.callbacks.onNotify(message, type);
      }
    }
  }

  global.RoletaPip = new FloatingTimerController();
})(window);
