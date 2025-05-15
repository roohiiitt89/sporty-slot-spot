import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Star, Check, X, Loader2, Eye, ThumbsUp, AlertCircle } from 'lucide-react';
interface Review {
  id: string;
  venue_id: string;
  venue_name: string;
  user_id: string;
  user_name?: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_approved: boolean;
}
interface ReviewManagementProps {
  userRole: string | null;
  adminVenues?: Array<{
    venue_id: string;
  }>;
}
const ReviewManagement: React.FC<ReviewManagementProps> = ({
  userRole,
  adminVenues = []
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const isSuperAdmin = userRole === 'super_admin';
  useEffect(() => {
    fetchReviews();
  }, [userRole, adminVenues]);
  useEffect(() => {
    filterReviews();
  }, [reviews, filter]);
  const fetchReviews = async () => {
    try {
      setLoading(true);
      let query = supabase.from('reviews').select(`
        id, 
        venue_id,
        user_id,
        rating,
        comment,
        created_at,
        is_approved
      `);

      // For regular admins, only fetch reviews for their venues
      if (userRole === 'admin' && adminVenues && adminVenues.length > 0) {
        const venueIds = adminVenues.map(venue => venue.venue_id);
        query = query.in('venue_id', venueIds);
      }
      const {
        data,
        error
      } = await query.order('created_at', {
        ascending: false
      });
      if (error) throw error;
      if (data) {
        // Fetch venue names and user information for each review
        const enrichedReviews = await Promise.all(data.map(async review => {
          // Get venue name
          const {
            data: venueData
          } = await supabase.from('venues').select('name').eq('id', review.venue_id).single();

          // Get user information
          const {
            data: userData
          } = await supabase.from('profiles').select('full_name, profile_name').eq('id', review.user_id).single();
          return {
            ...review,
            venue_name: venueData?.name || 'Unknown Venue',
            user_name: userData?.profile_name || userData?.full_name || 'Anonymous'
          };
        }));
        setReviews(enrichedReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const filterReviews = () => {
    if (filter === 'all') {
      setFilteredReviews(reviews);
    } else if (filter === 'pending') {
      setFilteredReviews(reviews.filter(review => !review.is_approved));
    } else {
      setFilteredReviews(reviews.filter(review => review.is_approved));
    }
  };
  const approveReview = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from('reviews').update({
        is_approved: true
      }).eq('id', id);
      if (error) throw error;

      // Update local state
      setReviews(reviews.map(review => review.id === id ? {
        ...review,
        is_approved: true
      } : review));
      toast({
        title: 'Review approved',
        description: 'The review is now visible to all users'
      });
    } catch (error) {
      console.error('Error approving review:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve review',
        variant: 'destructive'
      });
    }
  };
  const rejectReview = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;

      // Update local state
      setReviews(reviews.filter(review => review.id !== id));
      toast({
        title: 'Review rejected',
        description: 'The review has been deleted'
      });
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete review',
        variant: 'destructive'
      });
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold">Review Management</h2>
        
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-md text-sm ${filter === 'all' ? 'bg-indigo text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            All
          </button>
          <button onClick={() => setFilter('pending')} className={`px-3 py-1 rounded-md text-sm ${filter === 'pending' ? 'bg-indigo text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            Pending
          </button>
          <button onClick={() => setFilter('approved')} className={`px-3 py-1 rounded-md text-sm ${filter === 'approved' ? 'bg-indigo text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            Approved
          </button>
        </div>
      </div>
      
      {loading ? <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo" />
        </div> : filteredReviews.length === 0 ? <div className="bg-emerald-800 rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No reviews found</h3>
          <p className="text-gray-500">
            {filter === 'pending' ? 'There are no pending reviews to moderate' : filter === 'approved' ? 'No approved reviews yet' : 'No reviews have been submitted yet'}
          </p>
        </div> : <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venue
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating & Comment
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReviews.map(review => <tr key={review.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{review.venue_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{review.user_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />)}
                      <span className="ml-1 text-sm text-gray-700">{review.rating}/5</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500 max-w-md truncate">
                      {review.comment || <span className="italic text-gray-400">No comment</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(review.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${review.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {review.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button className="text-indigo-600 hover:text-indigo-900" title="View full review">
                        <Eye className="h-5 w-5" />
                      </button>
                      
                      {!review.is_approved && <>
                          <button onClick={() => approveReview(review.id)} className="text-green-600 hover:text-green-900" title="Approve review">
                            <Check className="h-5 w-5" />
                          </button>
                          <button onClick={() => rejectReview(review.id)} className="text-red-600 hover:text-red-900" title="Reject review">
                            <X className="h-5 w-5" />
                          </button>
                        </>}
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>}
    </div>;
};
export default ReviewManagement;