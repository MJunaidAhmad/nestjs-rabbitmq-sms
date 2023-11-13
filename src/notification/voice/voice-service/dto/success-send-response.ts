import { ApiProperty } from '@nestjs/swagger';

export class SendVoiceMessageSuccessResponse {
  @ApiProperty()
  message: string;

  @ApiProperty()
  messageId: string;
}
