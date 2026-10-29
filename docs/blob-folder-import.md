# Import portfolio work from Blob folders

Deploy this code to the existing Vercel project, then open `/admin` and sign in.
The importer uses the same Blob SDK credential resolution as the project database:
`BLOB_READ_WRITE_TOKEN`, or a connected OIDC store using `VERCEL_OIDC_TOKEN` and
`BLOB_STORE_ID`. Admin access still requires `ADMIN_PASS`. Credentials must identify
the store containing the assets. Never paste tokens into the admin UI or commit them.

1. Click **Import Blob folders**.
2. Leave the path as `Assets/Projects/` (case-sensitive), or enter a specific project folder.
3. Click **Scan folders**. All pages of matching assets are scanned before import is offered.
4. By default, subfolders belong to their parent project. Enable **Separate subfolders**
   to create individual works such as Healine's Branding, UI, and Motion folders.
5. Review titles, selected folders, covers, and the **Import into** targets.
   Existing work is matched by its linked folder or a unique overlapping media URL.
   You can explicitly choose an existing project when automatic matching is not possible.
6. Click **Import N folders** to save the batch and publish it to Works.
7. Open projects in the usual editor to refine descriptions, categories, year, placement,
   cover, captions, and media order. New projects are placed in Works only.

To import future uploads, repeat the scan and select the linked existing project.
Updates append new URLs without overwriting text, gallery order, or covers. Removed
files and projects are never automatically deleted. Changing folder grouping may
require selecting different target projects; each folder must target a different
project in a batch. Use the combined-folder mode when combining multiple subfolders
into one existing project.

Image, GIF and video files are detected by extension. Filename ordering uses natural
sort (`2` before `10`); `cover` and `thumbnail` names are preferred for new project
covers. No project narratives or categories are inferred from filenames.

This is a scan-and-confirm importer, not a background watcher. Merely uploading to
Blob does not publish a new project. No re-upload or redeployment is needed for content
imports after this feature has been deployed.

Use **Export** in the admin for a backup of the current project database. Do not use
the existing JSON **Import** button for folder imports; JSON Import replaces the full
project list.

## Validation

```sh
node --test tests/blob-import.test.cjs
pnpm exec tsc --noEmit
pnpm build
```

Tests cover nested folder grouping, animated media detection, duplicate avoidance,
legacy media records, editorial preservation, authentication, pagination forwarding,
failed saves, and empty/error database handling. Live store integration requires a
Vercel deployment with the existing environment variables.
