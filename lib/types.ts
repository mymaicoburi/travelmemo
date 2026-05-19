export type Trip = {
  id: string;
  slug: string;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export type ScheduleItem = {
  id: string;
  trip_id: string;
  day: string;
  start_time: string | null;
  title: string;
  location: string | null;
  memo: string | null;
  sort_order: number;
  created_at: string;
};

export type Comment = {
  id: string;
  trip_id: string;
  schedule_item_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
};

export type TripMember = {
  id: string;
  trip_id: string;
  name: string;
  created_at: string;
};

export type ScheduleParticipant = {
  schedule_item_id: string;
  member_id: string;
};
