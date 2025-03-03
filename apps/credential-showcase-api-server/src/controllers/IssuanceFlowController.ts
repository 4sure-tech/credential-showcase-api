import { Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import IssuanceFlowService from '../services/IssuanceFlowService'
import {
  IssuanceFlowRequest,
  IssuanceFlowRequestToJSONTyped,
  IssuanceFlowResponse,
  IssuanceFlowResponseFromJSONTyped,
  IssuanceFlowsResponse,
  IssuanceFlowsResponseFromJSONTyped,
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
import { issuanceFlowDTOFrom, stepDTOFrom } from '../utils/mappers'

@JsonController('/workflows/issuances')
@Service()
class IssuanceFlowController {
  constructor(private issuanceFlowService: IssuanceFlowService) {}

  // ISSUANCE FLOW

  @Get('/')
  public async getAllIssuanceFlows(): Promise<IssuanceFlowsResponse> {
    const result = await this.issuanceFlowService.getIssuanceFlows()
    const issuanceFlows = result.map((issuanceFlow) => issuanceFlowDTOFrom(issuanceFlow))
    return IssuanceFlowsResponseFromJSONTyped({ issuanceFlows }, false)
  }

  @Get('/:issuanceFlowId')
  public async getOneIssuanceFlow(@Param('issuanceFlowId') issuanceFlowId: string): Promise<IssuanceFlowResponse> {
    const result = await this.issuanceFlowService.getIssuanceFlow(issuanceFlowId)
    return IssuanceFlowResponseFromJSONTyped({ issuanceFlow: issuanceFlowDTOFrom(result) }, false)
  }

  @HttpCode(201)
  @Post('/')
  public async postIssuanceFlow(@Body() issuanceFlowRequest: IssuanceFlowRequest): Promise<IssuanceFlowResponse> {
    const result = await this.issuanceFlowService.createIssuanceFlow(IssuanceFlowRequestToJSONTyped(issuanceFlowRequest))
    return IssuanceFlowResponseFromJSONTyped({ issuanceFlow: issuanceFlowDTOFrom(result) }, false)
  }

  @Put('/:issuanceFlowId')
  public async putIssuanceFlow(
    @Param('issuanceFlowId') issuanceFlowId: string,
    @Body() issuanceFlowRequest: IssuanceFlowRequest,
  ): Promise<IssuanceFlowResponse> {
    const result = await this.issuanceFlowService.updateIssuanceFlow(issuanceFlowId, IssuanceFlowRequestToJSONTyped(issuanceFlowRequest))
    return IssuanceFlowResponseFromJSONTyped({ issuanceFlow: issuanceFlowDTOFrom(result) }, false)
  }

  @OnUndefined(204)
  @Delete('/:issuanceFlowId')
  public async deleteIssuanceFlow(@Param('issuanceFlowId') issuanceFlowId: string): Promise<void> {
    return await this.issuanceFlowService.deleteIssuanceFlow(issuanceFlowId)
  }

  // ISSUANCE FLOW STEP

  @Get('/:issuanceFlowId/steps')
  public async getAllSteps(@Param('issuanceFlowId') issuanceFlowId: string): Promise<StepsResponse> {
    const result = await this.issuanceFlowService.getIssuanceFlowSteps(issuanceFlowId)
    const steps = result.map((step) => stepDTOFrom(step))
    return StepsResponseFromJSONTyped({ steps }, false)
  }

  @Get('/:issuanceFlowId/steps/:stepId')
  public async getOneIssuanceFlowStep(@Param('issuanceFlowId') issuanceFlowId: string, @Param('stepId') stepId: string): Promise<StepResponse> {
    const result = await this.issuanceFlowService.getIssuanceFlowStep(issuanceFlowId, stepId)
    return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
  }

  @HttpCode(201)
  @Post('/:issuanceFlowId/steps')
  public async postIssuanceFlowStep(@Param('issuanceFlowId') issuanceFlowId: string, @Body() stepRequest: StepRequest): Promise<StepResponse> {
    const result = await this.issuanceFlowService.createIssuanceFlowStep(issuanceFlowId, StepRequestToJSONTyped(stepRequest))
    return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
  }

  @Put('/:issuanceFlowId/steps/:stepId')
  public async putIssuanceFlowStep(
    @Param('issuanceFlowId') issuanceFlowId: string,
    @Param('stepId') stepId: string,
    @Body() stepRequest: StepRequest,
  ): Promise<StepResponse> {
    const result = await this.issuanceFlowService.updateIssuanceFlowStep(issuanceFlowId, stepId, StepRequestToJSONTyped(stepRequest))
    return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false)
  }

  @OnUndefined(204)
  @Delete('/:issuanceFlowId/steps/:stepId')
  public async deleteIssuanceFlowStep(@Param('issuanceFlowId') issuanceFlowId: string, @Param('stepId') stepId: string): Promise<void> {
    return this.issuanceFlowService.deleteIssuanceFlowStep(issuanceFlowId, stepId)
  }

  // ISSUANCE FLOW STEP ACTION

  @Get('/:issuanceFlowId/steps/:stepId/actions')
  public async getAllIssuanceFlowStepActions(
    @Param('issuanceFlowId') issuanceFlowId: string,
    @Param('stepId') stepId: string,
  ): Promise<StepActionsResponse> {
    const result = await this.issuanceFlowService.getIssuanceFlowStepActions(issuanceFlowId, stepId)
    const actions = result.map((action) => action)
    return StepActionsResponseFromJSONTyped({ actions }, false)
  }

  @Get('/:issuanceFlowId/steps/:stepId/actions/:actionId')
  public async getOneIssuanceFlowStepAction(
    @Param('issuanceFlowId') issuanceFlowId: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
  ): Promise<StepActionResponse> {
    const result = await this.issuanceFlowService.getIssuanceFlowStepAction(issuanceFlowId, stepId, actionId)
    return StepActionResponseFromJSONTyped({ action: result }, false)
  }

  @HttpCode(201)
  @Post('/:issuanceFlowId/steps/:stepId/actions')
  public async postIssuanceFlowStepAction(
    @Param('issuanceFlowId') issuanceFlowId: string,
    @Param('stepId') stepId: string,
    @Body() actionRequest: StepActionRequest,
  ): Promise<StepActionResponse> {
    const result = await this.issuanceFlowService.createIssuanceFlowStepAction(issuanceFlowId, stepId, StepActionRequestToJSONTyped(actionRequest))
    return StepActionResponseFromJSONTyped({ action: result }, false)
  }

  @Put('/:issuanceFlowId/steps/:stepId/actions/:actionId')
  public async putIssuanceFlowStepAction(
    @Param('issuanceFlowId') issuanceFlowId: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
    @Body() actionRequest: StepActionRequest,
  ): Promise<StepActionResponse> {
    const result = await this.issuanceFlowService.updateIssuanceFlowStepAction(
      issuanceFlowId,
      stepId,
      actionId,
      StepActionRequestToJSONTyped(actionRequest),
    )
    return StepActionResponseFromJSONTyped({ action: result }, false)
  }

  @OnUndefined(204)
  @Delete('/:issuanceFlowId/steps/:stepId/actions/:actionId')
  public async deleteIssuanceFlowStepAction(
    @Param('issuanceFlowId') issuanceFlowId: string,
    @Param('stepId') stepId: string,
    @Param('actionId') actionId: string,
  ): Promise<void> {
    return this.issuanceFlowService.deleteIssuanceFlowStepAction(issuanceFlowId, stepId, actionId)
  }
}

export default IssuanceFlowController
