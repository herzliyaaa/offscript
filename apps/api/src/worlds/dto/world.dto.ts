import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsIn,
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

  @ApiPropertyOptional({ example: ['sabrina-carpenter', 'finneas'], type: [String] })
  @IsOptional()
  @IsString({ each: true })
  associatedCelebrityKeys?: string[];

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

  @ApiPropertyOptional({ description: 'The generated event being answered, if applicable.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  eventTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  eventDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  eventSourceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  eventSourceHandle?: string;
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

export class ReportContentDto {
  @IsString()
  @IsIn(['harassment', 'sexual', 'spam', 'self_harm', 'impersonation', 'other'])
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}

export class BlockCharacterDto {
  @IsString()
  @IsIn(['block', 'mute'])
  kind!: 'block' | 'mute';
}

export class ResolveReportDto {
  @IsString()
  @IsIn(['resolved', 'dismissed'])
  status!: 'resolved' | 'dismissed';
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

  @ApiPropertyOptional({ example: 'female', enum: ['female', 'male', 'nonbinary'] })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    const normalized = String(value).toLowerCase();
    return normalized === 'woman' || normalized === 'girl' ? 'female'
      : normalized === 'man' || normalized === 'boy' ? 'male'
      : normalized === 'non-binary' ? 'nonbinary'
      : normalized;
  })
  @IsIn(['female', 'male', 'nonbinary'])
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

export class CreateCharacterDto {
  @ApiProperty({ example: 'Alex Rivera' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: '@alexrivera' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  handle!: string;

  @ApiProperty({ example: 'A new artist trying to break through.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  bio!: string;

  @ApiPropertyOptional({ example: 'Funny, ambitious, and always online.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalDescription?: string;

  @ApiProperty({ example: 'nonbinary', enum: ['female', 'male', 'nonbinary'] })
  @IsString()
  @IsIn(['female', 'male', 'nonbinary'])
  @MaxLength(64)
  gender!: string;

  @ApiProperty({ example: 10000, enum: [1000, 5000, 10000, 50000, 100000, 500000, 1000000] })
  @Type(() => Number)
  @IsInt()
  @IsIn([1000, 5000, 10000, 50000, 100000, 500000, 1000000])
  followerCount!: number;

  @ApiProperty({ description: 'Hosted image URL for the avatar' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  avatarUrl!: string;
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
