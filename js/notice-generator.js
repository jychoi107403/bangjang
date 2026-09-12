/**
 * ============================================================================
 * 스마트 공지 & 규칙 생성기 (notice-generator.js)
 * ============================================================================
 * 역할:
 * 1. 다양한 모임 성격(정모, 스터디, 방 규칙, 온라인 회의)에 맞는 템플릿 제공
 * 2. 실시간 입력값 반영 및 깔끔한 카카오톡 공지문 텍스트 생성
 * 3. 원클릭 클립보드 복사
 */

const NoticeGenerator = {
  // 기본 템플릿 프리셋 데이터
  presets: {
    gathering: {
      title: '🎉 [주말 친목 모임] 9월 정기 모임 안내',
      date: '2026년 9월 19일 (토) 오후 6시 30분',
      location: '강남역 11번 출구 인근 맛집 (상세 장소 투표 진행 중)',
      fee: '1/N 분할 정산 (약 2~3만원 예상)',
      items: '기분 좋은 미소와 즐길 마음 😊\n시간 약속 준수 (지각 시 미리 톡 남겨주세요!)\n신분증 지참',
      footer: '처음 오시는 분들도 환영합니다! 모두 즐거운 시간 보내요 🥂'
    },
    study: {
      title: '📚 [개발/코딩 스터디] 이번 주 스터디 & 과제 공지',
      date: '매주 목요일 저녁 8시 (온라인 디스코드)',
      location: '디스코드 #스터디-1 음성 채널',
      fee: '벌금제 (과제 미제출: 5,000원 / 지각: 2,000원)',
      items: '이번 주 스터디 발표 자료 준비\n사전 코드 리뷰 PR 확인 완료하기\n스터디 시작 5분 전 음성방 입장',
      footer: '꾸준함이 최고의 무기입니다! 오늘도 파이팅 합시다 💻🔥'
    },
    rules: {
      title: '📜 [방장 공지] 우리 방 필수 에티켓 & 방 규칙',
      date: '입장 즉시 적용',
      location: '카카오톡 오픈채팅방 내',
      fee: '해당 없음 (상호 존중 무료 제공)',
      items: '입장 시 닉네임 양식 변경 필수 (예: 이름/나이/지역)\n욕설, 비하, 정치/종교 등 분쟁 유발 발언 절대 금지\n개인 DM 및 무단 광고 적발 시 즉시 강제 퇴장\n친목 도모 및 질문은 언제든 환영합니다!',
      footer: '서로 존중하며 따뜻하고 유익한 방을 만들어가요 🤝'
    },
    online: {
      title: '💻 [프로젝트 회의] 정기 스프린트 씽크 안내',
      date: '2026년 9월 21일 (월) 20:00 ~ 21:00',
      location: '구글 미트 (링크: meet.google.com/xyz-abcd-efg)',
      fee: '무료',
      items: '마이크 및 카메라 정상 작동 여부 사전 확인\n각 파트별 이번 주 진행 상황 및 이슈 정리\n다음 주 스프린트 우선순위 논의',
      footer: '원활한 회의 진행을 위해 시간 엄수 부탁드립니다 🚀'
    }
  },

  /**
   * 모듈 초기화 함수
   */
  init() {
    this.applyPreset('gathering');
    this.renderPreview();
  },

  /**
   * 사용자가 템플릿 셀렉트 박스를 변경했을 때 호출
   */
  onTemplateChange() {
    const select = document.getElementById('noticeTemplateType');
    const type = select ? select.value : 'gathering';
    this.applyPreset(type);
    this.renderPreview();
    showToast('선택한 템플릿으로 양식이 변경되었습니다!', '✨');
  },

  /**
   * 지정된 프리셋 값을 입력 폼에 채워 넣는 함수
   */
  applyPreset(type) {
    const data = this.presets[type];
    if (!data) return;

    const titleInput = document.getElementById('noticeTitle');
    const dateInput = document.getElementById('noticeDate');
    const locInput = document.getElementById('noticeLocation');
    const feeInput = document.getElementById('noticeFee');
    const itemsInput = document.getElementById('noticeItems');
    const footerInput = document.getElementById('noticeFooter');

    if (titleInput) titleInput.value = data.title;
    if (dateInput) dateInput.value = data.date;
    if (locInput) locInput.value = data.location;
    if (feeInput) feeInput.value = data.fee;
    if (itemsInput) itemsInput.value = data.items;
    if (footerInput) footerInput.value = data.footer;
  },

  /**
   * 모든 입력 필드를 깨끗하게 비우는 함수
   */
  resetFields() {
    ['noticeTitle', 'noticeDate', 'noticeLocation', 'noticeFee', 'noticeItems', 'noticeFooter'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.renderPreview();
    showToast('입력 내용이 초기화되었습니다.', '🧹');
  },

  /**
   * 현재 폼의 입력값을 조합하여 공지 텍스트를 구성하고 미리보기에 렌더링
   */
  buildText() {
    const title = (document.getElementById('noticeTitle')?.value || '').trim() || '[공지] 모임 안내';
    const date = (document.getElementById('noticeDate')?.value || '').trim();
    const location = (document.getElementById('noticeLocation')?.value || '').trim();
    const fee = (document.getElementById('noticeFee')?.value || '').trim();
    const rawItems = (document.getElementById('noticeItems')?.value || '').trim();
    const footer = (document.getElementById('noticeFooter')?.value || '').trim();

    let text = `👑 ━━━━━━━━━━━━━━━━━━━\n`;
    text += `📢 ${title}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (date) {
      text += `🗓️ 일시: ${date}\n`;
    }
    if (location) {
      text += `📍 장소: ${location}\n`;
    }
    if (fee) {
      text += `💰 회비/비용: ${fee}\n`;
    }

    if (rawItems) {
      text += `\n📌 [안내 및 준비사항]\n`;
      const itemLines = rawItems.split('\n');
      itemLines.forEach(line => {
        if (line.trim()) {
          text += `  • ${line.trim()}\n`;
        }
      });
    }

    if (footer) {
      text += `\n💬 ${footer}\n`;
    }

    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✍️ 작성: 방장.net (Bangjang.net)`;

    return text;
  },

  /**
   * 실시간 미리보기 화면 업데이트
   */
  renderPreview() {
    const previewBox = document.getElementById('noticePreviewBox');
    if (!previewBox) return;
    previewBox.textContent = this.buildText();
  },

  /**
   * 완성된 공지문을 클립보드에 복사
   */
  copyToClipboard() {
    const text = this.buildText();
    copyToClipboardHelper(text, '카카오톡 공지문이 복사되었습니다! 단톡방에 붙여넣기(Ctrl+V) 하세요.');
  }
};
