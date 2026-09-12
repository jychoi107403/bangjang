/**
 * ============================================================================
 * 방장 전용 모임 파티 오락 툴킷 (games.js)
 * ============================================================================
 * 모듈 목록:
 * 1. RouletteGame: 회전 룰렛 (커피 쏘기, 벌칙, 점심 메뉴 등)
 * 2. TeamShuffler: 팀/조 나누기 및 발표 순서 뽑기
 * 3. LadderGame: 인터랙티브 사다리 타기 게임
 */

/* ==========================================================================
   1. 벌칙 & 메뉴 추천 룰렛 게임 (RouletteGame)
   ========================================================================== */
const RouletteGame = {
  items: ['김철수', '이영희', '박민수', '최지수', '정현우', '강서연'],
  colors: ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'],
  startAngle: 0,
  isSpinning: false,
  canvas: null,
  ctx: null,

  presets: {
    coffee: ['김철수', '이영희', '박민수', '최지수', '정현우', '강서연'],
    food: ['삼겹살&소주 🥩', '치킨&맥주 🍗', '피자&파스타 🍕', '초밥&일식 🍣', '마라탕&꿔바로우 🍜', '햄버거 세트 🍔'],
    penalty: ['다음 모임 10분 일찍 오기 ⏰', '노래 한 곡 완창 🎤', '음료수 1개 쏘기 🥤', '방장 칭찬 3가지 하기 👑', '엉덩이로 이름 쓰기 🍑', '벌칙 면제 (행운!) ✨']
  },

  init() {
    this.canvas = document.getElementById('rouletteCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    const input = document.getElementById('rouletteItemsInput');
    if (input) {
      input.value = this.items.join('\n');
    }

    this.draw();
  },

  loadPreset(type) {
    if (this.presets[type]) {
      this.items = [...this.presets[type]];
      const input = document.getElementById('rouletteItemsInput');
      if (input) input.value = this.items.join('\n');
      this.draw();
      showToast('룰렛 프리셋이 적용되었습니다!', '🎯');
    }
  },

  updateFromInput() {
    const input = document.getElementById('rouletteItemsInput');
    if (!input) return;

    const lines = input.value.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (lines.length > 0) {
      this.items = lines;
      this.draw();
    }
  },

  draw() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const center = width / 2;
    const radius = center - 20;
    const count = this.items.length;
    if (count === 0) return;

    const arc = (2 * Math.PI) / count;

    ctx.clearRect(0, 0, width, height);

    // 1. 각 섹터 그리기
    for (let i = 0; i < count; i++) {
      const angle = this.startAngle + i * arc;
      ctx.fillStyle = this.colors[i % this.colors.length];
      
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.lineTo(center, center);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 2. 글자 쓰기
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Pretendard, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      
      ctx.translate(
        center + Math.cos(angle + arc / 2) * (radius * 0.65),
        center + Math.sin(angle + arc / 2) * (radius * 0.65)
      );
      ctx.rotate(angle + arc / 2 + Math.PI / 2);
      
      const text = this.items[i];
      const displayText = text.length > 8 ? text.slice(0, 7) + '..' : text;
      ctx.fillText(displayText, -ctx.measureText(displayText).width / 2, 0);
      ctx.restore();
    }

    // 3. 중앙 중심 핀 원
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e1b4b';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 5;
    ctx.stroke();

    // 4. 중앙 왕관 아이콘
    ctx.fillStyle = '#f59e0b';
    ctx.font = '22px sans-serif';
    ctx.fillText('👑', center - 12, center + 8);
  },

  spin() {
    if (this.isSpinning) return;
    if (this.items.length < 2) {
      showToast('룰렛 항목을 최소 2개 이상 입력해주세요.', '⚠️');
      return;
    }

    this.isSpinning = true;
    const banner = document.getElementById('rouletteResultBanner');
    if (banner) banner.style.display = 'none';

    // 회전 계산: 기본 5~8바퀴 + 랜덤 각도
    const spinRounds = 5 + Math.random() * 3;
    const totalRotation = spinRounds * 2 * Math.PI + Math.random() * (2 * Math.PI);
    const duration = 4000; // 4초 회전
    const startTime = performance.now();
    const initialStartAngle = this.startAngle;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 부드러운 감속 함수 (cubic-bezier ease-out 유사)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      this.startAngle = initialStartAngle + totalRotation * easeOut;
      this.draw();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        this.determineWinner();
      }
    };

    requestAnimationFrame(animate);
  },

  determineWinner() {
    const count = this.items.length;
    const arc = (2 * Math.PI) / count;
    // 화살표는 상단(3 * Math.PI / 2 또는 270도)에 위치
    const normalizedAngle = (1.5 * Math.PI - (this.startAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const winningIndex = Math.floor(normalizedAngle / arc) % count;
    const winner = this.items[winningIndex];

    const banner = document.getElementById('rouletteResultBanner');
    const winnerSpan = document.getElementById('rouletteWinner');
    if (banner && winnerSpan) {
      winnerSpan.textContent = winner;
      banner.style.display = 'block';
    }

    showToast(`축하합니다! 당첨: [${winner}]`, '🎉');
  }
};


/* ==========================================================================
   2. 랜덤 조짜기 & 순서 셔플러 (TeamShuffler)
   ========================================================================== */
const TeamShuffler = {
  lastResultData: null,

  onModeChange() {
    const mode = document.getElementById('teamSplitMode')?.value;
    const group = document.getElementById('teamCountGroup');
    const label = document.getElementById('teamCountLabel');
    const input = document.getElementById('teamCountInput');

    if (!group || !label || !input) return;

    if (mode === 'orderOnly') {
      group.style.display = 'none';
    } else {
      group.style.display = 'block';
      if (mode === 'byTeamCount') {
        label.textContent = '생성할 조(팀) 개수';
        input.value = 2;
      } else {
        label.textContent = '조당 인원 수 (명)';
        input.value = 3;
      }
    }
  },

  shuffle() {
    const raw = (document.getElementById('teamMembersInput')?.value || '').trim();
    if (!raw) {
      showToast('참가자 명단을 먼저 입력해주세요.', '⚠️');
      return;
    }

    // 이름 분리
    let members = raw.split(/[,\n]+/).map(s => s.trim()).filter(s => s.length > 0);
    if (members.length < 2) {
      showToast('최소 2명 이상의 참가자를 입력해주세요.', '⚠️');
      return;
    }

    // 피셔-예이츠 알고리즘으로 무작위 셔플
    for (let i = members.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [members[i], members[j]] = [members[j], members[i]];
    }

    const mode = document.getElementById('teamSplitMode')?.value || 'byTeamCount';
    const num = parseInt(document.getElementById('teamCountInput')?.value, 10) || 2;
    const container = document.getElementById('teamResultContainer');
    if (!container) return;

    let resultHtml = '';
    let copyText = `👑 [방장.net] 랜덤 조짜기 / 순서 결과\n━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (mode === 'orderOnly') {
      // 1. 단순 순서 뽑기
      resultHtml = `
        <div class="team-card" style="width: 100%;">
          <div class="team-card-header">
            <span>🎯 무작위 발표/진행 순서</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">총 ${members.length}명</span>
          </div>
          <ol style="padding-left: 1.25rem; font-size: 0.95rem; line-height: 2;">
            ${members.map((m, idx) => `<li style="color: ${idx === 0 ? 'var(--accent-gold)' : 'var(--text-main)'}; font-weight: ${idx === 0 ? 'bold' : 'normal'};">${m} ${idx === 0 ? '👑 (1번 타자)' : ''}</li>`).join('')}
          </ol>
        </div>
      `;
      members.forEach((m, idx) => {
        copyText += `${idx + 1}번째: ${m}\n`;
      });
    } else {
      // 2. 팀으로 분할
      let teamCount = num;
      if (mode === 'byMemberCount') {
        teamCount = Math.max(1, Math.ceil(members.length / num));
      }

      const teams = Array.from({ length: teamCount }, () => []);
      members.forEach((member, index) => {
        teams[index % teamCount].push(member);
      });

      resultHtml = `<div class="team-grid">`;
      teams.forEach((team, idx) => {
        const teamName = `${idx + 1}조 (${String.fromCharCode(65 + idx)}팀)`;
        resultHtml += `
          <div class="team-card">
            <div class="team-card-header">
              <span>🚩 ${teamName}</span>
              <span style="font-size: 0.78rem; color: var(--text-muted);">${team.length}명</span>
            </div>
            <ul class="team-member-list">
              ${team.map(m => `<li class="team-member-item">• ${m}</li>`).join('')}
            </ul>
          </div>
        `;

        copyText += `🚩 [${teamName}] (${team.length}명)\n`;
        copyText += `  • ${team.join(', ')}\n\n`;
      });
      resultHtml += `</div>`;
    }

    copyText += `━━━━━━━━━━━━━━━━━━━━━\n✨ 생성: 방장.net (Bangjang.net)`;
    this.lastResultData = copyText;

    container.innerHTML = resultHtml;
    showToast('공평하게 조 편성이 완료되었습니다!', '🔀');
  },

  copyResult() {
    if (!this.lastResultData) {
      showToast('먼저 [조 편성하기]를 실행해주세요.', '⚠️');
      return;
    }
    copyToClipboardHelper(this.lastResultData, '조 편성 결과가 복사되었습니다!');
  }
};


/* ==========================================================================
   3. 인터랙티브 사다리 타기 게임 (LadderGame)
   ========================================================================== */
const LadderGame = {
  canvas: null,
  ctx: null,
  players: [],
  results: [],
  rungs: [], // 가로 다리 정보

  init() {
    this.canvas = document.getElementById('ladderCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.generateLadder();
  },

  generateLadder() {
    if (!this.canvas || !this.ctx) return;

    const playerInput = document.getElementById('ladderPlayers')?.value || '';
    const resultInput = document.getElementById('ladderResults')?.value || '';

    this.players = playerInput.split(',').map(s => s.trim()).filter(Boolean);
    this.results = resultInput.split(',').map(s => s.trim()).filter(Boolean);

    if (this.players.length < 2) {
      showToast('참가자는 최소 2명 이상이어야 합니다.', '⚠️');
      return;
    }

    // 결과 개수 맞추기
    while (this.results.length < this.players.length) {
      this.results.push(`결과 ${this.results.length + 1}`);
    }

    // 랜덤 가로선(Rungs) 생성
    this.rungs = [];
    const count = this.players.length;
    const levels = 8; // 사다리 단수

    for (let l = 1; l <= levels; l++) {
      for (let c = 0; c < count - 1; c++) {
        if (Math.random() > 0.5) {
          // 인접한 다리가 겹치지 않게 생성
          const prevHasRung = this.rungs.some(r => r.level === l && r.col === c - 1);
          if (!prevHasRung) {
            this.rungs.push({ level: l, col: c });
          }
        }
      }
    }

    this.draw();
    const resultText = document.getElementById('ladderResultText');
    if (resultText) {
      resultText.textContent = `사다리가 준비되었습니다! 상단의 참가자 이름을 확인하세요.`;
    }
    showToast('새로운 사다리가 생성되었습니다!', '🪜');
  },

  draw(highlightPath = null) {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const count = this.players.length;
    if (count < 2) return;

    ctx.clearRect(0, 0, w, h);

    const paddingX = 60;
    const paddingTop = 60;
    const paddingBottom = 60;
    const colWidth = (w - paddingX * 2) / (count - 1);
    const rowHeight = (h - paddingTop - paddingBottom) / 9;

    // 1. 세로선 및 참가자/결과 텍스트
    for (let i = 0; i < count; i++) {
      const x = paddingX + i * colWidth;

      // 세로선
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, h - paddingBottom);
      ctx.stroke();

      // 상단 참가자 이름
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.players[i], x, paddingTop - 20);

      // 하단 결과 항목
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 15px Pretendard, sans-serif';
      ctx.fillText(this.results[i] || '', x, h - paddingBottom + 30);
    }

    // 2. 가로선 (사다리 발판)
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 4;
    this.rungs.forEach(rung => {
      const x1 = paddingX + rung.col * colWidth;
      const x2 = paddingX + (rung.col + 1) * colWidth;
      const y = paddingTop + rung.level * rowHeight;

      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    });
  }
};
