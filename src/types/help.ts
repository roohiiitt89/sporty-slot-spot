
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

// Type for the result of get_user_help_requests
export type GetUserHelpRequestsResult = HelpRequest[];

// Type for the result of get_help_requests
export type GetHelpRequestsResult = HelpRequest[];

// Type for the result of create_help_request
export type CreateHelpRequestResult = HelpRequest;

// Type for the result of update_help_request_status
export type UpdateHelpRequestStatusResult = HelpRequest;
