import { Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import {
  CredentialDefinitionRequest,
  CredentialDefinitionRequestToJSONTyped,
  CredentialDefinitionResponse,
  CredentialDefinitionResponseFromJSONTyped,
  CredentialDefinitionsResponse,
  CredentialDefinitionsResponseFromJSONTyped,
} from 'credential-showcase-openapi'
import CredentialDefinitionService from '../services/CredentialDefinitionService'
import { credentialDefinitionDTOFrom } from '../utils/mappers'

@JsonController('/credentials/definitions')
@Service()
export class CredentialDefinitionController {
  constructor(private credentialDefinitionService: CredentialDefinitionService) {}

  @Get('/')
  public async getAll(): Promise<CredentialDefinitionsResponse> {
    const result = await this.credentialDefinitionService.getCredentialDefinitions()
    const credentialDefinitions = result.map((credentialDefinition) => credentialDefinitionDTOFrom(credentialDefinition))
    return CredentialDefinitionsResponseFromJSONTyped({ credentialDefinitions }, false)
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<CredentialDefinitionResponse> {
    const result = await this.credentialDefinitionService.getCredentialDefinition(id)
    return CredentialDefinitionResponseFromJSONTyped({ credentialDefinition: credentialDefinitionDTOFrom(result) }, false)
  }

  @HttpCode(201)
  @Post('/')
  public async post(@Body() credentialDefinitionRequest: CredentialDefinitionRequest): Promise<CredentialDefinitionResponse> {
    const result = await this.credentialDefinitionService.createCredentialDefinition(
      CredentialDefinitionRequestToJSONTyped(credentialDefinitionRequest),
    )
    return CredentialDefinitionResponseFromJSONTyped({ credentialDefinition: credentialDefinitionDTOFrom(result) }, false)
  }

  @Put('/:id')
  public async put(@Param('id') id: string, @Body() credentialDefinitionRequest: CredentialDefinitionRequest): Promise<CredentialDefinitionResponse> {
    const result = await this.credentialDefinitionService.updateCredentialDefinition(
      id,
      CredentialDefinitionRequestToJSONTyped(credentialDefinitionRequest),
    )
    return CredentialDefinitionResponseFromJSONTyped({ credentialDefinition: credentialDefinitionDTOFrom(result) }, false)
  }

  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    return this.credentialDefinitionService.deleteCredentialDefinition(id)
  }
}
