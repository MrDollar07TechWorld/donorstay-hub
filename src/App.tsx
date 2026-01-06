import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DonorList from "./pages/DonorList";
import RoomManagement from "./pages/RoomManagement";
import Bookings from "./pages/Bookings";
import PaymentTracking from "./pages/PaymentTracking";
import IDCards from "./pages/IDCards";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/donors" element={<DonorList />} />
          <Route path="/rooms" element={<RoomManagement />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/payments" element={<PaymentTracking />} />
          <Route path="/id-cards" element={<IDCards />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
