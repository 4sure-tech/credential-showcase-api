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
    PresentationFlowRequest,
    PresentationFlowRequestToJSONTyped,
    PresentationFlowResponse,
    PresentationFlowResponseFromJSONTyped,
    PresentationFlowsResponse,
    PresentationFlowsResponseFromJSONTyped,
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
import { presentationFlowDTOFrom, stepDTOFrom } from '../utils/mappers';
import { WorkflowType } from '../types';

@JsonController('/workflows/presentations')
@Service()
class PresentationFlowController {
    constructor(private scenarioService: ScenarioService) { }

    @Get('/')
    public async getAllPresentationFlows(): Promise<PresentationFlowsResponse> {
        const result = await this.scenarioService.getScenarios({ filter: { scenarioType: WorkflowType.ISSUANCE } });
        const presentationFlows = result.map(presentationFlow => presentationFlowDTOFrom(presentationFlow));
        return PresentationFlowsResponseFromJSONTyped({ presentationFlows }, false);
    }

    @Get('/:presentationFlowId')
    public async getOnePresentationFlow(
        @Param('presentationFlowId') presentationFlowId: string
    ): Promise<PresentationFlowResponse> {
        const result = await this.scenarioService.getScenario(presentationFlowId);
        return PresentationFlowResponseFromJSONTyped({ presentationFlow: presentationFlowDTOFrom(result) }, false);
    }

    @HttpCode(201)
    @Post('/')
    public async postPresentationFlow(
        @Body() presentationFlowRequest: PresentationFlowRequest
    ): Promise<PresentationFlowResponse> {
        const result = await this.scenarioService.createScenario(PresentationFlowRequestToJSONTyped(presentationFlowRequest));
        return PresentationFlowResponseFromJSONTyped({ presentationFlow: presentationFlowDTOFrom(result) }, false);
    }

    @Put('/:presentationFlowId')
    public async putPresentationFlow(
        @Param('presentationFlowId') presentationFlowId: string,
        @Body() presentationFlowRequest: PresentationFlowRequest
    ): Promise<PresentationFlowResponse> {
        const result = await this.scenarioService.updateScenario(presentationFlowId, PresentationFlowRequestToJSONTyped(presentationFlowRequest));
        return PresentationFlowResponseFromJSONTyped({ presentationFlow: presentationFlowDTOFrom(result) }, false);
    }

    @OnUndefined(204)
    @Delete('/:presentationFlowId')
    public async deletePresentationFlow(
        @Param('presentationFlowId') presentationFlowId: string
    ): Promise<void> {
        return await this.scenarioService.deleteScenario(presentationFlowId);
    }

    @Get('/:presentationFlowId/steps')
    public async getAllSteps(
        @Param('presentationFlowId') presentationFlowId: string
    ): Promise<StepsResponse> {
        const result = await this.scenarioService.getScenarioSteps(presentationFlowId)
        const steps = result.map(step => stepDTOFrom(step));
        return StepsResponseFromJSONTyped({ steps }, false);
    }

    @Get('/:presentationFlowId/steps/:stepId')
    public async getOnePresentationFlowStep(
        @Param('presentationFlowId') presentationFlowId: string,
        @Param('stepId') stepId: string
    ): Promise<StepResponse> {
        const result = await this.scenarioService.getScenarioStep(presentationFlowId, stepId);
        return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false);
    }

    @HttpCode(201)
    @Post('/:presentationFlowId/steps')
    public async postPresentationFlowStep(
        @Param('presentationFlowId') presentationFlowId: string,
        @Body() stepRequest: StepRequest
    ): Promise<StepResponse> {
        const result = await this.scenarioService.createScenarioStep(presentationFlowId, StepRequestToJSONTyped(stepRequest));
        return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false);
    }

    @Put('/:presentationFlowId/steps/:stepId')
    public async putPresentationFlowStep(
        @Param('presentationFlowId') presentationFlowId: string,
        @Param('stepId') stepId: string,
        @Body() stepRequest: StepRequest
    ): Promise<StepResponse> {
        const result = await this.scenarioService.updateScenarioStep(presentationFlowId, stepId, StepRequestToJSONTyped(stepRequest))
        return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false);
    }

    @OnUndefined(204)
    @Delete('/:presentationFlowId/steps/:stepId')
    public async deletePresentationFlowStep(
        @Param('presentationFlowId') presentationFlowId: string,
        @Param('stepId') stepId: string
    ): Promise<void> {
        return this.scenarioService.deleteScenarioStep(presentationFlowId, stepId);
    }

    @Get('/:presentationFlowId/steps/:stepId/actions')
    public async getAllPresentationFlowStepActions(
        @Param('presentationFlowId') presentationFlowId: string,
        @Param('stepId') stepId: string
    ): Promise<StepActionsResponse> {
        const result = await this.scenarioService.getScenarioStepActions(presentationFlowId, stepId)
        const actions = result.map(action => action);
        return StepActionsResponseFromJSONTyped({ actions }, false);
    }

    @Get('/:presentationFlowId/steps/:stepId/actions/:actionId')
    public async getOnePresentationFlowStepAction(
        @Param('presentationFlowId') presentationFlowId: string,
        @Param('stepId') stepId: string,
        @Param('actionId') actionId: string
    ): Promise<StepActionResponse> {
        const result = await this.scenarioService.getScenarioStepAction(presentationFlowId, stepId, actionId);
        return StepActionResponseFromJSONTyped({ action: result }, false);
    }

    @HttpCode(201)
    @Post('/:presentationFlowId/steps/:stepId/actions')
    public async postPresentationFlowStepAction(
        @Param('presentationFlowId') presentationFlowId: string,
        @Param('stepId') stepId: string,
        @Body() actionRequest: StepActionRequest
    ): Promise<StepActionResponse> {
        const result = await this.scenarioService.createScenarioStepAction(presentationFlowId, stepId, StepActionRequestToJSONTyped(actionRequest));
        return StepActionResponseFromJSONTyped({ action: result }, false);
    }

    @Put('/:presentationFlowId/steps/:stepId/actions/:actionId')
    public async putPresentationFlowStepAction(
        @Param('presentationFlowId') presentationFlowId: string,
        @Param('stepId') stepId: string,
        @Param('actionId') actionId: string,
        @Body() actionRequest: StepActionRequest
    ): Promise<StepActionResponse> {
        const result = await this.scenarioService.updateScenarioStepAction(presentationFlowId, stepId, actionId, StepActionRequestToJSONTyped(actionRequest))
        return StepActionResponseFromJSONTyped({ action: result }, false);
    }

    @OnUndefined(204)
    @Delete('/:presentationFlowId/steps/:stepId/actions/:actionId')
    public async deletePresentationFlowStepAction(
        @Param('presentationFlowId') presentationFlowId: string,
        @Param('stepId') stepId: string,
        @Param('actionId') actionId: string
    ): Promise<void> {
        return this.scenarioService.deleteScenarioStepAction(presentationFlowId, stepId, actionId);
    }
}

export default PresentationFlowController
