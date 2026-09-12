/**
 * ============================================================================
 * 방장 전용 모임 파티 오락 툴킷 (games.js)
 * ============================================================================
 * 모듈 목록:
 * 1. RouletteGame: 회전 룰렛 (부드러운 실시간 회전 애니메이션 완벽 보장)
 * 2. TeamShuffler: 팀/조 나누기 및 발표 순서 뽑기
 * 3. LadderGame: 인터랙티브 사다리 타기
 */

/* ==========================================================================
   1. [애니메이션 완벽 보장] 벌칙 & 메뉴 추천 룰렛 게임 (RouletteGame)
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
    this.ensureCanvas();
    const input = document.getElementById('rouletteItemsInput');
    if (input && !input.value) {
      input.value = this.items.join('\n');
    }
    this.draw();
  },

  ensureCanvas() {
    this.canvas = document.getElementById('rouletteCanvas');
    if (this.canvas) {
      this.canvas.width = 720;
      this.canvas.height = 720;
      this.ctx = this.canvas.getContext('2d');
    }
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
    this.ensureCanvas();
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const center = width / 2;
    const radius = center - 30;
    const count = this.items.length;
    if (count === 0) return;

    const arc = (2 * Math.PI) / count;

    ctx.clearRect(0, 0, width, height);

    // 1. 부채꼴 섹터 그리기
    for (let i = 0; i < count; i++) {
      const angle = this.startAngle + i * arc;
      ctx.fillStyle = this.colors[i % this.colors.length];
      
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.lineTo(center, center);
      ctx.fill();

      // 테두리 구분선
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 2. 텍스트 렌더링
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      
      ctx.translate(
        center + Math.cos(angle + arc / 2) * (radius * 0.62),
        center + Math.sin(angle + arc / 2) * (radius * 0.62)
      );
      ctx.rotate(angle + arc / 2 + Math.PI / 2);
      
      const text = this.items[i];
      const displayText = text.length > 8 ? text.slice(0, 7) + '..' : text;
      ctx.fillText(displayText, -ctx.measureText(displayText).width / 2, 0);
      ctx.restore();
    }

    // 3. 중앙 핀 원
    ctx.beginPath();
    ctx.arc(center, center, 42, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.stroke();

    // 4. 중앙 왕관 이모지
    ctx.fillStyle = '#f59e0b';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', center, center);
  },

  /**
   * [실시간 물리 감속 회전 애니메이션]
   */
  spin() {
    if (this.isSpinning) return;
    this.ensureCanvas();

    if (this.items.length < 2) {
      showToast('룰렛 항목을 최소 2개 이상 입력해주세요.', '⚠️');
      return;
    }

    this.isSpinning = true;
    const btn = document.getElementById('btnSpinRoulette');
    if (btn) {
      btn.textContent = '🎲 힘차게 돌아가는 중...! ✨';
      btn.disabled = true;
    }

    const banner = document.getElementById('rouletteResultBanner');
    if (banner) banner.style.display = 'none';

    // 최소 7바퀴 ~ 최대 10바퀴 회전 + 랜덤 각도
    const spinRounds = 7 + Math.random() * 4;
    const totalRotation = spinRounds * 2 * Math.PI + Math.random() * (2 * Math.PI);
    const duration = 3800; // 3.8초 동안 회전
    const initialStartAngle = this.startAngle;

    let startTime = null;

    const animate = (currentTime) => {
      if (!startTime) {
        startTime = currentTime; // 첫 프레임의 타임스탬프로 정확한 기준점 설정
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 자연스러운 감속 곡선 (Cubic Ease-Out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      this.startAngle = initialStartAngle + totalRotation * easeOut;
      this.draw();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        if (btn) {
          btn.textContent = '🎲 룰렛 다시 돌리기!';
          btn.disabled = false;
        }
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

    showToast(`축하합니다! 🎯 [${winner}] 당첨!`, '🎉');
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

    let members = raw.split(/[,\n\s]+/).map(s => s.trim()).filter(s => s.length > 0);
    if (members.length < 2) {
      showToast('최소 2명 이상의 참가자를 입력해주세요.', '⚠️');
      return;
    }

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
   3. 인터랙티브 사다리 타기 게임 엔진 (LadderGame)
   ========================================================================== */
const LadderGame = {
  canvas: null,
  ctx: null,
  players: ['철수', '영희', '민수', '지수'],
  results: ['당첨🎉', '꽝😢', '커피쏘기☕', '꽝😢'],
  rungs: [],
  levels: 8,
  animating: false,

  init() {
    this.canvas = document.getElementById('ladderCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 560;
    this.canvas.height = 420;
    this.canvas.onclick = (e) => this.handleCanvasClick(e);
    this.generateLadder();
  },

  generateLadder() {
    this.canvas = document.getElementById('ladderCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    const playerInput = document.getElementById('ladderPlayers')?.value || '';
    const resultInput = document.getElementById('ladderResults')?.value || '';

    let parsedPlayers = playerInput.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    let parsedResults = resultInput.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);

    if (parsedPlayers.length >= 2) {
      this.players = parsedPlayers;
    } else {
      this.players = ['철수', '영희', '민수', '지수'];
    }

    if (parsedResults.length > 0) {
      this.results = parsedResults;
    } else {
      this.results = ['당첨🎉', '꽝😢', '커피쏘기☕', '벌칙'];
    }

    while (this.results.length < this.players.length) {
      this.results.push(`결과 ${this.results.length + 1}`);
    }

    this.rungs = [];
    const count = this.players.length;

    for (let l = 1; l <= this.levels; l++) {
      for (let c = 0; c < count - 1; c++) {
        if (Math.random() > 0.45) {
          const prevHasRung = this.rungs.some(r => r.level === l && r.col === c - 1);
          if (!prevHasRung) {
            this.rungs.push({ level: l, col: c });
          }
        }
      }
    }

    this.draw();
    this.renderPlayerButtons();

    const resultText = document.getElementById('ladderResultText');
    if (resultText) {
      resultText.innerHTML = `👉 상단의 <strong>[출발!]</strong> 버튼이나 캔버스 이름을 클릭하여 결과를 확인하세요!`;
    }

    showToast('새로운 사다리가 생성되었습니다!', '🪜');
  },

  renderPlayerButtons() {
    const container = document.getElementById('ladderPlayerButtons');
    if (!container) return;

    container.innerHTML = `
      <div style="display: flex; gap: 0.45rem; flex-wrap: wrap; justify-content: center; margin-bottom: 0.85rem;">
        ${this.players.map((p, idx) => `
          <button type="button" class="btn btn-sm btn-gold" onclick="LadderGame.startLadderForPlayer(${idx})">
            🏃 ${p} 출발!
          </button>
        `).join('')}
        <button type="button" class="btn btn-sm btn-primary" onclick="LadderGame.startAll()">
          ⚡ 전체 결과 보기
        </button>
      </div>
    `;
  },

  handleCanvasClick(e) {
    if (this.animating || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * this.canvas.height;

    const count = this.players.length;
    const paddingX = 60;
    const colWidth = (this.canvas.width - paddingX * 2) / (count - 1);

    if (clickY <= 85) {
      for (let i = 0; i < count; i++) {
        const x = paddingX + i * colWidth;
        if (Math.abs(clickX - x) <= colWidth / 2) {
          this.startLadderForPlayer(i);
          return;
        }
      }
    }
  },

  calculatePath(playerIndex) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const count = this.players.length;
    const paddingX = 60;
    const paddingTop = 60;
    const paddingBottom = 60;
    const colWidth = (w - paddingX * 2) / (count - 1);
    const rowHeight = (h - paddingTop - paddingBottom) / (this.levels + 1);

    let currentCol = playerIndex;
    const points = [];

    points.push({ x: paddingX + currentCol * colWidth, y: paddingTop });

    for (let l = 1; l <= this.levels; l++) {
      const y = paddingTop + l * rowHeight;
      points.push({ x: paddingX + currentCol * colWidth, y });

      const rightRung = this.rungs.find(r => r.level === l && r.col === currentCol);
      const leftRung = this.rungs.find(r => r.level === l && r.col === currentCol - 1);

      if (rightRung) {
        currentCol++;
        points.push({ x: paddingX + currentCol * colWidth, y });
      } else if (leftRung) {
        currentCol--;
        points.push({ x: paddingX + currentCol * colWidth, y });
      }
    }

    points.push({ x: paddingX + currentCol * colWidth, y: h - paddingBottom });

    return { points, finalCol: currentCol, player: this.players[playerIndex], result: this.results[currentCol] };
  },

  startLadderForPlayer(playerIndex) {
    if (this.animating) return;
    const pathData = this.calculatePath(playerIndex);
    this.animating = true;

    showToast(`${pathData.player}님 사다리 출발! 🏃`, '🪜');

    this.animateSinglePath(pathData.points, '#f43f5e', () => {
      this.animating = false;
      const resultText = document.getElementById('ladderResultText');
      if (resultText) {
        resultText.innerHTML = `🎉 <strong>[${pathData.player}]</strong>님의 결과 👉 <span style="font-size: 1.25rem; color: var(--accent-gold); font-weight: 800;">${pathData.result}</span>`;
      }
      showToast(`[${pathData.player}] 👉 ${pathData.result}`, '🎉');
    });
  },

  startAll() {
    if (this.animating) return;
    this.draw();

    const colors = ['#f43f5e', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#06b6d4', '#8b5cf6', '#14b8a6'];
    let summaryHtml = '<div style="margin-top: 0.6rem; text-align: left; background: rgba(15,23,42,0.85); padding: 0.85rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">';

    this.players.forEach((p, idx) => {
      const pathData = this.calculatePath(idx);
      this.drawPathStatic(pathData.points, colors[idx % colors.length]);
      summaryHtml += `<div style="padding: 0.25rem 0; font-size: 0.95rem;">• <strong>${p}</strong>: <span style="color: var(--accent-gold); font-weight: bold;">${pathData.result}</span></div>`;
    });

    summaryHtml += '</div>';
    const resultText = document.getElementById('ladderResultText');
    if (resultText) {
      resultText.innerHTML = `🏆 <strong>전체 사다리 결과</strong> ${summaryHtml}`;
    }
    showToast('전체 결과가 공개되었습니다!', '✨');
  },

  animateSinglePath(points, strokeColor, callback) {
    let currentSegment = 0;
    let progress = 0;
    const speed = 0.09;

    const step = () => {
      if (currentSegment >= points.length - 1) {
        if (callback) callback();
        return;
      }

      const p1 = points[currentSegment];
      const p2 = points[currentSegment + 1];

      progress += speed;
      if (progress >= 1) {
        progress = 0;
        currentSegment++;
      }

      this.draw();

      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = 6;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i <= currentSegment; i++) {
        this.ctx.lineTo(points[i].x, points[i].y);
      }

      if (currentSegment < points.length - 1) {
        const currentX = p1.x + (p2.x - p1.x) * progress;
        const currentY = p1.y + (p2.y - p1.y) * progress;
        this.ctx.lineTo(currentX, currentY);

        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(currentX, currentY, 8, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      } else {
        this.ctx.stroke();
      }

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  },

  drawPathStatic(points, strokeColor) {
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.stroke();
  },

  draw() {
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
    const rowHeight = (h - paddingTop - paddingBottom) / (this.levels + 1);

    for (let i = 0; i < count; i++) {
      const x = paddingX + i * colWidth;

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, h - paddingBottom);
      ctx.stroke();

      ctx.fillStyle = '#6366f1';
      ctx.fillRect(x - 45, paddingTop - 42, 90, 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      const pName = this.players[i].length > 5 ? this.players[i].slice(0, 4) + '..' : this.players[i];
      ctx.fillText(pName, x, paddingTop - 22);

      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(x - 45, h - paddingBottom + 12, 90, 30);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 45, h - paddingBottom + 12, 90, 30);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 13px sans-serif';
      const rName = (this.results[i] || '').length > 6 ? this.results[i].slice(0, 5) + '..' : (this.results[i] || '');
      ctx.fillText(rName, x, h - paddingBottom + 32);
    }

    ctx.strokeStyle = '#818cf8';
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
