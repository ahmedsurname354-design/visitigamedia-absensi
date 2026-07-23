/*
# VisitigaMedia Attendance System - Storage Policies Fix

Fixes a typo in the previous migration (POLIGGER -> POLICY) and ensures
all storage policies are applied correctly. Safe to re-run.
*/

-- Storage policies: users manage their own folder
DROP POLICY IF EXISTS "storage_attendance_own_select" ON storage.objects;
CREATE POLICY "storage_attendance_own_select" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'attendance-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_attendance_own_insert" ON storage.objects;
CREATE POLICY "storage_attendance_own_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'attendance-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_attendance_own_update" ON storage.objects;
CREATE POLICY "storage_attendance_own_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'attendance-photos' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'attendance-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_overtime_own_select" ON storage.objects;
CREATE POLICY "storage_overtime_own_select" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'overtime-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_overtime_own_insert" ON storage.objects;
CREATE POLICY "storage_overtime_own_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'overtime-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_overtime_own_update" ON storage.objects;
CREATE POLICY "storage_overtime_own_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'overtime-photos' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'overtime-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_leave_own_select" ON storage.objects;
CREATE POLICY "storage_leave_own_select" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'leave-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_leave_own_insert" ON storage.objects;
CREATE POLICY "storage_leave_own_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'leave-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_leave_own_update" ON storage.objects;
CREATE POLICY "storage_leave_own_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'leave-documents' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'leave-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
