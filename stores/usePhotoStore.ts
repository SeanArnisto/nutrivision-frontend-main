import { create } from 'zustand';

export interface Photo {
  uri: string;
  id: string;
  type: 'label' | 'fruit';
  width?: number;
  height?: number;
  orientation: string;
}

interface PhotosStore {
  // State
  capturedPhotos: Photo[];
  
  // Actions
  addPhoto: (photo: Photo) => void;
  removePhoto: (index: number) => void;
  removePhotoById: (id: string) => void;
  clearAllPhotos: () => void;
  updatePhoto: (index: number, updatedPhoto: Partial<Photo>) => void;
  setPhotos: (photos: Photo[]) => void;
  
  // Selectors/Getters
  getPhotoCount: () => number;
  getPhotosByType: (type: Photo['type']) => Photo[];
  hasMaxPhotos: () => boolean;
}

export const usePhotosStore = create<PhotosStore>((set, get) => ({
  // State
  capturedPhotos: [],
  
  // Actions
  addPhoto: (photo: Photo) => 
    set((state) => ({
      capturedPhotos: [photo, ...state.capturedPhotos].slice(0, 5) // Keep max 5 photos
    })),
  
  removePhoto: (index: number) =>
    set((state) => ({
      capturedPhotos: state.capturedPhotos.filter((_, i) => i !== index)
    })),
  
  removePhotoById: (id: string) =>
    set((state) => ({
      capturedPhotos: state.capturedPhotos.filter((photo) => photo.id !== id)
    })),
  
  clearAllPhotos: () =>
    set({ capturedPhotos: [] }),
  
  updatePhoto: (index: number, updatedPhoto: Partial<Photo>) =>
    set((state) => ({
      capturedPhotos: state.capturedPhotos.map((photo, i) => 
        i === index ? { ...photo, ...updatedPhoto } : photo
      )
    })),
  
  setPhotos: (photos: Photo[]) =>
    set({ capturedPhotos: photos.slice(0, 5) }), // Ensure max 5 photos
  
  // Selectors/Getters
  getPhotoCount: () => get().capturedPhotos.length,
  
  getPhotosByType: (type: Photo['type']) => 
    get().capturedPhotos.filter((photo) => photo.type === type),
  
  hasMaxPhotos: () => get().capturedPhotos.length >= 5,
}));