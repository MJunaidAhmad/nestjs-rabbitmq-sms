import { ApiProperty } from '@nestjs/swagger';

export class ValidationErrorResponse {
  @ApiProperty({ default: 400 })
  statusCode: number;
  @ApiProperty({ description: 'validation error messages' })
  message: Array<string>;
  @ApiProperty()
  error: string;
}
