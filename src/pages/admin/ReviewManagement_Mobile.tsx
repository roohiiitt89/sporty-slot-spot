
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Star, Check, X, Eye, AlertCircle } from 'lucide-react';

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

const ReviewManagement_Mobile: React.FC = () => {
  const { userRole } = useAuth();
  const [adminVenues, setAdminVenues] = useState<Array<{ venue_id: string }>>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        let query = supabase.from('reviews').select('*, venues(name)');
        if (userRole === 'admin') {
          const { data } = await supabase.rpc('get_admin_venues');
          setAdminVenues(data || []);
          const venueIds = (data || []).map((v: any) => v.venue_id);
          if (venueIds.length > 0) query = query.in('venue_id', venueIds);
        }
        const { data: reviewsData, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform the data to match our Review interface
        const formattedReviews: Review[] = (reviewsData || []).map((review: any) => ({
          id: review.id,
          venue_id: review.venue_id,
          venue_name: review.venues?.name || 'Unknown Venue',
          user_id: review.user_id,
          user_name: review.user_name || 'Anonymous',
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          is_approved: review.is_approved
        }));
        
        setReviews(formattedReviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [userRole]);

  const approveReview = async (id: string) => {
    await supabase.from('reviews').update({ is_approved: true }).eq('id', id);
    setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: true } : r));
  };
  const rejectReview = async (id: string) => {
    await supabase.from('reviews').delete().eq('id', id);
    setReviews(reviews.filter(r => r.id !== id));
  };
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo"></div></div>;

  return (
    <div className="p-2 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-3 text-white">Reviews</h2>
      <div className="flex flex-col gap-2">
        {reviews.length === 0 ? (
          <div className="bg-emerald-800 rounded-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No reviews found</h3>
          </div>
        ) : reviews.map(review => (
          <div key={review.id} className="bg-navy-800 rounded-lg shadow px-2 py-2 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm truncate">{review.venue_name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${review.is_approved ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{review.is_approved ? 'Approved' : 'Pending'}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-300">
              {[1,2,3,4,5].map(star => <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />)}
              <span className="ml-1">{review.rating}/5</span>
            </div>
            <div className="truncate text-xs text-gray-400">{review.comment || <span className="italic">No comment</span>}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">{review.user_name || 'Anonymous'} • {formatDate(review.created_at)}</span>
              <div className="flex gap-1">
                <button className="p-1 rounded bg-navy-900 hover:bg-navy-700 text-indigo-300" title="View" onClick={() => { setSelectedReview(review); setShowModal(true); }}><Eye className="w-4 h-4" /></button>
                {!review.is_approved && <>
                  <button className="p-1 rounded bg-navy-900 hover:bg-navy-700 text-green-300" title="Approve" onClick={() => approveReview(review.id)}><Check className="w-4 h-4" /></button>
                  <button className="p-1 rounded bg-navy-900 hover:bg-navy-700 text-red-300" title="Reject" onClick={() => rejectReview(review.id)}><X className="w-4 h-4" /></button>
                </>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Modal for full review */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold">Review Details</h3>
            </div>
            <div className="px-6 py-4 space-y-2">
              <div className="font-bold text-lg">{selectedReview.venue_name}</div>
              <div className="flex items-center gap-1 text-sm">
                {[1,2,3,4,5].map(star => <Star key={star} className={`w-4 h-4 ${star <= selectedReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />)}
                <span className="ml-1">{selectedReview.rating}/5</span>
              </div>
              <div className="text-gray-700">{selectedReview.comment || <span className="italic">No comment</span>}</div>
              <div className="text-xs text-gray-500">{selectedReview.user_name || 'Anonymous'} • {formatDate(selectedReview.created_at)}</div>
              <div className="flex gap-2 mt-2">
                {!selectedReview.is_approved && <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => { approveReview(selectedReview.id); setShowModal(false); }}>Approve</button>}
                {!selectedReview.is_approved && <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => { rejectReview(selectedReview.id); setShowModal(false); }}>Reject</button>}
                <button className="px-3 py-1 border rounded" onClick={() => setShowModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewManagement_Mobile; 
