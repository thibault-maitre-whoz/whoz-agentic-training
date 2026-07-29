// app.js — application logic: state, rendering, navigation, quiz engine
// Depends on: i18n.js (STR, t()) and modules.js (MODULES, LEVELS is defined here, PROMPTING_BP, LEXICON, CHECKLIST)

let currentLang = localStorage.getItem('csd_agentic_training_lang') || 'fr';
let currentModuleId = null;
let userAnswers = {};
let quizSubmitted = false;
const STORAGE_KEY = 'csd_agentic_training_progress';

const LEVELS = [
  { key:'beginner', moduleIds:[1,2,3] },
  { key:'intermediate', moduleIds:[4,10,6,5] },
  { key:'advanced', moduleIds:[9,11,12,13,8] }
];

// Display numbers reflect position in the curriculum (per LEVELS order),
// not the internal `id` used for quiz/progress tracking keys.
const MODULE_DISPLAY_NUMBER = {};
LEVELS.forEach(level => level.moduleIds.forEach(id => {
  MODULE_DISPLAY_NUMBER[id] = Object.keys(MODULE_DISPLAY_NUMBER).length + 1;
}));

function getProgress() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; } }
function saveProgress(p) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
function markCompleted(id) { const p = getProgress(); p[id] = true; saveProgress(p); }
function resetProgress() { if (confirm(t('resetConfirm'))) { localStorage.removeItem(STORAGE_KEY); renderHome(); } }

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('csd_agentic_training_lang', lang);
  applyLangButtons();
  const activeScreen = document.querySelector('.screen.active');
  const id = activeScreen ? activeScreen.id : 'screen-home';
  if (id === 'screen-home') renderHome();
  else if (id === 'screen-module') renderModule();
  else if (id === 'screen-quiz') renderQuiz();
  else if (id === 'screen-shortcuts') renderShortcuts();
  else if (id === 'screen-prompting') renderPrompting();
  else if (id === 'screen-lexicon') renderLexicon();
  else if (id === 'screen-checklist') renderChecklist();
  renderStaticStrings();
}

function applyLangButtons() {
  ['lang-fr-btn','lang-fr-btn-2','lang-fr-btn-sc','lang-fr-btn-bp','lang-fr-btn-lex','lang-fr-btn-cl'].forEach(idn => { const el = document.getElementById(idn); if (el) el.classList.toggle('active', currentLang === 'fr'); });
  ['lang-en-btn','lang-en-btn-2','lang-en-btn-sc','lang-en-btn-bp','lang-en-btn-lex','lang-en-btn-cl'].forEach(idn => { const el = document.getElementById(idn); if (el) el.classList.toggle('active', currentLang === 'en'); });
}

function renderStaticStrings() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('hero-subtitle', t('heroSubtitle'));
  set('progress-label-text', t('progressLabel'));
  set('back-home-label', t('backHome'));
  set('back-module-label', t('backModule'));
  document.querySelectorAll('.back-home-label-x').forEach(el => el.textContent = t('backHome'));
  set('material-label', t('material'));
  set('material-sc-title', t('scTitle'));
  set('material-sc-desc', t('scDesc'));
  set('sc-eyebrow', t('material'));
  set('sc-h2', t('scTitle'));
  set('material-bp-title', t('bpTitle'));
  set('material-bp-desc', t('bpDesc'));
  set('material-lex-title', t('lexTitle'));
  set('material-lex-desc', t('lexDesc'));
  set('material-cl-title', t('clTitle'));
  set('material-cl-desc', t('clDesc'));
  set('reset-btn', t('reset'));
  set('bp-eyebrow', t('material'));
  set('bp-h2', t('bpTitle'));
  set('lex-eyebrow', t('material'));
  set('lex-h2', t('lexTitle'));
  set('cl-eyebrow', t('material'));
  set('cl-h2', t('clTitle'));
  set('submit-label', t('submit'));
  set('retry-label', t('retry'));
  set('result-home-label', t('backHome'));
  document.documentElement.lang = currentLang;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function goHome() { renderHome(); showScreen('screen-home'); }
