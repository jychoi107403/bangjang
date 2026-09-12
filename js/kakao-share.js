/**
 * ============================================================================
 * 카카오톡 공식 공유 연동 모듈 (kakao-share.js)
 * ============================================================================
 * 역할:
 * 1. Kakao JavaScript SDK를 활용한 카카오톡 공식 메시지 카드 전송
 * 2. 카카오 SDK 미설정 환경에서도 클립보드 링크 복사로 100% 안전하게 폴백
 */

const KakaoShareHelper = {
  // 사용자가 카카오 개발자 센터에서 발급받은 JavaScript 키를 넣을 수 있는 슬롯
  KAKAO_JS_KEY: 'YOUR_KAKAO_JAVASCRIPT_KEY',

  init() {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      try {
        if (this.KAKAO_JS_KEY && this.KAKAO_JS_KEY !== 'YOUR_KAKAO_JAVASCRIPT_KEY') {
          window.Kakao.init(this.KAKAO_JS_KEY);
        }
      } catch (e) {
        console.warn('카카오 SDK 초기화 대기중:', e);
      }
    }
  },

  /**
   * 영수증/투표/스터디룸 카카오톡 공유
   */
  share(type, title, description, linkUrl) {
    // 1. 카카오 SDK가 초기화되어 있는 경우 공식 피드 공유
    if (window.Kakao && window.Kakao.isInitialized() && window.Kakao.Share) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: `👑 [방장.net] ${title}`,
            description: description || '모임 공지, 1/N 정산, 투표를 원클릭으로 확인하세요!',
            imageUrl: 'https://www.bangjang.net/assets/images/og-image.jpg',
            link: {
              mobileWebUrl: linkUrl,
              webUrl: linkUrl,
            },
          },
          buttons: [
            {
              title: '확인하기 👉',
              link: {
                mobileWebUrl: linkUrl,
                webUrl: linkUrl,
              },
            },
          ],
        });
        showToast('카카오톡 공유창이 열렸습니다!', '💬');
        return;
      } catch (err) {
        console.warn('카카오 SDK 전송 실패, 클립보드 복사로 대체:', err);
      }
    }

    // 2. 카카오 키 미등록 또는 PC 환경에서는 클립보드 복사로 안전하게 폴백
    copyToClipboardHelper(linkUrl, '공유 링크가 클립보드에 복사되었습니다! 카카오톡 단톡방에 붙여넣기하세요.');
  }
};
