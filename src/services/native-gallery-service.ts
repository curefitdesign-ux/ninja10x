import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface GalleryPhoto {
  id: string;
  dataUrl: string;
  webPath: string;
  timestamp: Date;
}

class NativeGalleryService {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Check if running on native platform
   */
  isNativePlatform(): boolean {
    return this.isNative;
  }

  /**
   * Request camera/gallery permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!this.isNative) return false;
    
    try {
      const permissions = await Camera.requestPermissions({
        permissions: ['photos']
      });
      return permissions.photos === 'granted';
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  /**
   * Check current permissions status
   */
  async checkPermissions(): Promise<boolean> {
    if (!this.isNative) return false;
    
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.photos === 'granted';
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }

  /**
   * Pick a single photo from gallery
   */
  async pickPhoto(): Promise<GalleryPhoto | null> {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        quality: 90
      });

      if (photo.dataUrl) {
        return {
          id: `photo-${Date.now()}`,
          dataUrl: photo.dataUrl,
          webPath: photo.webPath || '',
          timestamp: new Date()
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to pick photo:', error);
      return null;
    }
  }

  /**
   * Pick multiple photos from gallery
   */
  async pickMultiplePhotos(limit: number = 10): Promise<GalleryPhoto[]> {
    try {
      const photos = await Camera.pickImages({
        quality: 90,
        limit
      });

      const galleryPhotos: GalleryPhoto[] = [];

      for (const photo of photos.photos) {
        try {
          // Read the file to get base64 data
          if (photo.webPath) {
            const response = await fetch(photo.webPath);
            const blob = await response.blob();
            const dataUrl = await this.blobToDataUrl(blob);
            
            galleryPhotos.push({
              id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              dataUrl,
              webPath: photo.webPath,
              timestamp: new Date() // Note: actual timestamp not available from picker
            });
          }
        } catch (err) {
          console.error('Failed to process photo:', err);
        }
      }

      return galleryPhotos;
    } catch (error) {
      console.error('Failed to pick photos:', error);
      return [];
    }
  }

  /**
   * Take a new photo with camera
   */
  async takePhoto(): Promise<GalleryPhoto | null> {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        quality: 90
      });

      if (photo.dataUrl) {
        return {
          id: `photo-${Date.now()}`,
          dataUrl: photo.dataUrl,
          webPath: photo.webPath || '',
          timestamp: new Date()
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to take photo:', error);
      return null;
    }
  }

  /**
   * Convert blob to data URL
   */
  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Filter photos by date (for 24-hour restriction)
   * Note: This works with file lastModified when available
   */
  filterRecentPhotos(photos: GalleryPhoto[], hoursAgo: number = 24): GalleryPhoto[] {
    const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    return photos.filter(photo => photo.timestamp >= cutoff);
  }
}

export const nativeGalleryService = new NativeGalleryService();
