
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, ThumbsUp } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  user_name?: string;
}

interface VenueReviewsProps {
  venueId: string;
}

export function VenueReviews({ venueId }: VenueReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [venueId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id
        `)
        .eq('venue_id', venueId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        const reviewsWithUserInfo = await Promise.all(
          data.map(async (review) => {
            // Try to get user profile info
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, profile_name')
              .eq('id', review.user_id)
              .single();
              
            return {
              ...review,
              user_name: profileData?.profile_name || profileData?.full_name || 'Anonymous'
            };
          })
        );
        
        setReviews(reviewsWithUserInfo);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-sport-gray-dark mb-4">Reviews</h2>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo"></div>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-sport-gray-dark">{review.user_name}</h3>
                  <div className="flex items-center mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
                
                <button className="text-gray-400 hover:text-indigo transition-colors p-1">
                  <ThumbsUp className="h-4 w-4" />
                </button>
              </div>
              
              {review.comment && (
                <p className="text-sport-gray-dark mt-3 text-sm">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sport-gray-dark py-8">
          No reviews yet. Be the first to leave a review!
        </p>
      )}
    </div>
  );
}
