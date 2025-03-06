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
import { credentialSchemaDTOFrom } from '../utils/mappers'

@JsonController('/credentials/schemas')
@Service()
export class CredentialSchemaController {
  constructor(private credentialSchemaService: CredentialSchemaService) {}

  @Get('/')
  public async getAll(): Promise<CredentialSchemasResponse> {
    const result = await this.credentialSchemaService.getCredentialSchemas()
    const credentialSchemas = result.map((schema) => credentialSchemaDTOFrom(schema))
    return CredentialSchemasResponseFromJSONTyped({ credentialSchemas }, false)
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<CredentialSchemaResponse> {
    const result = await this.credentialSchemaService.getCredentialSchema(id)
    return CredentialSchemaResponseFromJSONTyped({ credentialSchema: credentialSchemaDTOFrom(result) }, false)
  }

  @HttpCode(201)
  @Post('/')
  public async post(@Body() credentialSchemaRequest: CredentialSchemaRequest): Promise<CredentialSchemaResponse> {
    const result = await this.credentialSchemaService.createCredentialSchema(CredentialSchemaRequestToJSONTyped(credentialSchemaRequest))
    return CredentialSchemaResponseFromJSONTyped({ credentialSchema: credentialSchemaDTOFrom(result) }, false)
  }

  @Put('/:id')
  public async put(@Param('id') id: string, @Body() credentialSchemaRequest: CredentialSchemaRequest): Promise<CredentialSchemaResponse> {
    const result = await this.credentialSchemaService.updateCredentialSchema(id, CredentialSchemaRequestToJSONTyped(credentialSchemaRequest))
    return CredentialSchemaResponseFromJSONTyped({ credentialSchema: credentialSchemaDTOFrom(result) }, false)
  }

  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    return this.credentialSchemaService.deleteCredentialSchema(id)
  }
}
