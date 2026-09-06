export interface UserInfo {
  sub: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  name: string;
  nickname: string;
  locale: string;
  cid: string;
}

export interface User extends UserInfo {
  groups: string[];
  is_admin: boolean;
}
