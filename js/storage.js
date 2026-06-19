// ============================================================
// storage.js — Drive JSON operations + image/folder helpers
// Depends on drive.js (STATE, findFile, createFolder,
//            deleteFile, renameFile, makePublic, showLoader, hideLoader)
//
// Drive image layout (matches spec):
//   images/
//   └── <category_slug>/          ← ensureCategoryFolder()
//       ├── category.jpg
//       ├── products/
//       │   └── <internalId>/     ← per-product folder
//       │       └── *.jpg
//       └── thumbnails/
// ============================================================

// ── JSON helpers ─────────────────────────────────────────────

/**
 * Create a JSON file in parentId if it does not already exist.
 * Returns the file ID (existing or newly created).
 */
async function ensureFileExists(filename, parentId, defaultContent = '[]') {
    let file = await findFile(filename, parentId);
    if (file) return file.id;

    const fileMetadata = { name: filename, parents: [parentId], mimeType: 'application/json' };
    const boundary     = '-------314159265358979323846';
    const delimiter    = '\r\n--' + boundary + '\r\n';
    const closeDelim   = '\r\n--' + boundary + '--';

    const body =
        delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(fileMetadata) +
        delimiter + 'Content-Type: application/json\r\n\r\n' + defaultContent +
        closeDelim;

    try {
        const res = await gapi.client.request({
            path:    '/upload/drive/v3/files',
            method:  'POST',
            params:  { uploadType: 'multipart' },
            headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
            body
        });
        return res.result.id;
    } catch (e) {
        console.error('ensureFileExists error for ' + filename, e);
        throw e;
    }
}

/**
 * Read a JSON file from the catalog folder.
 * If the file doesn't exist yet, creates it with a safe default and returns that default.
 * If STATE.catalogFolderId is not set, logs a warning and returns the safe default
 * (prevents a hard crash on public pages before Drive is fully resolved).
 */
async function loadJson(filename) {
    if (!STATE.catalogFolderId) {
        console.warn(`loadJson('${filename}'): catalogFolderId not set — returning empty default.`);
        return filename === 'settings.json' ? {} : [];
    }

    let file = await findFile(filename, STATE.catalogFolderId);
    if (!file) {
        const defaultContent = filename === 'settings.json' ? '{}' : '[]';
        await ensureFileExists(filename, STATE.catalogFolderId, defaultContent);
        return JSON.parse(defaultContent);
    }

    try {
        const res = await gapi.client.drive.files.get({ fileId: file.id, alt: 'media' });
        return res.result;
    } catch (e) {
        console.error('loadJson error for ' + filename, e);
        return filename === 'settings.json' ? {} : [];
    }
}

/**
 * Write (overwrite) a JSON file in the catalog folder.
 */
async function saveJson(filename, data) {
    if (!STATE.catalogFolderId) throw new Error('saveJson: storage not initialized');
    showLoader('Saving...');
    try {
        let file   = await findFile(filename, STATE.catalogFolderId);
        let fileId = file ? file.id : await ensureFileExists(filename, STATE.catalogFolderId);

        await gapi.client.request({
            path:    `/upload/drive/v3/files/${fileId}`,
            method:  'PATCH',
            params:  { uploadType: 'media' },
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(data, null, 2)
        });

        console.log(`Saved ${filename} successfully.`);
        return true;
    } catch (e) {
        console.error('saveJson error for ' + filename, e);
        alert('Failed to save data. Please try again.');
        return false;
    } finally {
        hideLoader();
    }
}

// ── Category folder helpers ───────────────────────────────────

/**
 * Ensure the Drive folder tree for a category exists and return the
 * category folder ID.  Creates it (with products/ and thumbnails/
 * sub-folders) if it does not exist yet.
 *
 * Resulting path:  images/<slug>/
 *                  images/<slug>/products/
 *                  images/<slug>/thumbnails/
 *
 * NOTE: slug must already be a safe lowercase-underscore string.
 */
async function ensureCategoryFolder(slug) {
    if (!STATE.imagesFolderId) throw new Error('ensureCategoryFolder: imagesFolderId not set');

    // Direct child of images/ — no extra "categories/" level
    let catFolder = await findFile(slug, STATE.imagesFolderId, 'application/vnd.google-apps.folder');
    if (!catFolder) {
        const id = await createFolder(slug, STATE.imagesFolderId);
        catFolder = { id };
        // Pre-create the two required sub-folders
        await createFolder('products',   id);
        await createFolder('thumbnails', id);
    }
    return catFolder.id;
}

/**
 * Delete a product's image folder from Drive.
 * Path deleted:  images/<catSlug>/products/<internalId>/
 *
 * Called by deleteProduct() in products.js.
 * Safe to call even if the folder doesn't exist (no-op).
 */
async function deleteProductFolder(internalId, catSlug) {
    if (!STATE.imagesFolderId) return; // Drive not ready — skip silently

    try {
        const catFolder = await findFile(catSlug, STATE.imagesFolderId, 'application/vnd.google-apps.folder');
        if (!catFolder) return;

        const productsFolder = await findFile('products', catFolder.id, 'application/vnd.google-apps.folder');
        if (!productsFolder) return;

        const productFolder = await findFile(internalId, productsFolder.id, 'application/vnd.google-apps.folder');
        if (!productFolder) return;

        await deleteFile(productFolder.id); // deleteFile() from drive.js — also removes all files inside
        console.log(`Deleted Drive folder for product ${internalId}`);
    } catch (e) {
        // Non-fatal — product is removed from JSON regardless
        console.error('deleteProductFolder error:', e);
    }
}

// ── Image upload ─────────────────────────────────────────────

/**
 * Upload a local File object to Drive inside parentFolderId.
 * Saves as newFilename (or the original filename if omitted).
 * Automatically makes the uploaded file publicly readable.
 * Returns the new file's Drive ID.
 */
async function uploadImage(file, parentFolderId, newFilename) {
    showLoader('Uploading image...');
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async function () {
            const fileMetadata = { name: newFilename || file.name, parents: [parentFolderId] };
            const boundary     = '-------314159265358979323846';
            const delimiter    = '\r\n--' + boundary + '\r\n';
            const closeDelim   = '\r\n--' + boundary + '--';

            // Encode binary to base64 for the multipart body
            let binary = '';
            const bytes = new Uint8Array(reader.result);
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
            const base64Data = btoa(binary);

            const body =
                delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(fileMetadata) +
                delimiter + 'Content-Type: ' + file.type + '\r\nContent-Transfer-Encoding: base64\r\n\r\n' + base64Data +
                closeDelim;

            try {
                const res = await gapi.client.request({
                    path:    '/upload/drive/v3/files',
                    method:  'POST',
                    params:  { uploadType: 'multipart' },
                    headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
                    body
                });

                // Use makePublic() from drive.js so the image is visible on public pages
                await makePublic(res.result.id);
                resolve(res.result.id);
            } catch (e) {
                console.error('uploadImage error:', e);
                reject(e);
            } finally {
                hideLoader();
            }
        };
    });
}
