

# Clear All Uploaded Content

## What Will Be Deleted

1. **All journey activities** -- every logged workout record from all users
2. **All activity reactions** -- 58 reaction records
3. **All files in storage** -- all uploaded photos, videos, and recaps in the `journey-uploads` bucket

## How

This will be done using SQL data operations to:

1. Delete all rows from `activity_reactions`
2. Delete all rows from `journey_activities`
3. Delete all files from the `journey-uploads` storage bucket

Note: This does NOT delete user profiles or auth accounts -- only activity-related content.

## Technical Details

Three SQL operations will be executed:
- `DELETE FROM activity_reactions` (58 rows)
- `DELETE FROM journey_activities` (all rows)
- `DELETE FROM storage.objects WHERE bucket_id = 'journey-uploads'` (all uploaded files)

This is a test environment operation only. If there is data in the live/published environment that also needs clearing, a separate step would be needed.

