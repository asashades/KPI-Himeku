/**
 * Google Apps Script untuk upload foto presensi ke Google Drive
 * 
 * CARA DEPLOY:
 * 1. Buka https://script.google.com/
 * 2. Buat project baru
 * 3. Copy paste seluruh kode ini
 * 4. Deploy > New Deployment
 * 5. Select type: Web app
 * 6. Execute as: Me (email Anda)
 * 7. Who has access: Anyone (atau Anyone with Google account)
 * 8. Deploy dan copy Web App URL
 * 9. Set URL tersebut di environment variable GAS_UPLOAD_URL
 *
 * STRUKTUR FOLDER:
 * - Folder ID: 1UxX1wtijj5imDREJeb3d1j2rCYvL2VFx
 * - Subfolder per bulan akan dibuat otomatis
 */

// ID Folder Google Drive untuk menyimpan foto presensi
const DRIVE_FOLDER_ID = '1UxX1wtijj5imDREJeb3d1j2rCYvL2VFx';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Validasi input
    if (!data.base64 || !data.filename || !data.mimeType) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Missing required fields: base64, filename, mimeType'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Decode base64
    const base64Data = data.base64.replace(/^data:image\/\w+;base64,/, '');
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), data.mimeType, data.filename);
    
    // Get or create monthly subfolder
    const parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const monthFolder = getOrCreateMonthFolder(parentFolder);
    
    // Upload file
    const file = monthFolder.createFile(blob);
    
    // Make file viewable by anyone with the link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileUrl = file.getUrl();
    const fileId = file.getId();
    const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileUrl: fileUrl,
      directUrl: directUrl,
      fileId: fileId,
      filename: data.filename
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Himecrew App Photo Upload Service',
    usage: 'POST with JSON body: { base64: string, filename: string, mimeType: string }'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get or create subfolder for current month
 */
function getOrCreateMonthFolder(parentFolder) {
  const now = new Date();
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const folderName = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  
  // Check if folder exists
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  
  // Create new folder
  return parentFolder.createFolder(folderName);
}

/**
 * Test function - run this to verify setup
 */
function testSetup() {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    Logger.log('Folder name: ' + folder.getName());
    Logger.log('Setup verified successfully!');
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    Logger.log('Make sure the DRIVE_FOLDER_ID is correct and you have access to the folder.');
  }
}
