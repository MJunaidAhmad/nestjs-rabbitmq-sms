import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponse {
  @ApiProperty({ default: 422 })
  statusCode: number;
  @ApiProperty({ description: 'error message' })
  message: string;
}
