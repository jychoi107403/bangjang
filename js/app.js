/**
 * ============================================================================
 * 방장.net (Bangjang.net) 메인 앱 컨트롤러 (app.js)
 * ============================================================================
 * 역할:
 * 1. 탭 네비게이션 전환 (메인 화면 접속 시 깔끔한 URL 유지)
 * 2. 전역 토스트 알림 메시지 표시
 * 3. 클립보드 복사 유틸리티
 * 4. 브라우저 로컬스토리지 데이터 보존
 * 5. URL 쿼리 파라미터(?bill=..., ?poll=..., ?class=...) 자동 감지 및 뷰어 실행
 */

// 페이지 로드 시 초기화 실행
document.addEventListener('DOMContentLoaded', () => {
  // 1. URL 파라미터 확인 (?bill=... 또는 ?poll=... 또는 ?class=...)
  const urlParams = new URLSearchParams(window.location.search);
  const billId = urlParams.get('bill');
  const pollId = urlParams.get('poll');
  const classId = urlParams.get('class');

  if (billId && window.BillViewer) {
    BillViewer.loadBill(billId);
  } else if (pollId && window.PollManager) {
    PollManager.loadPoll(pollId);
  } else if (classId && window.MiniClassroom) {
    MiniClassroom.loadClassroom(classId);
  }

  // 2. URL 해시 확인 (#notice, #splitter 등)
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && initialHash !== 'hub' && document.getElementById(`panel-${initialHash}`)) {
    switchTab(initialHash);
  } else {
    // 기본 메인 화면은 #hub 없이 깔끔하게 표시
    switchTab('hub');
  }

  // 3. 각 모듈 초기화
  if (window.NoticeGenerator) NoticeGenerator.init();
  if (window.BillSplitter) BillSplitter.init();
  if (window.RouletteGame) RouletteGame.init();
  if (window.LadderGame) LadderGame.init();
  if (window.PollManager) PollManager.init();
  if (window.StudyRoom) StudyRoom.init();
  if (window.MiniClassroom) MiniClassroom.init();
});

/**
 * [탭 전환 함수]
 * 메인 허브('hub')일 때는 URL 뒤에 #hub를 붙이지 않고 깔끔한 도메인 주소를 유지합니다.
 * @param {string} tabId - 전환할 탭의 고유 ID (예: 'hub', 'notice', 'splitter', 'study' 등)
 */
function switchTab(tabId) {
  // 1. 모든 탭 패널을 숨김 처리
  const panels = document.querySelectorAll('.tab-panel');
  panels.forEach(panel => panel.classList.remove('active'));

  // 2. 모든 상단 탭 버튼의 활성(active) 상태 해제
  const buttons = document.querySelectorAll('.nav-tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  // 3. 선택된 패널 및 버튼 활성화
  const targetPanel = document.getElementById(`panel-${tabId}`);
  const targetBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabId}"]`);

  if (targetPanel) {
    targetPanel.classList.add('active');

    // 메인 홈(hub)일 때는 깔끔하게 도메인만 유지하고, 다른 메뉴일 때만 해시(#) 기록
    if (tabId === 'hub') {
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } else {
      window.location.hash = tabId;
    }
  }

  if (targetBtn) {
    targetBtn.classList.add('active');
  }

  // 4. 모바일 화면 등에서 상단으로 스크롤 부드럽게 이동
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 5. 캔버스 기반 게임 탭으로 이동 시 화면 리사이징 보정
  if (tabId === 'roulette' && window.RouletteGame) {
    setTimeout(() => RouletteGame.draw(), 50);
  } else if (tabId === 'ladder' && window.LadderGame) {
    setTimeout(() => LadderGame.draw(), 50);
  }
}

/**
 * [토스트 알림 표시 함수]
 * @param {string} message - 표시할 메시지 텍스트
 * @param {string} icon - 이모지 또는 아이콘 (기본값: '✨')
 */
function showToast(message, icon = '✨') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  // 3초 후 토스트 자동 제거
  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

/**
 * [클립보드 복사 헬퍼]
 */
async function copyToClipboardHelper(text, successMessage = '클립보드에 복사되었습니다!') {
  if (!text || text.trim() === '') {
    showToast('복사할 내용이 없습니다.', '⚠️');
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    showToast(successMessage, '📋');
  } catch (err) {
    console.error('클립보드 복사 실패:', err);
    showToast('클립보드 복사에 실패했습니다. 직접 복사해주세요.', '❌');
  }
}

/**
 * [로컬스토리지 안전 관리자]
 */
const StorageManager = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(`bangjang_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('로컬스토리지 읽기 에러:', e);
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`bangjang_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('로컬스토리지 저장 에러:', e);
    }
  }
};
