import { Result } from "../../shared/models/result";

export const invalidNicknameLength = new Result('SB0012', 'Độ dài từ 3 đến 14 ký tự !!');
export const invalidNicknameChars = new Result('SB0013', 'Tên không chứa ký tự đặc biệt !!');
export const isDisableAccount = new Result('2002', 'Account is locked');
export const sameWithUsername = new Result('SB0014', 'Tên nhân vật không được trùng với tên đăng nhập...');
export const duplicateNickname = new Result('SB0015', 'Tên nhân vật đã tồn tại...');
