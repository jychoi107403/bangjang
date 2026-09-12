/**
 * ============================================================================
 * Supabase 클라이언트 설정 및 보안 암호화 유틸리티 (supabase-config.js)
 * ============================================================================
 * 역할:
 * 1. Supabase 연동 클라이언트 인스턴스 생성
 * 2. 민감한 데이터(계좌번호, 비밀번호 등) 클라이언트 암호화/복호화 보안 처리
 * 3. 영수증(Bills), 투표(Polls), 클래스룸(Classrooms) DB 통신 API 함수 제공
 */

// 1. Supabase 연결 정보 설정
const SUPABASE_URL = 'https://efbzpaaulnpbwghzytuq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYnpwYWF1bG5wYndnaHp5dHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDY1NjYsImV4cCI6MjEwNDc4MjU2Nn0.DqQgK-Jav3PlVfiiAK4pvYgKeR8jWLyde0rYuruZkTU';

let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

/**
 * [보안 암호화 모듈] SecurityManager
 */
const SecurityManager = {
  SECRET_SALT: 'BANGJANG_NET_SECURE_2026_KEY_#99',

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
      console.warn('복호화 실패:', e);
      return encryptedText;
    }
  }
};

/**
 * [DB 통신 서비스] BangjangDB
 */
const BangjangDB = {
  // 1. 영수증 관련
  async saveBill(billData) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 클라이언트를 초기화할 수 없습니다.');

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

    if (error) throw error;
    return data.id;
  },

  async fetchBill(billId) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 클라이언트 오류');

    const { data, error } = await sb
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single();

    if (error) throw error;

    if (data && data.encrypted_account) {
      data.decrypted_account = SecurityManager.decrypt(data.encrypted_account);
    } else {
      data.decrypted_account = '';
    }
    return data;
  },

  async updatePaidMembers(billId, paidMembers) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 클라이언트 오류');

    const { error } = await sb
      .from('bills')
      .update({ paid_members: paidMembers })
      .eq('id', billId);

    if (error) throw error;
    return true;
  },

  // 2. 투표/질문함 관련
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

    if (error) throw error;
    return data.id;
  },

  async fetchPollWithResponses(pollId) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 클라이언트 오류');

    const { data: poll, error: pollError } = await sb
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError) throw pollError;

    const { data: responses, error: respError } = await sb
      .from('poll_responses')
      .select('*')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false });

    if (respError) throw respError;
    return { poll, responses: responses || [] };
  },

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

    if (error) throw error;
    return true;
  },

  // 3. 미니 클래스룸 관련
  async createClassroom(classData) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 클라이언트 오류');

    const { data, error } = await sb
      .from('classrooms')
      .insert([
        {
          title: classData.title,
          teacher_name: classData.teacherName,
          description: classData.description || '',
          password_hash: classData.password || ''
        }
      ])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async fetchClassroomWithAssignments(classId) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 클라이언트 오류');

    const { data: classroom, error: classError } = await sb
      .from('classrooms')
      .select('*')
      .eq('id', classId)
      .single();

    if (classError) throw classError;

    const { data: assignments, error: assignError } = await sb
      .from('assignments')
      .select('*')
      .eq('classroom_id', classId)
      .order('created_at', { ascending: false });

    if (assignError) throw assignError;
    return { classroom, assignments: assignments || [] };
  },

  async submitAssignment(data) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 클라이언트 오류');

    const { error } = await sb
      .from('assignments')
      .insert([
        {
          classroom_id: data.classroomId,
          student_name: data.studentName,
          student_id_num: data.studentIdNum || '',
          content: data.content
        }
      ]);

    if (error) throw error;
    return true;
  },

  async praiseAssignment(assignmentId) {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase 클라이언트 오류');

    const { error } = await sb
      .from('assignments')
      .update({ is_praised: true })
      .eq('id', assignmentId);

    if (error) throw error;
    return true;
  }
};
