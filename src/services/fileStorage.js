import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../config/firebase";

/**
 * Upload a file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} category - The category folder (staff, ingredients, products, suppliers)
 * @param {string} [filename] - Optional custom filename
 * @param {function} [onProgress] - Optional progress callback
 * @returns {Promise<{url: string, path: string}>}
 */
export const uploadFile = async (file, category, filename, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    // Ensure category is valid
    const validCategories = ["staff", "ingredients", "products", "suppliers"];
    const folderPath = validCategories.includes(category) ? category : "misc";
    
    // Create a reference with a unique name
    const timestamp = Date.now();
    const finalFilename = filename || `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    
    // Use the TrackNToms/ folder structure you've created
    const storagePath = `TrackNToms/${folderPath}/${finalFilename}`;
    const storageRef = ref(storage, storagePath);
    
    // Start upload task
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Listen for state changes
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Calculate and report progress
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) onProgress(progress);
      },
      (error) => {
        // Handle errors
        console.error("Upload failed:", error);
        reject(error);
      },
      async () => {
        // Upload completed successfully
        try {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Resolve with URL and path
          resolve({
            url: downloadURL,
            path: storagePath,
          });
        } catch (error) {
          console.error("Failed to get download URL:", error);
          reject(error);
        }
      }
    );
  });
};

/**
 * Delete a file from Firebase Storage
 * @param {string} path - The path to the file in Storage
 * @returns {Promise<void>}
 */
export const deleteFile = async (path) => {
  if (!path) return;
  
  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

/**
 * Extract filename from a Firebase Storage URL or path
 * @param {string} urlOrPath - Firebase Storage URL or path
 * @returns {string} Extracted filename
 */
export const getFilenameFromPath = (urlOrPath) => {
  if (!urlOrPath) return "";
  
  // Handle both URLs and paths
  const parts = urlOrPath.split("/");
  return parts[parts.length - 1];
};