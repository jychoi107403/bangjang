-- ==========================================================================
-- 방장.net (Bangjang.net) Supabase 데이터베이스 마이그레이션
-- 파일명: 002_create_study_and_classroom.sql
-- 설명: 실시간 뽀모도로 스터디룸 및 선생님 미니 클래스룸 테이블 생성 및 RLS 보안 설정
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. study_rooms (실시간 뽀모도로 온라인 스터디룸 테이블)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL DEFAULT '온라인 집중 스터디룸',
    focus_duration INTEGER NOT NULL DEFAULT 25,          -- 집중 시간 (분)
    break_duration INTEGER NOT NULL DEFAULT 5,           -- 휴식 시간 (분)
    current_mode VARCHAR(50) NOT NULL DEFAULT 'focus',   -- 'focus' (집중 중) 또는 'break' (휴식 중)
    is_running BOOLEAN NOT NULL DEFAULT false,           -- 타이머 실행 여부
    target_end_time TIMESTAMP WITH TIME ZONE,            -- 현재 세션 종료 시각
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to study_rooms" ON public.study_rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert to study_rooms" ON public.study_rooms FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update to study_rooms" ON public.study_rooms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------------
-- 2. study_goals (스터디룸 참가자별 목표 및 완료 체크 테이블)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    nickname VARCHAR(100) NOT NULL,
    goal_text TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to study_goals" ON public.study_goals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert to study_goals" ON public.study_goals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update to study_goals" ON public.study_goals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);


-- --------------------------------------------------------------------------
-- 3. classrooms (선생님/교육자 미니 클래스룸 테이블)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,                         -- 수업명/학급명
    teacher_name VARCHAR(100) NOT NULL,                  -- 선생님 이름
    description TEXT,                                    -- 과제 안내 및 공지사항
    password_hash TEXT,                                  -- 방장 비밀번호 (해시/암호화 보관)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to classrooms" ON public.classrooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert to classrooms" ON public.classrooms FOR INSERT TO anon, authenticated WITH CHECK (true);

-- --------------------------------------------------------------------------
-- 4. assignments (학생 과제 제출 및 칭찬 피드백 테이블)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    student_id_num VARCHAR(50),                          -- 학번 (선택)
    student_name VARCHAR(100) NOT NULL,                  -- 학생 이름
    content TEXT NOT NULL,                               -- 과제 내용 또는 링크
    is_praised BOOLEAN NOT NULL DEFAULT false,           -- 선생님의 칭찬 도장 여부
    feedback TEXT,                                       -- 선생님의 피드백 한마디
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to assignments" ON public.assignments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert to assignments" ON public.assignments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update to assignments" ON public.assignments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
