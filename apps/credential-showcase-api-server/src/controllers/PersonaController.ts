import { Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import {
  PersonasResponse,
  PersonasResponseFromJSONTyped,
  PersonaResponse,
  PersonaResponseFromJSONTyped,
  PersonaRequest,
  PersonaRequestToJSONTyped,
} from 'credential-showcase-openapi'
import PersonaService from '../services/PersonaService'
import { personaDTOFrom } from '../utils/mappers'

@JsonController('/personas')
@Service()
class PersonaController {
  constructor(private personaService: PersonaService) {}

  @Get('/')
  public async getAll(): Promise<PersonasResponse> {
    const result = await this.personaService.getAll()
    const personas = result.map((persona) => personaDTOFrom(persona))
    return PersonasResponseFromJSONTyped({ personas }, false)
  }

  @Get('/:id')
  public async get(@Param('id') id: string): Promise<PersonaResponse> {
    const result = await this.personaService.get(id)
    return PersonaResponseFromJSONTyped({ persona: personaDTOFrom(result) }, false)
  }

  @HttpCode(201)
  @Post('/')
  public async post(@Body() personaRequest: PersonaRequest): Promise<PersonaResponse> {
    const result = await this.personaService.create(PersonaRequestToJSONTyped(personaRequest))
    return PersonaResponseFromJSONTyped({ persona: personaDTOFrom(result) }, false)
  }

  @Put('/:id')
  public async put(@Param('id') id: string, @Body() personaRequest: PersonaRequest): Promise<PersonaResponse> {
    const result = await this.personaService.update(id, PersonaRequestToJSONTyped(personaRequest))
    return PersonaResponseFromJSONTyped({ persona: personaDTOFrom(result) }, false)
  }

  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    return this.personaService.delete(id)
  }
}

export default PersonaController