function openModule(id) {
  currentModuleId = id;
  userAnswers = {};
  quizSubmitted = false;
  const m = MODULES.find(x => x.id === id);
  if (m.hasQuiz === false) markCompleted(m.id);
  renderModule();
  showScreen('screen-module');
}
function goToQuiz() { userAnswers = {}; quizSubmitted = false; renderQuiz(); showScreen('screen-quiz'); }
function goToModule() { showScreen('screen-module'); }
function retryQuiz() { userAnswers = {}; quizSubmitted = false; renderQuiz(); showScreen('screen-quiz'); }

function renderHome() {
  applyLangButtons();
  const progress = getProgress();
  const completed = MODULES.filter(m => MODULE_DISPLAY_NUMBER[m.id] !== undefined && progress[m.id]).length;
  const CURRICULUM_MODULE_COUNT = Object.keys(MODULE_DISPLAY_NUMBER).length;
  const pct = Math.round((completed / CURRICULUM_MODULE_COUNT) * 100);
  document.getElementById('home-progress-text').textContent = `${completed} / ${CURRICULUM_MODULE_COUNT}`;
  document.getElementById('home-progress-fill').style.width = `${pct}%`;
  const levelLabels = { beginner: t('levelBeginner'), intermediate: t('levelIntermediate'), advanced: t('levelAdvanced') };
  const container = document.getElementById('levels-container');
  container.innerHTML = LEVELS.map(level => {
    const mods = level.moduleIds.map(id => MODULES.find(m => m.id === id)).filter(Boolean);
    const cardsHtml = mods.map(m => {
      const done = !!progress[m.id];
      const title = m.title[currentLang];
      const dur = m.duration;
      return `<button class="module-card ${done ? 'completed' : ''}" onclick="openModule(${m.id})">
        <div class="module-num">${MODULE_DISPLAY_NUMBER[m.id]}</div>
        <div class="module-info">
          <div class="module-title">${title}</div>
          <div class="module-meta"><span>${dur} ${t('minRead')}</span>${m.hasQuiz === false ? '' : `<span class="dot">·</span><span>5 ${t('questions')}</span>`}</div>
        </div>
        <div class="module-status"><span class="badge ${done ? 'badge-done' : 'badge-todo'}">${done ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#2aaa87" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> ' + t('validated') : t('todo')}</span></div>
        <svg class="chevron" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 5l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>`;
    }).join('');
    return `<div class="level-section">
      <div class="section-label"><span class="level-badge ${level.key}">${levelLabels[level.key]}</span></div>
      <div class="module-list">${cardsHtml}</div>
    </div>`;
  }).join('');
  renderStaticStrings();
}

function renderModule() {
  const m = MODULES.find(x => x.id === currentModuleId);
  document.getElementById('mod-eyebrow').textContent = `Module ${MODULE_DISPLAY_NUMBER[m.id]} · ${m.duration}`;
  document.getElementById('mod-title').textContent = m.title[currentLang];
  document.getElementById('mod-duration').textContent = `${m.duration} ${t('minReadEst')}`;
  document.getElementById('mod-content').innerHTML = m.content[currentLang];
  applyLangButtons();
}

function renderQuiz() {
  const m = MODULES.find(x => x.id === currentModuleId);
  const qs = m.questions[currentLang];
  document.getElementById('quiz-eyebrow').textContent = `Quiz — Module ${m.id}`;
  document.getElementById('quiz-title').textContent = m.title[currentLang];
  document.getElementById('quiz-subtitle').textContent = `${qs.length} ${t('questions')} · ${t('threshold')} : 3/${qs.length}`;
  document.getElementById('quiz-submit-btn').style.display = '';
  const container = document.getElementById('quiz-questions');
  container.innerHTML = qs.map((q, qi) => `
    <div class="question-block" id="qblock-${qi}">
      <div class="question-num">${t('questionOf')} ${qi + 1} ${t('questionOf2')} ${qs.length}</div>
      <div class="question-text">${q.text}</div>
      <div class="options">${q.options.map((opt, oi) => `<label class="option-label" id="opt-${qi}-${oi}"><input type="radio" name="q${qi}" value="${oi}" onchange="selectAnswer(${qi}, ${oi})" />${opt}</label>`).join('')}</div>
    </div>`).join('');
}

function selectAnswer(qi, oi) { if (quizSubmitted) return; userAnswers[qi] = oi; }

