/**
 * Pipedrive API Types
 * 
 * Type definitions for Pipedrive CRM API integration.
 * These types match the Pipedrive API response structures.
 */

/**
 * Pipedrive API Response wrapper
 */
export interface PipedriveApiResponse<T = any> {
  success: boolean;
  data: T;
  additional_data?: {
    pagination?: {
      start: number;
      limit: number;
      more_items_in_collection: boolean;
      next_start?: number;
    };
  };
  related_objects?: Record<string, any>;
}

/**
 * Pipedrive Person (Contact) structure
 */
export interface PipedrivePerson {
  id: number;
  company_id: number;
  owner_id: {
    id: number;
    name: string;
    email: string;
    has_pic: boolean;
    pic_hash: string | null;
    active_flag: boolean;
    value: number;
  };
  org_id: {
    name: string;
    people_count: number;
    owner_id: number;
    address: string | null;
    active_flag: boolean;
    cc_email: string;
    value: number;
  } | null;
  name: string;
  first_name: string;
  last_name: string;
  open_deals_count: number;
  related_open_deals_count: number;
  closed_deals_count: number;
  related_closed_deals_count: number;
  participant_open_deals_count: number;
  participant_closed_deals_count: number;
  email_messages_count: number;
  activities_count: number;
  done_activities_count: number;
  undone_activities_count: number;
  files_count: number;
  notes_count: number;
  followers_count: number;
  won_deals_count: number;
  related_won_deals_count: number;
  lost_deals_count: number;
  related_lost_deals_count: number;
  active_flag: boolean;
  phone: Array<{
    value: string;
    primary: boolean;
    label: string;
  }>;
  email: Array<{
    value: string;
    primary: boolean;
    label: string;
  }>;
  primary_email: string;
  first_char: string;
  update_time: string;
  add_time: string;
  visible_to: string;
  marketing_status: string;
  picture_id: {
    item_type: string;
    item_id: number;
    active_flag: boolean;
    add_time: string;
    update_time: string;
    added_by_user_id: number;
    pictures: Record<string, string>;
    value: number;
  } | null;
  next_activity_date: string | null;
  next_activity_time: string | null;
  next_activity_id: number | null;
  last_activity_id: number | null;
  last_activity_date: string | null;
  last_incoming_mail_time: string | null;
  last_outgoing_mail_time: string | null;
  label: number | null;
  org_name: string;
  owner_name: string;
  cc_email: string;
  [key: string]: any; // Custom fields
}

/**
 * Pipedrive Organization structure
 */
export interface PipedriveOrganization {
  id: number;
  company_id: number;
  owner_id: {
    id: number;
    name: string;
    email: string;
    has_pic: boolean;
    pic_hash: string | null;
    active_flag: boolean;
    value: number;
  };
  name: string;
  open_deals_count: number;
  related_open_deals_count: number;
  closed_deals_count: number;
  related_closed_deals_count: number;
  email_messages_count: number;
  people_count: number;
  activities_count: number;
  done_activities_count: number;
  undone_activities_count: number;
  files_count: number;
  notes_count: number;
  followers_count: number;
  won_deals_count: number;
  related_won_deals_count: number;
  lost_deals_count: number;
  related_lost_deals_count: number;
  active_flag: boolean;
  category_id: number | null;
  picture_id: {
    item_type: string;
    item_id: number;
    active_flag: boolean;
    add_time: string;
    update_time: string;
    added_by_user_id: number;
    pictures: Record<string, string>;
    value: number;
  } | null;
  country_code: string | null;
  first_char: string;
  update_time: string;
  add_time: string;
  visible_to: string;
  next_activity_date: string | null;
  next_activity_time: string | null;
  next_activity_id: number | null;
  last_activity_id: number | null;
  last_activity_date: string | null;
  label: number | null;
  address: string | null;
  address_subpremise: string | null;
  address_street_number: string | null;
  address_route: string | null;
  address_sublocality: string | null;
  address_locality: string | null;
  address_admin_area_level_1: string | null;
  address_admin_area_level_2: string | null;
  address_country: string | null;
  address_postal_code: string | null;
  address_formatted_address: string | null;
  owner_name: string;
  cc_email: string;
  [key: string]: any; // Custom fields
}

