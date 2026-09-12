/**
 * ============================================================================
 * 방장 전용 '내 활동 기록 보관함' (vault.js)
 * ============================================================================
 * 역할:
 * 1. 방장이 만든 영수증, 투표함, 클래스룸, 공지문을 브라우저에 자동 보관
 * 2. 언제든 지난 모임 정산 내역이나 투표 링크를 다시 열람 및 복사
 * 3. 탭별 필터링 및 개별 삭제/전체 초기화 지원
 */

const BangjangVault = {
  STORAGE_KEY: 'bangjang_my_vault_history',

  /**
   * 새 활동 기록 추가
   * @param {'bill'|'poll'|'class'|'notice'} type - 유형
   * @param {string} id - 고유 UUID 또는 식별자
   * @param {string} title - 제목/설명
   * @param {string} extra - 부가 정보 (금액, 인원, 날짜 등)
   */
  add(type, id, title, extra = '') {
    const list = this.getAll();
    // 중복 제거 후 최신 항목을 맨 앞에 추가
    const filtered = list.filter(item => !(item.type === type && item.id === id));
    
    filtered.unshift({
      id,
      type,
      title: title || '제목 없음',
      extra: extra || '',
      createdAt: new Date().toISOString()
    });

    // 최대 50개까지 보관
    const trimmed = filtered.slice(0, 50);
    StorageManager.set(this.STORAGE_KEY, trimmed);
  },

  getAll() {
    return StorageManager.get(this.STORAGE_KEY, []);
  },

  remove(type, id) {
    const list = this.getAll();
    const updated = list.filter(item => !(item.type === type && item.id === id));
    StorageManager.set(this.STORAGE_KEY, updated);
    this.render(this.currentFilter || 'all');
    showToast('기록이 보관함에서 삭제되었습니다.', '🗑️');
  },

  clearAll() {
    if (!confirm('내 보관함의 모든 활동 기록을 삭제하시겠습니까?')) return;
    StorageManager.set(this.STORAGE_KEY, []);
    this.render('all');
    showToast('보관함이 모두 비워졌습니다.', '🧹');
  },

  open() {
    const modal = document.getElementById('vaultModal');
    if (modal) {
      modal.style.display = 'flex';
      this.render('all');
    }
  },

  close() {
    const modal = document.getElementById('vaultModal');
    if (modal) modal.style.display = 'none';
  },

  currentFilter: 'all',

  render(filterType = 'all') {
    this.currentFilter = filterType;
    const container = document.getElementById('vaultListContainer');
    if (!container) return;

    // 필터 버튼 활성화 스타일
    const buttons = document.querySelectorAll('.vault-filter-btn');
    buttons.forEach(btn => {
      if (btn.dataset.filter === filterType) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-secondary');
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      }
    });

    const allItems = this.getAll();
    const items = filterType === 'all' ? allItems : allItems.filter(item => item.type === filterType);

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📂</div>
          <p style="font-size: 0.95rem;">보관된 활동 기록이 없습니다.</p>
          <span style="font-size: 0.8rem; color: var(--text-sub);">영수증을 생성하거나 투표함을 개설하면 이곳에 자동으로 기록됩니다!</span>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(item => {
      const dateStr = new Date(item.createdAt).toLocaleDateString('ko-KR', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      let typeBadge = '';
      let actionBtn = '';

      if (item.type === 'bill') {
        typeBadge = '<span class="badge-new" style="background: var(--accent-gold); color: #1e1b4b;">💰 정산 영수증</span>';
        actionBtn = `<button class="btn btn-sm btn-gold" onclick="BillViewer.loadBill('${item.id}'); BangjangVault.close();">영수증 보기</button>`;
      } else if (item.type === 'poll') {
        typeBadge = '<span class="badge-new" style="background: var(--primary);">🗳️ 익명 투표함</span>';
        actionBtn = `<button class="btn btn-sm btn-primary" onclick="PollManager.loadPoll('${item.id}'); BangjangVault.close();">투표함 보기</button>`;
      } else if (item.type === 'class') {
        typeBadge = '<span class="badge-new" style="background: var(--accent-emerald);">🎓 클래스룸</span>';
        actionBtn = `<button class="btn btn-sm btn-primary" onclick="MiniClassroom.loadClassroom('${item.id}'); BangjangVault.close();">과제방 보기</button>`;
      }

      return `
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem; margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            ${typeBadge}
            <span style="font-size: 0.78rem; color: var(--text-muted);">${dateStr}</span>
          </div>
          <div style="font-size: 1.05rem; font-weight: 700; color: #ffffff; margin-bottom: 0.2rem;">${item.title}</div>
          ${item.extra ? `<div style="font-size: 0.85rem; color: var(--accent-gold); margin-bottom: 0.6rem;">${item.extra}</div>` : ''}
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
            ${actionBtn}
            <button class="btn btn-sm btn-danger-outline" onclick="BangjangVault.remove('${item.type}', '${item.id}')">삭제</button>
          </div>
        </div>
      `;
    }).join('');
  }
};
