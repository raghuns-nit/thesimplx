/*
# Add private image attachments to WhatsApp enquiries

1. Purpose
- Allow a customer to optionally upload one reference image while opening the existing WhatsApp Quote form.
- Keep the image separate from public product images and make it available to signed-in administrators only.

2. Database changes
- Add `enquiries.attachment_path` (text, nullable): the private Storage object path for the uploaded image.
- Add `enquiries.attachment_name` (text, nullable): the original filename shown to administrators.
- Existing enquiries remain valid because both columns are nullable.

3. Storage changes
- Create the private `enquiry-attachments` bucket when it does not already exist.
- Limit uploads to 5 MB and JPEG, PNG, or WebP images.
- Allow anonymous customers to upload only into the random `pending/` folder.
- Allow authenticated administrators to read uploaded objects for signed preview/download URLs.
- Do not allow public reads, anonymous updates, or anonymous deletes.

4. Security
- The existing enquiry INSERT policy remains the public submission path.
- The attachment path is a random client-generated value and is stored only with the submitted enquiry.
- The bucket is private; customer images are not exposed through permanent public URLs.

5. Important notes
- WhatsApp web links cannot attach a local file automatically. The form uploads the image to the enquiry record and opens WhatsApp with a message saying an image was included; the administrator can view it from the Enquiries screen.
- The interface also validates the same 5 MB and image-type limits before upload.
*/

ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS attachment_path text,
  ADD COLUMN IF NOT EXISTS attachment_name text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.enquiries TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'enquiry-attachments'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'enquiry-attachments',
      'enquiry-attachments',
      false,
      5242880,
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    );
  END IF;
END $$;

DROP POLICY IF EXISTS "customer_upload_enquiry_attachments" ON storage.objects;
CREATE POLICY "customer_upload_enquiry_attachments"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'enquiry-attachments'
  AND (storage.foldername(name))[1] = 'pending'
);

DROP POLICY IF EXISTS "admin_read_enquiry_attachments" ON storage.objects;
CREATE POLICY "admin_read_enquiry_attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'enquiry-attachments');
