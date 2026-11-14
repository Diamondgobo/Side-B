// =============================================================================
// src/story.js — Narrative Engine, Cassette Deck, Detective Board & Objective HUD
// "Side B" — An Interactive Short Story
// =============================================================================

import {
  initAudio,
  playSound,
  playVoiceAudio,
  startLoop,
  stopLoop,
  startBGGuitar,
  stopBGGuitar,
  duckBGGuitar,
  setMuted,
  isMuted,
} from './audio.js';

// ---------------------------------------------------------------------------
// 1. GAME STATE
// ---------------------------------------------------------------------------
export const state = {
  inIntro: true,          // Controls whether player is in title/intro screen
  activeModal: null,      // 'intro' | 'notepad' | 'dialogue' | 'tape' | 'board' | 'lock' | 'card_puzzle' | 'record' | 'ending' | null
  foundClinicCard: false,
  cardPuzzleSolved: false, // Reassemble torn counselor card puzzle
  hasClosetKey: false,     // Brass key hidden inside Kim's tea mug
  closetOpen: false,       // Wardrobe doors unlocked & swung open
  foundSongbook: false,
  foundPolaroid: false,
  foundNotepad: false,
  collectedTapes: {
    1: false,
    2: false,
    3: false,
  },
  secret1Unlocked: false, // Tape 1 B-side
  secret2Unlocked: false, // Tape 2 B-side
  secret3Unlocked: false, // Tape 3 B-side
  match1Solved: false,
  match2Solved: false,
  match3Solved: false,
  boxUnlocked: false,
  hasSideBTape: false,    // Blank Side B tape from keepsake box
  blankTapeCollected: false,
  gameCompleted: false,
  memoriesFound: 0,       // 0 - 3
  audioInitialized: false,
  muted: false,
};

// ---------------------------------------------------------------------------
// 2. CSS STYLES INJECTION (Comfortaa & Cozy Rose-Gold Theme)
// ---------------------------------------------------------------------------
const STYLES = `
.sb-modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(14, 11, 15, 0.90);
  display: none; align-items: center; justify-content: center;
  z-index: 50;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: default;
  pointer-events: auto;
}

.sb-panel {
  background: rgba(32, 22, 28, 0.96);
  border: 1px solid rgba(243, 167, 187, 0.35);
  border-radius: 20px;
  padding: 32px 38px;
  max-width: 740px; width: 92%;
  color: #f7f1ec;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(243, 167, 187, 0.08) inset;
  position: relative;
  font-family: 'Comfortaa', cursive, sans-serif !important;
}

.sb-btn {
  background: rgba(243, 167, 187, 0.14);
  color: #fcecef;
  border: 1px solid rgba(243, 167, 187, 0.4);
  padding: 10px 22px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.25s ease;
  font-family: 'Comfortaa', cursive, sans-serif !important;
  outline: none;
}
.sb-btn:hover {
  background: rgba(243, 167, 187, 0.28);
  border-color: rgba(255, 195, 215, 0.8);
  transform: translateY(-1px);
}
.sb-btn.active {
  background: rgba(243, 167, 187, 0.32);
  border-color: #f3a7bb;
  color: #ffffff;
  box-shadow: 0 0 16px rgba(243, 167, 187, 0.4);
}
.sb-btn:disabled, .sb-btn.locked {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: rgba(180, 150, 160, 0.25);
  background: rgba(20, 16, 18, 0.5);
  color: #9d8b92;
}

/* ── HUD ── */
#sb-hud-container {
  position: fixed; top: 20px; left: 24px;
  z-index: 25; pointer-events: auto;
  display: flex; flex-direction: column; gap: 10px;
}
.sb-objective-pill {
  background: rgba(26, 18, 24, 0.88);
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(243, 167, 187, 0.45);
  padding: 10px 22px; border-radius: 25px;
  font-size: 13.5px; font-weight: 600; letter-spacing: 0.5px;
  color: #fdf3f5;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(243, 167, 187, 0.12) inset;
  display: flex; align-items: center; gap: 10px;
  max-width: 580px;
}
.sb-objective-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: #f5a855;
  box-shadow: 0 0 8px #f5a855;
  flex-shrink: 0;
  animation: objPulse 2.5s infinite alternate;
}
@keyframes objPulse {
  0% { transform: scale(0.9); opacity: 0.8; }
  100% { transform: scale(1.2); opacity: 1; }
}

.sb-hud-row {
  display: flex; gap: 10px; align-items: center;
}
.sb-hud-pill {
  background: rgba(26, 18, 24, 0.82);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(243, 167, 187, 0.3);
  padding: 7px 16px; border-radius: 20px;
  font-size: 12.5px; font-weight: 600;
  color: #fbebf0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  cursor: pointer;
  transition: all 0.2s;
}
.sb-hud-pill:hover {
  border-color: #f3a7bb;
  color: #fff;
}
#sb-hud-mute {
  position: fixed; bottom: 22px; right: 24px;
  z-index: 25; cursor: pointer;
  background: rgba(26, 18, 24, 0.82);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(243, 167, 187, 0.3);
  padding: 8px 16px; border-radius: 20px;
  font-size: 13px; font-weight: 600; color: #fbebf0;
  transition: all 0.2s;
}
#sb-hud-mute:hover {
  border-color: #f3a7bb;
}

/* ── Toast Notification ── */
#sb-toast {
  position: fixed; top: 80px; left: 50%;
  transform: translateX(-50%) translateY(-20px);
  background: rgba(34, 22, 30, 0.94);
  backdrop-filter: blur(14px);
  border: 1.5px solid #55c792;
  border-radius: 25px;
  padding: 12px 28px;
  font-size: 14px; font-weight: 600; color: #d8f5e5;
  box-shadow: 0 8px 30px rgba(0,0,0,0.6), 0 0 20px rgba(85, 199, 146, 0.25);
  z-index: 100; opacity: 0; pointer-events: none;
  transition: opacity 0.35s ease, transform 0.35s ease;
  display: flex; align-items: center; gap: 10px;
}
#sb-toast.show {
  opacity: 1; transform: translateX(-50%) translateY(0);
}

/* ── Dialogue Box ── */
#sb-dialogue-box {
  position: fixed; bottom: 36px; left: 50%;
  transform: translateX(-50%);
  display: none; z-index: 35;
  width: 90%; max-width: 700px;
  background: rgba(28, 18, 25, 0.94);
  backdrop-filter: blur(16px);
  border: 1.5px solid rgba(243, 167, 187, 0.35);
  border-radius: 18px;
  padding: 22px 30px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(243, 167, 187, 0.08) inset;
  cursor: pointer;
}
.sb-speaker-badge {
  display: inline-block;
  font-size: 11.5px; text-transform: uppercase; letter-spacing: 1.5px;
  padding: 4px 12px; border-radius: 12px;
  margin-bottom: 12px; font-weight: 700;
}
.sb-speaker-charlie {
  background: rgba(243, 167, 187, 0.2);
  color: #fcd5df; border: 1px solid rgba(243, 167, 187, 0.5);
}
.sb-speaker-kim {
  background: rgba(245, 185, 99, 0.2);
  color: #ffd49e; border: 1px solid rgba(245, 185, 99, 0.5);
}
.sb-speaker-note {
  background: rgba(160, 195, 240, 0.2);
  color: #c9e0ff; border: 1px solid rgba(160, 195, 240, 0.5);
}
#sb-dialogue-text {
  font-size: 16px; line-height: 1.8; color: #fdf6f7;
  min-height: 54px; font-weight: 500;
}
.sb-dialogue-hint {
  text-align: right; font-size: 12px; color: #b49ca4;
  margin-top: 10px; font-weight: 500;
}

/* ── Intro Prologue Modal ── */
#sb-intro-modal .sb-panel {
  max-width: 680px;
  text-align: center;
  padding: 40px 44px;
}
.sb-intro-title {
  font-size: 34px; font-weight: 700; color: #fae4eb;
  letter-spacing: 6px; margin-bottom: 6px;
}
.sb-intro-sub {
  font-size: 15px; font-weight: 500; color: #e8b0be;
  margin-bottom: 30px; letter-spacing: 1px;
}
.sb-intro-step-box {
  min-height: 170px;
  display: flex; align-items: center; justify-content: center;
}
.sb-intro-p {
  font-size: 16.5px; line-height: 1.85; color: #f8ecf0;
  font-weight: 500; text-align: left;
  opacity: 1; transition: opacity 0.3s ease;
}
.sb-intro-actions {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 30px; border-top: 1px solid rgba(243, 167, 187, 0.2);
  padding-top: 20px;
}
.sb-intro-dots {
  display: flex; gap: 8px;
}
.sb-intro-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: rgba(243, 167, 187, 0.3);
  transition: all 0.3s ease;
}
.sb-intro-dot.active {
  background: #f3a7bb;
  transform: scale(1.3);
  box-shadow: 0 0 8px #f3a7bb;
}

/* ── Lined Notepad Modal ── */
#sb-notepad-modal .sb-panel {
  max-width: 640px;
  background: #fdfaf4;
  color: #2b2320;
  border: 1px solid #dcd4c7;
  box-shadow: 0 30px 70px rgba(0,0,0,0.7);
  border-radius: 14px;
  padding: 38px 44px;
  background-image: repeating-linear-gradient(#fdfaf4 0px, #fdfaf4 28px, #e8dfd3 29px);
  position: relative;
}
.sb-notepad-date {
  font-size: 13px; font-weight: 700; letter-spacing: 1px; color: #7f6e65;
  text-transform: uppercase; margin-bottom: 20px;
}
.sb-notepad-body {
  font-size: 16px; line-height: 29px; color: #2a201c;
  min-height: 230px; margin-bottom: 24px; font-weight: 500;
}
.sb-notepad-margin {
  border-top: 1.5px dashed #d86464;
  padding-top: 14px;
  font-size: 16px; color: #b82c2c;
  font-weight: 700; line-height: 1.6;
}

/* ── Cassette Deck ── */
.sb-deck-container {
  display: flex; flex-direction: column; gap: 14px;
}
.sb-reels-row {
  display: flex; justify-content: center; align-items: center; gap: 40px;
  margin: 6px 0;
  background: rgba(18, 12, 16, 0.85);
  padding: 16px 20px; border-radius: 14px;
  border: 1px solid rgba(243, 167, 187, 0.2);
}
.sb-reel {
  width: 58px; height: 58px; border-radius: 50%;
  border: 3px solid #f3cfd6;
  background: radial-gradient(circle, #2a1e24 40%, #151013 70%);
  position: relative;
  box-shadow: 0 0 14px rgba(243, 207, 214, 0.3);
}
.sb-reel::before, .sb-reel::after {
  content: ''; position: absolute; top: 50%; left: 50%;
  background: #f3cfd6;
}
.sb-reel::before {
  width: 48px; height: 2.5px;
  transform: translate(-50%, -50%);
}
.sb-reel::after {
  width: 2.5px; height: 48px;
  transform: translate(-50%, -50%);
}
.sb-reel.playing { animation: reelSpin 2.4s linear infinite; }
.sb-reel.rewinding { animation: reelSpin 0.5s linear infinite reverse; }
.sb-reel.paused { animation-play-state: paused; }
@keyframes reelSpin { 100% { transform: rotate(360deg); } }

.sb-tape-counter {
  font-size: 17px; font-weight: 700;
  color: #f7aabf; letter-spacing: 2px;
  text-align: center;
}
.sb-step-guide {
  font-size: 13.5px; font-weight: 600; line-height: 1.5;
  padding: 10px 18px; border-radius: 12px;
  text-align: center; margin: 4px 0;
  transition: all 0.3s ease;
}
.sb-step-normal {
  background: rgba(243, 167, 187, 0.1);
  border: 1px solid rgba(243, 167, 187, 0.25);
  color: #fae4eb;
}
.sb-step-splice {
  background: rgba(245, 185, 99, 0.22);
  border: 1.5px solid #ffb86c;
  color: #ffe6c7;
  box-shadow: 0 0 16px rgba(245, 185, 99, 0.3);
  animation: pulseSplice 1.5s infinite alternate;
}
@keyframes pulseSplice {
  0% { transform: scale(0.99); }
  100% { transform: scale(1.01); }
}

.sb-track {
  width: 100%; height: 16px; background: rgba(15, 10, 14, 0.95);
  border-radius: 8px; position: relative; overflow: visible;
  border: 1px solid rgba(243, 167, 187, 0.3);
  margin: 10px 0 6px 0;
}
.sb-splice-zone {
  position: absolute; top: 0; bottom: 0;
  background: rgba(245, 185, 99, 0.38);
  border: 1.5px solid #ffb86c;
  border-radius: 4px;
  box-shadow: 0 0 12px rgba(255, 184, 108, 0.45);
}
.sb-splice-tag {
  position: absolute; top: -20px; left: 50%;
  transform: translateX(-50%);
  background: #f5a855; color: #1e1308;
  font-size: 10px; font-weight: 700;
  padding: 1px 7px; border-radius: 8px;
  white-space: nowrap; pointer-events: none;
}
.sb-needle {
  position: absolute; top: -3px; bottom: -3px; width: 5px;
  background: #ffffff; left: 0%;
  border-radius: 3px; z-index: 5;
  transition: background 0.15s;
  box-shadow: 0 0 6px rgba(255,255,255,0.6);
}
.sb-needle.amber {
  background: #ffb86c;
  box-shadow: 0 0 12px #ffb86c;
}

.sb-signal-bar {
  width: 100%; height: 10px; background: #1a1014;
  border-radius: 5px; overflow: hidden;
  border: 1px solid rgba(255, 184, 108, 0.5);
  margin-top: 6px;
}
.sb-signal-fill {
  width: 0%; height: 100%;
  background: linear-gradient(90deg, #f5a855, #ff6b8b);
  transition: width 0.05s linear;
}

/* Subtitle Box inside Tape Modal */
.sb-tape-subtitle-box {
  background: rgba(20, 14, 18, 0.85);
  border: 1px solid rgba(243, 167, 187, 0.25);
  border-radius: 12px; padding: 12px 18px;
  min-height: 52px; font-size: 14.5px;
  line-height: 1.6; color: #fbf0f4;
  font-weight: 500;
}

/* ── Detective Board ── */
#sb-board-modal .sb-panel {
  max-width: 820px;
}
.sb-board-cols {
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  margin: 20px 0 14px 0;
  position: relative;
}
.sb-board-card {
  background: rgba(38, 26, 32, 0.9);
  border: 1.5px solid rgba(243, 167, 187, 0.28);
  border-radius: 14px; padding: 14px 18px;
  color: #f7eef1; font-size: 13.5px; font-weight: 600;
  cursor: pointer; transition: all 0.25s ease;
  user-select: none;
  display: flex; align-items: center; gap: 12px;
}
.sb-board-card:hover {
  background: rgba(243, 167, 187, 0.2);
  border-color: #f3cfd6;
}
.sb-board-card.selected {
  border-color: #ff9fb4;
  background: rgba(255, 159, 180, 0.28);
  box-shadow: 0 0 16px rgba(255, 159, 180, 0.4);
}
.sb-board-card.solved {
  border-color: #55c792;
  background: rgba(85, 199, 146, 0.15);
  color: #a4f2cc;
  cursor: default;
}
#sb-yarn-svg {
  position: absolute; inset: 0; pointer-events: none;
  width: 100%; height: 100%; z-index: 5;
}

/* ── Padlock ── */
.sb-dial-row {
  display: flex; gap: 18px; justify-content: center;
  margin: 26px 0;
}
.sb-dial {
  font-size: 34px; width: 68px; height: 80px;
  font-weight: 700; border-radius: 12px;
  background: #251c20; color: #fcebef;
  border: 2px solid rgba(243, 167, 187, 0.45);
}
.sb-dial:hover { border-color: #f3a7bb; }

/* ── Torn Counselor Card Puzzle Modal ── */
.sb-puzzle-panel {
  max-width: 780px !important;
  background: rgba(28, 19, 25, 0.98);
  border: 1.5px solid rgba(243, 167, 187, 0.45);
}
#sb-puzzle-workspace {
  position: relative;
  width: 100%;
  height: 380px;
  background: rgba(18, 12, 16, 0.9);
  border-radius: 14px;
  border: 1px solid rgba(243, 167, 187, 0.22);
  overflow: hidden;
  user-select: none;
  touch-action: none;
}
#sb-card-target-frame {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  width: 440px;
  height: 240px;
  background: rgba(255, 255, 255, 0.04);
  border: 2px dashed rgba(243, 167, 187, 0.4);
  border-radius: 8px;
  box-shadow: 0 0 35px rgba(0, 0, 0, 0.5) inset;
}
.sb-card-watermark {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 4px;
  color: rgba(243, 167, 187, 0.12);
  pointer-events: none;
  text-align: center;
}
.sb-target-slot {
  position: absolute;
  pointer-events: none;
  border: 1px dotted rgba(243, 167, 187, 0.18);
  box-sizing: border-box;
}
.sb-card-scrap {
  position: absolute;
  cursor: grab;
  user-select: none;
  touch-action: none;
  border-radius: 4px;
  background: linear-gradient(135deg, #fdfbf7 0%, #f4ede2 100%);
  color: #1a2230;
  padding: 8px 10px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.55);
  border: 1.5px dashed #bfae96;
  z-index: 10;
  box-sizing: border-box;
  overflow: hidden;
}
.sb-card-scrap:active {
  cursor: grabbing;
  z-index: 35;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.75);
}
.sb-card-scrap.snapped {
  cursor: default;
  border: 2px solid #55c792;
  box-shadow: 0 0 18px rgba(85, 199, 146, 0.35);
  z-index: 5;
  pointer-events: none;
}
.sb-scrap-rotate-btn {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(38, 24, 32, 0.88);
  color: #fcebef;
  border: 1px solid rgba(243, 167, 187, 0.45);
  border-radius: 10px;
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 6px;
  cursor: pointer;
  z-index: 20;
  transition: all 0.18s;
  font-family: 'Comfortaa', cursive, sans-serif !important;
}
.sb-scrap-rotate-btn:hover {
  background: #f3a7bb;
  color: #1a1014;
}

/* ── Side B Record Climax Modal ── */
.sb-record-circle-btn {
  width: 106px;
  height: 106px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #eb3b5a, #801323);
  border: 3px solid rgba(255, 180, 195, 0.7);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 25px rgba(235, 59, 90, 0.5), 0 6px 18px rgba(0,0,0,0.6);
  transition: all 0.2s ease;
  user-select: none;
  font-family: 'Comfortaa', cursive, sans-serif !important;
  outline: none;
}
.sb-record-circle-btn:hover {
  transform: scale(1.04);
  box-shadow: 0 0 35px rgba(235, 59, 90, 0.8), 0 6px 24px rgba(0,0,0,0.7);
}
.sb-record-circle-btn.recording {
  background: radial-gradient(circle at 35% 35%, #ff4d6d, #b31232);
  transform: scale(0.96);
  box-shadow: 0 0 45px rgba(255, 77, 109, 0.95);
  border-color: #ffffff;
}

/* ── Ending Monologue Overlay ── */
#sb-ending-overlay {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(14, 10, 14, 0.0);
  display: none; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px; text-align: center;
  pointer-events: auto;
  transition: background 3.5s ease;
}
#sb-ending-overlay.active { background: rgba(14, 10, 14, 0.78); }
#sb-ending-overlay.fade-black { background: rgba(8, 6, 8, 0.98); }
.sb-monologue-card {
  max-width: 780px;
  font-size: 21px; line-height: 1.85;
  color: #fcf4f6; font-weight: 500;
  text-shadow: 0 2px 14px rgba(0,0,0,0.85);
  min-height: 150px;
  opacity: 0; transform: translateY(12px);
  transition: opacity 1.2s ease, transform 1.2s ease;
}
.sb-monologue-card.visible { opacity: 1; transform: translateY(0); }
#sb-ending-credits { display: none; text-align: center; }
`;

