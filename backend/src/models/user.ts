export interface User {
  cid: string;
  phone?: string;
  is_admin: boolean;
  groups: string[];
  language: string;
  accessToken?: string;
}
