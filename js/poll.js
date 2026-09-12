/**
 * ============================================================================
 * 방장 전용 실시간 익명 투표 & 질문함 컨트롤러 (poll.js)
 * ============================================================================
 * 역할:
 * 1. 객관식 투표 / 익명 질문함(AMA) 1분 만에 개설 및 DB 저장
 * 2. 고유 URL(?poll=UUID) 기반 참여 뷰어 및 실시간 응답 제출
 * 3. 실시간 투표 집계 막대 그래프 및 질문 목록 렌더링
 * 4. 내 보관함 자동 아카이빙
 */

const PollManager = {
  currentPoll: null,
  currentResponses: [],

  init() {
    this.renderOptionInputs();
  },

  onTypeChange() {
    const type = document.getElementById('pollTypeSelect')?.value || 'vote';
    const optionsGroup = document.getElementById('pollOptionsGroup');
    const titleInput = document.getElementById('pollTitleInput');

    if (type === 'qna') {
      if (optionsGroup) optionsGroup.style.display = 'none';
      if (titleInput) titleInput.placeholder = '예: 방장에게 바라는 점 또는 익명 건의사항';
    } else {
      if (optionsGroup) optionsGroup.style.display = 'block';
      if (titleInput) titleInput.placeholder = '예: [투표] 이번 주 정기 모임 날짜 투표';
    }
  },

  renderOptionInputs() {
    const container = document.getElementById('pollOptionsContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <input type="text" class="form-input poll-opt" placeholder="선택지 1 (예: 금요일 저녁 7시)">
        <input type="text" class="form-input poll-opt" placeholder="선택지 2 (예: 토요일 낮 1시)">
        <input type="text" class="form-input poll-opt" placeholder="선택지 3 (예: 토요일 저녁 6시)">
      </div>
    `;
  },

  addOptionInput() {
    const container = document.getElementById('pollOptionsContainer');
    if (!container) return;

    const div = container.querySelector('div');
    if (!div) return;

    const count = div.querySelectorAll('.poll-opt').length + 1;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input poll-opt';
    input.placeholder = `선택지 ${count}`;
    div.appendChild(input);
  },

  async createPoll() {
    const title = (document.getElementById('pollTitleInput')?.value || '').trim();
    const desc = (document.getElementById('pollDescInput')?.value || '').trim();
    const type = document.getElementById('pollTypeSelect')?.value || 'vote';

    if (!title) {
      showToast('투표 또는 질문함 제목을 입력해주세요.', '⚠️');
      return;
    }

    let options = [];
    if (type === 'vote') {
      const inputs = document.querySelectorAll('.poll-opt');
      inputs.forEach(input => {
        if (input.value.trim()) options.push(input.value.trim());
      });

      if (options.length < 2) {
        showToast('객관식 투표는 최소 2개 이상의 선택지가 필요합니다.', '⚠️');
        return;
      }
    }

    showToast('새로운 투표/질문 방을 생성하는 중...', '⏳');

    try {
      const pollId = await BangjangDB.createPoll({
        title,
        description: desc,
        pollType: type,
        options
      });

      // 내 보관함에 아카이빙
      if (window.BangjangVault) {
        BangjangVault.add('poll', pollId, title, type === 'vote' ? '객관식 투표' : '익명 Q&A');
      }

      const shareUrl = `${window.location.origin}${window.location.pathname}?poll=${pollId}`;
      await copyToClipboardHelper(shareUrl, '투표함 링크가 생성 & 복사되었습니다! 카톡에 공유하세요.');

      this.loadPoll(pollId);
    } catch (err) {
      console.error('투표함 생성 실패:', err);
      showToast('투표함 생성에 실패했습니다.', '❌');
    }
  },

  async loadPoll(pollId) {
    const modal = document.getElementById('pollViewerModal');
    const content = document.getElementById('pollViewerContent');
    if (!modal || !content) return;

    modal.style.display = 'flex';
    content.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem;">
        <div style="font-size: 2rem; margin-bottom: 1rem; animation: spin 1s infinite linear;">🗳️</div>
        <p style="color: var(--text-muted);">투표 데이터를 실시간으로 불러오는 중...</p>
      </div>
    `;

    try {
      const { poll, responses } = await BangjangDB.fetchPollWithResponses(pollId);
      this.currentPoll = poll;
      this.currentResponses = responses;
      this.renderViewer(poll, responses);
    } catch (err) {
      console.error('투표 데이터 로드 실패:', err);
      content.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.8rem;">⚠️</div>
          <h3 style="font-size: 1.2rem;">투표를 찾을 수 없습니다.</h3>
          <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="PollManager.closeModal()">홈으로 돌아가기</button>
        </div>
      `;
    }
  },

  renderViewer(poll, responses) {
    const content = document.getElementById('pollViewerContent');
    if (!content) return;

    const isVote = poll.poll_type === 'vote';
    const totalCount = responses.length;

    const counts = {};
    if (isVote && Array.isArray(poll.options)) {
      poll.options.forEach(opt => counts[opt] = 0);
      responses.forEach(r => {
        if (r.choice && counts[r.choice] !== undefined) {
          counts[r.choice]++;
        }
      });
    }

    let html = `
      <div class="glass-card" style="background: #1e293b; color: #f8fafc; border-radius: 20px; padding: 1.75rem;">
        <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="badge-new" style="background: var(--primary);">${isVote ? '🗳️ 익명 투표' : '💬 익명 건의/질문함'}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">총 ${totalCount}명 참여</span>
          </div>
          <h2 style="font-size: 1.35rem; font-weight: 800; margin-top: 0.5rem; color: #ffffff;">${poll.title}</h2>
          ${poll.description ? `<p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.3rem;">${poll.description}</p>` : ''}
        </div>

        ${isVote ? `
          <div style="margin-bottom: 1.5rem;">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-gold); margin-bottom: 0.8rem;">
              👉 원하는 항목을 클릭하여 바로 투표하세요!
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${(poll.options || []).map(opt => {
                const count = counts[opt] || 0;
                const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                return `
                  <div 
                    style="position: relative; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.85rem 1rem; cursor: pointer; overflow: hidden; transition: all 0.2s;"
                    onclick="PollManager.submitVote('${opt.replace(/'/g, "\\'")}')">
                    <div style="position: absolute; top: 0; left: 0; bottom: 0; width: ${percent}%; background: rgba(99, 102, 241, 0.25); z-index: 1;"></div>
                    <div style="position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem;">
                      <span style="font-weight: 600;">${opt}</span>
                      <span style="font-size: 0.85rem; font-weight: 800; color: var(--accent-gold);">${count}표 (${percent}%)</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : `
          <div style="margin-bottom: 1.5rem;">
            <div class="form-group">
              <label class="form-label">익명으로 질문 또는 한마디 남기기</label>
              <textarea id="qnaContentInput" class="form-textarea" placeholder="방장에게 하고 싶은 말, 건의사항을 자유롭게 작성해보세요 (완전 익명 보장!)" style="height: 90px;"></textarea>
            </div>
            <button class="btn btn-primary btn-block" onclick="PollManager.submitQna()">
              ✍️ 익명으로 등록하기
            </button>
          </div>

          <div>
            <h4 style="font-size: 0.92rem; color: var(--text-muted); margin-bottom: 0.6rem;">💬 등록된 익명 메시지 (${responses.length}개)</h4>
            <div style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem;">
              ${responses.length === 0 ? '<p style="font-size: 0.85rem; color: var(--text-sub); text-align: center; padding: 1rem;">아직 등록된 메시지가 없습니다. 첫 번째로 작성해보세요!</p>' : ''}
              ${responses.map(r => `
                <div style="background: rgba(15, 23, 42, 0.6); border-radius: 8px; padding: 0.75rem 0.9rem; font-size: 0.9rem; border: 1px solid rgba(255,255,255,0.05);">
                  ${r.content}
                </div>
              `).join('')}
            </div>
          </div>
        `}

        <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
          <button class="btn btn-secondary" style="flex: 1;" onclick="PollManager.closeModal()">닫기</button>
          <button class="btn btn-gold" style="flex: 2;" onclick="PollManager.shareLink()">🔗 투표 링크 복사</button>
        </div>
      </div>
    `;

    content.innerHTML = html;
  },

  async submitVote(choice) {
    if (!this.currentPoll) return;
    try {
      await BangjangDB.submitPollResponse(this.currentPoll.id, choice, null);
      showToast(`'${choice}'에 투표 완료되었습니다!`, '🎉');
      this.loadPoll(this.currentPoll.id);
    } catch (err) {
      console.error('투표 제출 실패:', err);
      showToast('투표 제출에 실패했습니다.', '⚠️');
    }
  },

  async submitQna() {
    if (!this.currentPoll) return;
    const content = (document.getElementById('qnaContentInput')?.value || '').trim();
    if (!content) {
      showToast('내용을 입력해주세요.', '⚠️');
      return;
    }

    try {
      await BangjangDB.submitPollResponse(this.currentPoll.id, null, content);
      showToast('익명 메시지가 등록되었습니다!', '💌');
      this.loadPoll(this.currentPoll.id);
    } catch (err) {
      console.error('메시지 등록 실패:', err);
      showToast('메시지 등록에 실패했습니다.', '⚠️');
    }
  },

  shareLink() {
    if (!this.currentPoll) return;
    const url = `${window.location.origin}${window.location.pathname}?poll=${this.currentPoll.id}`;
    if (window.KakaoShareHelper) {
      KakaoShareHelper.share('poll', this.currentPoll.title, this.currentPoll.description, url);
    } else {
      copyToClipboardHelper(url, '투표함 링크가 복사되었습니다! 단톡방에 공유하세요.');
    }
  },

  closeModal() {
    const modal = document.getElementById('pollViewerModal');
    if (modal) modal.style.display = 'none';
    const url = new URL(window.location);
    url.searchParams.delete('poll');
    window.history.pushState({}, '', url);
  }
};