// Inject Styles
const styleEl = document.createElement('style');
styleEl.textContent = STYLES;
document.head.appendChild(styleEl);

// ---------------------------------------------------------------------------
// 3. UI DOM INJECTION
// ---------------------------------------------------------------------------
const uiContainer = document.createElement('div');
uiContainer.id = 'sb-narrative-root';
uiContainer.innerHTML = `
<!-- Top HUD Objective & Memory Bar -->
<div id="sb-hud-container">
  <div class="sb-objective-pill" id="sb-objective-bar">
    <div class="sb-objective-dot"></div>
    <span id="sb-objective-text">Objective: Search Kim's bedroom for her cassette tapes (0/3 found)</span>
  </div>
  <div class="sb-hud-row">
    <div class="sb-hud-pill" id="sb-hud-board-btn">
      Memories: <span id="sb-memory-count">0</span> / 3 &nbsp;|&nbsp; <strong>[Tab] Board</strong>
    </div>
  </div>
</div>

<!-- Bottom Right Mute Toggle -->
<div id="sb-hud-mute">[M] 🔊</div>

<!-- Toast Notification -->
<div id="sb-toast">
  <span>📼</span>
  <span id="sb-toast-text">Tape collected</span>
</div>

<!-- Typewriter Dialogue Box -->
<div id="sb-dialogue-box">
  <div id="sb-dialogue-speaker" class="sb-speaker-badge sb-speaker-charlie">Charlie</div>
  <p id="sb-dialogue-text"></p>
  <div class="sb-dialogue-hint">Click or press [Space] to continue</div>
</div>

<!-- 1. Intro Backstory Prologue Modal (Unlocked Mouse Cursor & Continue Buttons) -->
<div id="sb-intro-modal" class="sb-modal-backdrop">
  <div class="sb-panel">
    <div class="sb-intro-title">SIDE B</div>
    <div class="sb-intro-sub">A Narrative Adventure</div>

    <div class="sb-intro-step-box">
      <p class="sb-intro-p" id="sb-intro-text"></p>
    </div>

    <div class="sb-intro-actions">
      <div class="sb-intro-dots">
        <div class="sb-intro-dot active" id="sb-dot-1"></div>
        <div class="sb-intro-dot" id="sb-dot-2"></div>
        <div class="sb-intro-dot" id="sb-dot-3"></div>
      </div>
      <div>
        <button class="sb-btn active" id="sb-intro-next-btn">Continue &nbsp;➔</button>
      </div>
    </div>
  </div>
</div>

<!-- 2. Notepad Modal (Kim's Raw Spiral Journal Entry) -->
<div id="sb-notepad-modal" class="sb-modal-backdrop">
  <div class="sb-panel">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div class="sb-notepad-date">Kim's Desk Notepad — Tuesday 1:40 AM</div>
      <button class="sb-btn" id="sb-close-notepad">[Esc] Close</button>
    </div>
    <div class="sb-notepad-body">
      I don't know how to explain to anyone how tired I am. Smiling all day in studio classes felt like lifting concrete with my teeth. Everybody thinks I'm the happy, creative girl who has her whole future mapped out. But when the sun goes down, my mind gets so loud and suffocating that I can't catch my breath. I snapped at Char tonight downstairs and I hate myself for it. I didn't mean it, Char. I swear I didn't.
    </div>
    <div class="sb-notepad-margin">
      * Shaky margin note: "Just make it to Thursday 3:30. Hold on for Char."
    </div>
  </div>
</div>

<!-- 3. Retro Cassette Deck Modal (With Splice Highlights & Live Subtitles) -->
<div id="sb-tape-modal" class="sb-modal-backdrop">
  <div class="sb-panel sb-deck-container">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h3 style="font-size: 19px; color: #f9d8e2; font-weight: 700;">Kim's Portable Cassette Player</h3>
      <button class="sb-btn" id="sb-close-tape">[Esc] Back</button>
    </div>

    <!-- Tape Selectors (Only enabled if physically collected) -->
    <div style="display: flex; gap: 10px; margin-top: 4px;">
      <button class="sb-btn" id="sb-tape-btn-1">Tape 1: Roommate Intro</button>
      <button class="sb-btn" id="sb-tape-btn-2">Tape 2: Midnight Guitar</button>
      <button class="sb-btn" id="sb-tape-btn-3">Tape 3: Sunday Drive</button>
    </div>

    <!-- Step by Step Instructions Guide -->
    <div id="sb-tape-step-guide" class="sb-step-guide sb-step-normal">
      Step 1: Let Side A play past the amber zone, then HOLD [← Left Arrow] or [Rewind] to bounce back into it.
    </div>

    <!-- Reels & Counter Display -->
    <div class="sb-reels-row">
      <div class="sb-reel playing" id="sb-reel-left"></div>
      <div style="text-align: center;">
        <div class="sb-tape-counter" id="sb-tape-counter">00:00 / 00:16</div>
        <div id="sb-tape-status" style="font-size: 12px; color: #ffb86c; margin-top: 4px; font-weight: 600;">Side A Playing</div>
      </div>
      <div class="sb-reel playing" id="sb-reel-right"></div>
    </div>

    <!-- Progress Track with Amber Splice Zone & Needle -->
    <div class="sb-track" id="sb-tape-track">
      <div class="sb-splice-zone" id="sb-splice-zone">
        <div class="sb-splice-tag">Side B Splice Zone</div>
      </div>
      <div class="sb-needle" id="sb-tape-needle"></div>
    </div>

    <!-- Live Subtitle Box inside Tape Modal -->
    <div class="sb-tape-subtitle-box" id="sb-tape-subtitles">
      [Transcript will appear here]
    </div>

    <!-- Signal Stabilization Meter -->
    <div id="sb-signal-container" style="display: none;">
      <div style="display: flex; justify-content: space-between; font-size: 13px; color: #ffb86c; font-weight: 700;">
        <span id="sb-signal-label">HOLD [Space] to stabilize magnetic splice!</span>
        <span id="sb-signal-pct">0%</span>
      </div>
      <div class="sb-signal-bar">
        <div class="sb-signal-fill" id="sb-signal-fill"></div>
      </div>
    </div>

    <!-- Bottom Controls -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
      <button class="sb-btn" id="sb-btn-rewind">⏪ Hold [←] Rewind (Bounce Back)</button>
      <span style="font-size: 12px; color: #bca8b0; font-weight: 500;">Press [Space] to stabilize splice</span>
    </div>
  </div>
</div>

<!-- 4. Detective Deduction Board Modal -->
<div id="sb-board-modal" class="sb-modal-backdrop">
  <div class="sb-panel">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h3 style="font-size: 19px; color: #f9d8e2; font-weight: 700;">Kim's Corkboard — Memories & Connections</h3>
      <button class="sb-btn" id="sb-close-board">[Tab] Close</button>
    </div>
    <p style="font-size: 14px; color: #d0bcc4; margin: 8px 0 16px 0; font-weight: 500;">
      Pair each physical memory with its hidden B-Side recording to uncover Kim's truth.
    </p>

    <div class="sb-board-cols" id="sb-board-columns">
      <svg id="sb-yarn-svg"></svg>

      <!-- Left Column: Physical Clues -->
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div class="sb-board-card" id="sb-clue-card-clinic" style="display: none;">
          <span>📄</span>
          <div>
            <div>Thursday Appointment Card</div>
            <div style="font-size: 12px; opacity: 0.8; font-weight: 400;">Student Wellness Center (3:30 PM)</div>
          </div>
        </div>

        <div class="sb-board-card" id="sb-clue-card-song" style="display: none;">
          <span>🎸</span>
          <div>
            <div>"For Char's 17th" Songbook</div>
            <div style="font-size: 12px; opacity: 0.8; font-weight: 400;">Chords written with Capo 3</div>
          </div>
        </div>

        <div class="sb-board-card" id="sb-clue-card-polaroid" style="display: none;">
          <span>📷</span>
          <div>
            <div>Dorm Packing Polaroid</div>
            <div style="font-size: 12px; opacity: 0.8; font-weight: 400;">"Midnight indie mix: 104.9 FM"</div>
          </div>
        </div>
      </div>

      <!-- Right Column: Unlocked B-Side Recordings -->
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div class="sb-board-card" id="sb-audio-card-tape1" style="display: none;">
          <span>📼</span>
          <div>
            <div>Tape 1 B-Side</div>
            <div style="font-size: 12px; opacity: 0.8; font-weight: 400;">"Make it to Thursday's appointment"</div>
          </div>
        </div>

        <div class="sb-board-card" id="sb-audio-card-tape2" style="display: none;">
          <span>📼</span>
          <div>
            <div>Tape 2 B-Side</div>
            <div style="font-size: 12px; opacity: 0.8; font-weight: 400;">"Pancakes before school tomorrow"</div>
          </div>
        </div>

        <div class="sb-board-card" id="sb-audio-card-tape3" style="display: none;">
          <span>📼</span>
          <div>
            <div>Tape 3 B-Side</div>
            <div style="font-size: 12px; opacity: 0.8; font-weight: 400;">"AA batteries for Char's player"</div>
          </div>
        </div>
      </div>
    </div>

    <div id="sb-board-status" style="font-size: 14.5px; color: #f5a855; min-height: 24px; text-align: center; margin-top: 10px; font-weight: 600;"></div>
  </div>
</div>

<!-- 5. 3-Digit Padlock Modal -->
<div id="sb-lock-modal" class="sb-modal-backdrop">
  <div class="sb-panel" style="max-width: 500px; text-align: center;">
    <h3 style="font-size: 19px; color: #f9d8e2; font-weight: 700;">Keepsake Box Padlock</h3>
    <p style="font-size: 14px; color: #d0bcc4; margin-top: 6px; font-weight: 500;">
      Enter the 3-digit combination revealed on the Detective Board.
    </p>

    <div class="sb-dial-row">
      <button class="sb-btn sb-dial" id="sb-dial-0">0</button>
      <button class="sb-btn sb-dial" id="sb-dial-1">0</button>
      <button class="sb-btn sb-dial" id="sb-dial-2">0</button>
    </div>

    <div style="display: flex; gap: 14px; justify-content: center; margin-top: 10px;">
      <button class="sb-btn active" id="sb-btn-unlock" style="padding: 11px 32px; font-size: 14px;">Unlock</button>
      <button class="sb-btn" id="sb-close-lock">Cancel</button>
    </div>
  </div>
</div>

<!-- 7. Torn Counselor Card Puzzle Modal -->
<div id="sb-card-puzzle-modal" class="sb-modal-backdrop">
  <div class="sb-panel sb-puzzle-panel">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #fae4eb; letter-spacing: 2px;">
        ✦ REASSEMBLE TORN CARD ✦
      </h2>
      <button class="sb-btn" id="sb-close-card-puzzle" style="padding: 6px 16px; font-size: 12px;">Close</button>
    </div>
    <p style="font-size: 13.5px; color: #d8b2bc; margin-bottom: 14px; line-height: 1.6;">
      Kim tore her counseling intake card into 5 scraps before throwing it away. Drag the pieces to the frame and click / press <strong>[R]</strong> to rotate by 45° to reconstruct the memory.
    </p>

    <!-- Puzzle Workspace -->
    <div id="sb-puzzle-workspace">
      <!-- Target Outline Box -->
      <div id="sb-card-target-frame">
        <div class="sb-card-watermark">STUDENT WELLNESS CENTER</div>
        <div class="sb-target-slot" id="sb-slot-0" style="left: 0px; top: 0px; width: 220px; height: 120px;"></div>
        <div class="sb-target-slot" id="sb-slot-1" style="left: 220px; top: 0px; width: 220px; height: 120px;"></div>
        <div class="sb-target-slot" id="sb-slot-2" style="left: 0px; top: 120px; width: 146px; height: 120px;"></div>
        <div class="sb-target-slot" id="sb-slot-3" style="left: 146px; top: 120px; width: 148px; height: 120px;"></div>
        <div class="sb-target-slot" id="sb-slot-4" style="left: 294px; top: 120px; width: 146px; height: 120px;"></div>
      </div>

      <!-- Scraps Container -->
      <div id="sb-scraps-container"></div>
    </div>

    <!-- Completion Banner & Button -->
    <div id="sb-card-complete-banner" style="display: none; margin-top: 14px; text-align: center;">
      <div style="font-size: 14.5px; font-weight: 700; color: #85e8b4; margin-bottom: 10px;">
        ✓ Appointment Card Reassembled: Student Wellness Center — Thursday, 3:30 PM
      </div>
      <button class="sb-btn active" id="sb-card-complete-btn" style="padding: 10px 28px; font-size: 13.5px;">
        Add to Detective Board & Keep Card
      </button>
    </div>
  </div>
</div>

<!-- 8. Side B Overdub & Record Modal -->
<div id="sb-record-modal" class="sb-modal-backdrop">
  <div class="sb-panel" style="max-width: 680px; text-align: center;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <h2 style="font-size: 22px; font-weight: 700; color: #fae4eb; letter-spacing: 3px;">
        ✦ SIDE B — OVERDUB & RECORD ✦
      </h2>
      <button class="sb-btn" id="sb-close-record" style="padding: 6px 16px; font-size: 12px;">Back</button>
    </div>
    <p style="font-size: 14px; font-weight: 500; color: #e8b0be; margin-bottom: 20px;">
      "For when you learn the chorus" — Kim's blank cassette tape
    </p>

    <!-- Twin Reels Animation -->
    <div style="display: flex; justify-content: center; align-items: center; gap: 60px; margin: 12px 0 20px 0;">
      <div class="sb-reel" id="sb-record-reel-left" style="width: 72px; height: 72px;"></div>
      <div style="display: flex; flex-direction: column; align-items: center;">
        <span style="font-size: 11px; letter-spacing: 2px; color: #ff6b8b; font-weight: 700; text-transform: uppercase;">REC HEAD ENGAGED</span>
        <div style="width: 80px; height: 4px; background: #ff4d6d; border-radius: 2px; margin-top: 6px; box-shadow: 0 0 10px #ff4d6d;"></div>
      </div>
      <div class="sb-reel" id="sb-record-reel-right" style="width: 72px; height: 72px;"></div>
    </div>

    <!-- Balance Slider Section -->
    <div style="background: rgba(20, 14, 18, 0.85); border: 1px solid rgba(243, 167, 187, 0.25); border-radius: 14px; padding: 18px 24px; margin-bottom: 22px;">
      <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #fcecef; margin-bottom: 10px;">
        <span>🎙 Kim's Acoustic Chords</span>
        <span id="sb-balance-display" style="color: #f5a855; font-weight: 700;">50% / 50%</span>
        <span>🎸 Charlie's Harmony</span>
      </div>
      <input type="range" min="0" max="100" value="50" id="sb-balance-slider" style="width: 100%; accent-color: #f3a7bb; cursor: pointer;" />
      <div style="font-size: 12px; color: #a48c94; margin-top: 8px;">
        Slide to balance the mix between Kim's rhythm and your chorus
      </div>
    </div>

    <!-- Big Record Button with Circular Hold Progress -->
    <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
      <div style="position: relative; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center;">
        <svg style="position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg);" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" stroke="rgba(243, 167, 187, 0.2)" stroke-width="6" fill="transparent" />
          <circle id="sb-record-progress-circle" cx="50" cy="50" r="44" stroke="#ff4d6d" stroke-width="6" stroke-linecap="round" fill="transparent" stroke-dasharray="276.46" stroke-dashoffset="276.46" style="transition: stroke-dashoffset 0.05s linear;" />
        </svg>
        <button id="sb-record-action-btn" class="sb-record-circle-btn">
          <span style="font-size: 22px; margin-bottom: 2px;">●</span>
          <span id="sb-rec-btn-text" style="font-size: 11px; font-weight: 700; letter-spacing: 1px;">RECORD</span>
        </button>
      </div>
      <div id="sb-record-instructions" style="font-size: 13px; font-weight: 600; color: #edd2da;">
        Hold <strong>[R]</strong> on keyboard or click & hold the record button for 2 seconds
      </div>
    </div>
  </div>
</div>

<!-- 6. Ending Monologue Overlay -->
<div id="sb-ending-overlay">
  <div class="sb-monologue-card" id="sb-monologue-card"></div>

  <div id="sb-ending-credits">
    <h1 style="font-size: 58px; font-weight: 700; letter-spacing: 12px; color: #fcebef; margin-bottom: 12px;">SIDE B</h1>
    <p style="font-size: 19px; font-weight: 600; color: #e8b0be; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">
      An Interactive Short Story
    </p>
    <p style="font-size: 14.5px; font-weight: 500; color: #f0c2cf; letter-spacing: 1.2px; margin-bottom: 28px;">
      Made by Ishaan Pai and Srikara Pramod
    </p>
    <p style="font-size: 16px; font-style: italic; color: #e4c7d0; margin-bottom: 34px;">
      "Some memories aren't meant to be rewritten — only understood."
    </p>
    <button class="sb-btn active" id="sb-ending-replay" style="padding: 15px 42px; font-size: 16px;">
      Replay Story
    </button>
  </div>
</div>
`;
document.body.appendChild(uiContainer);

