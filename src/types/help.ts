
export interface HelpRequest {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  user_name?: string;
  user_email?: string;
}

// Type for RPC function return types
export type GetUserHelpRequestsResult = HelpRequest[];
export type GetHelpRequestsResult = HelpRequest[];
export type CreateHelpRequestResult = HelpRequest;
export type UpdateHelpRequestStatusResult = HelpRequest;
