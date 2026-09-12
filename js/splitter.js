/**
 * ============================================================================
 * 스마트 1/N 회비 정산기 (splitter.js)
 * ============================================================================
 * 역할:
 * 1. 1차, 2차, 3차 등 다단계 지출 내역 동적 추가/관리
 * 2. 참석자별 맞춤 금액 자동 분할 계산
 * 3. 계좌번호 및 간편 송금 링크 포함 카카오톡 송금 안내문 생성
 * 4. [Supabase 연동] 고유 웹 영수증 공유 링크 생성 및 실시간 입금 체크 연계
 * 5. [내 보관함 연동] 생성된 영수증 자동 아카이빙
 */

const BillSplitter = {
  // 차수 데이터 배열
  rounds: [
    { id: 1, name: '1차 식사 (삼겹살)', amount: 120000, attendees: '' }
  ],
  lastResultText: '',

  /**
   * 모듈 초기화
   */
  init() {
    // 저장된 계좌번호가 있다면 불러오기
    const savedAccount = StorageManager.get('saved_account', '');
    const accountInput = document.getElementById('splitAccount');
    if (savedAccount && accountInput) {
      accountInput.value = savedAccount;
    }

    // 기본 참석자 예시 채우기
    const membersInput = document.getElementById('splitMembers');
    if (membersInput && !membersInput.value) {
      membersInput.value = '철수, 영희, 민수, 지수';
    }

    this.renderRoundInputs();
    this.calculate();
  },

  /**
   * 차수 추가 함수 (+ 차수 버튼 클릭 시)
   */
  addRound() {
    const nextId = this.rounds.length > 0 ? Math.max(...this.rounds.map(r => r.id)) + 1 : 1;
    this.rounds.push({
      id: nextId,
      name: `${nextId}차 모임`,
      amount: 0,
      attendees: ''
    });
    this.renderRoundInputs();
    this.calculate();
    showToast(`${nextId}차 지출 항목이 추가되었습니다.`, '➕');
  },

  /**
   * 차수 삭제 함수
   */
  removeRound(id) {
    if (this.rounds.length <= 1) {
      showToast('최소 1개 이상의 지출 내역이 필요합니다.', '⚠️');
      return;
    }
    this.rounds = this.rounds.filter(r => r.id !== id);
    this.renderRoundInputs();
    this.calculate();
    showToast('차수 항목이 삭제되었습니다.', '🗑️');
  },

  /**
   * 차수 입력 필드 UI 렌더링
   */
  renderRoundInputs() {
    const container = document.getElementById('splitRoundList');
    if (!container) return;

    container.innerHTML = '';

    this.rounds.forEach((round, index) => {
      const row = document.createElement('div');
      row.className = 'split-item-list';
      row.innerHTML = `
        <div class="split-item-row" style="display: flex; flex-wrap: wrap; gap: 0.5rem; background: rgba(15, 23, 42, 0.7); padding: 0.8rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 0.5rem;">
          <input type="text" class="form-input" style="flex: 2; min-width: 140px;" placeholder="차수 이름 (예: 1차 식사)" value="${round.name}" oninput="BillSplitter.updateRound(${round.id}, 'name', this.value)">
          <div style="flex: 1.5; display: flex; align-items: center; gap: 0.3rem;">
            <input type="number" class="form-input" placeholder="금액 (원)" value="${round.amount || ''}" oninput="BillSplitter.updateRound(${round.id}, 'amount', this.value)">
            <span style="font-size: 0.85rem; color: var(--text-muted);">원</span>
          </div>
          <button class="btn btn-sm btn-danger-outline" onclick="BillSplitter.removeRound(${round.id})" title="삭제">❌</button>
        </div>
      `;
      container.appendChild(row);
    });
  },

  /**
   * 차수 데이터 업데이트
   */
  updateRound(id, field, value) {
    const target = this.rounds.find(r => r.id === id);
    if (!target) return;

    if (field === 'amount') {
      target.amount = parseInt(value, 10) || 0;
    } else {
      target[field] = value;
    }
    this.calculate();
  },

  /**
   * 계좌번호 로컬스토리지에 저장
   */
  saveAccountToLocal() {
    const account = document.getElementById('splitAccount')?.value || '';
    if (!account.trim()) {
      showToast('저장할 계좌번호를 먼저 입력해주세요.', '⚠️');
      return;
    }
    StorageManager.set('saved_account', account.trim());
    showToast('계좌번호가 브라우저에 안전하게 저장되었습니다!', '💾');
  },

  /**
   * 1/N 정산 계산 및 텍스트 빌드
   */
  calculate() {
    const rawMembers = (document.getElementById('splitMembers')?.value || '').trim();
    const account = (document.getElementById('splitAccount')?.value || '').trim();
    const payLink = (document.getElementById('splitPayLink')?.value || '').trim();

    // 쉼표, 공백, 줄바꿈으로 멤버 분리
    const members = rawMembers.split(/[,\s\n]+/).filter(m => m.trim().length > 0);

    const totalAmount = this.rounds.reduce((sum, r) => sum + (r.amount || 0), 0);
    const memberCount = members.length;

    let resultText = `👑 ━━━━━━━━━━━━━━━━━━━\n`;
    resultText += `🧾 [방장 정산] 모임 회비 1/N 영수증\n`;
    resultText += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    resultText += `👥 총 참석자 (${memberCount}명): ${members.join(', ') || '미입력'}\n\n`;
    resultText += `📌 [지출 상세 내역]\n`;

    this.rounds.forEach((round, idx) => {
      resultText += `  • ${round.name || `${idx + 1}차`}: ${(round.amount || 0).toLocaleString()}원\n`;
    });

    resultText += `─────────────────────\n`;
    resultText += `💵 총 지출 금액: ${totalAmount.toLocaleString()}원\n\n`;

    let perPerson = 0;
    if (memberCount > 0 && totalAmount > 0) {
      perPerson = Math.ceil(totalAmount / memberCount / 10) * 10; // 10원 단위 절상
      resultText += `🎯 1인당 입금액: ${perPerson.toLocaleString()}원\n\n`;
      resultText += `📌 [개인별 정산 현황]\n`;
      members.forEach(member => {
        resultText += `  • ${member}: ${perPerson.toLocaleString()}원\n`;
      });
    } else {
      resultText += `🎯 1인당 입금액: 0원 (금액 및 참석자를 입력해주세요)\n`;
    }

    resultText += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    resultText += `🏦 [입금 계좌 안내]\n`;
    if (account) {
      resultText += `👉 ${account}\n`;
    } else {
      resultText += `👉 (계좌번호를 입력해주세요)\n`;
    }

    if (payLink) {
      resultText += `📲 간편 송금 링크: ${payLink}\n`;
    }

    resultText += `\n입금 후 '입금완료' 톡 하나만 남겨주시면 감사하겠습니다! 🙏\n`;
    resultText += `━━━━━━━━━━━━━━━━━━━━━\n`;
    resultText += `✨ 계산: 방장.net (Bangjang.net)`;

    const resultBox = document.getElementById('splitResultBox');
    if (resultBox) {
      resultBox.textContent = resultText;
    }

    this.lastResultText = resultText;
    this.currentCalculation = {
      totalAmount,
      perPerson,
      members,
      rounds: this.rounds,
      account,
      payLink
    };
  },

  /**
   * [Supabase 연동] 웹 영수증 공유 링크 생성 및 열기
   */
  async createShareableLink() {
    this.calculate();
    const data = this.currentCalculation;

    if (!data.members || data.members.length === 0) {
      showToast('참석자 명단을 먼저 입력해주세요.', '⚠️');
      return;
    }
    if (data.totalAmount <= 0) {
      showToast('지출 금액을 1원 이상 입력해주세요.', '⚠️');
      return;
    }

    showToast('클라우드에 안전하게 영수증을 생성하는 중...', '⏳');

    try {
      const billId = await BangjangDB.saveBill({
        title: '모임 회비 1/N 정산',
        totalAmount: data.totalAmount,
        perPerson: data.perPerson,
        members: data.members,
        rounds: data.rounds,
        account: data.account,
        payLink: data.payLink
      });

      // 내 보관함에 자동 아카이빙
      if (window.BangjangVault) {
        BangjangVault.add('bill', billId, '모임 회비 1/N 정산', `총액: ${data.totalAmount.toLocaleString()}원 (1인당 ${data.perPerson.toLocaleString()}원)`);
      }

      const shareUrl = `${window.location.origin}${window.location.pathname}?bill=${billId}`;
      await copyToClipboardHelper(shareUrl, '웹 영수증 링크가 생성 & 복사되었습니다! 카톡에 공유해보세요.');

      // 바로 웹 영수증 뷰어 모달 띄우기
      if (window.BillViewer) {
        BillViewer.loadBill(billId);
      }
    } catch (err) {
      console.error('영수증 링크 생성 실패:', err);
      showToast('영수증 링크 생성에 실패했습니다. DB 설정을 확인해주세요.', '❌');
    }
  },

  /**
   * 계산된 정산 안내문을 클립보드에 복사
   */
  copyToClipboard() {
    if (!this.lastResultText) {
      this.calculate();
    }
    copyToClipboardHelper(this.lastResultText, '회비 정산 안내문이 복사되었습니다! 카톡에 공유하세요.');
  }
};