/**
 * Pipedrive Product structure
 */
export interface PipedriveProduct {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  unit: string | null;
  tax: number;
  category: string | null;
  active_flag: boolean;
  selectable: boolean;
  first_char: string;
  visible_to: string;
  owner_id: {
    id: number;
    name: string;
    email: string;
    has_pic: boolean;
    pic_hash: string | null;
    active_flag: boolean;
    value: number;
  };
  files_count: number;
  add_time: string;
  update_time: string;
  prices: Array<{
    id: number;
    product_id: number;
    price: number;
    currency: string;
    cost: number;
    overhead_cost: number;
  }>;
  [key: string]: any; // Custom fields
}

/**
 * Pipedrive Deal structure
 */
export interface PipedriveDeal {
  id: number;
  creator_user_id: {
    id: number;
    name: string;
    email: string;
    has_pic: boolean;
    pic_hash: string | null;
    active_flag: boolean;
    value: number;
  };
  user_id: {
    id: number;
    name: string;
    email: string;
    has_pic: boolean;
    pic_hash: string | null;
    active_flag: boolean;
    value: number;
  };
  person_id: {
    active_flag: boolean;
    name: string;
    email: Array<{
      label: string;
      value: string;
      primary: boolean;
    }>;
    phone: Array<{
      label: string;
      value: string;
      primary: boolean;
    }>;
    owner_id: number;
    value: number;
  } | null;
  org_id: {
    name: string;
    people_count: number;
    owner_id: number;
    address: string;
    active_flag: boolean;
    cc_email: string;
    value: number;
  } | null;
  stage_id: number;
  title: string;
  value: number;
  currency: string;
  add_time: string;
  update_time: string;
  stage_change_time: string;
  active: boolean;
  deleted: boolean;
  status: string;
  probability: number | null;
  next_activity_date: string | null;
  next_activity_time: string | null;
  next_activity_id: number | null;
  last_activity_id: number | null;
  last_activity_date: string | null;
  lost_reason: string | null;
  visible_to: string;
  close_time: string | null;
  pipeline_id: number;
  won_time: string | null;
  first_won_time: string | null;
  lost_time: string | null;
  products_count: number;
  files_count: number;
  notes_count: number;
  followers_count: number;
  email_messages_count: number;
  activities_count: number;
  done_activities_count: number;
  undone_activities_count: number;
  participants_count: number;
  expected_close_date: string | null;
  last_incoming_mail_time: string | null;
  last_outgoing_mail_time: string | null;
  label: string | null;
  stage_order_nr: number;
  person_name: string;
  org_name: string;
  next_activity_subject: string | null;
  next_activity_type: string | null;
  next_activity_duration: string | null;
  next_activity_note: string | null;
  formatted_value: string;
  weighted_value: number;
  formatted_weighted_value: string;
  weighted_value_currency: string;
  rotten_time: string | null;
  owner_name: string;
  cc_email: string;
  org_hidden: boolean;
  person_hidden: boolean;
  [key: string]: any; // Custom fields
}

/**
 * Pipedrive Pipeline structure
 */
export interface PipedrivePipeline {
  id: number;
  name: string;
  url_title: string;
  order_nr: number;
  active: boolean;
  deal_probability: boolean;
  add_time: string;
  update_time: string;
  selected: boolean;
}

/**
 * Pipedrive Stage structure
 */
export interface PipedriveStage {
  id: number;
  order_nr: number;
  name: string;
  active_flag: boolean;
  deal_probability: number;
  pipeline_id: number;
  rotten_flag: boolean;
  rotten_days: number | null;
  add_time: string;
  update_time: string;
}

/**
 * Pipedrive Deal Product structure
 */
