
import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

interface ReviewModalProps {
  bookingId: string;
  venueId: string;
  venueName: string;
  onClose: () => void;
}

export function ReviewModal({ bookingId, venueId, venueName, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to submit a review.",
        variant: "destructive",
      });
      return;
    }
    
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting your review.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase.from('reviews').insert({
        booking_id: bookingId || null,
        venue_id: venueId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null
      });
      
      if (error) throw error;
      
      toast({
        title: "Thank you for your review!",
        description: "Your feedback has been submitted and will be reviewed by our team.",
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Failed to submit review",
        description: "There was an error submitting your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-navy-light to-navy-dark rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-indigo/30">
        <div className="flex justify-between items-center p-6 border-b border-indigo/20">
          <h2 className="text-xl font-bold text-white">Rate your experience</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-white text-lg mb-1">How was your experience at</p>
            <p className="text-indigo-light text-xl font-bold">{venueName}?</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="flex justify-center mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(null)}
                  onClick={() => handleRatingClick(star)}
                  className="px-2 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredStar || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-500'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            
            <div className="mb-6">
              <label htmlFor="comment" className="block text-white mb-2">
                Share your thoughts (optional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience..."
                className="w-full h-32 px-4 py-3 rounded-lg bg-navy border border-indigo/30 focus:border-indigo-light text-white focus:outline-none focus:ring-1 focus:ring-indigo-light placeholder-gray-500"
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className={`px-4 py-2 bg-indigo text-white rounded-md hover:bg-indigo-dark transition-colors ${
                  (isSubmitting || rating === 0) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
