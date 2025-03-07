import { Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import {
  IssuerRequest,
  IssuerRequestToJSONTyped,
  IssuersResponse,
  IssuersResponseFromJSONTyped,
  IssuerResponse,
  IssuerResponseFromJSONTyped,
} from 'credential-showcase-openapi'
import IssuerService from '../services/IssuerService'
import { issuerDTOFrom } from '../utils/mappers'

@JsonController('/roles/issuers')
@Service()
class IssuerController {
  constructor(private issuerService: IssuerService) {}

  @Get('/')
  public async getAll(): Promise<IssuersResponse> {
    const result = await this.issuerService.getIssuers()
    const issuers = result.map((issuer) => issuerDTOFrom(issuer))
    return IssuersResponseFromJSONTyped({ issuers }, false)
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<IssuerResponse> {
    const result = await this.issuerService.getIssuer(id)
    return IssuerResponseFromJSONTyped({ issuer: issuerDTOFrom(result) }, false)
  }

  @HttpCode(201)
  @Post('/')
  public async post(@Body() issuerRequest: IssuerRequest): Promise<IssuerResponse> {
    const result = await this.issuerService.createIssuer(IssuerRequestToJSONTyped(issuerRequest))
    return IssuerResponseFromJSONTyped({ issuer: issuerDTOFrom(result) }, false)
  }

  @Put('/:id')
  public async put(@Param('id') id: string, @Body() issuerRequest: IssuerRequest): Promise<IssuerResponse> {
    const result = await this.issuerService.updateIssuer(id, IssuerRequestToJSONTyped(issuerRequest))
    return IssuerResponseFromJSONTyped({ issuer: issuerDTOFrom(result) }, false)
  }

  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    return this.issuerService.deleteIssuer(id)
  }
}

export default IssuerController