export interface PipedriveDealProduct {
  id: number;
  deal_id: number;
  order_nr: number;
  product_id: number;
  product_variation_id: number | null;
  quantity: number;
  quantity_formatted: string;
  unit_price: number;
  sum: number;
  currency: string;
  enabled_flag: boolean;
  add_time: string;
  last_edit: string;
  comments: string | null;
  active_flag: boolean;
  tax: number;
  name: string;
  sum_formatted: string;
  quantity_default_currency: number;
  sum_default_currency: number;
}

/**
 * Pipedrive Activity structure
 */
export interface PipedriveActivity {
  id: number;
  company_id: number;
  user_id: number;
  done: boolean;
  type: string;
  reference_type: string | null;
  reference_id: number | null;
  conference_meeting_client: string | null;
  conference_meeting_url: string | null;
  conference_meeting_id: string | null;
  due_date: string;
  due_time: string;
  duration: string;
  busy_flag: boolean;
  add_time: string;
  marked_as_done_time: string;
  last_notification_time: string | null;
  last_notification_user_id: number | null;
  notification_language_id: number | null;
  subject: string;
  public_description: string | null;
  calendar_sync_include_context: string | null;
  location: string | null;
  org_id: number | null;
  person_id: number | null;
  deal_id: number | null;
  lead_id: string | null;
  project_id: number | null;
  active_flag: boolean;
  update_time: string;
  update_user_id: number | null;
  gcal_event_id: string | null;
  google_calendar_id: string | null;
  google_calendar_etag: string | null;
  source_timezone: string | null;
  rec_rule: string | null;
  rec_rule_extension: string | null;
  rec_master_activity_id: number | null;
  series: any[];
  created_by_user_id: number;
  location_subpremise: string | null;
  location_street_number: string | null;
  location_route: string | null;
  location_sublocality: string | null;
  location_locality: string | null;
  location_admin_area_level_1: string | null;
  location_admin_area_level_2: string | null;
  location_country: string | null;
  location_postal_code: string | null;
  location_formatted_address: string | null;
  attendees: any[];
  participants: any[];
  org_name: string | null;
  person_name: string | null;
  deal_title: string | null;
  owner_name: string;
  person_dropbox_bcc: string | null;
  deal_dropbox_bcc: string | null;
  assigned_to_user_id: number;
  file: any | null;
  note: string | null;
}

/**
 * Pipedrive Webhook Event structure
 */
export interface PipedriveWebhookEvent {
  v: number;
  matches_filters: {
    current: any[];
    previous: any[];
  };
  meta: {
    v: number;
    object: string;
    action: string;
    id: number;
    company_id: number;
    user_id: number;
    host: string;
    timestamp: number;
    timestamp_micro: number;
    permitted_user_ids: number[];
    trans_pending: boolean;
    is_bulk_update: boolean;
    pipedrive_service_name: boolean;
    webhook_id: string;
  };
  current: PipedriveDeal | PipedrivePerson | PipedriveOrganization | PipedriveActivity;
  previous: PipedriveDeal | PipedrivePerson | PipedriveOrganization | PipedriveActivity | null;
  event: string;
  retry: number;
}

/**
 * Pipedrive API Error structure
 */
export interface PipedriveApiError {
  success: boolean;
  error: string;
  error_code?: number;
  error_detail?: string;
  error_info?: string;
}

/**
 * Pipedrive Search Result structure
 */
export interface PipedriveSearchResult<T = any> {
  item: T;
  result_score: number;
}

/**
 * Pipedrive Custom Field structure
 */
export interface PipedriveCustomField {
  id: number;
  key: string;
  name: string;
  field_type: string;
  active_flag: boolean;
  edit_flag: boolean;
  index_visible_flag: boolean;
  details_visible_flag: boolean;
  add_visible_flag: boolean;
  important_flag: boolean;
  bulk_edit_allowed: boolean;
  searchable_flag: boolean;
  filtering_allowed: boolean;
  sortable_flag: boolean;
  mandatory_flag: boolean;
  options?: Array<{
    id: number;
    label: string;
  }>;
  add_time: string;
  update_time: string;
  last_updated_by_user_id: number;
}
