import React, { useState } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import Footer from '../components/Footer';
import BookSlotModal from '../components/BookSlotModal';

const Index: React.FC = () => {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <HeroSection onBookNowClick={() => setIsBookModalOpen(true)} />
      <Footer />

      {isBookModalOpen && (
        <BookSlotModal
          open={isBookModalOpen}
          onOpenChange={setIsBookModalOpen}
          selectedDate={new Date()}
          selectedCourt={null}
          hourlyRate={null}
          onBookingComplete={() => {}}
          allowCashPayments={true}
          onClose={() => setIsBookModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Index;
