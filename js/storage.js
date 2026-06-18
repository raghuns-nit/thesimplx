
// Direct Google Drive JSON read/write operations
// Relies on js/drive.js being loaded and STATE being initialized

async function ensureFileExists(filename, parentId, defaultContent = "[]") {
    let file = await findFile(filename, parentId);
    
    if (!file) {
        try {
            // Step 1: Create the empty file metadata first (Highly Reliable)
            const createRes = await gapi.client.drive.files.create({
                resource: { 
                    name: filename, 
                    parents: [parentId], 
                    mimeType: 'application/json' 
                },
                fields: 'id'
            });
            
            const fileId = createRes.result.id;

            // Step 2: Upload the default content into the newly created file via simple media upload
            await gapi.client.request({
                path: `/upload/drive/v3/files/${fileId}`,
                method: 'PATCH',
                params: { uploadType: 'media' },
                body: defaultContent,
                headers: { 'Content-Type': 'application/json' }
            });
            
            return fileId;
        } catch (e) {
            console.error("Error creating file " + filename, e);
            throw e;
        }
    }
    return file.id;
}

async function loadJson(filename) {
    if(!STATE.catalogFolderId) throw new Error("Storage not initialized");
    
    let file = await findFile(filename, STATE.catalogFolderId);
    if(!file) {
        // Initialize default empty structure based on filename
        let defaultContent = "[]";
        if(filename === 'settings.json') defaultContent = "{}";
        await ensureFileExists(filename, STATE.catalogFolderId, defaultContent);
        return JSON.parse(defaultContent);
    }
    
    try {
        const response = await gapi.client.drive.files.get({ fileId: file.id, alt: 'media' });
        return response.result;
    } catch(e) {
        console.error("Error loading JSON: " + filename, e);
        return filename === 'settings.json' ? {} : [];
    }
}

async function saveJson(filename, data) {
    if(!STATE.catalogFolderId) throw new Error("Storage not initialized");
    showLoader("Saving...");
    
    try {
        let file = await findFile(filename, STATE.catalogFolderId);
        let fileId = file ? file.id : await ensureFileExists(filename, STATE.catalogFolderId);
        
        const content = JSON.stringify(data, null, 2);
        
        // Use PATCH to update existing file content
        const request = gapi.client.request({
            path: `/upload/drive/v3/files/${fileId}`,
            method: 'PATCH',
            params: { uploadType: 'media' },
            body: content,
            headers: { 'Content-Type': 'application/json' }
        });
        
        await request;
        console.log(`Saved ${filename} successfully.`);
        return true;
    } catch(e) {
         console.error("Error saving JSON: " + filename, e);
         alert("Failed to save data. Please try again.");
         return false;
    } finally {
        hideLoader();
    }
}

// Ensure specific category folder exists under images/categories/
async function ensureCategoryFolder(slug) {
    if(!STATE.imagesFolderId) throw new Error("Storage not initialized");
    
    let catsFolder = await findFile('categories', STATE.imagesFolderId, 'application/vnd.google-apps.folder');
    if(!catsFolder) catsFolder = { id: await createFolder('categories', STATE.imagesFolderId) };
    
    let targetFolder = await findFile(slug, catsFolder.id, 'application/vnd.google-apps.folder');
    if(!targetFolder) {
        targetFolder = { id: await createFolder(slug, catsFolder.id) };
        await createFolder('products', targetFolder.id);
        await createFolder('thumbnails', targetFolder.id);
    }
    return targetFolder.id;
}

// Upload image (simplified base64 upload for constraints)
async function uploadImage(file, parentFolderId, newFilename) {
    showLoader("Uploading image...");
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async function() {
            const fileMetadata = { name: newFilename || file.name, parents: [parentFolderId] };
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";
            
            // Convert ArrayBuffer to Base64
            let binary = '';
            const bytes = new Uint8Array(reader.result);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
            const base64Data = btoa(binary);

            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(fileMetadata) +
                delimiter +
                'Content-Type: ' + file.type + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n\r\n' +
                base64Data +
                close_delim;

            try {
                const request = gapi.client.request({
                    'path': '/upload/drive/v3/files',
                    'method': 'POST',
                    'params': {'uploadType': 'multipart'},
                    'headers': { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
                    'body': multipartRequestBody
                });
                let response = await request;
                
                // Make publicly readable
                await gapi.client.drive.permissions.create({
                    fileId: response.result.id,
                    resource: { type: 'anyone', role: 'reader' }
                });
                
                resolve(response.result.id);
            } catch(e) {
                console.error(e);
                reject(e);
            } finally { hideLoader(); }
        };
    });
}
