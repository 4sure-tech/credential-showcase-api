import {
    Body,
    Delete,
    Get,
    HttpCode,
    JsonController,
    OnUndefined,
    Param,
    Post,
    Put
} from 'routing-controllers';
import { Service } from 'typedi';
import ScenarioService from '../services/ScenarioService';
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
    StepActionRequestToJSONTyped
} from 'credential-showcase-openapi';
import { issuanceFlowDTOFrom, stepDTOFrom } from '../utils/mappers';
import { WorkflowType } from '../types';

@JsonController('/workflows/issuances')
@Service()
class IssuanceFlowController {
    constructor(private scenarioService: ScenarioService) { }

    @Get('/')
    public async getAllIssuanceFlows(): Promise<IssuanceFlowsResponse> {
        const result = await this.scenarioService.getScenarios({ filter: { scenarioType: WorkflowType.ISSUANCE } });
        const issuanceFlows = result.map(issuanceFlow => issuanceFlowDTOFrom(issuanceFlow));
        return IssuanceFlowsResponseFromJSONTyped({ issuanceFlows }, false);
    }

    @Get('/:issuanceFlowId')
    public async getOneIssuanceFlow(
        @Param('issuanceFlowId') issuanceFlowId: string
    ): Promise<IssuanceFlowResponse> {
        const result = await this.scenarioService.getScenario(issuanceFlowId);
        return IssuanceFlowResponseFromJSONTyped({ issuanceFlow: issuanceFlowDTOFrom(result) }, false);
    }

    @HttpCode(201)
    @Post('/')
    public async postIssuanceFlow(
        @Body() issuanceFlowRequest: IssuanceFlowRequest
    ): Promise<IssuanceFlowResponse> {
        const result = await this.scenarioService.createScenario(IssuanceFlowRequestToJSONTyped(issuanceFlowRequest));
        return IssuanceFlowResponseFromJSONTyped({ issuanceFlow: issuanceFlowDTOFrom(result) }, false);
    }

    @Put('/:issuanceFlowId')
    public async putIssuanceFlow(
        @Param('issuanceFlowId') issuanceFlowId: string,
        @Body() issuanceFlowRequest: IssuanceFlowRequest
    ): Promise<IssuanceFlowResponse> {
        const result = await this.scenarioService.updateScenario(issuanceFlowId, IssuanceFlowRequestToJSONTyped(issuanceFlowRequest));
        return IssuanceFlowResponseFromJSONTyped({ issuanceFlow: issuanceFlowDTOFrom(result) }, false);
    }

    @OnUndefined(204)
    @Delete('/:issuanceFlowId')
    public async deleteIssuanceFlow(
        @Param('issuanceFlowId') issuanceFlowId: string
    ): Promise<void> {
        return await this.scenarioService.deleteScenario(issuanceFlowId);
    }

    @Get('/:issuanceFlowId/steps')
    public async getAllSteps(
        @Param('issuanceFlowId') issuanceFlowId: string
    ): Promise<StepsResponse> {
        const result = await this.scenarioService.getScenarioSteps(issuanceFlowId)
        const steps = result.map(step => stepDTOFrom(step));
        return StepsResponseFromJSONTyped({ steps }, false);
    }

    @Get('/:issuanceFlowId/steps/:stepId')
    public async getOneIssuanceFlowStep(
        @Param('issuanceFlowId') issuanceFlowId: string,
        @Param('stepId') stepId: string
    ): Promise<StepResponse> {
        const result = await this.scenarioService.getScenarioStep(issuanceFlowId, stepId);
        return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false);
    }

    @HttpCode(201)
    @Post('/:issuanceFlowId/steps')
    public async postIssuanceFlowStep(
        @Param('issuanceFlowId') issuanceFlowId: string,
        @Body() stepRequest: StepRequest
    ): Promise<StepResponse> {
        const result = await this.scenarioService.createScenarioStep(issuanceFlowId, StepRequestToJSONTyped(stepRequest));
        return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false);
    }

    @Put('/:issuanceFlowId/steps/:stepId')
    public async putIssuanceFlowStep(
        @Param('issuanceFlowId') issuanceFlowId: string,
        @Param('stepId') stepId: string,
        @Body() stepRequest: StepRequest
    ): Promise<StepResponse> {
        const result = await this.scenarioService.updateScenarioStep(issuanceFlowId, stepId, StepRequestToJSONTyped(stepRequest))
        return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false);
    }

    @OnUndefined(204)
    @Delete('/:issuanceFlowId/steps/:stepId')
    public async deleteIssuanceFlowStep(
        @Param('issuanceFlowId') issuanceFlowId: string,
        @Param('stepId') stepId: string
    ): Promise<void> {
        return this.scenarioService.deleteScenarioStep(issuanceFlowId, stepId);
    }

    @Get('/:issuanceFlowId/steps/:stepId/actions')
    public async getAllIssuanceFlowStepActions(
        @Param('issuanceFlowId') issuanceFlowId: string,
        @Param('stepId') stepId: string
    ): Promise<StepActionsResponse> {
        const result = await this.scenarioService.getScenarioStepActions(issuanceFlowId, stepId)
        const actions = result.map(action => action);
        return StepActionsResponseFromJSONTyped({ actions }, false);
    }

    @Get('/:issuanceFlowId/steps/:stepId/actions/:actionId')
    public async getOneIssuanceFlowStepAction(
        @Param('issuanceFlowId') issuanceFlowId: string,
        @Param('stepId') stepId: string,
        @Param('actionId') actionId: string
    ): Promise<StepActionResponse> {
        const result = await this.scenarioService.getScenarioStepAction(issuanceFlowId, stepId, actionId);
        return StepActionResponseFromJSONTyped({ action: result }, false);
    }

    @HttpCode(201)
    @Post('/:issuanceFlowId/steps/:stepId/actions')
    public async postIssuanceFlowStepAction(
        @Param('issuanceFlowId') issuanceFlowId: string,
        @Param('stepId') stepId: string,
        @Body() actionRequest: StepActionRequest
    ): Promise<StepActionResponse> {
        const result = await this.scenarioService.createScenarioStepAction(issuanceFlowId, stepId, StepActionRequestToJSONTyped(actionRequest));
        return StepActionResponseFromJSONTyped({ action: result }, false);
    }

    @Put('/:issuanceFlowId/steps/:stepId/actions/:actionId')
    public async putIssuanceFlowStepAction(
        @Param('issuanceFlowId') issuanceFlowId: string,
        @Param('stepId') stepId: string,
        @Param('actionId') actionId: string,
        @Body() actionRequest: StepActionRequest
    ): Promise<StepActionResponse> {
        const result = await this.scenarioService.updateScenarioStepAction(issuanceFlowId, stepId, actionId, StepActionRequestToJSONTyped(actionRequest))
        return StepActionResponseFromJSONTyped({ action: result }, false);
    }

    @OnUndefined(204)
    @Delete('/:issuanceFlowId/steps/:stepId/actions/:actionId')
    public async deleteIssuanceFlowStepAction(
        @Param('issuanceFlowId') issuanceFlowId: string,
        @Param('stepId') stepId: string,
        @Param('actionId') actionId: string
    ): Promise<void> {
        return this.scenarioService.deleteScenarioStepAction(issuanceFlowId, stepId, actionId);
    }
}

export default IssuanceFlowController
