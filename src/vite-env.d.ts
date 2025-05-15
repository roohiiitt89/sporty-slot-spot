
/// <reference types="vite/client" />

// Add types for Web Speech API
interface Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}
