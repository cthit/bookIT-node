export interface UserInfo {
  sid: string;
  sub: string;
  given_name: string;
  locale: string;
  picture: string;
  name: string;
  nickname: string;
  family_name: string;
  jti: string;
  cid: string;
}

export interface User extends UserInfo {
  groups: string[];
  is_admin: boolean;
}