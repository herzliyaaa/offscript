import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type ModerationKind = 'post' | 'dm' | 'character' | 'prompt';

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
  category?: 'blocked_term' | 'sexual' | 'harassment' | 'prompt_injection' | 'real_person';
}

@Injectable()
export class ModerationService {
  private readonly blockedTerms = [
    'child porn',
    'csam',
    'sexual exploitation',
    'rape threat',
  ];
  private readonly sexualTerms = [
    'explicit sex',
    'hardcore porn',
    'nude leak',
    'sexual roleplay',
  ];
  private readonly harassmentTerms = [
    'kill yourself',
    'go die',
    'i will find you',
    'doxx you',
    'you deserve to die',
  ];
  private readonly injectionPatterns = [
    /ignore\s+(?:all\s+)?previous\s+instructions/i,
    /system\s+message\s*:/i,
    /developer\s+message\s*:/i,
    /reveal\s+(?:the\s+)?prompt/i,
    /show\s+(?:me\s+)?(?:your|the)\s+(?:hidden|system)\s+instructions/i,
    /jailbreak/i,
  ];

  constructor(private readonly config: ConfigService) {}

  check(text: string, kind: ModerationKind): ModerationResult {
    const value = text.trim();
    const normalized = value.toLowerCase().replace(/\s+/g, ' ');

    if (!value) {
      return { allowed: false, reason: 'Content cannot be empty.', category: 'blocked_term' };
    }
    if (this.blockedTerms.some((term) => normalized.includes(term))) {
      return { allowed: false, reason: 'This content is not allowed.', category: 'blocked_term' };
    }
    if (this.sexualTerms.some((term) => normalized.includes(term))) {
      return { allowed: false, reason: 'Explicit sexual content is not allowed.', category: 'sexual' };
    }
    if (this.harassmentTerms.some((term) => normalized.includes(term))) {
      return { allowed: false, reason: 'Threats and targeted harassment are not allowed.', category: 'harassment' };
    }
    if ((kind === 'prompt' || kind === 'post' || kind === 'dm') &&
        this.injectionPatterns.some((pattern) => pattern.test(value))) {
      return {
        allowed: false,
        reason: 'Prompt instructions cannot be added to social content.',
        category: 'prompt_injection',
      };
    }
    if (kind === 'character' && /\b(real|actual)\s+(person|celebrity|politician)\b/i.test(value)) {
      return {
        allowed: false,
        reason: 'Character profiles must be fictional and respectful.',
        category: 'real_person',
      };
    }
    return { allowed: true };
  }

  assertAllowed(text: string, kind: ModerationKind): void {
    const result = this.check(text, kind);
    if (!result.allowed) {
      throw new BadRequestException(result.reason);
    }
  }

  assertAdmin(requestKey: string | undefined): void {
    const configuredKey = this.config.get<string>('moderationAdminKey');
    if (!configuredKey || !requestKey || requestKey !== configuredKey) {
      throw new UnauthorizedException('Admin moderation access is required.');
    }
  }
}
