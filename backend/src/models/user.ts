export interface User {
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
  groups: string[];
  is_admin: boolean;
}
