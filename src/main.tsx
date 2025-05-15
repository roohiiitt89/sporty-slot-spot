
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupRealtimeSubscriptions, enableRealtimeForBookingSystem } from './integrations/supabase/realtime'

// Initialize realtime subscriptions for the application
setupRealtimeSubscriptions();
enableRealtimeForBookingSystem();

createRoot(document.getElementById("root")!).render(<App />);
