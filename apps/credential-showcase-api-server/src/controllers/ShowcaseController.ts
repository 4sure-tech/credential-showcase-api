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
import {
    ShowcaseResponse,
    ShowcaseResponseFromJSONTyped,
    ShowcaseRequest,
    ShowcaseRequestToJSONTyped,
    ShowcasesResponse,
    ShowcasesResponseFromJSONTyped
} from 'credential-showcase-openapi';
import ShowcaseService from '../services/ShowcaseService';
import { showcaseDTOFrom } from '../utils/mappers';

@JsonController('/showcases')
@Service()
class ShowcaseController {
    constructor(private showcaseService: ShowcaseService) { }

    @Get('/')
    public async getAll(): Promise<ShowcasesResponse> {
        const result = await this.showcaseService.getShowcases()
        const showcases = result.map(showcase => showcaseDTOFrom(showcase))
        return ShowcasesResponseFromJSONTyped({ showcases }, false)
    }

    @Get('/:id')
    public async getOne(@Param('id') id: string): Promise<ShowcaseResponse> {
        const result = await this.showcaseService.getShowcase(id);
        return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
    }

    @HttpCode(201)
    @Post('/')
    public async post(@Body() showcaseRequest: ShowcaseRequest): Promise<ShowcaseResponse> {
        const result = await this.showcaseService.createShowcase(ShowcaseRequestToJSONTyped(showcaseRequest));
        return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
    }

    @Put('/:id')
    public async put(@Param('id') id: string, @Body() showcaseRequest: ShowcaseRequest): Promise<ShowcaseResponse> {
        const result = await this.showcaseService.updateShowcase(id, ShowcaseRequestToJSONTyped(showcaseRequest))
        return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
    }

    @OnUndefined(204)
    @Delete('/:id')
    public async delete(@Param('id') id: string): Promise<void> {
        return this.showcaseService.deleteShowcase(id);
    }
}

export default ShowcaseController
