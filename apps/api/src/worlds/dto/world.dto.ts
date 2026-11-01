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

  @ApiPropertyOptional({ example: 'sabrina-carpenter' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  playerCelebrityKey?: string;

  @ApiPropertyOptional({ example: '@myhandle' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  playerHandle?: string;

  @ApiPropertyOptional({ example: 'woman' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  playerGender?: string;

  @ApiPropertyOptional({ example: 'A producer rebuilding her career after a public fallout.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  playerAdditionalDescription?: string;

  @ApiPropertyOptional({ example: 120000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  playerFollowerCount?: number;

  @ApiPropertyOptional({ description: 'Data URL or hosted image URL for the player avatar' })
  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  playerAvatarUrl?: string;

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

  @ApiPropertyOptional({ example: 12, description: 'Post to quote' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quotePostId?: number;
}

export class PostInteractionDto {
  @ApiProperty({ example: 'like', enum: ['like', 'repost'] })
  @IsString()
  @IsNotEmpty()
  type!: 'like' | 'repost';
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

export class UpdateCharacterDto {
  @ApiPropertyOptional({ example: 'Mina Park' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: '@minapark' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  handle?: string;

  @ApiPropertyOptional({ example: 'woman' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  gender?: string;

  @ApiPropertyOptional({ example: 'A songwriter rebuilding her career.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ example: 'Writes at night and refuses to repeat old mistakes.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalDescription?: string;

  @ApiPropertyOptional({ example: 120000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  followerCount?: number;

  @ApiPropertyOptional({ description: 'Data URL or hosted image URL for the avatar' })
  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  avatarUrl?: string;
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
