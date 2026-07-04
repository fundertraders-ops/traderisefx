
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;

-- Realtime channel authorization: explicit policies on realtime.messages.
-- The competition leaderboard is intentionally public, and the supabase_realtime
-- publication for competition_accounts already excludes account_login/account_password
-- via a column allow-list, so broadcast payloads contain no credentials.
DROP POLICY IF EXISTS "realtime_public_competition_read" ON realtime.messages;
CREATE POLICY "realtime_public_competition_read"
ON realtime.messages
FOR SELECT
TO anon, authenticated
USING (
  realtime.topic() LIKE 'competition%'
  OR realtime.topic() LIKE 'public:competition%'
);

DROP POLICY IF EXISTS "realtime_auth_user_topics" ON realtime.messages;
CREATE POLICY "realtime_auth_user_topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE ('user:' || auth.uid()::text || '%')
);
