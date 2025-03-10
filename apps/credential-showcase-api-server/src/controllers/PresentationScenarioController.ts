import { Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import ScenarioService from '../services/ScenarioService'
import {
  PresentationScenarioRequest,
  PresentationScenarioRequestToJSONTyped,
  PresentationScenarioResponse,
  PresentationScenarioResponseFromJSONTyped,
  PresentationScenariosResponse,
  PresentationScenariosResponseFromJSONTyped,
  StepsResponse,
  StepsResponseFromJSONTyped,
  StepResponse,
  StepResponseFromJSONTyped,
  StepRequest,
  StepRequestToJSONTyped,
  StepActionsResponse,
  StepActionsResponseFromJSONTyped,
  StepActionResponse,
  StepActionResponseFromJSONTyped,
  StepActionRequest,
  StepActionRequestToJSONTyped,
} from 'credential-showcase-openapi'
import { presentationScenarioDTOFrom, stepDTOFrom } from '../utils/mappers'
import { ScenarioType } from '../types'

@JsonController('/scenarios/presentations')
@Service()
class PresentationScenarioController {
  constructor(private scenarioService: ScenarioService) {}

  @Get('/')
  public async getAllPresentationScenarios(): Promise<PresentationScenariosResponse> {
    const result = await this.scenarioService.getScenarios({ filter: { scenarioType: ScenarioType.ISSUANCE } })
    const presentationScenarios = result.map((presentationScenario) => presentationScenarioDTOFrom(presentationScenario))
    return PresentationScenariosResponseFromJSONTyped({ presentationScenarios }, false)
  }

  @Get('/:slug')
  public async getOnePresentationScenario(@Param('slug') slug: string): Promise<PresentationScenarioResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    const result = await this.scenarioService.getScenario(presentationScenarioId)
    return PresentationScenarioResponseFromJSONTyped({ presentationScenario: presentationScenarioDTOFrom(result) }, false)
  }

  @HttpCode(201)
  @Post('/')
  public async postPresentationScenario(@Body() presentationScenarioRequest: PresentationScenarioRequest): Promise<PresentationScenarioResponse> {
    const result = await this.scenarioService.createScenario(PresentationScenarioRequestToJSONTyped(presentationScenarioRequest))
    return PresentationScenarioResponseFromJSONTyped({ presentationScenario: presentationScenarioDTOFrom(result) }, false)
  }

  @Put('/:slug')
  public async putPresentationScenario(
    @Param('slug') slug: string,
    @Body() presentationScenarioRequest: PresentationScenarioRequest,
  ): Promise<PresentationScenarioResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    const result = await this.scenarioService.updateScenario(
      presentationScenarioId,
      PresentationScenarioRequestToJSONTyped(presentationScenarioRequest),
    )
    return PresentationScenarioResponseFromJSONTyped({ presentationScenario: presentationScenarioDTOFrom(result) }, false)
  }

  @OnUndefined(204)
  @Delete('/:slug')
  public async deletePresentationScenario(@Param('slug') slug: string): Promise<void> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    return await this.scenarioService.deleteScenario(presentationScenarioId)
  }

  @Get('/:slug/steps')
  public async getAllSteps(@Param('slug') slug: string): Promise<StepsResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    const result = await this.scenarioService.getScenarioSteps(presentationScenarioId)
    const steps = result.map((step) => stepDTOFrom(step))
    return StepsResponseFromJSONTyped({ steps }, false)
  }

  @Get('/:slug/steps/:stepId')
  public async getOnePresentationScenarioStep(@Param('slug') slug: string, @Param('stepId') stepId: string): Promise<StepResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    const result = await this.scenarioService.getScenarioStep(presentationScenarioId, stepId)
    return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
  }

  @HttpCode(201)
  @Post('/:slug/steps')
  public async postPresentationScenarioStep(@Param('slug') slug: string, @Body() stepRequest: StepRequest): Promise<StepResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    const result = await this.scenarioService.createScenarioStep(presentationScenarioId, StepRequestToJSONTyped(stepRequest))
    return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
  }

  @Put('/:slug/steps/:stepId')
  public async putPresentationScenarioStep(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Body() stepRequest: StepRequest,
  ): Promise<StepResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    const result = await this.scenarioService.updateScenarioStep(presentationScenarioId, stepId, StepRequestToJSONTyped(stepRequest))
    return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
  }

  @OnUndefined(204)
  @Delete('/:slug/steps/:stepId')
  public async deletePresentationScenarioStep(@Param('slug') slug: string, @Param('stepId') stepId: string): Promise<void> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    return this.scenarioService.deleteScenarioStep(presentationScenarioId, stepId)
  }

  @Get('/:slug/steps/:stepId/actions')
  public async getAllPresentationScenarioStepActions(@Param('slug') slug: string, @Param('stepId') stepId: string): Promise<StepActionsResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    const result = await this.scenarioService.getScenarioStepActions(presentationScenarioId, stepId)
    const actions = result.map((action) => action)
    return StepActionsResponseFromJSONTyped({ actions }, false)
  }

  @Get('/:slug/steps/:stepId/actions/:actionId')
  public async getOnePresentationScenarioStepAction(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
  ): Promise<StepActionResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    const result = await this.scenarioService.getScenarioStepAction(presentationScenarioId, stepId, actionId)
    return StepActionResponseFromJSONTyped({ action: result }, false)
  }

  @HttpCode(201)
  @Post('/:slug/steps/:stepId/actions')
  public async postPresentationScenarioStepAction(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Body() actionRequest: StepActionRequest,
  ): Promise<StepActionResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    const result = await this.scenarioService.createScenarioStepAction(presentationScenarioId, stepId, StepActionRequestToJSONTyped(actionRequest))
    return StepActionResponseFromJSONTyped({ action: result }, false)
  }

  @Put('/:slug/steps/:stepId/actions/:actionId')
  public async putPresentationScenarioStepAction(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
    @Body() actionRequest: StepActionRequest,
  ): Promise<StepActionResponse> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    const result = await this.scenarioService.updateScenarioStepAction(
      presentationScenarioId,
      stepId,
      actionId,
      StepActionRequestToJSONTyped(actionRequest),
    )
    return StepActionResponseFromJSONTyped({ action: result }, false)
  }

  @OnUndefined(204)
  @Delete('/:slug/steps/:stepId/actions/:actionId')
  public async deletePresentationScenarioStepAction(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
  ): Promise<void> {
    const presentationScenarioId = await this.scenarioService.getIdBySlug(slug)
    return this.scenarioService.deleteScenarioStepAction(presentationScenarioId, stepId, actionId)
  }
}

export default PresentationScenarioController
