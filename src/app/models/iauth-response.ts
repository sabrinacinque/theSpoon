import { IUserAuthData } from './iuser-auth-data';

export interface IAuthResponse {
  success: boolean;
  message?: string;
  data?: IUserAuthData;
}
