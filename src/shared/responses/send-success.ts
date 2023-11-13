import { ApiProperty } from '@nestjs/swagger';

export class SendSuccessResponse {
  @ApiProperty()
  message: string;
}