function submitQuiz() {
  const m = MODULES.find(x => x.id === currentModuleId);
  const qs = m.questions[currentLang];
  const total = qs.length;
  const unanswered = qs.map((_, i) => i).filter(i => userAnswers[i] === undefined);
  if (unanswered.length > 0) {
    unanswered.forEach(i => { const b = document.getElementById(`qblock-${i}`); b.style.borderColor = '#e05252'; b.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    return;
  }
  quizSubmitted = true;
  document.getElementById('quiz-submit-btn').style.display = 'none';
  let score = 0;
  qs.forEach((q, qi) => {
    const chosen = userAnswers[qi];
    const correct = q.correct;
    const isCorrect = chosen === correct;
    if (isCorrect) score++;
    q.options.forEach((_, oi) => {
      const label = document.getElementById(`opt-${qi}-${oi}`);
      label.querySelector('input').disabled = true;
      label.classList.add('disabled');
      if (oi === chosen && isCorrect) { label.classList.add('correct'); label.innerHTML = `<span class="option-icon">✓</span> ${q.options[oi]}`; }
      else if (oi === chosen && !isCorrect) { label.classList.add('wrong'); label.innerHTML = `<span class="option-icon">✗</span> ${q.options[oi]}`; }
      else if (oi === correct && !isCorrect) { label.classList.add('was-correct'); label.innerHTML = `<span class="option-icon">✓</span> ${q.options[oi]}`; }
      else { label.innerHTML = q.options[oi]; }
    });
    document.getElementById(`qblock-${qi}`).style.borderColor = isCorrect ? '#34CBA4' : '#e05252';
  });
  setTimeout(() => showResult(score, total), 800);
}

function showResult(score, total) {
  const passed = score >= 3;
  const m = MODULES.find(x => x.id === currentModuleId);
  if (passed) markCompleted(m.id);
  document.getElementById('result-icon').textContent = passed ? '🎉' : '💪';
  document.getElementById('result-icon').className = `result-icon ${passed ? 'pass' : 'fail'}`;
  document.getElementById('result-score').textContent = `${score}/${total}`;
  document.getElementById('result-score-label').textContent = t('correctLabel');
  document.getElementById('result-title').textContent = passed ? t('quizPassTitle') : t('quizFailTitle');
  document.getElementById('result-message').textContent = passed ? t('passMsg')(score, total) : t('failMsg')(score, total);
  document.getElementById('result-retry-btn').style.display = passed ? 'none' : '';
  showScreen('screen-result');
}

function openShortcuts() { renderShortcuts(); showScreen('screen-shortcuts'); }
function openPrompting() { renderPrompting(); showScreen('screen-prompting'); }
function openLexicon() { renderLexicon(); showScreen('screen-lexicon'); }
function openChecklist() { renderChecklist(); showScreen('screen-checklist'); }

function renderShortcuts() {
  const m = MODULES.find(x => x.id === 7);
  document.getElementById('sc-meta').textContent = currentLang === 'fr' ? 'Référence rapide' : 'Quick reference';
  document.getElementById('sc-content').innerHTML = m.content[currentLang];
  applyLangButtons();
}

function renderPrompting() {
  document.getElementById('bp-meta').textContent = currentLang === 'fr' ? 'Référence · Méthode · Setup technique' : 'Reference · Method · Technical setup';
  document.getElementById('bp-content').innerHTML = PROMPTING_BP[currentLang];
  applyLangButtons();
}
function renderLexicon() {
  document.getElementById('lex-meta').textContent = currentLang === 'fr' ? '29 termes · Modèles · Agents · Acteurs · Défis' : '29 terms · Models · Agents · Key players · Challenges';
  document.getElementById('lex-content').innerHTML = LEXICON[currentLang] + `<div style="text-align:center;padding:8px 0 4px"><button class="btn btn-primary" onclick="goHome()">${t('backHome')}</button></div>`;
  applyLangButtons();
}
function renderChecklist() {
  document.getElementById('cl-meta').textContent = currentLang === 'fr' ? '10 points à vérifier avant de publier' : '10 things to check before publishing';
  document.getElementById('cl-content').innerHTML = CHECKLIST[currentLang];
  applyLangButtons();
}

renderHome();
