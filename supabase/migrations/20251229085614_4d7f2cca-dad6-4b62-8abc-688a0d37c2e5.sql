-- Create storage bucket for backups
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backups', 'backups', false, 52428800, ARRAY['application/json', 'application/octet-stream'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for backups bucket
CREATE POLICY "Service role can manage backup files"
ON storage.objects
FOR ALL
USING (bucket_id = 'backups' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'backups' AND auth.role() = 'service_role');