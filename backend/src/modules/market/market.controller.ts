import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { MarketService } from './market.service';

class CreateListingDto {
  code!: string;
  amount!: number;
  price!: number;
}

class BuyListingDto {
  amount!: number;
}

@Controller('market')
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Get('listings')
  getListings(
    @Query('std') std?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
  ) {
    return this.market.getListings(std, q, sort);
  }

  @Post('listings')
  createListing(@Body() dto: CreateListingDto) {
    return this.market.createListing(dto);
  }

  @Post('listings/:id/buy')
  buyListing(@Param('id') id: string, @Body() dto: BuyListingDto) {
    return this.market.buyListing(id, dto.amount);
  }

  @Delete('listings/:id')
  deleteListing(@Param('id') id: string) {
    return this.market.deleteListing(id);
  }
}

