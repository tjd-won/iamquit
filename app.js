// ===== DOM Elements =====
const step1 = document.getElementById('step1');
const stepTranslation = document.getElementById('stepTranslation');
const step2 = document.getElementById('step2');
const stepLoading = document.getElementById('stepLoading');
const step3 = document.getElementById('step3');

const reasonInput = document.getElementById('reason');
const charCount = document.getElementById('charCount');
const toStep2Btn = document.getElementById('toStep2');
const backToStep1FromTranslation = document.getElementById('backToStep1FromTranslation');
const toSignatureStepBtn = document.getElementById('toSignatureStep');
const backToTranslationBtn = document.getElementById('backToTranslation');
const toStep3Btn = document.getElementById('toStep3');
const clearCanvasBtn = document.getElementById('clearCanvas');
const restartBtn = document.getElementById('restart');

const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
const placeholder = document.getElementById('canvasPlaceholder');
const canvasContainer = document.querySelector('.canvas-container');

// Result elements
const letterDate = document.getElementById('letterDate');
const letterReason = document.getElementById('letterReason');
const signatureImage = document.getElementById('signatureImage');

// Share buttons
const shareNative = document.getElementById('shareNative');
const shareDownload = document.getElementById('shareDownload');

// ===== State =====
let isDrawing = false;
let hasDrawn = false;
let lastX = 0;
let lastY = 0;

// ===== Submission Counter =====
const COUNTER_BASE = 2847; // 시작 기본값 (사회적 증거 효과)
const COUNTER_KEY = 'resignation_count';
const submissionCountEl = document.getElementById('submissionCount');

function getCount() {
  const stored = localStorage.getItem(COUNTER_KEY);
  if (stored === null) {
    localStorage.setItem(COUNTER_KEY, COUNTER_BASE.toString());
    return COUNTER_BASE;
  }
  return parseInt(stored, 10);
}

function incrementCount() {
  const current = getCount() + 1;
  localStorage.setItem(COUNTER_KEY, current.toString());
  return current;
}

function animateCount(target) {
  const duration = 1200;
  const start = Math.max(0, target - 30);
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    submissionCountEl.textContent = current.toLocaleString();
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}

// Initialize counter on page load
animateCount(getCount());

