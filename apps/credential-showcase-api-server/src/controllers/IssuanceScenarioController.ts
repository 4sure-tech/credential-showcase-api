import { Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import ScenarioService from '../services/ScenarioService'
import {
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
  IssuanceScenarioRequest,
  IssuanceScenarioRequestToJSONTyped,
} from 'credential-showcase-openapi'
import { issuanceScenarioDTOFrom, stepDTOFrom } from '../utils/mappers'
import { ScenarioType } from '../types'
import { NotFoundError } from '../errors/NotFoundError'

@JsonController('/scenarios/issuances')
@Service()
class IssuanceScenarioController {
  constructor(private scenarioService: ScenarioService) {}

  @Get('/')
  public async getAllIssuanceScenarios(): Promise<IssuanceScenariosResponse> {
    try {
      const result = await this.scenarioService.getScenarios({ filter: { scenarioType: ScenarioType.ISSUANCE } })
      const issuanceScenarios = result.map((issuanceScenario) => issuanceScenarioDTOFrom(issuanceScenario))
      return IssuanceScenariosResponseFromJSONTyped({ issuanceScenarios }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get all issuance scenarios failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:issuanceScenarioId')
  public async getOneIssuanceScenario(@Param('issuanceScenarioId') issuanceScenarioId: string): Promise<IssuanceScenarioResponse> {
    try {
      const result = await this.scenarioService.getScenario(issuanceScenarioId)
      return IssuanceScenarioResponseFromJSONTyped({ issuanceScenario: issuanceScenarioDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @HttpCode(201)
  @Post('/')
  public async postIssuanceScenario(@Body() issuanceScenarioRequest: IssuanceScenarioRequest): Promise<IssuanceScenarioResponse> {
    try {
      const result = await this.scenarioService.createScenario(IssuanceScenarioRequestToJSONTyped(issuanceScenarioRequest))
      return IssuanceScenarioResponseFromJSONTyped({ issuanceScenario: issuanceScenarioDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Create issuance scenario failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Put('/:issuanceScenarioId')
  public async putIssuanceScenario(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Body() issuanceScenarioRequest: IssuanceScenarioRequest,
  ): Promise<IssuanceScenarioResponse> {
    try {
      const result = await this.scenarioService.updateScenario(issuanceScenarioId, IssuanceScenarioRequestToJSONTyped(issuanceScenarioRequest))
      return IssuanceScenarioResponseFromJSONTyped({ issuanceScenario: issuanceScenarioDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Update issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @OnUndefined(204)
  @Delete('/:issuanceScenarioId')
  public async deleteIssuanceScenario(@Param('issuanceScenarioId') issuanceScenarioId: string): Promise<void> {
    try {
      return await this.scenarioService.deleteScenario(issuanceScenarioId)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Delete issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:issuanceScenarioId/steps')
  public async getAllSteps(@Param('issuanceScenarioId') issuanceScenarioId: string): Promise<StepsResponse> {
    try {
      const result = await this.scenarioService.getScenarioSteps(issuanceScenarioId)
      const steps = result.map((step) => stepDTOFrom(step))
      return StepsResponseFromJSONTyped({ steps }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get all steps for issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:issuanceScenarioId/steps/:stepId')
  public async getOneIssuanceScenarioStep(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Param('stepId') stepId: string,
  ): Promise<StepResponse> {
    try {
      const result = await this.scenarioService.getScenarioStep(issuanceScenarioId, stepId)
      return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get step id=${stepId} for issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @HttpCode(201)
  @Post('/:issuanceScenarioId/steps')
  public async postIssuanceScenarioStep(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Body() stepRequest: StepRequest,
  ): Promise<StepResponse> {
    try {
      const result = await this.scenarioService.createScenarioStep(issuanceScenarioId, StepRequestToJSONTyped(stepRequest))
      return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Create step for issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Put('/:issuanceScenarioId/steps/:stepId')
  public async putIssuanceScenarioStep(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Param('stepId') stepId: string,
    @Body() stepRequest: StepRequest,
  ): Promise<StepResponse> {
    try {
      const result = await this.scenarioService.updateScenarioStep(issuanceScenarioId, stepId, StepRequestToJSONTyped(stepRequest))
      return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Update step id=${stepId} for issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @OnUndefined(204)
  @Delete('/:issuanceScenarioId/steps/:stepId')
  public async deleteIssuanceScenarioStep(@Param('issuanceScenarioId') issuanceScenarioId: string, @Param('stepId') stepId: string): Promise<void> {
    try {
      return this.scenarioService.deleteScenarioStep(issuanceScenarioId, stepId)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Delete step id=${stepId} for issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:issuanceScenarioId/steps/:stepId/actions')
  public async getAllIssuanceScenarioStepActions(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Param('stepId') stepId: string,
  ): Promise<StepActionsResponse> {
    try {
      const result = await this.scenarioService.getScenarioStepActions(issuanceScenarioId, stepId)
      const actions = result.map((action) => action)
      return StepActionsResponseFromJSONTyped({ actions }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get all actions for step id=${stepId}, issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:issuanceScenarioId/steps/:stepId/actions/:actionId')
  public async getOneIssuanceScenarioStepAction(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
  ): Promise<StepActionResponse> {
    try {
      const result = await this.scenarioService.getScenarioStepAction(issuanceScenarioId, stepId, actionId)
      return StepActionResponseFromJSONTyped({ action: result }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get action id=${actionId} for step id=${stepId}, issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @HttpCode(201)
  @Post('/:issuanceScenarioId/steps/:stepId/actions')
  public async postIssuanceScenarioStepAction(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Param('stepId') stepId: string,
    @Body() actionRequest: StepActionRequest,
  ): Promise<StepActionResponse> {
    try {
      const result = await this.scenarioService.createScenarioStepAction(issuanceScenarioId, stepId, StepActionRequestToJSONTyped(actionRequest))
      return StepActionResponseFromJSONTyped({ action: result }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Create action for step id=${stepId}, issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Put('/:issuanceScenarioId/steps/:stepId/actions/:actionId')
  public async putIssuanceScenarioStepAction(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
    @Body() actionRequest: StepActionRequest,
  ): Promise<StepActionResponse> {
    try {
      const result = await this.scenarioService.updateScenarioStepAction(
        issuanceScenarioId,
        stepId,
        actionId,
        StepActionRequestToJSONTyped(actionRequest),
      )
      return StepActionResponseFromJSONTyped({ action: result }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Update action id=${actionId} for step id=${stepId}, issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @OnUndefined(204)
  @Delete('/:issuanceScenarioId/steps/:stepId/actions/:actionId')
  public async deleteIssuanceScenarioStepAction(
    @Param('issuanceScenarioId') issuanceScenarioId: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
  ): Promise<void> {
    try {
      return this.scenarioService.deleteScenarioStepAction(issuanceScenarioId, stepId, actionId)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Delete action id=${actionId} for step id=${stepId}, issuance scenario id=${issuanceScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }
}

export default IssuanceScenarioController
