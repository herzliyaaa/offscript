import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreatePostDto,
  CreateWorldDto,
  GenerateEventDto,
  ListDmsQueryDto,
  ListEventsQueryDto,
  ListWorldsQueryDto,
  SendDmDto,
  WorldActionDto,
} from './dto/world.dto.js';
import { WorldsService } from './worlds.service.js';

@ApiTags('worlds')
@Controller('worlds')
export class WorldsController {
  constructor(private readonly worlds: WorldsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a world from a scenario template' })
  create(@Body() dto: CreateWorldDto) {
    return this.worlds.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "List the player's worlds" })
  list(@Query() query: ListWorldsQueryDto) {
    return this.worlds.list(query.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a world with its cast, feed, events, and relationships',
  })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.worlds.get(id);
  }

  @Get(':id/feed')
  @ApiOperation({ summary: 'Get the social feed for a world' })
  feed(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return this.worlds.feed(id, limit);
  }

  @Post(':id/posts')
  @ApiOperation({ summary: 'Post to the feed and simulate the reaction' })
  createPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePostDto,
  ) {
    return this.worlds.createPost(id, dto);
  }

  @Get(':id/posts/:postId')
  @ApiOperation({ summary: 'Get a post and its replies' })
  getPost(
    @Param('id', ParseIntPipe) id: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.worlds.getPost(id, postId);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'List recent world events' })
  listEvents(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListEventsQueryDto,
  ) {
    return this.worlds.listEvents(id, query.limit ?? 20);
  }

  @Post(':id/events')
  @ApiOperation({ summary: 'Generate a new event' })
  generateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GenerateEventDto,
  ) {
    return this.worlds.generateEvent(id, dto);
  }

  @Get(':id/conversations')
  @ApiOperation({ summary: 'List DM conversations for a world' })
  listConversations(@Param('id', ParseIntPipe) id: number) {
    return this.worlds.listConversations(id);
  }

  @Get(':id/conversations/:characterId')
  @ApiOperation({ summary: 'Get the DM history with a character' })
  listDms(
    @Param('id', ParseIntPipe) id: number,
    @Param('characterId', ParseIntPipe) characterId: number,
    @Query() query: ListDmsQueryDto,
  ) {
    return this.worlds.listDms(id, characterId, query.limit ?? 100);
  }

  @Post(':id/conversations/:characterId')
  @ApiOperation({ summary: 'Send a DM to a character' })
  sendDm(
    @Param('id', ParseIntPipe) id: number,
    @Param('characterId', ParseIntPipe) characterId: number,
    @Body() dto: SendDmDto,
  ) {
    return this.worlds.sendDm(id, characterId, dto);
  }

  @Post(':id/actions')
  @ApiOperation({ summary: 'Take an action and advance the simulation' })
  act(@Param('id', ParseIntPipe) id: number, @Body() dto: WorldActionDto) {
    return this.worlds.act(id, dto.action);
  }
}