// ---------------------------------------------------------------------------
// 4. STORY CONTROLLER FACTORY
// ---------------------------------------------------------------------------
export function createStoryController({ controls, camera, scene, onEndingLighting, onTapePickedUp, onClosetOpen }) {
  // DOM Elements
  const objectiveText = document.getElementById('sb-objective-text');
  const hudMemoryCount = document.getElementById('sb-memory-count');
  const hudBoardBtn = document.getElementById('sb-hud-board-btn');
  const hudMute = document.getElementById('sb-hud-mute');
  const toastEl = document.getElementById('sb-toast');
  const toastText = document.getElementById('sb-toast-text');

  const dialogueBox = document.getElementById('sb-dialogue-box');
  const dialogueSpeaker = document.getElementById('sb-dialogue-speaker');
  const dialogueText = document.getElementById('sb-dialogue-text');

  const introModal = document.getElementById('sb-intro-modal');
  const introText = document.getElementById('sb-intro-text');
  const introNextBtn = document.getElementById('sb-intro-next-btn');
  const dot1 = document.getElementById('sb-dot-1');
  const dot2 = document.getElementById('sb-dot-2');
  const dot3 = document.getElementById('sb-dot-3');

  const notepadModal = document.getElementById('sb-notepad-modal');
  const closeNotepadBtn = document.getElementById('sb-close-notepad');

  const tapeModal = document.getElementById('sb-tape-modal');
  const closeTapeBtn = document.getElementById('sb-close-tape');
  const reelLeft = document.getElementById('sb-reel-left');
  const reelRight = document.getElementById('sb-reel-right');
  const tapeCounter = document.getElementById('sb-tape-counter');
  const tapeStatus = document.getElementById('sb-tape-status');
  const tapeStepGuide = document.getElementById('sb-tape-step-guide');
  const tapeSubtitles = document.getElementById('sb-tape-subtitles');
  const tapeNeedle = document.getElementById('sb-tape-needle');
  const spliceZone = document.getElementById('sb-splice-zone');
  const signalContainer = document.getElementById('sb-signal-container');
  const signalFill = document.getElementById('sb-signal-fill');
  const signalPct = document.getElementById('sb-signal-pct');
  const btnRewind = document.getElementById('sb-btn-rewind');

  const boardModal = document.getElementById('sb-board-modal');
  const closeBoardBtn = document.getElementById('sb-close-board');
  const clueClinic = document.getElementById('sb-clue-card-clinic');
  const clueSong = document.getElementById('sb-clue-card-song');
  const cluePolaroid = document.getElementById('sb-clue-card-polaroid');
  const audioTape1 = document.getElementById('sb-audio-card-tape1');
  const audioTape2 = document.getElementById('sb-audio-card-tape2');
  const audioTape3 = document.getElementById('sb-audio-card-tape3');
  const boardStatus = document.getElementById('sb-board-status');
  const yarnSvg = document.getElementById('sb-yarn-svg');

  const lockModal = document.getElementById('sb-lock-modal');
  const closeLockBtn = document.getElementById('sb-close-lock');
  const btnUnlock = document.getElementById('sb-btn-unlock');

  const cardPuzzleModal = document.getElementById('sb-card-puzzle-modal');
  const closeCardPuzzleBtn = document.getElementById('sb-close-card-puzzle');
  const scrapsContainer = document.getElementById('sb-scraps-container');
  const cardCompleteBanner = document.getElementById('sb-card-complete-banner');
  const cardCompleteBtn = document.getElementById('sb-card-complete-btn');

  const recordModal = document.getElementById('sb-record-modal');
  const closeRecordBtn = document.getElementById('sb-close-record');
  const balanceSlider = document.getElementById('sb-balance-slider');
  const balanceDisplay = document.getElementById('sb-balance-display');
  const recordActionBtn = document.getElementById('sb-record-action-btn');
  const recordProgressCircle = document.getElementById('sb-record-progress-circle');
  const recordInstructions = document.getElementById('sb-record-instructions');
  const recordReelLeft = document.getElementById('sb-record-reel-left');
  const recordReelRight = document.getElementById('sb-record-reel-right');
  const recBtnText = document.getElementById('sb-rec-btn-text');

  const endingOverlay = document.getElementById('sb-ending-overlay');
  const monologueCard = document.getElementById('sb-monologue-card');
  const endingCredits = document.getElementById('sb-ending-credits');
  const endingReplay = document.getElementById('sb-ending-replay');

  // -------------------------------------------------------------------------
  // OBJECTIVE BAR UPDATE
  // -------------------------------------------------------------------------
  function updateObjective() {
    const collectedCount = (state.collectedTapes[1] ? 1 : 0) +
                           (state.collectedTapes[2] ? 1 : 0) +
                           (state.collectedTapes[3] ? 1 : 0);

    if (state.gameCompleted) {
      objectiveText.textContent = "Objective: Listen to Kim & Charlie's Side B";
    } else if (state.hasSideBTape || state.blankTapeCollected) {
      objectiveText.textContent = "Objective: Place the blank Side B tape into the cassette player on the desk";
    } else if (state.boxUnlocked) {
      objectiveText.textContent = "Objective: Retrieve the contents of Kim's keepsake box";
    } else if (state.match1Solved && state.match2Solved && state.match3Solved) {
      objectiveText.textContent = "Objective: Unlock Kim's keepsake box on the desk (Code: 1-0-4)";
    } else if (state.memoriesFound === 3) {
      objectiveText.textContent = "Objective: Inspect the room's clues & connect them on the Detective Board [Tab]";
    } else if (!state.cardPuzzleSolved && state.foundClinicCard) {
      objectiveText.textContent = "Objective: Reassemble Kim's torn counseling appointment card";
    } else if (!state.hasClosetKey) {
      objectiveText.textContent = `Objective: Search Kim's bedroom for tapes & clues (${collectedCount}/3 tapes found)`;
    } else if (!state.collectedTapes[3]) {
      objectiveText.textContent = "Objective: Use the brass key from the tea mug to unlock Kim's wardrobe";
    } else if (collectedCount > 0) {
      objectiveText.textContent = `Objective: Use the cassette player on the desk & rewind into Side B (${state.memoriesFound}/3 uncovered)`;
    } else {
      objectiveText.textContent = `Objective: Search Kim's bedroom for her cassette tapes (${collectedCount}/3 found)`;
    }
  }

  function showToast(msg) {
    toastText.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3600);
  }

  // -------------------------------------------------------------------------
  // MODAL MANAGEMENT
  // -------------------------------------------------------------------------
  function openModal(name) {
    state.activeModal = name;
    if (controls && controls.isLocked) controls.unlock();

    introModal.style.display = name === 'intro' ? 'flex' : 'none';
    notepadModal.style.display = name === 'notepad' ? 'flex' : 'none';
    dialogueBox.style.display = name === 'dialogue' ? 'block' : 'none';
    tapeModal.style.display = name === 'tape' ? 'flex' : 'none';
    boardModal.style.display = name === 'board' ? 'flex' : 'none';
    lockModal.style.display = name === 'lock' ? 'flex' : 'none';
    cardPuzzleModal.style.display = name === 'card_puzzle' ? 'flex' : 'none';
    recordModal.style.display = name === 'record' ? 'flex' : 'none';
    endingOverlay.style.display = name === 'ending' ? 'flex' : 'none';
  }

  function closeAllModals() {
    if (activeVoiceHandle) {
      activeVoiceHandle.stop();
      activeVoiceHandle = null;
    }
    stopLoop('tape_rewind_loop');
    stopLoop('tape_static_loop');

    if (isTypewriting) {
      clearInterval(typewriterTimer);
      isTypewriting = false;
    }
    dialogueQueue = [];

    state.activeModal = null;
    introModal.style.display = 'none';
    notepadModal.style.display = 'none';
    dialogueBox.style.display = 'none';
    tapeModal.style.display = 'none';
    boardModal.style.display = 'none';
    lockModal.style.display = 'none';
    cardPuzzleModal.style.display = 'none';
    recordModal.style.display = 'none';

    // Only re-lock controls if gameplay is active
    if (!state.inIntro && !state.gameCompleted && controls) {
      controls.lock();
    }
  }

  // -------------------------------------------------------------------------
  // 1. INTRO PROLOGUE SEQUENCE (Unlocked Cursor, Step by Step)
  // -------------------------------------------------------------------------
  const introParagraphs = [
    "Six months ago, our house went silent. My nineteen-year-old sister Kim died by suicide, leaving behind an unfinished design degree, an acoustic guitar she never put away, and a grief so heavy it stopped time.",
    "The night before she died, we had a bitter, stupid fight in the hallway. I was sixteen, hurt, and angry. I slammed my bedroom door and shouted for her to leave me alone. I spent every night since wishing I could rewind that moment and rewrite what I said.",
    "Today, Mom asked me to pack up Kim's bedroom so she can finally let go. I've been standing outside this door for six months, terrified of what I'd find. But I'm finally ready to step inside.",
  ];

  let currentIntroStep = 0;

  function showIntroStep(step) {
    currentIntroStep = step;
    introText.style.opacity = '0';

    setTimeout(() => {
      introText.textContent = introParagraphs[step];
      introText.style.opacity = '1';

      dot1.className = `sb-intro-dot ${step === 0 ? 'active' : ''}`;
      dot2.className = `sb-intro-dot ${step === 1 ? 'active' : ''}`;
      dot3.className = `sb-intro-dot ${step === 2 ? 'active' : ''}`;

      if (step === 2) {
        introNextBtn.innerHTML = "Step Inside Kim's Bedroom &nbsp;➔";
      } else {
        introNextBtn.innerHTML = "Continue &nbsp;➔";
      }
    }, 200);
  }

  function advanceIntro() {
    if (currentIntroStep < 2) {
      showIntroStep(currentIntroStep + 1);
    } else {
      // Finished intro! Enter bedroom
      state.inIntro = false;
      closeAllModals();
      startBGGuitar();
      if (controls) controls.lock();
    }
  }

  introNextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    advanceIntro();
  });

  function startPrologueSequence() {
    initAudio();
    state.inIntro = true;
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    openModal('intro');
    showIntroStep(0);
  }

  // Connect to title screen "Begin" button
  const titleBeginBtn = document.getElementById('sb-title-begin-btn');
  const startOverlay = document.getElementById('start-overlay');
  if (titleBeginBtn) {
    titleBeginBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      if (startOverlay) startOverlay.style.display = 'none';
      startPrologueSequence();
    });
  }

  if (window.location.hash.includes('preview') || window.location.search.includes('preview')) {
    state.inIntro = false;
    state.activeModal = null;
    if (startOverlay) startOverlay.style.display = 'none';
  }

  // -------------------------------------------------------------------------
  // 2. TYPEWRITER DIALOGUE SYSTEM
  // -------------------------------------------------------------------------
  let dialogueQueue = [];
  let typewriterTimer = null;
  let isTypewriting = false;
  let fullCurrentText = '';

  function showDialogue(speaker, lines) {
    if (isTypewriting) {
      clearInterval(typewriterTimer);
      isTypewriting = false;
    }
    dialogueQueue = Array.isArray(lines) ? [...lines] : [lines];

    dialogueSpeaker.textContent = speaker;
    dialogueSpeaker.className = 'sb-speaker-badge';
    if (speaker.includes('Charlie')) dialogueSpeaker.classList.add('sb-speaker-charlie');
    else if (speaker.includes('Kim')) dialogueSpeaker.classList.add('sb-speaker-kim');
    else dialogueSpeaker.classList.add('sb-speaker-note');

    openModal('dialogue');
    advanceDialogue();
  }

  function advanceDialogue() {
    if (isTypewriting) {
      clearInterval(typewriterTimer);
      dialogueText.textContent = fullCurrentText;
      isTypewriting = false;
      return;
    }

    if (dialogueQueue.length === 0) {
      closeAllModals();
      return;
    }

    fullCurrentText = dialogueQueue.shift();
    dialogueText.textContent = '';
    isTypewriting = true;
    let charIdx = 0;

    clearInterval(typewriterTimer);
    typewriterTimer = setInterval(() => {
      charIdx++;
      dialogueText.textContent = fullCurrentText.slice(0, charIdx);
      if (charIdx >= fullCurrentText.length) {
        clearInterval(typewriterTimer);
        isTypewriting = false;
      }
    }, 24);
  }

  dialogueBox.addEventListener('click', advanceDialogue);

  // -------------------------------------------------------------------------
  // 3. RETRO CASSETTE WALKMAN DECK (Hardcoded Exact Subtitles & Clear Steps)
  // -------------------------------------------------------------------------
  const tapeConfigs = [
    {
      id: 1,
      name: 'Roommate Intro',
      sideAFile: 'tape1_side_a.mp3',
      sideBFile: 'tape1_side_b.mp3',
      totalDuration: 16.0,
      spliceStart: 10.0,
      spliceEnd: 13.5,
      secretKey: 'secret1Unlocked',
      sideAText: 'Side A: "Hey guys! I\'m Kim, nineteen, majoring in environmental design, and I promise I\'m usually way more awake than I look in my profile picture. Um, I play a little acoustic guitar, I\'m super neat, and I\'m really excited to meet everyone in the dorm this fall!"',
      sideBText: 'Side B: "Okay. Just make it to Thursday\'s appointment. You already booked it. You just have to get through tonight, Kim. Do it for Char."',
    },
    {
      id: 2,
      name: 'Midnight Guitar',
      sideAFile: 'tape2_side_a.mp3',
      sideBFile: 'tape2_side_b.mp3',
      totalDuration: 11.0,
      spliceStart: 6.5,
      spliceEnd: 9.5,
      secretKey: 'secret2Unlocked',
      sideAText: 'Side A: "Testing, testing... okay, B string is still way too flat. Hold on. Why does this clip-on tuner never work when I actually need it?"',
      sideBText: 'Side B: "I\'m sorry I snapped at you downstairs, Char. It wasn\'t you. My head is just really loud tonight and I don\'t know how to turn it down. I\'ll make you pancakes before school tomorrow, okay?"',
    },
    {
      id: 3,
      name: 'Sunday Drive',
      sideAFile: 'tape3_side_a.mp3',
      sideBFile: 'tape3_side_b.mp3',
      totalDuration: 12.0,
      spliceStart: 7.0,
      spliceEnd: 10.0,
      secretKey: 'secret3Unlocked',
      sideAText: 'Side A: "Okay, rain check on the beach—literally. At least the gas station still had blue raspberry slushies, even if Char spilled half of hers on my floor mats."',
      sideBText: 'Side B: "Note to self: grab extra double-A batteries for Char\'s tape player before I leave for campus, and burn her a mix from one-oh-four point nine\'s midnight set so she doesn\'t miss me too much."',
    },
  ];

  let currentTapeIdx = 0;
  let tapePlayhead = 0.0;
  let isRewinding = false;
  let stabilizationCharge = 0.0;
  let activeVoiceHandle = null;
  let inSpliceWindow = false;

  function refreshTapeButtons() {
    [1, 2, 3].forEach((tapeId, idx) => {
      const btn = document.getElementById(`sb-tape-btn-${tapeId}`);
      const isCollected = state.collectedTapes[tapeId];
      if (isCollected) {
        btn.disabled = false;
        btn.classList.remove('locked');
        btn.textContent = `Tape ${tapeId}: ${tapeConfigs[idx].name}`;
        if (idx === currentTapeIdx) btn.classList.add('active');
        else btn.classList.remove('active');
      } else {
        btn.disabled = true;
        btn.classList.add('locked');
        btn.classList.remove('active');
        btn.textContent = `🔒 Tape ${tapeId} (Not Found Yet)`;
      }
    });

    // Update Splice Zone overlay on track
    const config = tapeConfigs[currentTapeIdx];
    const leftPct = (config.spliceStart / config.totalDuration) * 100;
    const widthPct = ((config.spliceEnd - config.spliceStart) / config.totalDuration) * 100;
    spliceZone.style.left = `${leftPct}%`;
    spliceZone.style.width = `${widthPct}%`;
  }

  function selectTape(idx) {
    if (!state.collectedTapes[idx + 1]) {
      showToast(`Find Tape ${idx + 1} in the bedroom first!`);
      return;
    }

    if (activeVoiceHandle) {
      activeVoiceHandle.stop();
      activeVoiceHandle = null;
    }

    currentTapeIdx = idx;
    tapePlayhead = 0.0;
    stabilizationCharge = 0.0;
    inSpliceWindow = false;

    refreshTapeButtons();
    playTapeVoiceA();
  }

  function playTapeVoiceA() {
    const config = tapeConfigs[currentTapeIdx];
    if (activeVoiceHandle) activeVoiceHandle.stop();
    tapeSubtitles.textContent = config.sideAText;

    playVoiceAudio(config.sideAFile).then((h) => {
      activeVoiceHandle = h;
    });
  }

  document.getElementById('sb-tape-btn-1').addEventListener('click', (e) => { e.currentTarget.blur(); selectTape(0); });
  document.getElementById('sb-tape-btn-2').addEventListener('click', (e) => { e.currentTarget.blur(); selectTape(1); });
  document.getElementById('sb-tape-btn-3').addEventListener('click', (e) => { e.currentTarget.blur(); selectTape(2); });
  closeTapeBtn.addEventListener('click', closeAllModals);

  // Rewind button events
  btnRewind.addEventListener('mousedown', (e) => {
    e.currentTarget.blur();
    isRewinding = true;
    startLoop('tape_rewind_loop');
    if (activeVoiceHandle) { activeVoiceHandle.stop(); activeVoiceHandle = null; }
  });
  window.addEventListener('mouseup', () => {
    if (isRewinding) {
      isRewinding = false;
      stopLoop('tape_rewind_loop');
      if (state.activeModal === 'tape') playTapeVoiceA();
    }
  });

  function updateTapeDeck(delta, isSpaceHeld) {
    if (state.activeModal !== 'tape') return;

    const config = tapeConfigs[currentTapeIdx];
    const total = config.totalDuration;

    if (isRewinding) {
      tapePlayhead = Math.max(0, tapePlayhead - 3.8 * delta);
      reelLeft.className = 'sb-reel rewinding';
      reelRight.className = 'sb-reel rewinding';
    } else {
      tapePlayhead = (tapePlayhead + delta) % total;
      reelLeft.className = 'sb-reel playing';
      reelRight.className = 'sb-reel playing';
    }

    const curSec = Math.floor(tapePlayhead);
    const totSec = Math.floor(total);
    tapeCounter.textContent = `00:${String(curSec).padStart(2, '0')} / 00:${String(totSec).padStart(2, '0')}`;

    const pct = (tapePlayhead / total) * 100;
    tapeNeedle.style.left = `${pct}%`;

    const insideSplice = tapePlayhead >= config.spliceStart && tapePlayhead <= config.spliceEnd;
    const isUnlocked = state[config.secretKey];

    if (insideSplice && !isUnlocked) {
      if (!inSpliceWindow) {
        inSpliceWindow = true;
        playSound('tape_static_burst');
        startLoop('tape_static_loop');
      }

      tapeNeedle.classList.add('amber');
      signalContainer.style.display = 'block';
      tapeStatus.textContent = '⚡ MAGNETIC SPLICE DETECTED';
      tapeStepGuide.className = 'sb-step-guide sb-step-splice';
      tapeStepGuide.textContent = 'Step 2: SPLICE DETECTED! Release Rewind and HOLD [Space] until signal reaches 100%!';
      tapeSubtitles.textContent = '[Faint magnetic splice underneath static... hold Space to stabilize]';

      if (isSpaceHeld) {
        stabilizationCharge = Math.min(100, stabilizationCharge + 75 * delta);
      } else {
        stabilizationCharge = Math.max(0, stabilizationCharge - 25 * delta);
      }

      signalFill.style.width = `${stabilizationCharge}%`;
      signalPct.textContent = `${Math.round(stabilizationCharge)}%`;

      if (stabilizationCharge >= 100) {
        state[config.secretKey] = true;
        state.memoriesFound++;
        hudMemoryCount.textContent = state.memoriesFound;
        stopLoop('tape_static_loop');
        updateObjective();

        if (activeVoiceHandle) activeVoiceHandle.stop();
        playVoiceAudio(config.sideBFile);

        tapeSubtitles.textContent = config.sideBText;
        closeAllModals();
        showDialogue('Kim — Tape B-Side', config.sideBText);
      }
    } else {
      if (inSpliceWindow) {
        inSpliceWindow = false;
        stopLoop('tape_static_loop');
      }
      tapeNeedle.classList.remove('amber');
      signalContainer.style.display = 'none';

      tapeStepGuide.className = 'sb-step-guide sb-step-normal';
      tapeStepGuide.textContent = 'Step 1: Let Side A play past the amber zone, then HOLD [← Left Arrow] or [Rewind] to bounce back into it.';

      if (isUnlocked) {
        tapeStatus.textContent = '✓ B-Side Memory Recovered';
        tapeSubtitles.textContent = config.sideBText;
      } else {
        tapeStatus.textContent = isRewinding ? 'Rewinding...' : 'Side A Playing';
        tapeSubtitles.textContent = config.sideAText;
      }
    }
  }

  // -------------------------------------------------------------------------
  // 4. DETECTIVE DEDUCTION BOARD
  // -------------------------------------------------------------------------
  let selectedLeftCard = null;
  let selectedRightCard = null;

  function openBoard() {
    clueClinic.style.display = state.foundClinicCard ? 'flex' : 'none';
    clueSong.style.display = state.foundSongbook ? 'flex' : 'none';
    cluePolaroid.style.display = state.foundPolaroid ? 'flex' : 'none';

    audioTape1.style.display = state.secret1Unlocked ? 'flex' : 'none';
    audioTape2.style.display = state.secret2Unlocked ? 'flex' : 'none';
    audioTape3.style.display = state.secret3Unlocked ? 'flex' : 'none';

    if (state.match1Solved) { clueClinic.classList.add('solved'); audioTape1.classList.add('solved'); }
    if (state.match2Solved) { clueSong.classList.add('solved'); audioTape2.classList.add('solved'); }
    if (state.match3Solved) { cluePolaroid.classList.add('solved'); audioTape3.classList.add('solved'); }

    selectedLeftCard = null;
    selectedRightCard = null;
    clearBoardSelections();
    updateBoardStatus();
    drawYarnLines();
    openModal('board');
  }

  function clearBoardSelections() {
    document.querySelectorAll('.sb-board-card').forEach((c) => c.classList.remove('selected'));
  }

  function updateBoardStatus() {
    const solvedCount = (state.match1Solved ? 1 : 0) + (state.match2Solved ? 1 : 0) + (state.match3Solved ? 1 : 0);
    const digits = [
      state.match1Solved ? '1' : '_',
      state.match2Solved ? '0' : '_',
      state.match3Solved ? '4' : '_',
    ];

    if (solvedCount === 3) {
      boardStatus.innerHTML = `All 3 pairs connected! Padlock combination: <span style="font-size:18px; color:#ffb86c; font-weight:700;">1 - 0 - 4</span>`;
      updateObjective();
    } else if (solvedCount > 0) {
      boardStatus.innerHTML = `Matches solved: ${solvedCount}/3 — Padlock Code: <strong>${digits.join(' ')}</strong>`;
      updateObjective();
    } else {
      boardStatus.textContent = 'Select one clue on the left and its matching B-side recording on the right.';
    }
  }

  function checkMatch() {
    if (!selectedLeftCard || !selectedRightCard) return;

    let isCorrect = false;
    if (selectedLeftCard === 'clinic' && selectedRightCard === 'tape1') {
      state.match1Solved = true;
      isCorrect = true;
    } else if (selectedLeftCard === 'song' && selectedRightCard === 'tape2') {
      state.match2Solved = true;
      isCorrect = true;
    } else if (selectedLeftCard === 'polaroid' && selectedRightCard === 'tape3') {
      state.match3Solved = true;
      isCorrect = true;
    }

    if (isCorrect) {
      playSound('paper_rustle');
      drawYarnLines();
      updateBoardStatus();
    } else {
      playSound('padlock_dial');
      boardStatus.textContent = 'Those two memories don\'t quite connect. Try another pairing.';
    }

    selectedLeftCard = null;
    selectedRightCard = null;
    clearBoardSelections();
  }

  clueClinic.addEventListener('click', () => { if (!state.match1Solved) { selectedLeftCard = 'clinic'; clearLeftCards(); clueClinic.classList.add('selected'); checkMatch(); } });
  clueSong.addEventListener('click', () => { if (!state.match2Solved) { selectedLeftCard = 'song'; clearLeftCards(); clueSong.classList.add('selected'); checkMatch(); } });
  cluePolaroid.addEventListener('click', () => { if (!state.match3Solved) { selectedLeftCard = 'polaroid'; clearLeftCards(); cluePolaroid.classList.add('selected'); checkMatch(); } });

  audioTape1.addEventListener('click', () => { if (!state.match1Solved) { selectedRightCard = 'tape1'; clearRightCards(); audioTape1.classList.add('selected'); checkMatch(); } });
  audioTape2.addEventListener('click', () => { if (!state.match2Solved) { selectedRightCard = 'tape2'; clearRightCards(); audioTape2.classList.add('selected'); checkMatch(); } });
  audioTape3.addEventListener('click', () => { if (!state.match3Solved) { selectedRightCard = 'tape3'; clearRightCards(); audioTape3.classList.add('selected'); checkMatch(); } });

  function clearLeftCards() {
    clueClinic.classList.remove('selected');
    clueSong.classList.remove('selected');
    cluePolaroid.classList.remove('selected');
  }
  function clearRightCards() {
    audioTape1.classList.remove('selected');
    audioTape2.classList.remove('selected');
    audioTape3.classList.remove('selected');
  }

  function drawYarnLines() {
    yarnSvg.innerHTML = '';
    const boardRect = document.getElementById('sb-board-columns').getBoundingClientRect();

    const pairs = [
      { solved: state.match1Solved, left: clueClinic, right: audioTape1 },
      { solved: state.match2Solved, left: clueSong, right: audioTape2 },
      { solved: state.match3Solved, left: cluePolaroid, right: audioTape3 },
    ];

    pairs.forEach(({ solved, left, right }) => {
      if (!solved) return;
      const lRect = left.getBoundingClientRect();
      const rRect = right.getBoundingClientRect();

      const x1 = lRect.right - boardRect.left;
      const y1 = lRect.top + lRect.height / 2 - boardRect.top;
      const x2 = rRect.left - boardRect.left;
      const y2 = rRect.top + rRect.height / 2 - boardRect.top;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2 + 18;
      path.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
      path.setAttribute('stroke', '#e04747');
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      yarnSvg.appendChild(path);
    });
  }

  hudBoardBtn.addEventListener('click', openBoard);
  closeBoardBtn.addEventListener('click', closeAllModals);

  // -------------------------------------------------------------------------
  // 5. 3-DIGIT COMBINATION PADLOCK
  // -------------------------------------------------------------------------
  const padlockDigits = [0, 0, 0];
  [0, 1, 2].forEach((idx) => {
    const dialBtn = document.getElementById(`sb-dial-${idx}`);
    dialBtn.addEventListener('click', () => {
      padlockDigits[idx] = (padlockDigits[idx] + 1) % 10;
      dialBtn.textContent = padlockDigits[idx];
      playSound('padlock_dial');
    });
  });

  btnUnlock.addEventListener('click', () => {
    if (padlockDigits[0] === 1 && padlockDigits[1] === 0 && padlockDigits[2] === 4) {
      state.boxUnlocked = true;
      state.hasSideBTape = true;
      state.blankTapeCollected = true;
      playSound('padlock_open');
      closeAllModals();
      updateObjective();
      showToast("Unlocked keepsake box! Picked up blank Side B tape.");
      showDialogue('Memory Note', [
        'The brass lock pops open with a resonant click.',
        'Inside the keepsake box: my missing brass guitar pick, a polaroid of us at the lake, and a blank cassette tape.',
        'On the tape label, in Kim\'s handwriting: "Side B — For when you learn the chorus."',
        'Charlie picked up the blank "Side B" cassette from inside the box.',
        'I should take this blank Side B tape to Kim\'s cassette player on the desk to record our chorus.',
      ]);
    } else {
      playSound('padlock_dial');
      btnUnlock.style.borderColor = '#e04747';
      setTimeout(() => (btnUnlock.style.borderColor = ''), 600);
    }
  });
  closeLockBtn.addEventListener('click', closeAllModals);
  closeNotepadBtn.addEventListener('click', closeAllModals);

  // -------------------------------------------------------------------------
  // 5.5 TORN COUNSELOR APPOINTMENT CARD PUZZLE
  // -------------------------------------------------------------------------
  const CARD_PIECES = [
    {
      id: 0,
      w: 220, h: 120,
      targetX: 0, targetY: 0,
      initX: 18, initY: 265, initRot: 45,
      title: 'STUDENT WELLNESS CENTER',
      sub: 'CONFIDENTIAL INTAKE',
      detail: 'Patient: Kim M.',
    },
    {
      id: 1,
      w: 220, h: 120,
      targetX: 220, targetY: 0,
      initX: 472, initY: 18, initRot: 315,
      title: 'APPOINTMENT DETAILS',
      sub: 'Thursday, Oct 24 — 3:30 PM',
      detail: 'Room 204 — Dr. E. Vance',
    },
    {
      id: 2,
      w: 146, h: 120,
      targetX: 0, targetY: 120,
      initX: 18, initY: 18, initRot: 90,
      title: 'INTAKE REASON',
      sub: 'Academic stress & insomnia',
      detail: 'Notes: "Needs sleep support"',
    },
    {
      id: 3,
      w: 148, h: 120,
      targetX: 146, targetY: 120,
      initX: 245, initY: 265, initRot: 135,
      title: 'SESSION INFO',
      sub: '50-min Initial Assessment',
      detail: 'Arrival: 10 mins early',
    },
    {
      id: 4,
      w: 146, h: 120,
      targetX: 294, targetY: 120,
      initX: 472, initY: 265, initRot: 225,
      title: 'HEALTH SERVICES',
      sub: 'Status: SCHEDULED',
      detail: 'Official Intake Record',
    },
  ];

  let puzzlePiecesState = [];
  let selectedPuzzlePiece = null;
  let isDraggingPiece = false;
  let dragOffset = { x: 0, y: 0 };

  function initCardPuzzle() {
    scrapsContainer.innerHTML = '';
    cardCompleteBanner.style.display = 'none';

    puzzlePiecesState = CARD_PIECES.map((p) => ({
      ...p,
      x: p.initX,
      y: p.initY,
      rot: p.initRot,
      snapped: false,
    }));

    puzzlePiecesState.forEach((piece) => {
      const el = document.createElement('div');
      el.className = 'sb-card-scrap';
      el.id = `sb-scrap-${piece.id}`;
      el.style.width = `${piece.w}px`;
      el.style.height = `${piece.h}px`;
      el.style.left = `${piece.x}px`;
      el.style.top = `${piece.y}px`;
      el.style.transform = `rotate(${piece.rot}deg)`;

      el.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
          <div style="font-size:10px; font-weight:700; color:#5a4d41; letter-spacing:0.8px;">${piece.title}</div>
          <button class="sb-scrap-rotate-btn" data-id="${piece.id}" title="Rotate 45°">↻</button>
        </div>
        <div style="font-size:12px; font-weight:700; color:#1f2833; margin-bottom:4px; line-height:1.2;">${piece.sub}</div>
        <div style="font-size:10.5px; color:#495565; line-height:1.3;">${piece.detail}</div>
      `;

      const rotBtn = el.querySelector('.sb-scrap-rotate-btn');
      rotBtn.addEventListener('mousedown', (e) => e.stopPropagation());
      rotBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        rotateScrap(piece.id);
      });

      el.addEventListener('mousedown', (e) => {
        if (piece.snapped) return;
        selectedPuzzlePiece = piece.id;
        isDraggingPiece = true;
        const rect = el.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        el.style.zIndex = '40';
      });

      scrapsContainer.appendChild(el);
    });
  }

  function rotateScrap(pieceId) {
    const piece = puzzlePiecesState.find((p) => p.id === pieceId);
    if (!piece || piece.snapped) return;
    piece.rot = (piece.rot + 45) % 360;
    const el = document.getElementById(`sb-scrap-${piece.id}`);
    if (el) {
      el.style.transform = `rotate(${piece.rot}deg)`;
    }
    playSound('paper_rustle');
    checkPieceSnap(piece);
  }

  function checkPieceSnap(piece) {
    if (piece.snapped) return;
    const targetFrame = document.getElementById('sb-card-target-frame');
    const workspace = document.getElementById('sb-puzzle-workspace');
    if (!targetFrame || !workspace) return;

    const frameRect = targetFrame.getBoundingClientRect();
    const wsRect = workspace.getBoundingClientRect();
    const frameLeft = frameRect.left - wsRect.left;
    const frameTop = frameRect.top - wsRect.top;

    const targetPosX = frameLeft + piece.targetX;
    const targetPosY = frameTop + piece.targetY;

    const dist = Math.hypot(piece.x - targetPosX, piece.y - targetPosY);
    const rotAligned = (piece.rot % 360 + 360) % 360 === 0;

    if (dist < 46 && rotAligned) {
      piece.snapped = true;
      piece.x = targetPosX;
      piece.y = targetPosY;
      piece.rot = 0;

      const el = document.getElementById(`sb-scrap-${piece.id}`);
      if (el) {
        el.style.left = `${piece.x}px`;
        el.style.top = `${piece.y}px`;
        el.style.transform = 'rotate(0deg)';
        el.classList.add('snapped');
        el.style.zIndex = '15';
        const rotBtn = el.querySelector('.sb-scrap-rotate-btn');
        if (rotBtn) rotBtn.style.display = 'none';
      }
      playSound('paper_rustle');

      const allDone = puzzlePiecesState.every((p) => p.snapped);
      if (allDone) {
        state.cardPuzzleSolved = true;
        state.foundClinicCard = true;
        cardCompleteBanner.style.display = 'block';
        playSound('padlock_open');
      }
    }
  }

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingPiece || selectedPuzzlePiece === null) return;
    const piece = puzzlePiecesState.find((p) => p.id === selectedPuzzlePiece);
    if (!piece || piece.snapped) return;

    const workspace = document.getElementById('sb-puzzle-workspace');
    if (!workspace) return;
    const wsRect = workspace.getBoundingClientRect();

    let newX = e.clientX - wsRect.left - dragOffset.x;
    let newY = e.clientY - wsRect.top - dragOffset.y;

    newX = Math.max(0, Math.min(wsRect.width - piece.w, newX));
    newY = Math.max(0, Math.min(wsRect.height - piece.h, newY));

    piece.x = newX;
    piece.y = newY;

    const el = document.getElementById(`sb-scrap-${piece.id}`);
    if (el) {
      el.style.left = `${newX}px`;
      el.style.top = `${newY}px`;
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingPiece && selectedPuzzlePiece !== null) {
      const piece = puzzlePiecesState.find((p) => p.id === selectedPuzzlePiece);
      if (piece && !piece.snapped) {
        checkPieceSnap(piece);
        const el = document.getElementById(`sb-scrap-${piece.id}`);
        if (el && !piece.snapped) el.style.zIndex = '10';
      }
      isDraggingPiece = false;
      selectedPuzzlePiece = null;
    }
  });

  cardCompleteBtn.addEventListener('click', () => {
    closeAllModals();
    showDialogue('Memory Note', [
      "The torn pieces line up into Kim's campus health center card.",
      "\"Student Wellness Center — Thursday, 3:30 PM — Kim M.\"",
      "She booked help for two days after she passed. She was trying so hard to hold on, not giving up.",
      "I've added the completed card to the Detective Board [Tab]."
    ]);
    updateObjective();
  });
  closeCardPuzzleBtn.addEventListener('click', closeAllModals);

  // -------------------------------------------------------------------------
  // 5.6 SIDE B OVERDUB & RECORD CLIMAX
  // -------------------------------------------------------------------------
  let isMouseHoldingRecord = false;
  let recordHoldProgress = 0.0;
  let recordReelAngle = 0;

  balanceSlider.addEventListener('input', () => {
    const val = parseInt(balanceSlider.value, 10);
    balanceDisplay.textContent = `${100 - val}% / ${val}%`;
  });

  recordActionBtn.addEventListener('mousedown', () => {
    isMouseHoldingRecord = true;
  });
  window.addEventListener('mouseup', () => {
    isMouseHoldingRecord = false;
  });

  function updateRecordClimax(delta, isRHeld) {
    if (state.activeModal !== 'record') {
      recordHoldProgress = 0;
      return;
    }

    const isEngaged = isMouseHoldingRecord || isRHeld;
    if (isEngaged) {
      recordHoldProgress = Math.min(2.0, recordHoldProgress + delta);
      recordReelAngle = (recordReelAngle + delta * 280) % 360;
      recordReelLeft.style.transform = `rotate(${recordReelAngle}deg)`;
      recordReelRight.style.transform = `rotate(${recordReelAngle}deg)`;

      if (recBtnText) recBtnText.textContent = `${Math.round((recordHoldProgress / 2.0) * 100)}%`;
      recordInstructions.innerHTML = `<span style="color: #ff6b8b;">RECORDING IN PROGRESS (${recordHoldProgress.toFixed(1)}s / 2.0s)...</span>`;
    } else {
      recordHoldProgress = Math.max(0.0, recordHoldProgress - delta * 3.0);
      if (recBtnText) recBtnText.textContent = 'RECORD';
      recordInstructions.innerHTML = `Hold <strong>[R]</strong> on keyboard or click & hold the record button for 2 seconds`;
    }

    const circumference = 276.46;
    const progressRatio = recordHoldProgress / 2.0;
    const dashoffset = circumference * (1.0 - progressRatio);
    recordProgressCircle.style.strokeDashoffset = dashoffset.toFixed(2);

    if (recordHoldProgress >= 2.0) {
      recordHoldProgress = 0;
      isMouseHoldingRecord = false;
      playSound('tape_click');
      closeAllModals();
      triggerEnding();
    }
  }
  closeRecordBtn.addEventListener('click', closeAllModals);

  // -------------------------------------------------------------------------
  // 6. EXACT HARDCODED 4-PART MONOLOGUE ENDING SEQUENCE (3s Pauses)
  // -------------------------------------------------------------------------
  const monologueParts = [
    {
      file: 'final-monologue1.mp3',
      text: 'Six months. I stood outside your bedroom door for six months, terrified that if I opened it, I\'d have to face the exact second I broke everything. Every night since then, my head has been stuck on rewind—playing back that stupid argument in the hallway, wishing I could splice in a different version of myself. One who didn\'t slam the door. One who noticed how quiet you\'d gotten. One who said \'I love you\' instead of \'just leave me alone.\'',
    },
    {
      file: 'final-monologue2.mp3',
      text: 'I came in here tonight looking for proof that it was my fault. Instead, I found a Thursday appointment card you booked to get help. I found a promise to make me pancakes before school. I found half-written chords for my seventeenth birthday, and a reminder to buy double-A batteries so my tape player wouldn\'t die while you were at college.',
    },
    {
      file: 'final-monologue3.mp3',
      text: 'You weren\'t angry at me, Kim. You were fighting a storm inside your own head that nobody else could hear—and even when it was loud enough to drown everything out, you were still planning for tomorrow. You were still looking out for me.',
    },
    {
      file: 'final-monologue4.mp3',
      text: 'I can\'t rewind Side A. I can\'t rewrite the ending, and I\'m going to miss you for the rest of my life. And that\'s okay. Grief doesn\'t mean staying frozen in the dark. So here\'s the chorus you left unfinished, Kim... I\'m finally ready to play the rest of the song.',
    },
  ];

  function triggerEnding() {
    state.gameCompleted = true;
    openModal('ending');
    updateObjective();

    if (onEndingLighting) onEndingLighting();
    startBGGuitar();

    endingOverlay.classList.add('active');
    playMonologueSequence(0);
  }

  function playMonologueSequence(idx) {
    if (idx >= monologueParts.length) {
      setTimeout(() => {
        endingOverlay.classList.add('fade-black');
        monologueCard.style.display = 'none';
        setTimeout(() => {
          endingCredits.style.display = 'block';
        }, 1200);
      }, 3000);
      return;
    }

    const part = monologueParts[idx];

    // Show exact subtitle
    monologueCard.textContent = part.text;
    monologueCard.classList.add('visible');

    // Play voice audio
    playVoiceAudio(part.file, () => {
      // Audio finished! Hide subtitle cleanly, wait 3 seconds silent break, then next part
      monologueCard.classList.remove('visible');
      setTimeout(() => {
        monologueCard.textContent = ''; // subtitle box hidden cleanly
        setTimeout(() => {
          playMonologueSequence(idx + 1);
        }, 1800);
      }, 1200);
    });
  }

  endingReplay.addEventListener('click', () => {
    window.location.reload();
  });

  // -------------------------------------------------------------------------
  // 7. CLUE & TAPE PICKUP HANDLER
  // -------------------------------------------------------------------------
  function inspectClue(clueId) {
    switch (clueId) {
      case 'pickup_tape_1':
        state.collectedTapes[1] = true;
        playSound('tape_click');
        if (onTapePickedUp) onTapePickedUp(1);
        showToast("Picked up Tape 1: Roommate Intro — Play it at Kim's cassette player");
        updateObjective();
        break;

      case 'pickup_tape_2':
        state.collectedTapes[2] = true;
        playSound('tape_click');
        if (onTapePickedUp) onTapePickedUp(2);
        showToast("Picked up Tape 2: Midnight Guitar — Play it at Kim's cassette player");
        updateObjective();
        break;

      case 'pickup_tape_3':
        state.collectedTapes[3] = true;
        playSound('tape_click');
        if (onTapePickedUp) onTapePickedUp(3);
        showToast("Picked up Tape 3: Sunday Drive — Play it at Kim's cassette player");
        updateObjective();
        break;

      case 'notepad':
        playSound('paper_rustle');
        state.foundNotepad = true;
        openModal('notepad');
        break;

      case 'trash_can':
        if (!state.cardPuzzleSolved) {
          playSound('paper_rustle');
          initCardPuzzle();
          openModal('card_puzzle');
        } else {
          showDialogue('Memory Note', [
            'Kim\'s wastebasket. The reassembled appointment card is safely on the Detective Board.',
            '"Student Wellness Center — Thursday, 3:30 PM — Kim M."',
            'She booked help for two days after she passed. She was trying so hard to hold on.',
          ]);
        }
        break;

      case 'guitar':
      case 'songbook':
        playSound('paper_rustle');
        state.foundSongbook = true;
        showDialogue('Memory Note', [
          'Kim\'s acoustic guitar sits on its stand with a capo on the third fret.',
          'Open beside it is a half-written song: "For Char\'s 17th — Capo 3."',
          'She was writing me a birthday song. My birthday was four months away.',
        ]);
        break;

      case 'polaroids':
      case 'camera':
      case 'cardboard_boxes':
        playSound('paper_rustle');
        state.foundPolaroid = true;
        showDialogue('Memory Note', [
          'A faded Polaroid of Kim and me drinking gas-station slushies in the rain.',
          'On the back in Kim\'s handwriting: "For my dorm desk — call Char every Sunday."',
          'At the bottom in smaller print: "Midnight indie mix: 104.9 FM."',
        ]);
        break;

      case 'standing_lamp':
        showDialogue('Charlie', [
          'The floor lamp Kim bought at a garage sale with her first paycheck.',
          'She kept it on late every night while working on architectural blueprints.',
        ]);
        break;

      case 'bed':
        showDialogue('Charlie', [
          'Kim\'s quilt is folded neatly at the foot of the bed.',
          'My oversized hoodie she used to steal is still resting on her pillow.',
        ]);
        break;

      case 'mug':
        if (!state.hasClosetKey) {
          state.hasClosetKey = true;
          playSound('padlock_dial');
          showToast("Found Small Brass Key inside tea mug!");
          showDialogue('Charlie', [
            'A ceramic mug with dried chamomile tea rings at the bottom—her favorite.',
            'Wait... resting at the bottom underneath a dried lemon peel is a small brass key.',
            'Kim must have tucked it here so she wouldn\'t misplace it.',
            'This looks like the key to her locked wardrobe closet!'
          ]);
          updateObjective();
        } else {
          showDialogue('Charlie', [
            'Kim\'s chamomile tea mug. I already retrieved the brass key from inside.',
            'She\'d always let her tea go cold while drawing blueprints.',
          ]);
        }
        break;

      case 'chair':
        showDialogue('Charlie', [
          'Her faded green cardigan is draped over the desk chair, just like she left it.',
        ]);
        break;

      case 'closet':
        if (!state.hasClosetKey) {
          playSound('tape_click');
          showDialogue('Charlie', [
            "The wardrobe door is latched shut. There might be a small key somewhere on Kim's desk.",
          ]);
        } else if (!state.collectedTapes[3]) {
          state.closetOpen = true;
          state.collectedTapes[3] = true;
          playSound('padlock_open');
          showToast("Unlocked wardrobe & found Tape 3: Sunday Drive!");
          showDialogue('Charlie', [
            "You unlock the wardrobe with the brass key and find Kim's hidden cassette tape tucked behind her duffel bag!",
            "The label reads: 'Tape 3: Sunday Drive'.",
            "I can now play it at the cassette player on Kim's desk.",
          ]);
          refreshTapeButtons();
          updateObjective();
        } else {
          showDialogue('Charlie', [
            "Kim's wardrobe is unlocked. I already found Tape 3 tucked behind her duffel bag.",
            "Half-empty hangers and her favorite jacket hanging quietly.",
          ]);
        }
        break;

      case 'door':
        showDialogue('Charlie', [
          'I stood outside this door for six months afraid to turn the handle.',
          'I\'m finally here.',
        ]);
        break;

      case 'board':
        openBoard();
        break;

      case 'keepsake_box':
        if (!state.boxUnlocked && !state.hasSideBTape) {
          openModal('lock');
        } else {
          showDialogue('Memory Note', [
            'Inside the keepsake box: my missing brass guitar pick, an early birthday card...',
            '...and a blank cassette labeled "Side B — For when you learn the chorus."',
            'I should put this in the cassette player on the desk.',
          ]);
        }
        break;

      case 'tape_player':
      case 'cassette':
        if ((state.boxUnlocked || state.hasSideBTape) && !state.gameCompleted) {
          openModal('record');
        } else if (!state.gameCompleted) {
          const hasAny = state.collectedTapes[1] || state.collectedTapes[2] || state.collectedTapes[3];
          if (!hasAny) {
            playSound('tape_click');
            showToast("Kim's tapes are scattered around the room. Find one first.");
            showDialogue('Charlie', [
              "Kim's cassette player is empty.",
              "Her tapes are scattered around the bedroom. I should find one first.",
            ]);
            return;
          }

          playSound('tape_click');
          // Find first collected tape
          let firstCollected = 0;
          if (state.collectedTapes[1]) firstCollected = 0;
          else if (state.collectedTapes[2]) firstCollected = 1;
          else if (state.collectedTapes[3]) firstCollected = 2;

          refreshTapeButtons();
          openModal('tape');
          selectTape(firstCollected);
        }
        break;

      default:
        break;
    }
  }

  // -------------------------------------------------------------------------
  // 8. GLOBAL KEYBOARD LISTENERS
  // -------------------------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    // Intro navigation
    if (state.inIntro) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        advanceIntro();
        return;
      }
    }

    // Mute toggle
    if (e.code === 'KeyM') {
      state.muted = !state.muted;
      setMuted(state.muted);
      hudMute.textContent = state.muted ? '[M] 🔇' : '[M] 🔊';
      return;
    }

    // Rotate scrap in card puzzle modal
    if (e.code === 'KeyR' && state.activeModal === 'card_puzzle') {
      e.preventDefault();
      const targetId = selectedPuzzlePiece !== null ? selectedPuzzlePiece : puzzlePiecesState.find((p) => !p.snapped)?.id;
      if (targetId !== undefined) {
        rotateScrap(targetId);
      }
      return;
    }

    // Escape closes modals
    if (e.code === 'Escape' && state.activeModal && state.activeModal !== 'ending' && state.activeModal !== 'intro') {
      closeAllModals();
      return;
    }

    // Tab toggles detective board
    if (e.code === 'Tab') {
      e.preventDefault();
      if (state.activeModal === 'board') {
        closeAllModals();
      } else if (!state.activeModal && !state.inIntro) {
        openBoard();
      }
      return;
    }

    // Prevent Space from triggering button click in tape modal!
    if (e.code === 'Space' && state.activeModal === 'tape') {
      e.preventDefault();
      return;
    }

    // Space advances dialogue
    if (e.code === 'Space' && state.activeModal === 'dialogue') {
      e.preventDefault();
      advanceDialogue();
      return;
    }

    // ArrowLeft rewinds tape
    if (e.code === 'ArrowLeft' && state.activeModal === 'tape' && !isRewinding) {
      isRewinding = true;
      startLoop('tape_rewind_loop');
      if (activeVoiceHandle) { activeVoiceHandle.stop(); activeVoiceHandle = null; }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' && isRewinding) {
      isRewinding = false;
      stopLoop('tape_rewind_loop');
      if (state.activeModal === 'tape') playTapeVoiceA();
    }
  });

  hudMute.addEventListener('click', () => {
    state.muted = !state.muted;
    setMuted(state.muted);
    hudMute.textContent = state.muted ? '[M] 🔇' : '[M] 🔊';
  });

  // -------------------------------------------------------------------------
  // 9. FRAME UPDATE LOOP
  // -------------------------------------------------------------------------
  function update(delta, isSpaceHeld, isRHeld) {
    updateTapeDeck(delta, isSpaceHeld);
    updateRecordClimax(delta, isRHeld);
  }

  // Initialize Objective Bar text
  updateObjective();

  return {
    inspectClue,
    update,
    openBoard,
    startPrologueSequence,
    updateObjective,
  };
}
