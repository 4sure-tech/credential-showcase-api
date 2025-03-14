import {
  CreateShowcaseParams,
  DeleteShowcaseParams,
  GetIdBySlugParams,
  GetShowcaseParams,
  GetShowcasesParams,
  Showcase,
  UpdateShowcaseParams,
} from '../types'
import { Service } from 'typedi'
import ShowcaseRepository from '../database/repositories/ShowcaseRepository'

@Service()
export class ShowcaseService {
  constructor(private readonly showcaseRepository: ShowcaseRepository) {}

  public getShowcases = async (params: GetShowcasesParams = {}): Promise<Showcase[]> => {
    return this.showcaseRepository.findAll(params.expand)
  }

  public getShowcase = async (params: GetShowcaseParams): Promise<Showcase> => {
    return this.showcaseRepository.findById(params.id, params.expand)
  }

  public createShowcase = async (params: CreateShowcaseParams): Promise<Showcase> => {
    return this.showcaseRepository.create(params.showcase)
  }

  public updateShowcase = async (params: UpdateShowcaseParams): Promise<Showcase> => {
    return this.showcaseRepository.update(params.id, params.showcase)
  }

  public deleteShowcase = async (params: DeleteShowcaseParams): Promise<void> => {
    return this.showcaseRepository.delete(params.id)
  }

  public getIdBySlug = async (params: GetIdBySlugParams): Promise<string> => {
    return this.showcaseRepository.findIdBySlug(params.slug)
  }
}
