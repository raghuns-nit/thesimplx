# Project memory

## Product intent & audience

- Platform connecting customers to merchants via WhatsApp enquiries.
- Customers submit an enquiry form with optional image attachment; message opens in WhatsApp (`wa.me` click-to-chat).
- Merchants view and manage submitted enquiries (including attachments) via an admin screen.

## Brand personality & voice

- Not yet defined; tone appears utilitarian and transactional given WhatsApp/business enquiry context.

## Visual design & UX direction

- Framework: Vite + React.
- Enquiry form includes image upload field; submission constructs a WhatsApp `wa.me` text message.
- Admin screen displays enquiry entries with stored attachment references.
- No design-system or styling details inferred yet.

## Decisions, constraints & rationale

- Backend uses Supabase storage; attachments stored in a private `enquiry-attachments` bucket (no public URLs by design).
- WhatsApp `wa.me` links support text only — cannot attach images directly.
- Fix implemented: after upload, generate a time-limited (24h) signed URL for the image and include it in the WhatsApp message text so the merchant can tap to view it.
- Image is persisted both to the enquiry record (admin) and surfaced to the merchant via the signed URL in the WhatsApp message.

## Open questions & assumptions

- Signed URL validity is 24h; behaviour after expiry (e.g., merchant opens stale link) not addressed.
- Whether longer-lived links or alternative image delivery should be considered for future iterations.
- No explicit branding, design-system, or accessibility requirements established yet.