
/// <reference types="vite/client" />

// Add types for Web Speech API
interface Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

// Add missing type for NearbyVenues
declare module '@/components/NearbyVenues' {
  export const NearbyVenues: React.FC<{ className?: string }>;
}
