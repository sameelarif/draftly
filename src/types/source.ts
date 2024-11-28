export interface Source {
  id: number;
  user_id: string;
  label: string;
  content: string;
  created_at: Date;
}

export interface AddSourceRequest {
  type: "url" | "text";
  content: string;
}
