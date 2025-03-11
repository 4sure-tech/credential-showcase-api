import { Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import {
  IssuanceScenario,
  Issuer,
  Showcase,
  ShowcaseRequest,
  ShowcaseRequestToJSONTyped,
  ShowcaseResponse,
  ShowcaseResponseFromJSONTyped,
  ShowcasesResponse,
  ShowcasesResponseFromJSONTyped,
  ShowcaseStatus,
} from 'credential-showcase-openapi'
import ShowcaseService from '../services/ShowcaseService'
import { showcaseDTOFrom } from '../utils/mappers'
import { AdapterClientApi } from 'credential-showcase-adapter-client-api'

@JsonController('/showcases')
@Service()
class ShowcaseController {
  constructor(
    private showcaseService: ShowcaseService,
    private adapterClientApi: AdapterClientApi,
  ) {}

  @Get('/')
  public async getAll(): Promise<ShowcasesResponse> {
    const result = await this.showcaseService.getShowcases()
    const showcases = result.map((showcase) => showcaseDTOFrom(showcase))
    return ShowcasesResponseFromJSONTyped({ showcases }, false)
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<ShowcaseResponse> {
    const result = await this.showcaseService.getShowcase(id)
    return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
  }

  @HttpCode(201)
  @Post('/')
  public async post(@Body() showcaseRequest: ShowcaseRequest): Promise<ShowcaseResponse> {
    const result = await this.showcaseService.createShowcase(ShowcaseRequestToJSONTyped(showcaseRequest))
    if (showcaseRequest.status === ShowcaseStatus.Active) {
      void (await this.publishFromShowcase(showcaseDTOFrom(result)))
    }
    return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
  }

  @Put('/:id')
  public async put(@Param('id') id: string, @Body() showcaseRequest: ShowcaseRequest): Promise<ShowcaseResponse> {
    const result = await this.showcaseService.updateShowcase(id, ShowcaseRequestToJSONTyped(showcaseRequest))
    if (showcaseRequest.status === ShowcaseStatus.Active) {
      void (await this.publishFromShowcase(showcaseDTOFrom(result)))
    }
    return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
  }

  private async publishFromShowcase(showcase: Showcase) {
    console.log(`Publishing showcase ${showcase.name} to Traction`)

    // Get issuers from scenarios
    const issuers: Array<Issuer> = showcase.scenarios
      ?.filter((scenario) => 'issuer' in scenario && scenario.issuer)
      .map((scenario) => (scenario as IssuanceScenario).issuer)

    // Process each issuer
    const processedIssuerIds = new Set<string>()

    for (const issuer of issuers) {
      // Skip if we've already processed this issuer
      if (processedIssuerIds.has(issuer.id)) {
        continue
      }
      processedIssuerIds.add(issuer.id)

      const newIssuer: Issuer = {
        id: issuer.id,
        name: issuer.name,
        description: issuer.description,
        type: issuer.type,
        organization: issuer.organization,
        identifierType: issuer.identifierType,
        identifier: issuer.identifier,
        logo: issuer.logo,
        credentialDefinitions: [],
        credentialSchemas: [],
        createdAt: issuer.createdAt,
        updatedAt: issuer.updatedAt,
      }

      // Find matching credential definitions from showcase
      const matchingCredDefs = showcase.credentialDefinitions.filter((credDef) =>
        issuer.credentialDefinitions.some((issuerCredDef) => issuerCredDef.id === credDef.id),
      )

      newIssuer.credentialDefinitions = matchingCredDefs

      // Get schema IDs from matching credential definitions
      const schemaIds = matchingCredDefs.map((credDef) => credDef.schemaId)

      // Look up schemas from ALL issuers (not just the current one)
      newIssuer.credentialSchemas = issuers
        .flatMap((i) => i.credentialSchemas || [])
        .filter((schema) => schemaIds.includes(schema.id))
        // Remove duplicates
        .filter((schema, index, self) => index === self.findIndex((s) => s.id === schema.id))

      // Publish the issuer
      void (await this.adapterClientApi.publishIssuer(newIssuer))
    }
  }

  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    return this.showcaseService.deleteShowcase(id)
  }
}

export default ShowcaseController
