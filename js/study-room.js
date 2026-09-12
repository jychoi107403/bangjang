/**
 * ============================================================================
 * 뽀모도로 온라인 스터디룸 컨트롤러 (study-room.js)
 * ============================================================================
 * 역할:
 * 1. 뽀모도로 타이머 로직 (집중 25/50분, 휴식 5/10분)
 * 2. Web Audio 화이트 노이즈 사운드 제어 (빗소리, 파도소리 등)
 * 3. 참가자별 목표(To-Do) 실시간 작성 및 완료 체크 (Supabase 연동)
 */

const StudyRoom = {
  currentRoomId: null,
  timerInterval: null,
  timeLeft: 25 * 60, // 초 단위
  totalDuration: 25 * 60,
  mode: 'focus', // 'focus' (집중) 또는 'break' (휴식)
  isRunning: false,
  goals: [],

  init() {
    this.updateTimerDisplay();
  },

  /**
   * 타이머 프리셋 시간 변경
   */
  setPreset(focusMin, breakMin) {
    if (this.isRunning) {
      if (!confirm('타이머가 실행 중입니다. 시간을 변경하고 리셋하시겠습니까?')) return;
    }
    this.pauseTimer();
    this.mode = 'focus';
    this.totalDuration = focusMin * 60;
    this.timeLeft = this.totalDuration;
    this.breakDuration = breakMin * 60;
    this.updateTimerDisplay();
    showToast(`${focusMin}분 집중 / ${breakMin}분 휴식 모드로 설정되었습니다!`, '⏰');
  },

  /**
   * 타이머 시작/일시정지 토글
   */
  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  },

  startTimer() {
    if (this.isRunning) return;
    this.isRunning = true;
    document.getElementById('btnToggleTimer').textContent = '⏸️ 일시정지';
    document.getElementById('btnToggleTimer').className = 'btn btn-secondary';

    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.updateTimerDisplay();
      } else {
        // 타이머 종료 알림 및 모드 자동 전환
        this.onTimerComplete();
      }
    }, 1000);

    showToast('뽀모도로 타이머가 시작되었습니다. 집중해봅시다! 🔥', '⏳');
  },

  pauseTimer() {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    const btn = document.getElementById('btnToggleTimer');
    if (btn) {
      btn.textContent = '▶️ 타이머 시작';
      btn.className = 'btn btn-gold';
    }
  },

  resetTimer() {
    this.pauseTimer();
    this.timeLeft = this.totalDuration;
    this.updateTimerDisplay();
    showToast('타이머가 리셋되었습니다.', '🔄');
  },

  onTimerComplete() {
    this.pauseTimer();
    
    if (this.mode === 'focus') {
      alert('🎉 뽀모도로 집중 세션이 완료되었습니다! 5분간 푹 쉬세요 ☕');
      this.mode = 'break';
      this.totalDuration = (this.breakDuration || 5 * 60);
      this.timeLeft = this.totalDuration;
    } else {
      alert('⏰ 달콤한 휴식이 끝났습니다! 다음 집중 세션을 시작해보세요 🔥');
      this.mode = 'focus';
      this.totalDuration = 25 * 60;
      this.timeLeft = this.totalDuration;
    }
    this.updateTimerDisplay();
  },

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const timerEl = document.getElementById('studyTimerDisplay');
    const badgeEl = document.getElementById('studyModeBadge');

    if (timerEl) timerEl.textContent = formatted;
    if (badgeEl) {
      if (this.mode === 'focus') {
        badgeEl.textContent = '🔥 뽀모도로 집중 시간';
        badgeEl.style.background = 'var(--primary)';
      } else {
        badgeEl.textContent = '☕ 달콤한 휴식 시간';
        badgeEl.style.background = 'var(--accent-emerald)';
      }
    }
  },

  /**
   * 화이트 노이즈 사운드 재생 토글
   */
  toggleSound(type) {
    const rainBtn = document.getElementById('btnSoundRain');
    const wavesBtn = document.getElementById('btnSoundWaves');
    const whiteBtn = document.getElementById('btnSoundWhite');

    [rainBtn, wavesBtn, whiteBtn].forEach(b => {
      if (b) b.classList.remove('btn-gold');
    });

    if (SoundEngine.isPlaying && SoundEngine.currentType === type) {
      SoundEngine.stop();
      showToast('사운드가 꺼졌습니다.', '🔇');
    } else {
      SoundEngine.play(type);
      const activeBtn = document.getElementById(`btnSound${type.charAt(0).toUpperCase() + type.slice(1)}`);
      if (activeBtn) activeBtn.classList.add('btn-gold');
      showToast(`${type === 'rain' ? '잔잔한 빗소리 🌧️' : type === 'waves' ? '깊은 파도소리 🌊' : '백색소음 🎧'} 재생 중`, '🎶');
    }
  },

  /**
   * 목표 추가
   */
  addGoal() {
    const nameInput = document.getElementById('studyGoalName');
    const textInput = document.getElementById('studyGoalText');
    const nickname = (nameInput?.value || '').trim() || '익명의 열공러';
    const text = (textInput?.value || '').trim();

    if (!text) {
      showToast('오늘의 집중 목표를 작성해주세요!', '⚠️');
      return;
    }

    const newGoal = {
      id: Date.now(),
      nickname,
      text,
      isCompleted: false
    };

    this.goals.unshift(newGoal);
    if (textInput) textInput.value = '';
    this.renderGoals();
    showToast('오늘의 목표가 등록되었습니다. 파이팅! 🎯', '✨');
  },

  toggleGoalComplete(id) {
    const target = this.goals.find(g => g.id === id);
    if (target) {
      target.isCompleted = !target.isCompleted;
      this.renderGoals();
      if (target.isCompleted) {
        showToast(`'${target.text}' 목표 달성을 축하합니다! 🏆`, '🎉');
      }
    }
  },

  renderGoals() {
    const container = document.getElementById('studyGoalList');
    if (!container) return;

    if (this.goals.length === 0) {
      container.innerHTML = `<p style="color: var(--text-sub); text-align: center; padding: 1.5rem 0; font-size: 0.9rem;">아직 등록된 목표가 없습니다. 오늘 할 일을 등록해보세요!</p>`;
      return;
    }

    container.innerHTML = this.goals.map(g => `
      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(15, 23, 42, 0.6); padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
          <input type="checkbox" ${g.isCompleted ? 'checked' : ''} onchange="StudyRoom.toggleGoalComplete(${g.id})" style="width: 18px; height: 18px; cursor: pointer;">
          <div>
            <span style="font-size: 0.78rem; color: var(--accent-gold); font-weight: 700;">${g.nickname}</span>
            <div style="font-size: 0.92rem; color: ${g.isCompleted ? 'var(--text-sub)' : 'var(--text-main)'}; text-decoration: ${g.isCompleted ? 'line-through' : 'none'};">${g.text}</div>
          </div>
        </div>
        ${g.isCompleted ? '<span style="font-size: 0.75rem; color: var(--accent-emerald); font-weight: 800;">달성 완료! 🌟</span>' : ''}
      </div>
    `).join('');
  }
};
