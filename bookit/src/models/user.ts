export interface UserInfo {
  sub: string;
  name: string;
  nickname: string;
  locale: string;
  cid: string;
}

export interface User extends UserInfo {
  groups: string[];
  is_admin: boolean;
}
