import { Service } from 'typedi'
import IssuerRepository from '../database/repositories/IssuerRepository'
import { Issuer, NewIssuer } from '../types'

@Service()
class IssuerService {
  constructor(private readonly issuerRepository: IssuerRepository) {}

  public getIssuers = async (): Promise<Issuer[]> => {
    return this.issuerRepository.findAll()
  }

  public getIssuer = async (id: string): Promise<Issuer> => {
    return this.issuerRepository.findById(id)
  }

  public createIssuer = async (issuer: NewIssuer): Promise<Issuer> => {
    return this.issuerRepository.create(issuer)
  }

  public updateIssuer = async (id: string, issuer: NewIssuer): Promise<Issuer> => {
    return this.issuerRepository.update(id, issuer)
  }

  public deleteIssuer = async (id: string): Promise<void> => {
    return this.issuerRepository.delete(id)
  }
}

export default IssuerService
