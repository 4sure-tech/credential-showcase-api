import { Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import {
  RelyingPartyRequest,
  RelyingPartyRequestToJSONTyped,
  RelyingPartiesResponse,
  RelyingPartiesResponseFromJSONTyped,
  RelyingPartyResponse,
  RelyingPartyResponseFromJSONTyped,
} from 'credential-showcase-openapi'
import RelyingPartyService from '../services/RelyingPartyService'
import { relyingPartyDTOFrom } from '../utils/mappers'

@JsonController('/roles/relying-parties')
@Service()
class RelyingPartyController {
  constructor(private relyingPartyService: RelyingPartyService) {}

  @Get('/')
  public async getAll(): Promise<RelyingPartiesResponse> {
    const result = await this.relyingPartyService.getRelyingParties()
    const relyingParties = result.map((relyingParty) => relyingPartyDTOFrom(relyingParty))
    return RelyingPartiesResponseFromJSONTyped({ relyingParties }, false)
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<RelyingPartyResponse> {
    const result = await this.relyingPartyService.getRelyingParty(id)
    return RelyingPartyResponseFromJSONTyped({ relyingParty: relyingPartyDTOFrom(result) }, false)
  }

  @HttpCode(201)
  @Post('/')
  public async post(@Body() relyingPartyRequest: RelyingPartyRequest): Promise<RelyingPartyResponse> {
    const result = await this.relyingPartyService.createRelyingParty(RelyingPartyRequestToJSONTyped(relyingPartyRequest))
    return RelyingPartyResponseFromJSONTyped({ relyingParty: relyingPartyDTOFrom(result) }, false)
  }

  @Put('/:id')
  public async put(@Param('id') id: string, @Body() relyingPartyRequest: RelyingPartyRequest): Promise<RelyingPartyResponse> {
    const result = await this.relyingPartyService.updateRelyingParty(id, RelyingPartyRequestToJSONTyped(relyingPartyRequest))
    return RelyingPartyResponseFromJSONTyped({ relyingParty: relyingPartyDTOFrom(result) }, false)
  }

  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    return this.relyingPartyService.deleteRelyingParty(id)
  }
}

export default RelyingPartyController
