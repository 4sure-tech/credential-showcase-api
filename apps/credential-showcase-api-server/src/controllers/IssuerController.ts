import { Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import {
  IssuerRequest,
  IssuerRequestToJSONTyped,
  IssuerResponse,
  IssuerResponseFromJSONTyped,
  IssuersResponse,
  IssuersResponseFromJSONTyped,
} from 'credential-showcase-openapi'
import IssuerService from '../services/IssuerService'
import { issuerDTOFrom } from '../utils/mappers'
import { NotFoundError } from '../errors'

@JsonController('/roles/issuers')
@Service()
class IssuerController {
  constructor(private issuerService: IssuerService) {}

  @Get('/')
  public async getAll(): Promise<IssuersResponse> {
    try {
      const result = await this.issuerService.getIssuers()
      const issuers = result.map((issuer) => issuerDTOFrom(issuer))
      return IssuersResponseFromJSONTyped({ issuers }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get all issuers failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<IssuerResponse> {
    try {
      const result = await this.issuerService.getIssuer(id)
      return IssuerResponseFromJSONTyped({ issuer: issuerDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get issuer id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @HttpCode(201)
  @Post('/')
  public async post(@Body() issuerRequest: IssuerRequest): Promise<IssuerResponse> {
    try {
      const result = await this.issuerService.createIssuer(IssuerRequestToJSONTyped(issuerRequest))
      return IssuerResponseFromJSONTyped({ issuer: issuerDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Create issuer failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Put('/:id')
  public async put(@Param('id') id: string, @Body() issuerRequest: IssuerRequest): Promise<IssuerResponse> {
    try {
      const result = await this.issuerService.updateIssuer(id, IssuerRequestToJSONTyped(issuerRequest))
      return IssuerResponseFromJSONTyped({ issuer: issuerDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Update issuer id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    try {
      return this.issuerService.deleteIssuer(id)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Delete issuer id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }
}

export default IssuerController
