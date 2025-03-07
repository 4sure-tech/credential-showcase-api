import { Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import ScenarioService from '../services/ScenarioService'
import {
  IssuanceScenarioRequest,
  IssuanceScenarioRequestToJSONTyped,
  IssuanceScenarioResponse,
  IssuanceScenarioResponseFromJSONTyped,
  IssuanceScenariosResponse,
  IssuanceScenariosResponseFromJSONTyped,
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
import { issuanceScenarioDTOFrom, stepDTOFrom } from '../utils/mappers'
import { ScenarioType } from '../types'

@JsonController('/scenarios/issuances')
@Service()
class IssuanceScenarioController {
  constructor(private scenarioService: ScenarioService) {}

  @Get('/')
  public async getAllIssuanceScenarios(): Promise<IssuanceScenariosResponse> {
    const result = await this.scenarioService.getScenarios({ filter: { scenarioType: ScenarioType.ISSUANCE } })
    const issuanceScenarios = result.map((issuanceScenario) => issuanceScenarioDTOFrom(issuanceScenario))
    return IssuanceScenariosResponseFromJSONTyped({ issuanceScenarios }, false)
  }

  @Get('/:issuanceScenarioId')
  public async getOneIssuanceScenario(@Param('issuanceScenarioId') issuanceScenarioId: string): Promise<IssuanceScenarioResponse> {
    const result = await this.scenarioService.getScenario(issuanceScenarioId)
    return IssuanceScenarioResponseFromJSONTyped({ issuanceScenario: issuanceScenarioDTOFrom(result) }, false)
  }

  @HttpCode(201)
  @Post('/')
  public async postIssuanceScenario(@Body() issuanceScenarioRequest: IssuanceScenarioRequest): Promise<IssuanceScenarioResponse> {
    const result = await this.scenarioService.createScenario(IssuanceScenarioRequestToJSONTyped(issuanceScenarioRequest))
    return IssuanceScenarioResponseFromJSONTyped({ issuanceScenario: issuanceScenarioDTOFrom(result) }, false)
  }

  @Put('/:issuanceScenarioId')
  public async putIssuanceScenario(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Body() issuanceScenarioRequest: IssuanceScenarioRequest,
  ): Promise<IssuanceScenarioResponse> {
    const result = await this.scenarioService.updateScenario(issuanceScenarioId, IssuanceScenarioRequestToJSONTyped(issuanceScenarioRequest))
    return IssuanceScenarioResponseFromJSONTyped({ issuanceScenario: issuanceScenarioDTOFrom(result) }, false)
  }

  @OnUndefined(204)
  @Delete('/:issuanceScenarioId')
  public async deleteIssuanceScenario(@Param('issuanceScenarioId') issuanceScenarioId: string): Promise<void> {
    return await this.scenarioService.deleteScenario(issuanceScenarioId)
  }

  @Get('/:issuanceScenarioId/steps')
  public async getAllSteps(@Param('issuanceScenarioId') issuanceScenarioId: string): Promise<StepsResponse> {
    const result = await this.scenarioService.getScenarioSteps(issuanceScenarioId)
    const steps = result.map((step) => stepDTOFrom(step))
    return StepsResponseFromJSONTyped({ steps }, false)
  }

  @Get('/:issuanceScenarioId/steps/:stepId')
  public async getOneIssuanceScenarioStep(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Param('stepId') stepId: string,
  ): Promise<StepResponse> {
    const result = await this.scenarioService.getScenarioStep(issuanceScenarioId, stepId)
    return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
  }

  @HttpCode(201)
  @Post('/:issuanceScenarioId/steps')
  public async postIssuanceScenarioStep(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Body() stepRequest: StepRequest,
  ): Promise<StepResponse> {
    const result = await this.scenarioService.createScenarioStep(issuanceScenarioId, StepRequestToJSONTyped(stepRequest))
    return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
  }

  @Put('/:issuanceScenarioId/steps/:stepId')
  public async putIssuanceScenarioStep(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Param('stepId') stepId: string,
    @Body() stepRequest: StepRequest,
  ): Promise<StepResponse> {
    const result = await this.scenarioService.updateScenarioStep(issuanceScenarioId, stepId, StepRequestToJSONTyped(stepRequest))
    return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
  }

  @OnUndefined(204)
  @Delete('/:issuanceScenarioId/steps/:stepId')
  public async deleteIssuanceScenarioStep(@Param('issuanceScenarioId') issuanceScenarioId: string, @Param('stepId') stepId: string): Promise<void> {
    return this.scenarioService.deleteScenarioStep(issuanceScenarioId, stepId)
  }

  @Get('/:issuanceScenarioId/steps/:stepId/actions')
  public async getAllIssuanceScenarioStepActions(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Param('stepId') stepId: string,
  ): Promise<StepActionsResponse> {
    const result = await this.scenarioService.getScenarioStepActions(issuanceScenarioId, stepId)
    const actions = result.map((action) => action)
    return StepActionsResponseFromJSONTyped({ actions }, false)
  }

  @Get('/:issuanceScenarioId/steps/:stepId/actions/:actionId')
  public async getOneIssuanceScenarioStepAction(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
  ): Promise<StepActionResponse> {
    const result = await this.scenarioService.getScenarioStepAction(issuanceScenarioId, stepId, actionId)
    return StepActionResponseFromJSONTyped({ action: result }, false)
  }

  @HttpCode(201)
  @Post('/:issuanceScenarioId/steps/:stepId/actions')
  public async postIssuanceScenarioStepAction(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Param('stepId') stepId: string,
    @Body() actionRequest: StepActionRequest,
  ): Promise<StepActionResponse> {
    const result = await this.scenarioService.createScenarioStepAction(issuanceScenarioId, stepId, StepActionRequestToJSONTyped(actionRequest))
    return StepActionResponseFromJSONTyped({ action: result }, false)
  }

  @Put('/:issuanceScenarioId/steps/:stepId/actions/:actionId')
  public async putIssuanceScenarioStepAction(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
    @Body() actionRequest: StepActionRequest,
  ): Promise<StepActionResponse> {
    const result = await this.scenarioService.updateScenarioStepAction(
      issuanceScenarioId,
      stepId,
      actionId,
      StepActionRequestToJSONTyped(actionRequest),
    )
    return StepActionResponseFromJSONTyped({ action: result }, false)
  }

  @OnUndefined(204)
  @Delete('/:issuanceScenarioId/steps/:stepId/actions/:actionId')
  public async deleteIssuanceScenarioStepAction(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
  ): Promise<void> {
    return this.scenarioService.deleteScenarioStepAction(issuanceScenarioId, stepId, actionId)
  }
}

export default IssuanceScenarioController
