import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  findScenario,
  scenarioCatalog,
  toScenarioSummary,
} from './scenario.catalog.js';

@ApiTags('scenarios')
@Controller('scenarios')
export class ScenariosController {
  @Get()
  @ApiOperation({ summary: 'List available scenario templates' })
  list() {
    return scenarioCatalog.map(toScenarioSummary);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a scenario template by key' })
  get(@Param('key') key: string) {
    const scenario = findScenario(key);

    if (!scenario) {
      throw new NotFoundException(`Unknown scenario "${key}"`);
    }

    return toScenarioSummary(scenario);
  }
}
