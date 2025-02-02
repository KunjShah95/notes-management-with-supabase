/*
  # Add attachments support

  1. Changes
    - Add `attachments` column to `notes` table to store file URLs
    - Create storage bucket for file uploads

  2. Security
    - Enable storage bucket policies for authenticated users
*/

-- Add attachments column to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}';

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes-attachments', 'notes-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notes-attachments');

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated users to read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'notes-attachments');

-- Allow authenticated users to delete their files
CREATE POLICY "Allow authenticated users to delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'notes-attachments');