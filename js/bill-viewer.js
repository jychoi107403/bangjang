/**
 * ============================================================================
 * 웹 영수증 뷰어 컨트롤러 (bill-viewer.js)
 * ============================================================================
 * 역할:
 * 1. 고유 URL(?bill=UUID)로 접속 시 Supabase에서 영수증 데이터 로드
 * 2. 모바일 친화적 디지털 영수증 렌더링
 * 3. 계좌번호 복사 & 카카오페이/토스 원클릭 송금
 * 4. "나 입금했어요! 🙋‍♂️" 실시간 입금 완료 체크 기능
 * 5. 카카오톡 공식 공유 연계
 */

const BillViewer = {
  currentBill: null,

  async loadBill(billId) {
    const modal = document.getElementById('billViewerModal');
    const content = document.getElementById('billViewerContent');
    if (!modal || !content) return;

    modal.style.display = 'flex';
    content.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem;">
        <div style="font-size: 2rem; margin-bottom: 1rem; animation: spin 1s infinite linear;">⏳</div>
        <p style="color: var(--text-muted); font-size: 1rem;">영수증 데이터를 안전하게 불러오는 중입니다...</p>
      </div>
    `;

    try {
      const bill = await BangjangDB.fetchBill(billId);
      this.currentBill = bill;
      this.render(bill);
    } catch (err) {
      console.error('영수증 로드 실패:', err);
      content.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.8rem;">⚠️</div>
          <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">영수증을 찾을 수 없습니다.</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">링크가 잘못되었거나 삭제된 영수증입니다.</p>
          <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="BillViewer.closeModal()">홈으로 돌아가기</button>
        </div>
      `;
    }
  },

  render(bill) {
    const content = document.getElementById('billViewerContent');
    if (!content) return;

    const members = Array.isArray(bill.members) ? bill.members : [];
    const paidMembers = Array.isArray(bill.paid_members) ? bill.paid_members : [];
    const rounds = Array.isArray(bill.rounds) ? bill.rounds : [];
    const createdDate = new Date(bill.created_at).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const account = bill.decrypted_account || '';
    const payLink = bill.pay_link || '';

    let html = `
      <div class="kakao-preview-card" style="background: #ffffff; color: #1e293b; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); padding: 1.75rem;">
        <div style="text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 1.2rem; margin-bottom: 1.2rem;">
          <span style="font-size: 1.8rem;">👑</span>
          <h2 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-top: 0.3rem;">${bill.title || '모임 회비 정산 영수증'}</h2>
          <span style="font-size: 0.8rem; color: #64748b;">${createdDate} · 방장.net</span>
        </div>

        <div style="background: linear-gradient(135deg, #eef2ff, #f8fafc); border: 1px solid #c7d2fe; border-radius: 14px; padding: 1.2rem; text-align: center; margin-bottom: 1.2rem;">
          <span style="font-size: 0.88rem; color: #4f46e5; font-weight: 700;">🎯 1인당 보내실 금액</span>
          <div style="font-size: 2rem; font-weight: 900; color: #1e1b4b; margin: 0.2rem 0;">
            ${(bill.per_person || 0).toLocaleString()}<span style="font-size: 1.2rem; font-weight: 700;">원</span>
          </div>
          <span style="font-size: 0.8rem; color: #64748b;">총 지출: ${(bill.total_amount || 0).toLocaleString()}원 (${members.length}명 분할)</span>
        </div>

        <div style="margin-bottom: 1.2rem;">
          <h4 style="font-size: 0.92rem; color: #475569; font-weight: 700; margin-bottom: 0.5rem;">📋 지출 상세 내역</h4>
          <div style="background: #f8fafc; border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.88rem;">
            ${rounds.map(r => `
              <div style="display: flex; justify-content: space-between; padding: 0.3rem 0; border-bottom: 1px dashed #e2e8f0;">
                <span style="color: #334155;">• ${r.name || '식사'}</span>
                <span style="font-weight: 700; color: #0f172a;">${(r.amount || 0).toLocaleString()}원</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="margin-bottom: 1.5rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 1rem;">
          <div style="font-size: 0.85rem; font-weight: 700; color: #92400e; margin-bottom: 0.4rem;">🏦 입금 계좌번호</div>
          <div style="font-size: 1.05rem; font-weight: 800; color: #78350f; word-break: break-all; margin-bottom: 0.6rem;">
            ${account || '(계좌번호 정보가 없습니다)'}
          </div>
          <div style="display: flex; gap: 0.5rem;">
            ${account ? `<button class="btn btn-sm btn-gold" style="flex: 1;" onclick="copyToClipboardHelper('${account.replace(/'/g, "\\'")}', '계좌번호가 복사되었습니다!')">📋 계좌번호 복사</button>` : ''}
            ${payLink ? `<a href="${payLink}" target="_blank" class="btn btn-sm btn-primary" style="flex: 1; text-decoration: none;">📲 송금 바로가기</a>` : ''}
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
            <h4 style="font-size: 0.92rem; color: #475569; font-weight: 700;">🙋‍♂️ 입금 확인 (${paidMembers.length}/${members.length}명 완료)</h4>
            <span style="font-size: 0.78rem; color: #10b981; font-weight: 700;">이름을 클릭하면 입금 완료!</span>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            ${members.map(member => {
              const isPaid = paidMembers.includes(member);
              return `
                <button 
                  class="btn btn-sm" 
                  style="background: ${isPaid ? '#dcfce7' : '#f1f5f9'}; color: ${isPaid ? '#15803d' : '#475569'}; border: 1px solid ${isPaid ? '#86efac' : '#cbd5e1'}; font-weight: ${isPaid ? '800' : '600'}; padding: 0.45rem 0.8rem; border-radius: 999px; cursor: pointer;"
                  onclick="BillViewer.togglePaid('${member}')">
                  ${isPaid ? '✔️ ' : '⏳ '}${member} ${isPaid ? '(완료)' : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div style="margin-top: 1.75rem; display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary" style="flex: 1;" onclick="BillViewer.closeModal()">닫기</button>
          <button class="btn btn-gold" style="flex: 2;" onclick="BillViewer.shareLink()">🔗 카카오톡/링크 공유</button>
        </div>
      </div>
    `;

    content.innerHTML = html;
  },

  async togglePaid(memberName) {
    if (!this.currentBill) return;

    let paidMembers = Array.isArray(this.currentBill.paid_members) ? [...this.currentBill.paid_members] : [];
    if (paidMembers.includes(memberName)) {
      paidMembers = paidMembers.filter(m => m !== memberName);
    } else {
      paidMembers.push(memberName);
    }

    this.currentBill.paid_members = paidMembers;
    this.render(this.currentBill);

    try {
      await BangjangDB.updatePaidMembers(this.currentBill.id, paidMembers);
      showToast(`${memberName}님의 입금 상태가 업데이트되었습니다!`, '✨');
    } catch (err) {
      console.error('입금 상태 변경 실패:', err);
      showToast('입금 상태 저장에 실패했습니다.', '⚠️');
    }
  },

  shareLink() {
    if (!this.currentBill) return;
    const url = `${window.location.origin}${window.location.pathname}?bill=${this.currentBill.id}`;
    if (window.KakaoShareHelper) {
      KakaoShareHelper.share('bill', this.currentBill.title, `1인당 금액: ${(this.currentBill.per_person || 0).toLocaleString()}원`, url);
    } else {
      copyToClipboardHelper(url, '영수증 공유 링크가 복사되었습니다! 카톡에 공유하세요.');
    }
  },

  closeModal() {
    const modal = document.getElementById('billViewerModal');
    if (modal) modal.style.display = 'none';
    const url = new URL(window.location);
    url.searchParams.delete('bill');
    window.history.pushState({}, '', url);
  }
};
