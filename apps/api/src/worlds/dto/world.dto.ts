import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateWorldDto {
  @ApiProperty({ example: 'kpop-idol-producer' })
  @IsString()
  @IsNotEmpty()
  scenarioKey!: string;

  @ApiProperty({ example: 'Mina Park' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  playerName!: string;

  @ApiPropertyOptional({ example: 'A former center who writes demos at 3am.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  playerPersona?: string;

  @ApiPropertyOptional({ example: 'The Midnight Studio' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;
}

export class WorldActionDto {
  @ApiProperty({
    example:
      'I invite the rival idol to my studio at midnight to hear the demo.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  action!: string;
}

export class ListWorldsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;
}

export class CreatePostDto {
  @ApiProperty({
    example: 'The demo is real. I just need one person to believe it.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content!: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number;
}

export class SendDmDto {
  @ApiProperty({ example: 'We need to talk about the leaked demo.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content!: string;
}

export class GenerateEventDto {
  @ApiPropertyOptional({
    example: 'scandal',
    description:
      'scandal, opportunity, rivalry, romance, career, public, or wildcard',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @ApiPropertyOptional({
    example: 'A tabloid claims I stole the demo from a trainee.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  prompt?: string;
}

export class ListEventsQueryDto {
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class ListDmsQueryDto {
  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
