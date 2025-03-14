import { Service } from 'typedi'
import ShowcaseRepository from '../database/repositories/ShowcaseRepository'
import { Showcase, NewShowcase } from '../types'
import { ShowcaseExpand } from 'credential-showcase-openapi'

@Service()
class ShowcaseService {
  constructor(private readonly showcaseRepository: ShowcaseRepository) {}

  public getShowcases = async (expand?: ShowcaseExpand[]): Promise<Showcase[]> => {
    return this.showcaseRepository.findAll(expand)
  }

  public getShowcase = async (id: string, expand?: ShowcaseExpand[]): Promise<Showcase> => {
    return this.showcaseRepository.findById(id, expand)
  }

  public createShowcase = async (showcase: NewShowcase): Promise<Showcase> => {
    return this.showcaseRepository.create(showcase)
  }

  public updateShowcase = async (id: string, showcase: NewShowcase): Promise<Showcase> => {
    return this.showcaseRepository.update(id, showcase)
  }

  public deleteShowcase = async (id: string): Promise<void> => {
    return this.showcaseRepository.delete(id)
  }

  public getIdBySlug = async (slug: string): Promise<string> => {
    return this.showcaseRepository.findIdBySlug(slug)
  }
}

export default ShowcaseService
