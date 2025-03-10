import { Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import {
  ShowcaseResponse,
  ShowcaseResponseFromJSONTyped,
  ShowcaseRequest,
  ShowcaseRequestToJSONTyped,
  ShowcasesResponse,
  ShowcasesResponseFromJSONTyped,
} from 'credential-showcase-openapi'
import ShowcaseService from '../services/ShowcaseService'
import { showcaseDTOFrom } from '../utils/mappers'
import { NotFoundError } from '../errors/NotFoundError'

@JsonController('/showcases')
@Service()
class ShowcaseController {
  constructor(private showcaseService: ShowcaseService) {}

  @Get('/')
  public async getAll(): Promise<ShowcasesResponse> {
    try {
      const result = await this.showcaseService.getShowcases()
      const showcases = result.map((showcase) => showcaseDTOFrom(showcase))
      return ShowcasesResponseFromJSONTyped({ showcases }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get all showcases failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<ShowcaseResponse> {
    try {
      const result = await this.showcaseService.getShowcase(id)
      return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Get showcase id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @HttpCode(201)
  @Post('/')
  public async post(@Body() showcaseRequest: ShowcaseRequest): Promise<ShowcaseResponse> {
    try {
      const result = await this.showcaseService.createShowcase(ShowcaseRequestToJSONTyped(showcaseRequest))
      return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Create showcase failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @Put('/:id')
  public async put(@Param('id') id: string, @Body() showcaseRequest: ShowcaseRequest): Promise<ShowcaseResponse> {
    try {
      const result = await this.showcaseService.updateShowcase(id, ShowcaseRequestToJSONTyped(showcaseRequest))
      return ShowcaseResponseFromJSONTyped({ showcase: showcaseDTOFrom(result) }, false)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Update showcase id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }

  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    try {
      return this.showcaseService.deleteShowcase(id)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        console.error(`Delete showcase id=${id} failed:`, e)
      }
      return Promise.reject(e)
    }
  }
}

export default ShowcaseController
