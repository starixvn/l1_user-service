import { VerifySessionRequest } from "./verify-session-request";

export class UpdateSettingsRequest extends VerifySessionRequest {
    key: string;
    value: any;
}
