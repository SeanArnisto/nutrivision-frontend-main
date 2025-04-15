// ApiContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import axios from 'axios';

// Define types for our context
interface ImageToUpload {
  uri: string;
  type?: string;
  name?: string;
}

interface ApiContextState {
  uploadedImages: ImageToUpload[];
  extractedData: any | null;
  isLoading: boolean;
  error: string | null;
  uploadImages: (images: ImageToUpload[]) => Promise<any>;
  clearData: () => void;
}

// Create the context with a default undefined value
const ApiContext = createContext<ApiContextState | undefined>(undefined);

// Props for the provider component
interface ApiProviderProps {
  children: ReactNode;
}

// Create the provider component
export function ApiProvider({ children }: ApiProviderProps): JSX.Element {
  console.log('✅ ApiProvider mounted');
  // State for storing uploaded images data
  const [uploadedImages, setUploadedImages] = useState<ImageToUpload[]>([]);
  // State for storing API response data
  const [extractedData, setExtractedData] = useState<any | null>(null);
  // State for tracking loading status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State for errors
  const [error, setError] = useState<string | null>(null);

  // Function to upload images to the API endpoint using axios
  const uploadImages = async (images: ImageToUpload[]): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      // Append each image to the form data
      images.forEach((image) => {
        // Extract the filename from the URI if not already provided
        const uriParts = image.uri.split('/');
        const fileName = image.name || uriParts[uriParts.length - 1];
        // Determine the file MIME type (example: image/jpeg)
        const match = /\.(\w+)$/.exec(fileName);
        const type = image.type || (match ? `image/${match[1]}` : 'image/jpeg');

        // Append to form data – note that React Native FormData works a bit differently
        formData.append('files', {
          uri: image.uri,
          name: fileName,
          type: type,
        } as any); // Using "any" as a workaround for FormData types in RN
      });

      // Use axios.post to upload data to the given endpoint
      const response = await axios.post(
        'https://nutrivision-backend-textrecog-77tx.onrender.com/extract/',
        formData,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Update state with the response data
      setExtractedData(response.data);
      setUploadedImages(images);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload images';
      setError(errorMessage);
      console.error('Upload error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear all data
  const clearData = (): void => {
    setUploadedImages([]);
    setExtractedData(null);
    setError(null);
  };

  // The value to be provided to consumers
  const value: ApiContextState = {
    uploadedImages,
    extractedData,
    isLoading,
    error,
    uploadImages,
    clearData,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

// Custom hook for using this context
export function useApi(): ApiContextState {
  const context = useContext(ApiContext);
  console.log('📌 useApi called, context:', context);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
