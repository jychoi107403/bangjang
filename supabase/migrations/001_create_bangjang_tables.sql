-- ==========================================================================
-- 방장.net (Bangjang.net) Supabase 데이터베이스 마이그레이션
-- 파일명: 001_create_bangjang_tables.sql
-- 설명: 웹 영수증 공유 테이블 및 익명 투표/질문함 테이블 생성 및 보안 RLS 설정
-- ==========================================================================

-- 1. 확장 기능 활성화 (UUID 생성용)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------------
-- 2. bills (스마트 회비 정산 영수증 테이블)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL DEFAULT '모임 회비 정산',
    total_amount INTEGER NOT NULL DEFAULT 0,
    per_person INTEGER NOT NULL DEFAULT 0,
    members JSONB NOT NULL DEFAULT '[]'::jsonb,           -- 전체 참석자 목록 ['철수', '영희', ...]
    rounds JSONB NOT NULL DEFAULT '[]'::jsonb,            -- 차수별 지출 내역 [{name: '1차', amount: 50000}, ...]
    encrypted_account TEXT,                              -- 암호화된 입금 계좌 정보 (보안 강화)
    pay_link TEXT,                                       -- 카카오페이/토스 간편 송금 링크
    paid_members JSONB NOT NULL DEFAULT '[]'::jsonb,      -- 입금 완료한 참석자 목록 ['철수']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- bills 테이블 RLS (Row Level Security) 활성화
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- 모든 사용자(익명 포함)가 링크를 통해 영수증을 읽을 수 있도록 허용
CREATE POLICY "Allow public read access to bills"
ON public.bills FOR SELECT
TO anon, authenticated
USING (true);

-- 모든 사용자가 새로운 정산 영수증을 등록할 수 있도록 허용
CREATE POLICY "Allow public insert to bills"
ON public.bills FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 참석자가 자신의 입금 완료 상태(paid_members)를 업데이트할 수 있도록 허용
CREATE POLICY "Allow public update paid_members on bills"
ON public.bills FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);


-- --------------------------------------------------------------------------
-- 3. polls (방장 전용 익명 투표 및 질문함 테이블)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    poll_type VARCHAR(50) NOT NULL DEFAULT 'vote',       -- 'vote' (객관식 투표) 또는 'qna' (익명 질문/건의함)
    options JSONB NOT NULL DEFAULT '[]'::jsonb,          -- 투표 선택지 목록 ['강남역', '홍대입구', ...]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- polls 테이블 RLS 활성화
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 읽기 허용
CREATE POLICY "Allow public read access to polls"
ON public.polls FOR SELECT
TO anon, authenticated
USING (true);

-- 모든 사용자 생성 허용
CREATE POLICY "Allow public insert to polls"
ON public.polls FOR INSERT
TO anon, authenticated
WITH CHECK (true);


-- --------------------------------------------------------------------------
-- 4. poll_responses (투표 결과 및 익명 질문 응답 테이블)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.poll_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    choice TEXT,                                         -- 투표한 항목 (객관식 투표 시)
    content TEXT,                                        -- 작성한 질문/건의 내용 (Q&A 시)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- poll_responses 테이블 RLS 활성화
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 읽기 허용
CREATE POLICY "Allow public read access to poll_responses"
ON public.poll_responses FOR SELECT
TO anon, authenticated
USING (true);

-- 모든 사용자 응답 등록 허용
CREATE POLICY "Allow public insert to poll_responses"
ON public.poll_responses FOR INSERT
TO anon, authenticated
WITH CHECK (true);
