/**
 * ============================================================================
 * 글로벌 다국어 & 멀티 채널 스마트 공지 생성기 (notice-generator.js)
 * ============================================================================
 * 역할:
 * 1. 접속 국가(브라우저 언어) 자동 감지하여 최적 언어/채널 초기 세팅 (KO, EN, JA, ZH)
 * 2. 채널별 맞춤 포맷팅:
 *    - 🟡 카카오톡/라인 (KakaoTalk / LINE) : 이모지 & 불릿 박스
 *    - 📸 인스타그램 (Instagram / Threads) : 인스타 줄바꿈 공백 + 스마트 추천 해시태그
 *    - 👾 디스코드/슬랙 (Discord / Slack) : 마크다운 문법 (# 헤더, **굵게**, > 인용구)
 *    - 🟢 왓츠앱/페이스북 (WhatsApp / Facebook) : 글로벌 메신저 굵게(*텍스트*) 문법
 * 3. 원클릭 다채널 다이렉트 전송 & 복사 (WhatsApp, Telegram, KakaoTalk, Clipboard)
 */

const NoticeGenerator = {
  // 현재 선택된 언어 및 채널 상태
  currentLang: 'ko',
  currentChannel: 'kakao',
  currentType: 'gathering',

  // 4개 국어 지원 템플릿 프리셋 데이터
  presets: {
    ko: {
      gathering: {
        title: '🎉 [주말 친목 모임] 9월 정기 모임 안내',
        date: '2026년 9월 19일 (토) 오후 6시 30분',
        location: '강남역 11번 출구 인근 맛집 (상세 장소 투표 진행 중)',
        fee: '1/N 분할 정산 (약 2~3만원 예상)',
        items: '기분 좋은 미소와 즐길 마음 😊\n시간 약속 준수 (지각 시 미리 톡 남겨주세요!)\n신분증 지참',
        footer: '처음 오시는 분들도 환영합니다! 모두 즐거운 시간 보내요 🥂',
        hashtags: '#정기모임 #주말모임 #친목모임 #모임공지 #단톡방 #방장넷'
      },
      study: {
        title: '📚 [개발/코딩 스터디] 이번 주 스터디 & 과제 공지',
        date: '매주 목요일 저녁 8시 (온라인 디스코드)',
        location: '디스코드 #스터디-1 음성 채널',
        fee: '벌금제 (과제 미제출: 5,000원 / 지각: 2,000원)',
        items: '이번 주 스터디 발표 자료 준비\n사전 코드 리뷰 PR 확인 완료하기\n스터디 시작 5분 전 음성방 입장',
        footer: '꾸준함이 최고의 무기입니다! 오늘도 파이팅 합시다 💻🔥',
        hashtags: '#스터디 #개발스터디 #코딩스터디 #자기계발 #공부인증 #방장넷'
      },
      rules: {
        title: '📜 [방장 공지] 우리 방 필수 에티켓 & 방 규칙',
        date: '입장 즉시 적용',
        location: '카카오톡 오픈채팅방 내',
        fee: '해당 없음 (상호 존중 무료 제공)',
        items: '입장 시 닉네임 양식 변경 필수 (예: 이름/나이/지역)\n욕설, 비하, 정치/종교 등 분쟁 유발 발언 절대 금지\n개인 DM 및 무단 광고 적발 시 즉시 강제 퇴장\n친목 도모 및 질문은 언제든 환영합니다!',
        footer: '서로 존중하며 따뜻하고 유익한 방을 만들어가요 🤝',
        hashtags: '#오픈채팅 #방규칙 #에티켓 #공지사항 #단톡방규칙'
      },
      online: {
        title: '💻 [프로젝트 회의] 정기 스프린트 씽크 안내',
        date: '2026년 9월 21일 (월) 20:00 ~ 21:00',
        location: '구글 미트 (링크: meet.google.com/xyz-abcd-efg)',
        fee: '무료',
        items: '마이크 및 카메라 정상 작동 여부 사전 확인\n각 파트별 이번 주 진행 상황 및 이슈 정리\n다음 주 스프린트 우선순위 논의',
        footer: '원활한 회의 진행을 위해 시간 엄수 부탁드립니다 🚀',
        hashtags: '#프로젝트 #화상회의 #스프린트 #온라인미팅 #협업'
      }
    },
    en: {
      gathering: {
        title: '🎉 [Weekend Social Meetup] Monthly Gathering & Dinner',
        date: 'Saturday, Sep 19, 2026 @ 6:30 PM',
        location: 'Downtown Lounge & Grill (Near Central Station)',
        fee: 'Split the bill evenly (Approx. $20~$30)',
        items: 'Good vibes and an open mind 😊\nPunctuality (Please message us if running late)\nBring your valid ID',
        footer: 'Newcomers and first-timers are warmly welcomed! See you all there 🥂',
        hashtags: '#Meetup #SocialGathering #WeekendVibes #Party #Networking #Bangjang'
      },
      study: {
        title: '📚 [Coding & Study Group] Weekly Sprint & Homework Notice',
        date: 'Every Thursday @ 8:00 PM EST',
        location: 'Discord #study-room voice channel',
        fee: 'Free (Accountability deposit applies for missed tasks)',
        items: 'Prepare this week’s presentation slides\nComplete peer code reviews on GitHub PR\nJoin voice channel 5 minutes prior to start',
        footer: 'Consistency is key to mastery. Let’s do this! 💻🔥',
        hashtags: '#StudyGroup #CodingCommunity #LearnToCode #SelfImprovement #Productivity'
      },
      rules: {
        title: '📜 [Community Guidelines] Official Server & Group Rules',
        date: 'Effective Immediately upon joining',
        location: 'Official Community Chat',
        fee: 'None (Mutual respect is mandatory)',
        items: 'Set your nickname format upon joining (e.g., Name / City)\nZero tolerance for harassment, hate speech, or spamming\nNo unsolicited direct messaging (DM) or promotions\nConstructive questions and friendly chats are always welcome!',
        footer: 'Let’s build a safe, respectful, and vibrant community together 🤝',
        hashtags: '#CommunityRules #Guidelines #ServerRules #Respect #ChatEtiquette'
      },
      online: {
        title: '💻 [Project Sync] Weekly Team Sprint Meeting',
        date: 'Monday, Sep 21, 2026 @ 8:00 PM - 9:00 PM',
        location: 'Google Meet (Link: meet.google.com/xyz-abcd-efg)',
        fee: 'Free',
        items: 'Check mic and webcam functionality in advance\nSummarize your sprint accomplishments and blockers\nReview upcoming sprint milestone goals',
        footer: 'Please be on time so we can keep the meeting crisp and efficient 🚀',
        hashtags: '#ProjectSync #RemoteWork #SprintMeeting #TeamWork #Agile'
      }
    },
    ja: {
      gathering: {
        title: '🎉 【週末交流オフ会】9月度 定例懇親会・ディナーのご案内',
        date: '2026年9月19日（土）18:30〜',
        location: '渋谷駅近くのダイニングバー（詳細はお店投票中）',
        fee: '割り勘（1人あたり 約3,000円〜4,000円予定）',
        items: '楽しむ気持ちと笑顔 😊\n時間厳守（遅れる場合は事前にご連絡ください）\n身分証のご持参',
        footer: '初参加の方も大歓迎です！みんなで楽しく過ごしましょう 🥂',
        hashtags: '#オフ会 #飲み会 #交流会 #社会人サークル #週末の過ごし方 #Bangjang'
      },
      study: {
        title: '📚 【プログラミング・勉強会】今週の進捗共有＆課題告知',
        date: '毎週木曜日 20:00〜（オンライン Discord）',
        location: 'Discord #勉強会ボイスチャンネル',
        fee: '無料',
        items: '今週の発表スライドやコードの準備\n事前PRレビューの確認\n開始5分前にボイスチャットに入室',
        footer: '継続は力なり！今週も一緒に頑張りましょう 💻🔥',
        hashtags: '#勉強会 #プログラミング #朝活 #スキルアップ #もくもく会'
      },
      rules: {
        title: '📜 【ルーム規約】チャット利用時の基本ルール＆マナー',
        date: '入室時より即時適用',
        location: 'LINEオープンチャット内',
        fee: '無料（お互いの敬意をお願いします）',
        items: '入室後はニックネームの設定をお願いします\n誹謗中傷、荒らし、迷惑行為は即強制退会となります\n無断での個別DM送信や過度な営業・宣伝の禁止\n質問や気軽な雑談は大歓迎です！',
        footer: 'みんなで居心地の良い温かいコミュニティを作りましょう 🤝',
        hashtags: '#オプチャ #グループ規約 #ルール #マナー #コミュニティ'
      },
      online: {
        title: '💻 【定例MTG】週次スプリント進捗共有ミーティング',
        date: '2026年9月21日（月）20:00〜21:00',
        location: 'Google Meet（リンク: meet.google.com/xyz-abcd-efg）',
        fee: '無料',
        items: '事前にマイク・カメラの動作確認\n各担当パートの今週の進捗と課題の整理\n次週のタスク優先順位の確認',
        footer: 'スムーズな進行のため、時間通りのご参加をお願いいたします 🚀',
        hashtags: '#オンライン会議 #定例会 #スプリント #プロジェクト #リモートワーク'
      }
    },
    zh: {
      gathering: {
        title: '🎉 【周末聚会】9月份线下聚会 & 晚餐通知',
        date: '2026年9月19日（周六）18:30',
        location: '市中心餐厅（具体地点投票进行中）',
        fee: 'AA制 平摊（预计人均 150~200元）',
        items: '轻松愉快的心情 😊\n请准时到达（如遇迟到请提前群里报备）\n随身携带有效身份证件',
        footer: '非常欢迎新朋友加入！期待与大家度过美好时光 🥂',
        hashtags: '#同城聚会 #周末去哪儿 #交友聚会 #线下活动 #AA制 #Bangjang'
      },
      study: {
        title: '📚 【编程/学习小组】本周学习与作业通知',
        date: '每周四 晚上 20:00（线上会议）',
        location: '腾讯会议 / Discord 语音频道',
        fee: '免费',
        items: '准备本周的分享资料与演示文档\n完成代码审查（Code Review）\n会议开始前5分钟进入语音房间',
        footer: '持之以恒，共同进步！今晚加油 💻🔥',
        hashtags: '#学习小组 #编程打卡 #自我提升 #线上自习 #自律'
      },
      rules: {
        title: '📜 【群规公告】本群日常交流规范与守则',
        date: '进群即刻生效',
        location: '官方微信群 / QQ群',
        fee: '免费（相互尊重）',
        items: '进群请修改群昵称格式（例如：昵称-城市-职业）\n严禁任何形式的辱骂、广告轰炸与违规言论\n禁止未经同意私加好友或骚扰他人\n欢迎随时提出疑问与友好互动讨论！',
        footer: '让我们共同营造一个温暖、友善的高质量交流社区 🤝',
        hashtags: '#群规 #微信群 #社群运营 #公告 #文明交流'
      },
      online: {
        title: '💻 【项目例会】周度敏捷同步会议通知',
        date: '2026年9月21日（周一）20:00 - 21:00',
        location: '腾讯会议（链接: meeting.tencent.com/xyz）',
        fee: '免费',
        items: '提前测试麦克风与摄像头是否正常\n整理本周任务进度及遇到的阻碍点\n确认下周冲刺计划与优先级',
        footer: '请准时参会，确保高效沟通 🚀',
        hashtags: '#线上会议 #远程办公 #项目管理 #敏捷开发 #工作同步'
      }
    }
  },

  /**
   * 모듈 초기화 함수
   */
  init() {
    this.detectUserLanguage();
    this.applyPreset();
    this.renderPreview();
  },

  /**
   * 사용자의 브라우저 언어 및 국가 자동 감지
   */
  detectUserLanguage() {
    try {
      const browserLang = (navigator.language || (navigator.languages && navigator.languages[0]) || 'ko').toLowerCase();
      
      if (browserLang.startsWith('ko')) {
        this.currentLang = 'ko';
        this.currentChannel = 'kakao';
      } else if (browserLang.startsWith('ja')) {
        this.currentLang = 'ja';
        this.currentChannel = 'kakao'; // LINE/Kakao 포맷
      } else if (browserLang.startsWith('zh')) {
        this.currentLang = 'zh';
        this.currentChannel = 'whatsapp';
      } else {
        this.currentLang = 'en';
        this.currentChannel = 'whatsapp'; // 글로벌 기본 왓츠앱/디스코드
      }

      this.updateLanguageUI();
    } catch (e) {
      console.warn('언어 감지 실패, 기본값(ko) 적용:', e);
      this.currentLang = 'ko';
      this.currentChannel = 'kakao';
    }
  },

  /**
   * 언어 선택 버튼 UI 상태 동기화
   */
  updateLanguageUI() {
    const langBtns = document.querySelectorAll('.lang-select-btn');
    langBtns.forEach(btn => {
      if (btn.getAttribute('data-lang') === this.currentLang) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-secondary');
      } else {
        btn.classList.add('btn-secondary');
        btn.classList.remove('btn-primary');
      }
    });

    const channelBtns = document.querySelectorAll('.channel-select-btn');
    channelBtns.forEach(btn => {
      if (btn.getAttribute('data-channel') === this.currentChannel) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  /**
   * 수동 언어 변경 (한국어, 영어, 일본어, 중국어 버튼 클릭 시)
   */
  setLanguage(lang) {
    if (!this.presets[lang]) return;
    this.currentLang = lang;
    this.updateLanguageUI();
    this.applyPreset();
    this.renderPreview();

    const langNames = { ko: '한국어 🇰🇷', en: 'English 🇺🇸', ja: '日本語 🇯🇵', zh: '中文 🇨🇳' };
    showToast(`${langNames[lang] || lang} 공지 템플릿으로 변경되었습니다!`, '🌍');
  },

  /**
   * 출력 채널 변경 (카카오톡, 인스타그램, 디스코드, 왓츠앱)
   */
  setChannel(channel) {
    this.currentChannel = channel;
    this.updateLanguageUI();
    this.renderPreview();
    
    const channelNames = {
      kakao: '카카오톡/LINE',
      instagram: '인스타그램/Threads',
      discord: '디스코드/슬랙',
      whatsapp: 'WhatsApp/Messenger'
    };
    showToast(`${channelNames[channel] || channel} 포맷으로 미리보기가 전환되었습니다!`, '📱');
  },

  /**
   * 템플릿 유형 변경 핸들러
   */
  onTemplateChange() {
    const select = document.getElementById('noticeTemplateType');
    this.currentType = select ? select.value : 'gathering';
    this.applyPreset();
    this.renderPreview();
    showToast('선택한 템플릿 양식으로 변경되었습니다!', '✨');
  },

  /**
   * 지정된 프리셋 값을 입력 폼에 채워 넣는 함수
   */
  applyPreset() {
    const langGroup = this.presets[this.currentLang] || this.presets.ko;
    const data = langGroup[this.currentType] || langGroup.gathering;
    if (!data) return;

    const titleInput = document.getElementById('noticeTitle');
    const dateInput = document.getElementById('noticeDate');
    const locInput = document.getElementById('noticeLocation');
    const feeInput = document.getElementById('noticeFee');
    const itemsInput = document.getElementById('noticeItems');
    const footerInput = document.getElementById('noticeFooter');
    const hashInput = document.getElementById('noticeHashtags');

    if (titleInput) titleInput.value = data.title;
    if (dateInput) dateInput.value = data.date;
    if (locInput) locInput.value = data.location;
    if (feeInput) feeInput.value = data.fee;
    if (itemsInput) itemsInput.value = data.items;
    if (footerInput) footerInput.value = data.footer;
    if (hashInput) hashInput.value = data.hashtags || '';
  },

  /**
   * 모든 입력 필드를 깨끗하게 비우는 함수
   */
  resetFields() {
    ['noticeTitle', 'noticeDate', 'noticeLocation', 'noticeFee', 'noticeItems', 'noticeFooter', 'noticeHashtags'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.renderPreview();
    showToast('입력 내용이 초기화되었습니다.', '🧹');
  },

  /**
   * 현재 채널 및 언어에 맞는 텍스트 생성 엔진
   */
  buildText() {
    const title = (document.getElementById('noticeTitle')?.value || '').trim() || '📢 모임 공지 / Event Announcement';
    const date = (document.getElementById('noticeDate')?.value || '').trim();
    const location = (document.getElementById('noticeLocation')?.value || '').trim();
    const fee = (document.getElementById('noticeFee')?.value || '').trim();
    const rawItems = (document.getElementById('noticeItems')?.value || '').trim();
    const footer = (document.getElementById('noticeFooter')?.value || '').trim();
    const hashtags = (document.getElementById('noticeHashtags')?.value || '').trim();

    const channel = this.currentChannel;

    // 1. [👾 디스코드 / 슬랙 마크다운 포맷]
    if (channel === 'discord') {
      let text = `# 👑 ${title}\n\n`;
      text += `> *Bangjang.net Event Notification*\n\n`;
      if (date) text += `📅 **Date / Time:** \`${date}\`\n`;
      if (location) text += `📍 **Location:** ${location}\n`;
      if (fee) text += `💰 **Fee / Cost:** ${fee}\n`;

      if (rawItems) {
        text += `\n### 📌 Guidelines & Preparation\n`;
        rawItems.split('\n').forEach(line => {
          if (line.trim()) text += `- ${line.trim()}\n`;
        });
      }

      if (footer) text += `\n> 💬 ${footer}\n`;
      text += `\n---\n*Created with [Bangjang.net](https://www.bangjang.net)*`;
      return text;
    }

    // 2. [📸 인스타그램 / 스레드 캡션 포맷 (줄바꿈 공백 + 해시태그)]
    if (channel === 'instagram') {
      let text = `👑 ${title}\n.\n`;
      if (date) text += `🗓 일시: ${date}\n`;
      if (location) text += `📍 장소: ${location}\n`;
      if (fee) text += `💰 비용: ${fee}\n`;

      if (rawItems) {
        text += `.\n📌 [주요 안내사항]\n`;
        rawItems.split('\n').forEach(line => {
          if (line.trim()) text += `✔ ${line.trim()}\n`;
        });
      }

      if (footer) text += `.\n💬 ${footer}\n`;
      text += `.\n.\n👉 프로필 링크에서 상세 일정 및 정산 확인 가능!\n`;
      if (hashtags) text += `.\n${hashtags}`;
      return text;
    }

    // 3. [🟢 왓츠앱 / 페이스북 메신저 글로벌 포맷 (*굵게*)]
    if (channel === 'whatsapp') {
      let text = `👑 *${title}*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      if (date) text += `🗓 *Date:* ${date}\n`;
      if (location) text += `📍 *Location:* ${location}\n`;
      if (fee) text += `💰 *Cost:* ${fee}\n`;

      if (rawItems) {
        text += `\n📌 *Details & Preparation:*\n`;
        rawItems.split('\n').forEach(line => {
          if (line.trim()) text += ` • ${line.trim()}\n`;
        });
      }

      if (footer) text += `\n💬 _${footer}_\n`;
      text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      text += `✍️ *Bangjang.net* (https://www.bangjang.net)`;
      return text;
    }

    // 4. [🟡 기본 카카오톡 / 라인 표준 포맷]
    let text = `👑 ━━━━━━━━━━━━━━━━━━━\n`;
    text += `📢 ${title}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (date) text += `🗓️ 일시: ${date}\n`;
    if (location) text += `📍 장소: ${location}\n`;
    if (fee) text += `💰 회비/비용: ${fee}\n`;

    if (rawItems) {
      text += `\n📌 [안내 및 준비사항]\n`;
      rawItems.split('\n').forEach(line => {
        if (line.trim()) text += `  • ${line.trim()}\n`;
      });
    }

    if (footer) text += `\n💬 ${footer}\n`;
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
    copyToClipboardHelper(text, '선택한 채널 포맷의 공지문이 복사되었습니다! 원하는 곳에 붙여넣기(Ctrl+V) 하세요.');
  },

  /**
   * [🟢 WhatsApp으로 즉시 공유]
   */
  shareWhatsApp() {
    const text = encodeURIComponent(this.buildText());
    const url = `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  },

  /**
   * [✈️ Telegram으로 즉시 공유]
   */
  shareTelegram() {
    const text = encodeURIComponent(this.buildText());
    const url = `https://t.me/share/url?url=${encodeURIComponent('https://www.bangjang.net')}&text=${text}`;
    window.open(url, '_blank');
  },

  /**
   * [🟡 카카오톡으로 공유]
   */
  shareKakao() {
    const title = (document.getElementById('noticeTitle')?.value || '').trim() || '방장.net 모임 공지';
    const desc = (document.getElementById('noticeDate')?.value || '') + ' ' + (document.getElementById('noticeLocation')?.value || '');
    if (window.KakaoShareHelper) {
      KakaoShareHelper.share('notice', title, desc, 'https://www.bangjang.net/#notice');
    } else {
      this.copyToClipboard();
    }
  }
};
