/**
 * Google Apps Script - Presensi Photo Upload to Google Drive
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Create new project, name it "KPI Himeku - Presensi Upload"
 * 3. Copy this entire code and paste it
 * 4. Create a folder in Google Drive for photos, copy the folder ID from URL
 * 5. Replace FOLDER_ID below with your folder ID
 * 6. Click Deploy > New deployment
 * 7. Select type: Web app
 * 8. Execute as: Me
 * 9. Who has access: Anyone
 * 10. Click Deploy and copy the Web App URL
 * 11. Update APPS_SCRIPT_URL in server/routes/presensi.js
 */

// ============ CONFIGURATION ============
// Replace with your Google Drive folder ID
// Get folder ID from URL: https://drive.google.com/drive/folders/FOLDER_ID_HERE
const FOLDER_ID = 'YOUR_FOLDER_ID_HERE';

// ============ MAIN FUNCTIONS ============

/**
 * Handle POST requests for file upload
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'upload') {
      return uploadPhoto(data);
    } else if (data.action === 'delete') {
      return deletePhoto(data.fileId);
    }
    
    return createResponse(false, 'Invalid action');
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return createResponse(true, 'Presensi Upload API is running', {
    version: '1.0',
    timestamp: new Date().toISOString()
  });
}

/**
 * Upload photo to Google Drive
 */
function uploadPhoto(data) {
  try {
    const { base64Data, fileName, mimeType, staffName, date } = data;
    
    // Validate required fields
    if (!base64Data || !fileName) {
      return createResponse(false, 'Missing required fields: base64Data, fileName');
    }
    
    // Get the folder
    const folder = DriveApp.getFolderById(FOLDER_ID);
    
    // Create subfolder by month (YYYY-MM) for organization
    const monthFolder = getOrCreateSubfolder(folder, date ? date.substring(0, 7) : getCurrentMonth());
    
    // Decode base64 to blob
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      mimeType || 'image/jpeg',
      fileName
    );
    
    // Create file in Google Drive
    const file = monthFolder.createFile(blob);
    
    // Set file description for reference
    file.setDescription(`Presensi: ${staffName || 'Unknown'} - ${date || new Date().toISOString()}`);
    
    // Make file accessible via link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get the file URL
    const fileUrl = file.getUrl();
    const fileId = file.getId();
    const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    
    return createResponse(true, 'File uploaded successfully', {
      fileId: fileId,
      fileName: file.getName(),
      fileUrl: fileUrl,
      directUrl: directUrl,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`
    });
    
  } catch (error) {
    return createResponse(false, 'Upload failed: ' + error.toString());
  }
}

/**
 * Delete photo from Google Drive
 */
function deletePhoto(fileId) {
  try {
    if (!fileId) {
      return createResponse(false, 'Missing fileId');
    }
    
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    
    return createResponse(true, 'File deleted successfully');
  } catch (error) {
    return createResponse(false, 'Delete failed: ' + error.toString());
  }
}

// ============ HELPER FUNCTIONS ============

/**
 * Get or create subfolder
 */
function getOrCreateSubfolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  }
  
  return parentFolder.createFolder(folderName);
}

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Create standardized JSON response
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============ TEST FUNCTION ============

/**
 * Test the upload function (run this in Apps Script editor)
 */
function testUpload() {
  // Small test image (1x1 red pixel)
  const testBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQA/AL+AB//Z';
  
  const testData = {
    action: 'upload',
    base64Data: testBase64,
    fileName: 'test_upload.jpg',
    mimeType: 'image/jpeg',
    staffName: 'Test User',
    date: new Date().toISOString().split('T')[0]
  };
  
  const result = uploadPhoto(testData);
  Logger.log(result.getContent());
}
