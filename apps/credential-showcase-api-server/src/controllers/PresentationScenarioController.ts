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
  StepActionRequest,
  StepActionRequestToJSONTyped,
  StepActionResponse,
  StepActionResponseFromJSONTyped,
  StepActionsResponse,
  StepActionsResponseFromJSONTyped,
  StepRequest,
  StepRequestToJSONTyped,
  StepResponse,
  StepResponseFromJSONTyped,
  StepsResponse,
  StepsResponseFromJSONTyped,
} from 'credential-showcase-openapi'
import { presentationScenarioDTOFrom, stepDTOFrom } from '../utils/mappers'
import { ScenarioType } from '../types'
import { NotFoundError } from '../errors'

@JsonController('/scenarios/presentations')
@Service()
class PresentationScenarioController {
  constructor(private scenarioService: ScenarioService) {}

  @Get('/')
  public async getAllPresentationScenarios(): Promise<PresentationScenariosResponse> {
    try {
      const result = await this.scenarioService.getScenarios({ filter: { scenarioType: ScenarioType.ISSUANCE } })
      const presentationScenarios = result.map((presentationScenario) => presentationScenarioDTOFrom(presentationScenario))
      return PresentationScenariosResponseFromJSONTyped({ presentationScenarios }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get all presentation scenarios failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:presentationScenarioId')
  public async getOnePresentationScenario(@Param('presentationScenarioId') presentationScenarioId: string): Promise<PresentationScenarioResponse> {
    try {
      const result = await this.scenarioService.getScenario(presentationScenarioId)
      return PresentationScenarioResponseFromJSONTyped({ presentationScenario: presentationScenarioDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get presentation scenario id=${presentationScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @HttpCode(201)
  @Post('/')
  public async postPresentationScenario(@Body() presentationScenarioRequest: PresentationScenarioRequest): Promise<PresentationScenarioResponse> {
    try {
      const result = await this.scenarioService.createScenario(PresentationScenarioRequestToJSONTyped(presentationScenarioRequest))
      return PresentationScenarioResponseFromJSONTyped({ presentationScenario: presentationScenarioDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Create presentation scenario failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Put('/:presentationScenarioId')
  public async putPresentationScenario(
    @Param('presentationScenarioId') presentationScenarioId: string,
    @Body() presentationScenarioRequest: PresentationScenarioRequest,
  ): Promise<PresentationScenarioResponse> {
    try {
      const result = await this.scenarioService.updateScenario(
        presentationScenarioId,
        PresentationScenarioRequestToJSONTyped(presentationScenarioRequest),
      )
      return PresentationScenarioResponseFromJSONTyped({ presentationScenario: presentationScenarioDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Update presentation scenario id=${presentationScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @OnUndefined(204)
  @Delete('/:presentationScenarioId')
  public async deletePresentationScenario(@Param('presentationScenarioId') presentationScenarioId: string): Promise<void> {
    try {
      return await this.scenarioService.deleteScenario(presentationScenarioId)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Delete presentation scenario id=${presentationScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:presentationScenarioId/steps')
  public async getAllSteps(@Param('presentationScenarioId') presentationScenarioId: string): Promise<StepsResponse> {
    try {
      const result = await this.scenarioService.getScenarioSteps(presentationScenarioId)
      const steps = result.map((step) => stepDTOFrom(step))
      return StepsResponseFromJSONTyped({ steps }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get all steps for presentation scenario id=${presentationScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:presentationScenarioId/steps/:stepId')
  public async getOnePresentationScenarioStep(
    @Param('presentationScenarioId') presentationScenarioId: string,
    @Param('stepId') stepId: string,
  ): Promise<StepResponse> {
    try {
      const result = await this.scenarioService.getScenarioStep(presentationScenarioId, stepId)
      return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get step id=${stepId} for presentation scenario id=${presentationScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @HttpCode(201)
  @Post('/:presentationScenarioId/steps')
  public async postPresentationScenarioStep(
    @Param('presentationScenarioId') presentationScenarioId: string,
    @Body() stepRequest: StepRequest,
  ): Promise<StepResponse> {
    try {
      const result = await this.scenarioService.createScenarioStep(presentationScenarioId, StepRequestToJSONTyped(stepRequest))
      return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Create step for presentation scenario id=${presentationScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Put('/:presentationScenarioId/steps/:stepId')
  public async putPresentationScenarioStep(
    @Param('presentationScenarioId') presentationScenarioId: string,
    @Param('stepId') stepId: string,
    @Body() stepRequest: StepRequest,
  ): Promise<StepResponse> {
    try {
      const result = await this.scenarioService.updateScenarioStep(presentationScenarioId, stepId, StepRequestToJSONTyped(stepRequest))
      return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Update step id=${stepId} for presentation scenario id=${presentationScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @OnUndefined(204)
  @Delete('/:presentationScenarioId/steps/:stepId')
  public async deletePresentationScenarioStep(
    @Param('presentationScenarioId') presentationScenarioId: string,
    @Param('stepId') stepId: string,
  ): Promise<void> {
    try {
      return this.scenarioService.deleteScenarioStep(presentationScenarioId, stepId)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Delete step id=${stepId} for presentation scenario id=${presentationScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:presentationScenarioId/steps/:stepId/actions')
  public async getAllPresentationScenarioStepActions(
    @Param('presentationScenarioId') presentationScenarioId: string,
    @Param('stepId') stepId: string,
  ): Promise<StepActionsResponse> {
    try {
      const result = await this.scenarioService.getScenarioStepActions(presentationScenarioId, stepId)
      const actions = result.map((action) => action)
      return StepActionsResponseFromJSONTyped({ actions }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get all actions for step id=${stepId}, presentation scenario id=${presentationScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:presentationScenarioId/steps/:stepId/actions/:actionId')
  public async getOnePresentationScenarioStepAction(
    @Param('presentationScenarioId') presentationScenarioId: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
  ): Promise<StepActionResponse> {
    try {
      const result = await this.scenarioService.getScenarioStepAction(presentationScenarioId, stepId, actionId)
      return StepActionResponseFromJSONTyped({ action: result }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get action id=${actionId} for step id=${stepId}, presentation scenario id=${presentationScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @HttpCode(201)
  @Post('/:presentationScenarioId/steps/:stepId/actions')
  public async postPresentationScenarioStepAction(
    @Param('presentationScenarioId') presentationScenarioId: string,
    @Param('stepId') stepId: string,
    @Body() actionRequest: StepActionRequest,
  ): Promise<StepActionResponse> {
    try {
      const result = await this.scenarioService.createScenarioStepAction(presentationScenarioId, stepId, StepActionRequestToJSONTyped(actionRequest))
      return StepActionResponseFromJSONTyped({ action: result }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Create action for step id=${stepId}, presentation scenario id=${presentationScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Put('/:presentationScenarioId/steps/:stepId/actions/:actionId')
  public async putPresentationScenarioStepAction(
    @Param('presentationScenarioId') presentationScenarioId: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
    @Body() actionRequest: StepActionRequest,
  ): Promise<StepActionResponse> {
    try {
      const result = await this.scenarioService.updateScenarioStepAction(
        presentationScenarioId,
        stepId,
        actionId,
        StepActionRequestToJSONTyped(actionRequest),
      )
      return StepActionResponseFromJSONTyped({ action: result }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Update action id=${actionId} for step id=${stepId}, presentation scenario id=${presentationScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @OnUndefined(204)
  @Delete('/:presentationScenarioId/steps/:stepId/actions/:actionId')
  public async deletePresentationScenarioStepAction(
    @Param('presentationScenarioId') presentationScenarioId: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
  ): Promise<void> {
    try {
      return this.scenarioService.deleteScenarioStepAction(presentationScenarioId, stepId, actionId)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Delete action id=${actionId} for step id=${stepId}, presentation scenario id=${presentationScenarioId} failed:`, e)
      }
      return Promise.reject(e)
    }
  }
}

export default PresentationScenarioController
