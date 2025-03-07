import { Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import CredentialSchemaService from '../services/CredentialSchemaService'
import {
  CredentialSchemaRequest,
  CredentialSchemaRequestToJSONTyped,
  CredentialSchemaResponse,
  CredentialSchemaResponseFromJSONTyped,
  CredentialSchemasResponse,
  CredentialSchemasResponseFromJSONTyped,
} from 'credential-showcase-openapi'

@JsonController('/credentials/schemas')
@Service()
export class CredentialSchemaController {
  constructor(private credentialSchemaService: CredentialSchemaService) {}

  @Get('/')
  public async getAll(): Promise<CredentialSchemasResponse> {
    const result = await this.credentialSchemaService.getCredentialSchemas()
    return CredentialSchemasResponseFromJSONTyped({ result }, false)
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<CredentialSchemaResponse> {
    const credentialSchema = await this.credentialSchemaService.getCredentialSchema(id)
    return CredentialSchemaResponseFromJSONTyped({ credentialSchema }, false)
  }

  @HttpCode(201)
  @Post('/')
  public async post(@Body() credentialSchemaRequest: CredentialSchemaRequest): Promise<CredentialSchemaResponse> {
    const credentialSchema = await this.credentialSchemaService.createCredentialSchema(CredentialSchemaRequestToJSONTyped(credentialSchemaRequest))
    return CredentialSchemaResponseFromJSONTyped({ credentialSchema }, false)
  }

  @Put('/:id')
  public async put(@Param('id') id: string, @Body() credentialSchemaRequest: CredentialSchemaRequest): Promise<CredentialSchemaResponse> {
    const credentialSchema = await this.credentialSchemaService.updateCredentialSchema(
      id,
      CredentialSchemaRequestToJSONTyped(credentialSchemaRequest),
    )
    return CredentialSchemaResponseFromJSONTyped({ credentialSchema }, false)
  }

  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    return this.credentialSchemaService.deleteCredentialSchema(id)
  }
}