// ===== Step Navigation =====
function showStep(stepEl) {
  document.querySelectorAll('.step').forEach(s => {
    s.classList.remove('active', 'visible');
  });
  stepEl.classList.add('active');
  // Trigger reflow for animation
  stepEl.offsetHeight;
  requestAnimationFrame(() => {
    stepEl.classList.add('visible');
  });
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize first step visibility
requestAnimationFrame(() => {
  step1.classList.add('visible');
});

// ===== Step 1: Reason Input =====
reasonInput.addEventListener('input', () => {
  const len = reasonInput.value.length;
  charCount.textContent = len;

  // Near limit indicator
  const charCountEl = document.querySelector('.char-count');
  if (len >= 25) {
    charCountEl.classList.add('near-limit');
  } else {
    charCountEl.classList.remove('near-limit');
  }

  // Enable/disable next button
  toStep2Btn.disabled = len === 0;
});

toStep2Btn.addEventListener('click', () => {
  if (reasonInput.value.trim().length === 0) return;
  // Show translation result
  const raw = reasonInput.value;
  const translated = translateReason(raw);
  document.getElementById('translationBefore').textContent = raw;
  document.getElementById('translationAfter').textContent = translated;
  showStep(stepTranslation);
});

// Back from translation to step1
backToStep1FromTranslation.addEventListener('click', () => {
  showStep(step1);
});

// From translation to signature
toSignatureStepBtn.addEventListener('click', () => {
  showStep(step2);
  initCanvas();
});

// Back from signature to translation
backToTranslationBtn.addEventListener('click', () => {
  showStep(stepTranslation);
});

// ===== Step 2: Signature Canvas =====
function initCanvas() {
  const rect = canvasContainer.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#FFFFFF';
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;

  if (e.touches) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function startDrawing(e) {
  e.preventDefault();
  isDrawing = true;
  const pos = getPos(e);
  lastX = pos.x;
  lastY = pos.y;

  if (!hasDrawn) {
    hasDrawn = true;
    placeholder.classList.add('hidden');
    canvasContainer.classList.add('drawing');
    toStep3Btn.disabled = false;
  }
}

function draw(e) {
  e.preventDefault();
  if (!isDrawing) return;

  const pos = getPos(e);

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();

  lastX = pos.x;
  lastY = pos.y;
}

function stopDrawing(e) {
  if (e) e.preventDefault();
  isDrawing = false;
}

// Pointer Events (works for mouse, touch, trackpad and pen)
canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', draw);
canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointerleave', stopDrawing);
canvas.addEventListener('pointercancel', stopDrawing);

// Prevent scrolling while drawing on mobile
canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

// Clear canvas
clearCanvasBtn.addEventListener('click', () => {
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  hasDrawn = false;
  placeholder.classList.remove('hidden');
  canvasContainer.classList.remove('drawing');
  toStep3Btn.disabled = true;
});

// Back button
// (handled above via backToTranslationBtn)

// ===== Loading Messages =====
const LOADING_MESSAGES = [
  '팀장님과 면담 중..',
  '팀원들과 커피 타임 중..',
  '인수인계 리스트 작성 중..',
  '링크드인 업데이트 중..',
  '짐 빼는 중..',
  '마지막 야근 빼먹는 중..',
  '사원증 반납하는 중..',
  '슬랙봇에 퇴사 알리는 중..',
  '연차 계산 중..',
  '출구 위치 확인 중..',
  'HR팀에 서류 제출 중..',
  '최후의 야근을 그리워하는 중..',
  '모니터 닦는 중..',
  '개인 물품 정리 중..',
];

function getRandomMessages(count) {
  const shuffled = [...LOADING_MESSAGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ===== Step 3: Generate Result =====
const loadingMessageEl = document.getElementById('loadingMessage');

toStep3Btn.addEventListener('click', () => {
  generateResult();

  // Show loading screen
  showStep(stepLoading);

  // Cycle through random messages
  const messages = getRandomMessages(4);
  let msgIndex = 0;
  loadingMessageEl.textContent = messages[0];

  const msgInterval = setInterval(() => {
    msgIndex++;
    if (msgIndex < messages.length) {
      loadingMessageEl.style.animation = 'none';
      loadingMessageEl.offsetHeight; // reflow
      loadingMessageEl.style.animation = 'fadeText 0.4s ease';
      loadingMessageEl.textContent = messages[msgIndex];
    }
  }, 1500);

  // After loading, show result
  setTimeout(() => {
    clearInterval(msgInterval);
    // Increment counter
    const newCount = incrementCount();
    animateCount(newCount);
    showStep(step3);
  }, 4500);
});

// ===== Reason Translator (비격식 → 격식) =====
function translateReason(rawText) {
  const text = rawText.trim().toLowerCase();
  if (!text) return rawText;

  // 매칭된 주제들을 수집 (우선순위 높은 것부터)
  const matched = [];

  // ──── 급여/보상 ────
  if (/월급.*적|월급.*짤|연봉.*낮|연봉.*동결|연봉.*삭감|인상.*없|올려.*안/.test(text)) {
    matched.push('합리적 보상 체계의 부재');
  } else if (/월급|돈|연봉|급여|페이|통장|짤짤이|쥐꼬리|박봉|최저|임금|돈 안|짠|수당|보너스|성과급|인센|인상/.test(text)) {
    matched.push('보수 조건의 개선 필요');
  }

  // ──── 상사/리더십 (세분화) ────
  if (/꼰대|라떼|옛날.*얘기|옛날.*방식|구시대/.test(text)) {
    matched.push('세대 간 소통 방식의 차이');
  } else if (/갑질|막말|소리.*지르|고함|욕|인격|무시|모욕|폭언/.test(text)) {
    matched.push('상호 존중 기반의 소통 환경 부재');
  } else if (/상사|팀장|부장|사장|대표|보스|또라이|상놈|진상|매니저|임원|리더/.test(text)) {
    matched.push('조직 내 리더십 방향성의 차이');
  }

  // ──── 야근/업무량 (세분화) ────
  if (/주말.*출근|휴일.*출근|공휴일.*일/.test(text)) {
    matched.push('휴일 근무의 상시화에 따른 피로');
  } else if (/새벽.*퇴근|밤.*늦|밤새|철야|야근.*매일|맨날.*야근/.test(text)) {
    matched.push('만성적 초과 근무로 인한 소진');
  } else if (/야근|칼퇴|퇴근|주말|휴일|잔업|노예|갈려|혹사|일만|과로|워라밸|일 시킴|업무.*많|일.*많|할 일.*산더미/.test(text)) {
    matched.push('업무 강도 및 근무 환경 재검토');
  }

  // ──── 동료/직장 내 관계 (세분화) ────
  if (/왕따|따돌|괴롭|무시.*당|왕.*따/.test(text)) {
    matched.push('건강한 동료 관계 형성의 어려움');
  } else if (/뒷담|험담|소문|음모|정치|눈치|줄서기/.test(text)) {
    matched.push('투명하지 않은 조직 내 의사소통');
  } else if (/동료|팀원|선배|후배|짬|분위기|사내|직장 내|인간|꼴보|사무실.*사람/.test(text)) {
    matched.push('조직 문화와의 적합성 재고');
  }

  // ──── 성장/자기개발 (세분화) ────
  if (/한계.*느|배울.*없|성장.*없|발전.*없|정체|매너리즘|루틴|반복/.test(text)) {
    matched.push('현 직무에서의 성장 정체감');
  } else if (/성장|배울|공부|발전|커리어|스킬|역량|비전|미래|전망/.test(text)) {
    matched.push('개인 역량 개발 및 경력 설계');
  }

  // ──── 건강/번아웃 (세분화) ────
  if (/번아웃|탈진|소진|무기력|의욕.*없|하기.*싫|관심.*없/.test(text)) {
    matched.push('직무 소진(번아웃)으로 인한 회복 필요');
  } else if (/우울|불안|불면|잠.*못|공황|멘탈|정신.*건강/.test(text)) {
    matched.push('정신 건강 관리 및 치료 목적');
  } else if (/건강|스트레스|병|아프|정신|체력|힘들|지침|피곤|죽겠|살려|몸.*안|허리|목|어깨|두통/.test(text)) {
    matched.push('심신 건강 회복 및 재충전');
  }

  // ──── 여행/휴식 (세분화) ────
  if (/세계.*여행|세계.*일주|배낭.*여행|유럽|동남아|남미|해외/.test(text)) {
    matched.push('글로벌 견문 확대를 위한 장기 계획');
  } else if (/여행|쉬고|놀고|자유|방랑|떠나|배낭|휴식|안식|쉬어|충전/.test(text)) {
    matched.push('자기 탐색을 위한 안식기 필요');
  }

  // ──── 창업/독립 ────
  if (/창업|독립|사업|프리랜서|자영|1인|스타트업|내 일|내 사업|대표.*되|투잡|부업/.test(text)) {
    matched.push('개인 사업 및 독립적 경력 추구');
  }

  // ──── 학업/진학 ────
  if (/대학|학교|석사|박사|유학|진학|공무원|시험|자격증|로스쿨|의대|수능|편입|대학원/.test(text)) {
    matched.push('학업 및 자기계발 목표 달성');
  }

  // ──── 가정/개인사 (세분화) ────
  if (/육아|아이.*돌|어린이집|유치원|등원/.test(text)) {
    matched.push('자녀 양육을 위한 불가피한 결정');
  } else if (/부모.*간병|부모.*병|부모님.*아프|효도/.test(text)) {
    matched.push('가족 돌봄을 위한 불가피한 결정');
  } else if (/결혼|육아|아이|임신|부모|가족|이사|상경|귀향|출산|시댁|처가/.test(text)) {
    matched.push('가정 사정으로 인한 불가피한 결정');
  }

  // ──── 회사 운영/경영 불안 ────
  if (/망할|폐업|도산|부도|적자|감원|구조조정|정리해고|짤리|해고|계약.*만료|위기/.test(text)) {
    matched.push('조직의 경영 안정성에 대한 우려');
  }

  // ──── 불공정/부당 대우 ────
  if (/차별|불공정|부당|편애|승진.*누락|진급.*안|평가.*불|성과.*인정.*안|무능.*평가|노력.*안 알/.test(text)) {
    matched.push('공정한 평가 체계의 부재');
  }

  // ──── 회의/비효율 ────
  if (/회의|미팅|보고|보고서|결재|서류|문서|이메일|야근.*보고|쓸데없/.test(text)) {
    matched.push('비효율적 업무 프로세스 개선 필요');
  }

  // ──── 꿈/열정 ────
  if (/꿈|열정|하고.*싶|좋아하는|진짜.*원하|음악|그림|예술|작가|유튜브|크리에이터|인플루언서|방송|연기|디자인.*하고/.test(text)) {
    matched.push('개인적 비전 실현을 위한 진로 전환');
  }

  // ──── 문화/가치관 불일치 ────
  if (/가치관|철학|문화.*안 맞|비윤리|양심|도덕|부정|비리|사기|거짓/.test(text)) {
    matched.push('개인 가치관과 조직 문화의 불일치');
  }

  // ──── 욕설/강한 불만 ────
  if (/ㅅㅂ|씨발|시발|좆|개씹|엿|꺼져|때려치|관둘|존나|ㅈㄴ|병신|ㄲㅈ|지긋지긋|질렸|역겹|구역질|못해먹|개판|엉망|더럽|짜증|싫|미치겠|열받|빡치|어이없|한심|황당|썩|망|최악/.test(text)) {
    matched.push('현 직무 환경의 전반적 재검토');
  }

  // ──── 새로운 기회 ────
  if (/이직|제안|스카우트|헤드헌터|오퍼|합격|다른 회사|새 회사|더 좋|더 나은|기회/.test(text)) {
    matched.push('새로운 도전과 성장 기회 모색');
  } else if (/다른|새로|옮기/.test(text)) {
    matched.push('새로운 환경에서의 재도약');
  }

  // ──── 복리후생 ────
  if (/복지|식사|밥|사무실|환경|의자|컴퓨터|장비|시설|화장실|냉난방|에어컨|히터|더워|추워|식당|카페|간식/.test(text)) {
    matched.push('근무 환경 및 복리후생의 개선 필요');
  }

  // ──── 통근/위치 ────
  if (/출퇴근|통근|거리|멀어|교통|지하철|버스|2시간|1시간|왕복|전철|ktx|사무실.*먼/.test(text)) {
    matched.push('출퇴근 여건상의 어려움');
  }

  // ──── 재택/유연근무 ────
  if (/재택|원격|리모트|유연|자율|출근.*강제|사무실.*강제|rto/.test(text)) {
    matched.push('유연한 근무 방식에 대한 니즈');
  }

  // ──── 지루함/흥미상실 ────
  if (/지루|재미없|흥미.*없|따분|심심|하기.*싫|관심.*없|의미.*없|보람.*없/.test(text)) {
    matched.push('직무 적합성 및 업무 동기 재점검');
  }

  // ──── 매니저/관리 부재 ────
  if (/방치|피드백.*없|관심.*없|관리.*안|방임|무관심|혼자.*다|혼자.*함/.test(text)) {
    matched.push('체계적 업무 관리 및 지원 체계 부재');
  }

  // 결과 조합
  if (matched.length === 0) {
    // 매칭 안 되면 부드럽게 감싸기
    return `일신상의 사유로 인한 자발적 퇴직`;
  } else if (matched.length === 1) {
    return matched[0];
  } else {
    // 최대 2개까지 조합
    return matched.slice(0, 2).join(' 및 ');
  }
}

function generateResult() {
  // Date
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  letterDate.textContent = `${year}년   ${month}월   ${day}일`;

  // Reason — translate to formal
  letterReason.textContent = translateReason(reasonInput.value);

  // Signature image
  signatureImage.src = canvas.toDataURL('image/png');
}

// ===== Sharing =====
const SHARE_TEXT = '오늘, 퇴사합니다 ✋ 나만의 사직서를 작성해보세요!';
const SHARE_URL = window.location.href;

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Capture letter as image
async function captureLetterImage() {
  const letterEl = document.getElementById('resignationLetter');
  try {
    const canvas = await html2canvas(letterEl, {
      backgroundColor: '#FFFEF5',
      scale: 2,
      useCORS: true,
      logging: false
    });
    return canvas;
  } catch (err) {
    console.error('html2canvas error:', err);
    return null;
  }
}

// 공유하기 (Web Share API → 링크 복사 폴백)
shareNative.addEventListener('click', () => {
  if (navigator.share) {
    navigator.share({
      title: '오늘, 퇴사합니다 ✋',
      text: SHARE_TEXT,
      url: SHARE_URL,
    }).catch(() => {
      // 사용자 취소 등 — 무시
    });
  } else {
    copyToClipboard();
  }
});

// Download as image
shareDownload.addEventListener('click', async () => {
  const canvas = await captureLetterImage();
  if (canvas) {
    const link = document.createElement('a');
    link.download = `사직서_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('이미지가 저장되었습니다! 📥');
  } else {
    showToast('이미지 저장에 실패했습니다 😢');
  }
});

function copyToClipboard() {
  const text = `${SHARE_TEXT}\n${SHARE_URL}`;
  navigator.clipboard.writeText(text).then(() => {
    showToast('링크가 복사되었습니다! 📋');
  }).catch(() => {
    showToast('복사에 실패했습니다 😢');
  });
}

// ===== Restart =====
restartBtn.addEventListener('click', () => {
  reasonInput.value = '';
  charCount.textContent = '0';
  toStep2Btn.disabled = true;
  hasDrawn = false;
  placeholder.classList.remove('hidden');
  canvasContainer.classList.remove('drawing');
  toStep3Btn.disabled = true;
  showStep(step1);
});

// ===== Handle window resize for canvas =====
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (step2.classList.contains('active')) {
      // Save current drawing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);

      // Reinitialize
      initCanvas();

      // Restore drawing
      if (hasDrawn) {
        const dpr = window.devicePixelRatio || 1;
        ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width / dpr, canvas.height / dpr);
      }
    }
  }, 250);
});
