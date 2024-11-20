export interface UploadDeleteRequest {
  id: number;
}

export interface Upload {
  id: string;
  vector_id: string;
  user_id: string;
  name: string;
  type: string;
}
