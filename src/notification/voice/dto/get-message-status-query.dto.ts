import { ApiProperty } from '@nestjs/swagger';

export class GetMessageStatusQueryDto {
  @ApiProperty()
  message_id: string;
}
