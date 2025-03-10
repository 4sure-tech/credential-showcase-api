import { Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import {
  RelyingPartiesResponse,
  RelyingPartiesResponseFromJSONTyped,
  RelyingPartyRequest,
  RelyingPartyRequestToJSONTyped,
  RelyingPartyResponse,
  RelyingPartyResponseFromJSONTyped,
} from 'credential-showcase-openapi'
import RelyingPartyService from '../services/RelyingPartyService'
import { relyingPartyDTOFrom } from '../utils/mappers'
import { NotFoundError } from '../errors/NotFoundError'

@JsonController('/roles/relying-parties')
@Service()
class RelyingPartyController {
  constructor(private relyingPartyService: RelyingPartyService) {}

  @Get('/')
  public async getAll(): Promise<RelyingPartiesResponse> {
    try {
      const result = await this.relyingPartyService.getRelyingParties()
      const relyingParties = result.map((relyingParty) => relyingPartyDTOFrom(relyingParty))
      return RelyingPartiesResponseFromJSONTyped({ relyingParties }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get all relying parties failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<RelyingPartyResponse> {
    try {
      const result = await this.relyingPartyService.getRelyingParty(id)
      return RelyingPartyResponseFromJSONTyped({ relyingParty: relyingPartyDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get relying party id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @HttpCode(201)
  @Post('/')
  public async post(@Body() relyingPartyRequest: RelyingPartyRequest): Promise<RelyingPartyResponse> {
    try {
      const result = await this.relyingPartyService.createRelyingParty(RelyingPartyRequestToJSONTyped(relyingPartyRequest))
      return RelyingPartyResponseFromJSONTyped({ relyingParty: relyingPartyDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Create relying party failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Put('/:id')
  public async put(@Param('id') id: string, @Body() relyingPartyRequest: RelyingPartyRequest): Promise<RelyingPartyResponse> {
    try {
      const result = await this.relyingPartyService.updateRelyingParty(id, RelyingPartyRequestToJSONTyped(relyingPartyRequest))
      return RelyingPartyResponseFromJSONTyped({ relyingParty: relyingPartyDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Update relying party id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    try {
      return this.relyingPartyService.deleteRelyingParty(id)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Delete relying party id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }
}

export default RelyingPartyController
