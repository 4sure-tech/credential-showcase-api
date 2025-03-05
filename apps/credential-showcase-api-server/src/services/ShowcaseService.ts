import { Service } from 'typedi';
import ShowcaseRepository from '../database/repositories/ShowcaseRepository';
import { Showcase, NewShowcase } from '../types';

@Service()
class ShowcaseService {
    constructor(private readonly showcaseRepository: ShowcaseRepository) {}

    public getShowcases = async (): Promise<Showcase[]> => {
        return this.showcaseRepository.findAll()
    };

    public getShowcase = async (id: string): Promise<Showcase> => {
        return this.showcaseRepository.findById(id)
    };

    public createShowcase = async (showcase: NewShowcase): Promise<Showcase> => {
        return this.showcaseRepository.create(showcase)
    };

    public updateShowcase = async (id: string, showcase: NewShowcase): Promise<Showcase> => {
        return this.showcaseRepository.update(id, showcase)
    };

    public deleteShowcase = async (id: string): Promise<void> => {
        return this.showcaseRepository.delete(id)
    };
}

export default ShowcaseService
