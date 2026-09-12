/**
 * ============================================================================
 * 교육자/선생님 전용 미니 클래스룸 컨트롤러 (classroom.js)
 * ============================================================================
 * 역할:
 * 1. 선생님(방장)의 학급 과제 제출방 개설 및 링크 발급
 * 2. 학생의 원클릭 과제(텍스트/링크) 제출
 * 3. 제출 현황 실시간 확인 및 "참 잘했어요! 🌟" 칭찬 도장 피드백
 */

const MiniClassroom = {
  currentClass: null,
  assignments: [],

  init() {},

  /**
   * 클래스룸 방 개설 (선생님)
   */
  async createClassroom() {
    const title = (document.getElementById('classTitleInput')?.value || '').trim();
    const teacher = (document.getElementById('classTeacherInput')?.value || '').trim();
    const desc = (document.getElementById('classDescInput')?.value || '').trim();
    const password = (document.getElementById('classPasswordInput')?.value || '').trim();

    if (!title || !teacher) {
      showToast('수업명과 선생님 이름을 입력해주세요.', '⚠️');
      return;
    }

    showToast('새로운 미니 클래스룸을 생성하는 중...', '⏳');

    try {
      const classId = await BangjangDB.createClassroom({
        title,
        teacherName: teacher,
        description: desc,
        password: password ? SecurityManager.encrypt(password) : ''
      });

      const shareUrl = `${window.location.origin}${window.location.pathname}?class=${classId}`;
      await copyToClipboardHelper(shareUrl, '클래스룸 링크가 복사되었습니다! 학생들에게 공유하세요.');
      
      this.loadClassroom(classId);
    } catch (err) {
      console.error('클래스룸 생성 실패:', err);
      showToast('클래스룸 생성에 실패했습니다.', '❌');
    }
  },

  /**
   * 클래스룸 뷰어 로드
   */
  async loadClassroom(classId) {
    const modal = document.getElementById('classViewerModal');
    const content = document.getElementById('classViewerContent');
    if (!modal || !content) return;

    modal.style.display = 'flex';
    content.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem;">
        <div style="font-size: 2rem; margin-bottom: 1rem; animation: spin 1s infinite linear;">🎓</div>
        <p style="color: var(--text-muted);">학급 과제방을 실시간으로 불러오는 중...</p>
      </div>
    `;

    try {
      const { classroom, assignments } = await BangjangDB.fetchClassroomWithAssignments(classId);
      this.currentClass = classroom;
      this.assignments = assignments || [];
      this.renderViewer();
    } catch (err) {
      console.error('클래스룸 로드 실패:', err);
      content.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.8rem;">⚠️</div>
          <h3 style="font-size: 1.2rem;">클래스룸을 찾을 수 없습니다.</h3>
          <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="MiniClassroom.closeModal()">홈으로 돌아가기</button>
        </div>
      `;
    }
  },

  /**
   * 클래스룸 뷰어 화면 렌더링
   */
  renderViewer() {
    const content = document.getElementById('classViewerContent');
    if (!content || !this.currentClass) return;

    const c = this.currentClass;
    const list = this.assignments;

    let html = `
      <div class="glass-card" style="background: #1e293b; color: #f8fafc; border-radius: 20px; padding: 1.75rem;">
        <!-- 상단 헤더 -->
        <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="badge-new" style="background: var(--accent-emerald);">🎓 ${c.teacher_name} 선생님의 학급</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">총 ${list.length}명 제출</span>
          </div>
          <h2 style="font-size: 1.35rem; font-weight: 800; margin-top: 0.5rem; color: #ffffff;">${c.title}</h2>
          ${c.description ? `<p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.3rem;">📢 과제 안내: ${c.description}</p>` : ''}
        </div>

        <!-- 1. 학생 과제 제출 폼 -->
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--accent-gold); margin-bottom: 0.75rem;">✍️ 학생 과제 제출하기</h4>
          <div class="form-row" style="margin-bottom: 0.6rem;">
            <input type="text" id="studentNameInput" class="form-input" style="flex: 1;" placeholder="이름 (예: 홍길동)">
            <input type="text" id="studentIdInput" class="form-input" style="flex: 1;" placeholder="학번/번호 (선택)">
          </div>
          <div class="form-group">
            <textarea id="assignmentContentInput" class="form-textarea" placeholder="과제 내용 또는 구글 드라이브/노션 링크를 입력하세요." style="height: 80px;"></textarea>
          </div>
          <button class="btn btn-primary btn-block" onclick="MiniClassroom.submitAssignment()">
            🚀 과제 제출 완료하기
          </button>
        </div>

        <!-- 2. 실시간 과제 제출 목록 -->
        <div>
          <h4 style="font-size: 0.92rem; color: var(--text-muted); margin-bottom: 0.6rem;">📋 과제 제출 현황</h4>
          <div style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem;">
            ${list.length === 0 ? '<p style="font-size: 0.85rem; color: var(--text-sub); text-align: center; padding: 1rem;">아직 제출된 과제가 없습니다.</p>' : ''}
            ${list.map(a => `
              <div style="background: rgba(15, 23, 42, 0.6); border-radius: 10px; padding: 0.75rem 1rem; border: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                  <span style="font-weight: 700; color: #f8fafc;">${a.student_name} ${a.student_id_num ? `(${a.student_id_num})` : ''}</span>
                  ${a.is_praised ? '<span style="font-size: 0.78rem; background: #dcfce7; color: #15803d; padding: 0.15rem 0.5rem; border-radius: 999px; font-weight: 800;">🌟 칭찬 도장 쾅!</span>' : `<button class="btn btn-sm btn-gold" onclick="MiniClassroom.praiseStudent('${a.id}')">🌟 칭찬 도장 찍기</button>`}
                </div>
                <div style="font-size: 0.88rem; color: var(--text-muted); white-space: pre-wrap;">${a.content}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 하단 버튼 -->
        <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
          <button class="btn btn-secondary" style="flex: 1;" onclick="MiniClassroom.closeModal()">닫기</button>
          <button class="btn btn-gold" style="flex: 2;" onclick="MiniClassroom.shareLink()">🔗 클래스룸 링크 복사</button>
        </div>
      </div>
    `;

    content.innerHTML = html;
  },

  /**
   * 학생 과제 제출
   */
  async submitAssignment() {
    if (!this.currentClass) return;
    const name = (document.getElementById('studentNameInput')?.value || '').trim();
    const idNum = (document.getElementById('studentIdInput')?.value || '').trim();
    const content = (document.getElementById('assignmentContentInput')?.value || '').trim();

    if (!name || !content) {
      showToast('이름과 과제 내용을 모두 입력해주세요.', '⚠️');
      return;
    }

    try {
      await BangjangDB.submitAssignment({
        classroomId: this.currentClass.id,
        studentName: name,
        studentIdNum: idNum,
        content
      });

      showToast(`${name} 학생, 과제가 성공적으로 제출되었습니다! 🎉`, '✨');
      this.loadClassroom(this.currentClass.id);
    } catch (err) {
      console.error('과제 제출 실패:', err);
      showToast('과제 제출에 실패했습니다.', '⚠️');
    }
  },

  /**
   * 칭찬 도장 발급
   */
  async praiseStudent(assignmentId) {
    try {
      await BangjangDB.praiseAssignment(assignmentId);
      showToast('학생에게 🌟 칭찬 도장을 보냈습니다!', '👏');
      this.loadClassroom(this.currentClass.id);
    } catch (err) {
      console.error('칭찬 도장 전송 실패:', err);
      showToast('칭찬 도장 전송에 실패했습니다.', '⚠️');
    }
  },

  shareLink() {
    if (!this.currentClass) return;
    const url = `${window.location.origin}${window.location.pathname}?class=${this.currentClass.id}`;
    copyToClipboardHelper(url, '클래스룸 링크가 복사되었습니다! 학생들에게 공유하세요.');
  },

  closeModal() {
    const modal = document.getElementById('classViewerModal');
    if (modal) modal.style.display = 'none';
    const url = new URL(window.location);
    url.searchParams.delete('class');
    window.history.pushState({}, '', url);
  }
};
