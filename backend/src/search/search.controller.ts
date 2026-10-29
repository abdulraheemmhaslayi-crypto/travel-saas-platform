import {
  Controller,
  Get,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import {
  TripSearchQueryDto,
  SearchResultsDto,
  GlobalSearchQueryDto,
  AutocompleteDto,
  SearchFiltersDto,
} from './search.dto';

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('trips')
  @Public()
  @ApiOperation({ summary: 'Search available trips' })
  @ApiQuery({ name: 'source', required: true })
  @ApiQuery({ name: 'destination', required: true })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'passengers', required: false, type: Number })
  @ApiQuery({ name: 'vehicleType', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['price', 'departureTime', 'duration', 'rating'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async searchTrips(@Query() query: TripSearchQueryDto): Promise<SearchResultsDto> {
    return this.searchService.searchTrips(query);
  }

  @Get('global')
  @ApiOperation({ summary: 'Global search across all entities' })
  async globalSearch(
    @Query('q') query: string,
    @Query('types') types?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ): Promise<SearchResultsDto> {
    return this.searchService.globalSearch(query, types?.split(','), page, limit);
  }

  @Get('autocomplete')
  @Public()
  @ApiOperation({ summary: 'Autocomplete suggestions' })
  async autocomplete(
    @Query('q') query: string,
    @Query('type') type?: string,
  ): Promise<AutocompleteDto[]> {
    return this.searchService.autocomplete(query, type);
  }

  @Get('popular-routes')
  @Public()
  @ApiOperation({ summary: 'Get popular routes' })
  async getPopularRoutes(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<{ source: string; destination: string; count: number; avgPrice: number }[]> {
    return this.searchService.getPopularRoutes(limit);
  }

  @Get('filters')
  @Public()
  @ApiOperation({ summary: 'Get available search filters' })
  async getFilters(): Promise<SearchFiltersDto> {
    return this.searchService.getAvailableFilters();
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent searches for user' })
  async getRecentSearches(@Query('userId') userId: string): Promise<string[]> {
    return this.searchService.getRecentSearches(userId);
  }
}