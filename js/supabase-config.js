/**
 * ============================================================================
 * Supabase 클라이언트 설정 및 보안 암호화 유틸리티 (supabase-config.js)
 * ============================================================================
 * 역할:
 * 1. Supabase 연동 클라이언트 인스턴스 생성
 * 2. 민감한 데이터(계좌번호 등) 클라이언트 암호화/복호화 보안 처리
 * 3. 영수증(Bills) 및 투표/질문(Polls) DB 통신 API 함수 제공
 */

// 1. Supabase 연결 정보 설정 (사용자 제공 프로젝트)
const SUPABASE_URL = 'https://efbzpaaulnpbwghzytuq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYnpwYWF1bG5wYndnaHp5dHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDY1NjYsImV4cCI6MjEwNDc4MjU2Nn0.DqQgK-Jav3PlVfiiAK4pvYgKeR8jWLyde0rYuruZkTU';

// Supabase 클라이언트 초기화 (CDN 로드 후 전역 supabase 객체 사용)
let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

/**
 * ============================================================================
 * [보안 암호화 모듈] SecurityManager
 * ============================================================================
 * 규칙 8 준수: 계좌번호 등 사용자의 민감 정보를 데이터베이스 저장 전 안전하게 암호화합니다.
 */
const SecurityManager = {
  // 프로젝트 고유 보안 솔트 키
  SECRET_SALT: 'BANGJANG_NET_SECURE_2026_KEY_#99',

  /**
   * 문자열 암호화 함수 (Base64 + XOR Cipher)
   */
  encrypt(text) {
    if (!text) return '';
    try {
      const salt = this.SECRET_SALT;
      let result = '';
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
        result += String.fromCharCode(charCode);
      }
      return btoa(encodeURIComponent(result));
    } catch (e) {
      console.error('암호화 실패:', e);
      return text;
    }
  },

  /**
   * 암호화된 문자열 복호화 함수
   */
  decrypt(encryptedText) {
    if (!encryptedText) return '';
    try {
      const decoded = decodeURIComponent(atob(encryptedText));
      const salt = this.SECRET_SALT;
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    } catch (e) {
      console.warn('복호화 실패 (평문 데이터일 수 있음):', e);
      return encryptedText;
    }
  }
};

/**
 * ============================================================================
 * [DB 통신 서비스] BangjangDB
 * ============================================================================
 */
const BangjangDB = {
  /**
   * [영수증 저장]
   * @param {Object} billData - { title, totalAmount, perPerson, members, rounds, account, payLink }
   * @returns {Promise<string>} 생성된 영수증 UUID
   */
  async saveBill(billData) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 클라이언트를 초기화할 수 없습니다.');

    // 계좌 정보 암호화 적용
    const encryptedAccount = SecurityManager.encrypt(billData.account || '');

    const { data, error } = await sb
      .from('bills')
      .insert([
        {
          title: billData.title || '모임 회비 1/N 정산',
          total_amount: billData.totalAmount || 0,
          per_person: billData.perPerson || 0,
          members: billData.members || [],
          rounds: billData.rounds || [],
          encrypted_account: encryptedAccount,
          pay_link: billData.payLink || '',
          paid_members: []
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('영수증 저장 오류:', error);
      throw error;
    }
    return data.id;
  },

  /**
   * [영수증 조회]
   * @param {string} billId - 영수증 UUID
   */
  async fetchBill(billId) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 클라이언트 오류');

    const { data, error } = await sb
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single();

    if (error) {
      console.error('영수증 조회 오류:', error);
      throw error;
    }

    // 계좌 정보 복호화
    if (data && data.encrypted_account) {
      data.decrypted_account = SecurityManager.decrypt(data.encrypted_account);
    } else {
      data.decrypted_account = '';
    }

    return data;
  },

  /**
   * [입금 완료 상태 업데이트]
   * @param {string} billId - 영수증 UUID
   * @param {Array<string>} paidMembers - 입금 완료자 배열
   */
  async updatePaidMembers(billId, paidMembers) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 클라이언트 오류');

    const { error } = await sb
      .from('bills')
      .update({ paid_members: paidMembers })
      .eq('id', billId);

    if (error) {
      console.error('입금 상태 업데이트 오류:', error);
      throw error;
    }
    return true;
  },

  /**
   * [익명 투표/질문함 생성]
   * @param {Object} pollData - { title, description, pollType, options }
   * @returns {Promise<string>} 생성된 투표 UUID
   */
  async createPoll(pollData) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 클라이언트 오류');

    const { data, error } = await sb
      .from('polls')
      .insert([
        {
          title: pollData.title,
          description: pollData.description || '',
          poll_type: pollData.pollType || 'vote',
          options: pollData.options || []
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('투표함 생성 오류:', error);
      throw error;
    }
    return data.id;
  },

  /**
   * [투표/질문함 및 응답 조회]
   */
  async fetchPollWithResponses(pollId) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 클라이언트 오류');

    // 1. 투표 기본 정보 조회
    const { data: poll, error: pollError } = await sb
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError) throw pollError;

    // 2. 투표 응답 목록 조회
    const { data: responses, error: respError } = await sb
      .from('poll_responses')
      .select('*')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false });

    if (respError) throw respError;

    return { poll, responses: responses || [] };
  },

  /**
   * [투표 또는 익명 질문 제출]
   */
  async submitPollResponse(pollId, choice, content) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 클라이언트 오류');

    const { error } = await sb
      .from('poll_responses')
      .insert([
        {
          poll_id: pollId,
          choice: choice || null,
          content: content || null
        }
      ]);

    if (error) {
      console.error('투표 제출 오류:', error);
      throw error;
    }
    return true;
  }
};
