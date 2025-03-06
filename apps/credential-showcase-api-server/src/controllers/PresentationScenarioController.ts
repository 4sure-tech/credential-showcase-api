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
    StepActionRequestToJSONTyped
} from 'credential-showcase-openapi';
import { presentationScenarioDTOFrom, stepDTOFrom } from '../utils/mappers';
import { ScenarioType } from '../types';

@JsonController('/scenarios/presentations')
@Service()
class PresentationScenarioController {
    constructor(private scenarioService: ScenarioService) { }

    @Get('/')
    public async getAllPresentationScenarios(): Promise<PresentationScenariosResponse> {
        const result = await this.scenarioService.getScenarios({ filter: { scenarioType: ScenarioType.ISSUANCE } });
        const presentationScenarios = result.map(presentationScenario => presentationScenarioDTOFrom(presentationScenario));
        return PresentationScenariosResponseFromJSONTyped({ presentationScenarios }, false);
    }

    @Get('/:presentationScenarioId')
    public async getOnePresentationScenario(
        @Param('presentationScenarioId') presentationScenarioId: string
    ): Promise<PresentationScenarioResponse> {
        const result = await this.scenarioService.getScenario(presentationScenarioId);
        return PresentationScenarioResponseFromJSONTyped({ presentationScenario: presentationScenarioDTOFrom(result) }, false);
    }

    @HttpCode(201)
    @Post('/')
    public async postPresentationScenario(
        @Body() presentationScenarioRequest: PresentationScenarioRequest
    ): Promise<PresentationScenarioResponse> {
        const result = await this.scenarioService.createScenario(PresentationScenarioRequestToJSONTyped(presentationScenarioRequest));
        return PresentationScenarioResponseFromJSONTyped({ presentationScenario: presentationScenarioDTOFrom(result) }, false);
    }

    @Put('/:presentationScenarioId')
    public async putPresentationScenario(
        @Param('presentationScenarioId') presentationScenarioId: string,
        @Body() presentationScenarioRequest: PresentationScenarioRequest
    ): Promise<PresentationScenarioResponse> {
        const result = await this.scenarioService.updateScenario(presentationScenarioId, PresentationScenarioRequestToJSONTyped(presentationScenarioRequest));
        return PresentationScenarioResponseFromJSONTyped({ presentationScenario: presentationScenarioDTOFrom(result) }, false);
    }

    @OnUndefined(204)
    @Delete('/:presentationScenarioId')
    public async deletePresentationScenario(
        @Param('presentationScenarioId') presentationScenarioId: string
    ): Promise<void> {
        return await this.scenarioService.deleteScenario(presentationScenarioId);
    }

    @Get('/:presentationScenarioId/steps')
    public async getAllSteps(
        @Param('presentationScenarioId') presentationScenarioId: string
    ): Promise<StepsResponse> {
        const result = await this.scenarioService.getScenarioSteps(presentationScenarioId)
        const steps = result.map(step => stepDTOFrom(step));
        return StepsResponseFromJSONTyped({ steps }, false);
    }

    @Get('/:presentationScenarioId/steps/:stepId')
    public async getOnePresentationScenarioStep(
        @Param('presentationScenarioId') presentationScenarioId: string,
        @Param('stepId') stepId: string
    ): Promise<StepResponse> {
        const result = await this.scenarioService.getScenarioStep(presentationScenarioId, stepId);
        return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false);
    }

    @HttpCode(201)
    @Post('/:presentationScenarioId/steps')
    public async postPresentationScenarioStep(
        @Param('presentationScenarioId') presentationScenarioId: string,
        @Body() stepRequest: StepRequest
    ): Promise<StepResponse> {
        const result = await this.scenarioService.createScenarioStep(presentationScenarioId, StepRequestToJSONTyped(stepRequest));
        return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false);
    }

    @Put('/:presentationScenarioId/steps/:stepId')
    public async putPresentationScenarioStep(
        @Param('presentationScenarioId') presentationScenarioId: string,
        @Param('stepId') stepId: string,
        @Body() stepRequest: StepRequest
    ): Promise<StepResponse> {
        const result = await this.scenarioService.updateScenarioStep(presentationScenarioId, stepId, StepRequestToJSONTyped(stepRequest))
        return StepResponseFromJSONTyped({ step: stepDTOFrom(result) }, false);
    }

    @OnUndefined(204)
    @Delete('/:presentationScenarioId/steps/:stepId')
    public async deletePresentationScenarioStep(
        @Param('presentationScenarioId') presentationScenarioId: string,
        @Param('stepId') stepId: string
    ): Promise<void> {
        return this.scenarioService.deleteScenarioStep(presentationScenarioId, stepId);
    }

    @Get('/:presentationScenarioId/steps/:stepId/actions')
    public async getAllPresentationScenarioStepActions(
        @Param('presentationScenarioId') presentationScenarioId: string,
        @Param('stepId') stepId: string
    ): Promise<StepActionsResponse> {
        const result = await this.scenarioService.getScenarioStepActions(presentationScenarioId, stepId)
        const actions = result.map(action => action);
        return StepActionsResponseFromJSONTyped({ actions }, false);
    }

    @Get('/:presentationScenarioId/steps/:stepId/actions/:actionId')
    public async getOnePresentationScenarioStepAction(
        @Param('presentationScenarioId') presentationScenarioId: string,
        @Param('stepId') stepId: string,
        @Param('actionId') actionId: string
    ): Promise<StepActionResponse> {
        const result = await this.scenarioService.getScenarioStepAction(presentationScenarioId, stepId, actionId);
        return StepActionResponseFromJSONTyped({ action: result }, false);
    }

    @HttpCode(201)
    @Post('/:presentationScenarioId/steps/:stepId/actions')
    public async postPresentationScenarioStepAction(
        @Param('presentationScenarioId') presentationScenarioId: string,
        @Param('stepId') stepId: string,
        @Body() actionRequest: StepActionRequest
    ): Promise<StepActionResponse> {
        const result = await this.scenarioService.createScenarioStepAction(presentationScenarioId, stepId, StepActionRequestToJSONTyped(actionRequest));
        return StepActionResponseFromJSONTyped({ action: result }, false);
    }

    @Put('/:presentationScenarioId/steps/:stepId/actions/:actionId')
    public async putPresentationScenarioStepAction(
        @Param('presentationScenarioId') presentationScenarioId: string,
        @Param('stepId') stepId: string,
        @Param('actionId') actionId: string,
        @Body() actionRequest: StepActionRequest
    ): Promise<StepActionResponse> {
        const result = await this.scenarioService.updateScenarioStepAction(presentationScenarioId, stepId, actionId, StepActionRequestToJSONTyped(actionRequest))
        return StepActionResponseFromJSONTyped({ action: result }, false);
    }

    @OnUndefined(204)
    @Delete('/:presentationScenarioId/steps/:stepId/actions/:actionId')
    public async deletePresentationScenarioStepAction(
        @Param('presentationScenarioId') presentationScenarioId: string,
        @Param('stepId') stepId: string,
        @Param('actionId') actionId: string
    ): Promise<void> {
        return this.scenarioService.deleteScenarioStepAction(presentationScenarioId, stepId, actionId);
    }
}

export default PresentationScenarioController
