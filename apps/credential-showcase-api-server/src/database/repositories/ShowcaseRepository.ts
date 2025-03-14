import { eq, inArray } from 'drizzle-orm'
import { Service } from 'typedi'
import { BadRequestError } from 'routing-controllers'
import DatabaseService from '../../services/DatabaseService'
import CredentialDefinitionRepository from './CredentialDefinitionRepository'
import PersonaRepository from './PersonaRepository'
import ScenarioRepository from './ScenarioRepository'
import AssetRepository from './AssetRepository'
import { sortSteps } from '../../utils/sort'
import { generateSlug } from '../../utils/slug'
import { NotFoundError } from '../../errors'
import {
  credentialDefinitions,
  personas,
  scenarios,
  showcases,
  showcasesToCredentialDefinitions,
  showcasesToPersonas,
  showcasesToScenarios,
} from '../schema'
import {
  CredentialDefinition,
  CredentialSchema,
  IssuanceScenario,
  Issuer,
  NewShowcase,
  Persona,
  PresentationScenario,
  RelyingParty,
  RepositoryDefinition,
  Scenario,
  Showcase,
  ShowcaseExpand,
  Step,
} from '../../types'

type ShowcaseRow = typeof showcases.$inferSelect

@Service()
class ShowcaseRepository implements RepositoryDefinition<Showcase, NewShowcase> {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly personaRepository: PersonaRepository,
    private readonly credentialDefinitionRepository: CredentialDefinitionRepository,
    private readonly scenarioRepository: ScenarioRepository,
    private readonly assetRepository: AssetRepository,
  ) {}

  // TODO should we return the asset objects, or just the IDs?
  async create(showcase: NewShowcase): Promise<Showcase> {
    if (showcase.personas.length === 0) {
      return Promise.reject(new BadRequestError('At least one persona is required'))
    }
    if (showcase.credentialDefinitions.length === 0) {
      return Promise.reject(new BadRequestError('At least one credential definition is required'))
    }
    if (showcase.scenarios.length === 0) {
      return Promise.reject(new BadRequestError('At least one scenario is required'))
    }
    const bannerImageResult = showcase.bannerImage ? await this.assetRepository.findById(showcase.bannerImage) : null
    const personaPromises = showcase.personas.map(async (persona) => await this.personaRepository.findById(persona))
    await Promise.all(personaPromises)
    const credentialDefinitionPromises = showcase.credentialDefinitions.map(
      async (credentialDefinition) => await this.credentialDefinitionRepository.findById(credentialDefinition),
    )
    await Promise.all(credentialDefinitionPromises)
    const scenarioPromises = showcase.scenarios.map(async (scenario) => this.scenarioRepository.findById(scenario))
    await Promise.all(scenarioPromises)

    const connection = await this.databaseService.getConnection()
    const slug = await generateSlug({
      value: showcase.name,
      connection,
      schema: showcases,
    })

    return connection.transaction(async (tx): Promise<Showcase> => {
      const [showcaseResult] = await tx
        .insert(showcases)
        .values({
          ...showcase,
          slug,
        })
        .returning()

      const showcasesToScenariosResult = await tx
        .insert(showcasesToScenarios)
        .values(
          showcase.scenarios.map((scenarioId: string) => ({
            showcase: showcaseResult.id,
            scenario: scenarioId,
          })),
        )
        .returning()

      const scenariosResult = await tx.query.scenarios.findMany({
        where: inArray(
          scenarios.id,
          showcasesToScenariosResult.map((item) => item.scenario),
        ),
        with: {
          steps: {
            with: {
              actions: {
                with: {
                  proofRequest: true,
                },
              },
              asset: true,
            },
          },
          relyingParty: {
            with: {
              cds: {
                with: {
                  cd: {
                    with: {
                      icon: true,
                      cs: {
                        with: {
                          attributes: true,
                        },
                      },
                      representations: true,
                      revocation: true,
                    },
                  },
                },
              },
              logo: true,
            },
          },
          issuer: {
            with: {
              cds: {
                with: {
                  cd: {
                    with: {
                      icon: true,
                      cs: {
                        with: {
                          attributes: true,
                        },
                      },
                      representations: true,
                      revocation: true,
                    },
                  },
                },
              },
              css: {
                with: {
                  cs: {
                    with: {
                      attributes: true,
                    },
                  },
                },
              },
              logo: true,
            },
          },
          personas: {
            with: {
              persona: {
                with: {
                  headshotImage: true,
                  bodyImage: true,
                },
              },
            },
          },
          bannerImage: true,
        },
      })

      const showcasesToCredentialDefinitionsResult = await tx
        .insert(showcasesToCredentialDefinitions)
        .values(
          showcase.credentialDefinitions.map((credentialDefinitionId: string) => ({
            showcase: showcaseResult.id,
            credentialDefinition: credentialDefinitionId,
          })),
        )
        .returning()

      const credentialDefinitionsResult = await tx.query.credentialDefinitions.findMany({
        where: inArray(
          credentialDefinitions.id,
          showcasesToCredentialDefinitionsResult.map((item) => item.credentialDefinition),
        ),
        with: {
          cs: {
            with: {
              attributes: true,
            },
          },
          representations: true,
          revocation: true,
          icon: true,
        },
      })

      const showcasesToPersonasResult = await tx
        .insert(showcasesToPersonas)
        .values(
          showcase.personas.map((personaId: string) => ({
            showcase: showcaseResult.id,
            persona: personaId,
          })),
        )
        .returning()

      const personasResult = await tx.query.personas.findMany({
        where: inArray(
          personas.id,
          showcasesToPersonasResult.map((item) => item.persona),
        ),
        with: {
          headshotImage: true,
          bodyImage: true,
        },
      })

      return {
        ...showcaseResult,
        scenarios: scenariosResult.map((scenario) => ({
          ...scenario,
          steps: sortSteps(scenario.steps),
          ...(scenario.relyingParty && {
            relyingParty: {
              ...(scenario.relyingParty as object),
              credentialDefinitions: scenario.relyingParty!.cds.map((credentialDefinition) => credentialDefinition.cd),
            },
          }),
          ...(scenario.issuer && {
            issuer: {
              ...(scenario.issuer as any),
              credentialDefinitions: scenario.issuer!.cds.map((credentialDefinition) => credentialDefinition.cd),
              credentialSchemas: scenario.issuer!.css.map((credentialSchema) => credentialSchema.cs),
            },
          }),
          personas: scenario.personas.map((item) => item.persona),
        })),
        credentialDefinitions: credentialDefinitionsResult.map((item: any) => ({
          ...item,
          credentialSchema: item.cs,
        })),
        personas: personasResult,
        bannerImage: bannerImageResult,
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(showcases).where(eq(showcases.id, id))
  }

  // TODO should we return the asset objects, or just the IDs?
  async update(id: string, showcase: NewShowcase): Promise<Showcase> {
    await this.findById(id)
    if (showcase.personas.length === 0) {
      return Promise.reject(new BadRequestError('At least one persona is required'))
    }
    if (showcase.credentialDefinitions.length === 0) {
      return Promise.reject(new BadRequestError('At least one credential definition is required'))
    }
    if (showcase.scenarios.length === 0) {
      return Promise.reject(new BadRequestError('At least one scenario is required'))
    }

    const bannerImageResult = showcase.bannerImage ? await this.assetRepository.findById(showcase.bannerImage) : null

    const personaPromises = showcase.personas.map(async (persona) => await this.personaRepository.findById(persona))
    await Promise.all(personaPromises)
    const credentialDefinitionPromises = showcase.credentialDefinitions.map(
      async (credentialDefinition) => await this.credentialDefinitionRepository.findById(credentialDefinition),
    )
    await Promise.all(credentialDefinitionPromises)
    const scenarioPromises = showcase.scenarios.map(async (scenario) => this.scenarioRepository.findById(scenario))
    await Promise.all(scenarioPromises)

    const connection = await this.databaseService.getConnection()
    const slug = await generateSlug({
      value: showcase.name,
      id,
      connection,
      schema: showcases,
    })

    return connection.transaction(async (tx): Promise<Showcase> => {
      const [showcaseResult] = await tx
        .update(showcases)
        .set({
          ...showcase,
          slug,
        })
        .where(eq(showcases.id, id))
        .returning()

      await tx.delete(showcasesToCredentialDefinitions).where(eq(showcasesToCredentialDefinitions.showcase, id))
      await tx.delete(showcasesToPersonas).where(eq(showcasesToPersonas.showcase, id))
      await tx.delete(showcasesToScenarios).where(eq(showcasesToScenarios.showcase, id))

      const showcasesToScenariosResult = await tx
        .insert(showcasesToScenarios)
        .values(
          showcase.scenarios.map((scenarioId: string) => ({
            showcase: showcaseResult.id,
            scenario: scenarioId,
          })),
        )
        .returning()

      const scenariosResult = await tx.query.scenarios.findMany({
        where: inArray(
          scenarios.id,
          showcasesToScenariosResult.map((item) => item.scenario),
        ),
        with: {
          steps: {
            with: {
              actions: {
                with: {
                  proofRequest: true,
                },
              },
              asset: true,
            },
          },
          relyingParty: {
            with: {
              cds: {
                with: {
                  cd: {
                    with: {
                      icon: true,
                      cs: {
                        with: {
                          attributes: true,
                        },
                      },
                      representations: true,
                      revocation: true,
                    },
                  },
                },
              },
              logo: true,
            },
          },
          issuer: {
            with: {
              cds: {
                with: {
                  cd: {
                    with: {
                      icon: true,
                      cs: {
                        with: {
                          attributes: true,
                        },
                      },
                      representations: true,
                      revocation: true,
                    },
                  },
                },
              },
              css: {
                with: {
                  cs: {
                    with: {
                      attributes: true,
                    },
                  },
                },
              },
              logo: true,
            },
          },
          personas: {
            with: {
              persona: {
                with: {
                  headshotImage: true,
                  bodyImage: true,
                },
              },
            },
          },
          bannerImage: true,
        },
      })

      const showcasesToCredentialDefinitionsResult = await tx
        .insert(showcasesToCredentialDefinitions)
        .values(
          showcase.credentialDefinitions.map((credentialDefinitionId: string) => ({
            showcase: showcaseResult.id,
            credentialDefinition: credentialDefinitionId,
          })),
        )
        .returning()

      const credentialDefinitionsResult = await tx.query.credentialDefinitions.findMany({
        where: inArray(
          credentialDefinitions.id,
          showcasesToCredentialDefinitionsResult.map((item) => item.credentialDefinition),
        ),
        with: {
          cs: {
            with: {
              attributes: true,
            },
          },
          representations: true,
          revocation: true,
          icon: true,
        },
      })

      const showcasesToPersonasResult = await tx
        .insert(showcasesToPersonas)
        .values(
          showcase.personas.map((personaId: string) => ({
            showcase: showcaseResult.id,
            persona: personaId,
          })),
        )
        .returning()

      const personasResult = await tx.query.personas.findMany({
        where: inArray(
          personas.id,
          showcasesToPersonasResult.map((item) => item.persona),
        ),
        with: {
          headshotImage: true,
          bodyImage: true,
        },
      })

      return {
        ...showcaseResult,
        scenarios: scenariosResult.map((scenario) => ({
          ...scenario,
          steps: sortSteps(scenario.steps),
          ...(scenario.relyingParty && {
            relyingParty: {
              ...(scenario.relyingParty as object),
              credentialDefinitions: scenario.relyingParty!.cds.map((credentialDefinition) => credentialDefinition.cd),
            },
          }),
          ...(scenario.issuer && {
            issuer: {
              ...(scenario.issuer as any),
              credentialDefinitions: scenario.issuer!.cds.map((credentialDefinition) => credentialDefinition.cd),
              credentialSchemas: scenario.issuer!.css.map((credentialSchema) => credentialSchema.cs),
            },
          }),
          personas: scenario.personas.map((item) => item.persona),
        })),
        credentialDefinitions: credentialDefinitionsResult.map((item: any) => ({
          ...item,
          credentialSchema: item.cs,
        })),
        personas: personasResult,
        bannerImage: bannerImageResult,
      }
    })
  }

  async findById(id: string, expand?: ShowcaseExpand[]): Promise<Showcase> {
    const expandSet = new Set(expand || [])
    let queryConfig = this.buildQueryConfigForId(id, expandSet)

    const connection = await this.databaseService.getConnection()
    const result = await connection.query.showcases.findFirst(queryConfig)

    if (!result) {
      return Promise.reject(new NotFoundError(`No showcase found for id: ${id}`))
    }

    // Create a typed showcase result
    const showcase: Showcase = {
      ...result,
      scenarios: [],
      credentialDefinitions: [],
      personas: [],
    }

    this.populateScenarios(result, expandSet, showcase)
    this.populateCredentialDefs(result, expandSet, showcase)
    this.populatePersonas(result, expandSet, showcase)

    return showcase
  }

  private populatePersonas(result: ShowcaseRow, expandSet: Set<ShowcaseExpand>, showcase: Showcase) {
    if ('personas' in result && Array.isArray(result.personas)) {
      if (expandSet.has(ShowcaseExpand.PERSONAS)) {
        showcase.personas = result.personas.filter((personaJoin) => personaJoin.persona).map((personaJoin) => personaJoin.persona as Persona)
      } else {
        showcase.personas = result.personas.map((showcasesToPersona) => showcasesToPersona.persona)
      }
    }
  }

  private populateCredentialDefs(result: ShowcaseRow, expandSet: Set<ShowcaseExpand>, showcase: Showcase) {
    if ('credentialDefinitions' in result && Array.isArray(result.credentialDefinitions)) {
      if (expandSet.has(ShowcaseExpand.CREDENTIAL_DEFINITIONS)) {
        const credentialDefinitionsArray: CredentialDefinition[] = []

        for (const cdJoin of result.credentialDefinitions) {
          if (!cdJoin.credentialDefinition) continue

          const cdObj = cdJoin.credentialDefinition

          credentialDefinitionsArray.push({
            ...cdObj,
            credentialSchema: cdObj.cs,
          } as CredentialDefinition)
        }

        showcase.credentialDefinitions = credentialDefinitionsArray
      } else {
        showcase.credentialDefinitions = result.credentialDefinitions.map(
          (showcaseToCredentialDefinition) => showcaseToCredentialDefinition.credentialDefinition,
        )
      }
    }
  }

  private populateScenarios(result: ShowcaseRow, expandSet: Set<ShowcaseExpand>, showcase: Showcase) {
    if ('scenarios' in result && Array.isArray(result.scenarios)) {
      if (expandSet.has(ShowcaseExpand.SCENARIOS)) {
        showcase.scenarios = result.scenarios
          .filter((scenarioJoin) => scenarioJoin.scenario)
          .map((scenarioJoin) => {
            const scenarioObj = scenarioJoin.scenario

            // Process steps if they exist
            const processedSteps = scenarioObj.steps ? (sortSteps(scenarioObj.steps) as Step[]) : []

            // Process relying party if it exists
            const processedRelyingParty = scenarioObj.relyingParty
              ? ({
                  ...scenarioObj.relyingParty,
                  credentialDefinitions: scenarioObj.relyingParty.cds.map((cd: { cd: CredentialDefinition }) => cd.cd),
                } as RelyingParty)
              : undefined

            // Process issuer if it exists
            const processedIssuer = scenarioObj.issuer
              ? ({
                  ...scenarioObj.issuer,
                  credentialDefinitions: scenarioObj.issuer.cds.map((cd: { cd: CredentialDefinition }) => cd.cd),
                  credentialSchemas: scenarioObj.issuer.css.map((cs: { cs: CredentialSchema }) => cs.cs),
                } as Issuer)
              : undefined

            // Process personas if they exist
            const processedPersonas = scenarioObj.personas ? scenarioObj.personas.map((p: { persona: Persona }) => p.persona) : []

            // Create the final scenario object with proper typing
            const finalScenario: Scenario = {
              ...scenarioObj,
              steps: processedSteps,
              personas: processedPersonas,
            }

            // Add relying party and issuer conditionally
            if (processedRelyingParty && 'relyingParty' in finalScenario) {
              finalScenario.relyingParty = processedRelyingParty
            }

            if (processedIssuer && 'issuer' in finalScenario) {
              finalScenario.issuer = processedIssuer
            }

            return finalScenario
          })
      } else {
        showcase.scenarios = result.scenarios.map((showcasesToScenario) => showcasesToScenario.scenario)
      }
    }
  }

  private buildQueryConfigForId(id: string, expandSet: Set<'SCENARIOS' | 'CREDENTIAL_DEFINITIONS' | 'PERSONAS' | 'ASSET_CONTENT'>) {
    // Define our query structure based on what should be included
    let queryConfig: any = {
      where: eq(showcases.id, id),
      with: {},
    }

    if (expandSet.has(ShowcaseExpand.ASSET_CONTENT)) {
      queryConfig.with.bannerImage = true
    }

    // Add credentialDefinitions if needed
    if (expandSet.has(ShowcaseExpand.CREDENTIAL_DEFINITIONS)) {
      queryConfig.with.credentialDefinitions = {
        with: {
          credentialDefinition: {
            with: {
              ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) && { icon: true }),
              cs: {
                with: {
                  attributes: true,
                },
              },
              representations: true,
              revocation: true,
            },
          },
        },
      }
    } else {
      // Include only the credentialDefinitions join table without expanding the credentialDefinition entity
      queryConfig.with.credentialDefinitions = {
        columns: {
          credentialDefinition: true,
        },
      }
    }

    // Add scenarios if needed
    if (expandSet.has(ShowcaseExpand.SCENARIOS)) {
      queryConfig.with.scenarios = {
        with: {
          scenario: {
            with: {
              steps: {
                with: {
                  actions: {
                    with: {
                      proofRequest: true,
                    },
                  },
                  ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) ? { asset: true } : {}),
                },
              },
              issuer: {
                with: {
                  cds: {
                    with: {
                      cd: {
                        with: {
                          ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) && { icon: true }),
                          cs: {
                            with: {
                              attributes: true,
                            },
                          },
                          representations: true,
                          revocation: true,
                        },
                      },
                    },
                  },
                  css: {
                    with: {
                      cs: {
                        with: {
                          attributes: true,
                        },
                      },
                    },
                  },
                  ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) ? { logo: true } : {}),
                },
              },
              relyingParty: {
                with: {
                  cds: {
                    with: {
                      cd: {
                        with: {
                          ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) && { icon: true }),
                          cs: {
                            with: {
                              attributes: true,
                            },
                          },
                          representations: true,
                          revocation: true,
                        },
                      },
                    },
                  },
                  ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) ? { logo: true } : {}),
                },
              },
              personas: {
                with: {
                  persona: {
                    with: {
                      ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT)
                        ? {
                            headshotImage: true,
                            bodyImage: true,
                          }
                        : {}),
                    },
                  },
                },
              },
            },
          },
        },
      }
    } else {
      // Include only the scenarios join table without expanding the scenario entity
      queryConfig.with.scenarios = {
        columns: {
          scenario: true,
        },
      }
    }

    // Add personas if needed
    if (expandSet.has(ShowcaseExpand.PERSONAS)) {
      queryConfig.with.personas = {
        with: {
          persona: {
            with: {
              ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT)
                ? {
                    headshotImage: true,
                    bodyImage: true,
                  }
                : {}),
            },
          },
        },
      }
    } else {
      // Include only the personas join table without expanding the persona entity
      queryConfig.with.personas = {
        columns: {
          persona: true,
        },
      }
    }
    return queryConfig
  }

  async findAll(expand?: ShowcaseExpand[]): Promise<Showcase[]> {
    const expandSet = new Set(expand || [])

    // Define our query structure based on what should be included
    let queryConfig: any = {
      with: {},
    }

    if (expandSet.has(ShowcaseExpand.ASSET_CONTENT)) {
      queryConfig.with.bannerImage = true
    }

    const connection = await this.databaseService.getConnection()
    const showcasesResult = await connection.query.showcases.findMany(queryConfig)

    if (showcasesResult.length === 0) {
      return []
    }

    const showcaseIds = showcasesResult.map((s) => s.id)

    // Initialize arrays for collecting expanded data
    let credDefData: any[] = []
    let scenariosData: any[] = []
    let personasData: any[] = []

    // Fetch credential definitions if needed
    if (expandSet.has(ShowcaseExpand.CREDENTIAL_DEFINITIONS)) {
      credDefData = await connection.query.showcasesToCredentialDefinitions.findMany({
        where: inArray(showcasesToCredentialDefinitions.showcase, showcaseIds),
        with: {
          credentialDefinition: {
            with: {
              ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) && { icon: true }),
              cs: {
                with: {
                  attributes: true,
                },
              },
              representations: true,
              revocation: true,
            },
          },
        },
      })
    }

    // Fetch scenarios if needed
    if (expandSet.has(ShowcaseExpand.SCENARIOS)) {
      scenariosData = await connection.query.showcasesToScenarios.findMany({
        where: inArray(showcasesToScenarios.showcase, showcaseIds),
        with: {
          scenario: {
            with: {
              steps: {
                with: {
                  actions: {
                    with: {
                      proofRequest: true,
                    },
                  },
                  ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) ? { asset: true } : {}),
                },
              },
              issuer: {
                with: {
                  cds: {
                    with: {
                      cd: {
                        with: {
                          ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) && { icon: true }),
                          cs: {
                            with: {
                              attributes: true,
                            },
                          },
                          representations: true,
                          revocation: true,
                        },
                      },
                    },
                  },
                  css: {
                    with: {
                      cs: {
                        with: {
                          attributes: true,
                        },
                      },
                    },
                  },
                  ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) ? { logo: true } : {}),
                },
              },
              relyingParty: {
                with: {
                  cds: {
                    with: {
                      cd: {
                        with: {
                          ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) && { icon: true }),
                          cs: {
                            with: {
                              attributes: true,
                            },
                          },
                          representations: true,
                          revocation: true,
                        },
                      },
                    },
                  },
                  ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) ? { logo: true } : {}),
                },
              },
              personas: {
                with: {
                  persona: {
                    with: {
                      ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT)
                        ? {
                            headshotImage: true,
                            bodyImage: true,
                          }
                        : {}),
                    },
                  },
                },
              },
            },
          },
        },
      })
    }

    // Fetch personas if needed
    if (expandSet.has(ShowcaseExpand.PERSONAS)) {
      personasData = await connection.query.showcasesToPersonas.findMany({
        where: inArray(showcasesToPersonas.showcase, showcaseIds),
        with: {
          persona: {
            with: {
              ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT)
                ? {
                    headshotImage: true,
                    bodyImage: true,
                  }
                : {}),
            },
          },
        },
      })
    }

    // Group data by showcase ID
    const credDefMap = new Map<string, any[]>()
    const scenariosMap = new Map<string, any[]>()
    const personasMap = new Map<string, any[]>()

    for (const item of credDefData) {
      const key = item.showcase
      if (!credDefMap.has(key)) {
        credDefMap.set(key, [])
      }
      credDefMap.get(key)!.push(item)
    }

    for (const item of scenariosData) {
      const key = item.showcase
      if (!scenariosMap.has(key)) {
        scenariosMap.set(key, [])
      }
      scenariosMap.get(key)!.push(item)
    }

    for (const item of personasData) {
      const key = item.showcase
      if (!personasMap.has(key)) {
        personasMap.set(key, [])
      }
      personasMap.get(key)!.push(item)
    }

    // Process each showcase with its expanded entities
    return showcasesResult.map((showcaseData): Showcase => {
      const showcase: Showcase = {
        ...showcaseData,
        scenarios: [],
        credentialDefinitions: [],
        personas: [],
      }

      // Process scenarios if they should be expanded
      if (expandSet.has(ShowcaseExpand.SCENARIOS)) {
        const scenarioItems = scenariosMap.get(showcaseData.id) || []
        showcase.scenarios = scenarioItems
          .filter((scenarioJoin) => scenarioJoin.scenario)
          .map((scenarioJoin) => {
            const scenarioObj = scenarioJoin.scenario

            // Create the final scenario object
            const finalScenario: Scenario = {
              ...scenarioObj,
              steps: scenarioObj.steps ? (sortSteps(scenarioObj.steps) as Step[]) : [],
              personas: scenarioObj.personas ? scenarioObj.personas.map((p: { persona: Persona }) => p.persona) : [],
            }

            // Process relying party if it exists
            if ('relyingParty' in scenarioObj && scenarioObj.relyingParty) {
              ;(finalScenario as PresentationScenario).relyingParty = {
                ...scenarioObj.relyingParty,
                credentialDefinitions: scenarioObj.relyingParty.cds.map((cd: { cd: CredentialDefinition }) => cd.cd),
              } as RelyingParty
            }

            // Process issuer if it exists
            if ('issuer' in scenarioObj && scenarioObj.issuer) {
              ;(finalScenario as IssuanceScenario).issuer = {
                ...scenarioObj.issuer,
                credentialDefinitions: scenarioObj.issuer.cds.map((cd: { cd: CredentialDefinition }) => cd.cd),
                credentialSchemas: scenarioObj.issuer.css.map((cs: { cs: CredentialSchema }) => cs.cs),
              } as Issuer
            }

            return finalScenario
          })
      }

      // Process credential definitions if they should be expanded
      if (expandSet.has(ShowcaseExpand.CREDENTIAL_DEFINITIONS)) {
        const cdItems = credDefMap.get(showcaseData.id) || []
        showcase.credentialDefinitions = cdItems
          .filter((cdJoin) => cdJoin.credentialDefinition)
          .map(
            (cdJoin) =>
              ({
                ...cdJoin.credentialDefinition,
                credentialSchema: cdJoin.credentialDefinition.cs,
              }) as CredentialDefinition,
          )
      }

      // Process personas if they should be expanded
      if (expandSet.has(ShowcaseExpand.PERSONAS)) {
        const personaItems = personasMap.get(showcaseData.id) || []
        showcase.personas = personaItems.filter((personaJoin) => personaJoin.persona).map((personaJoin) => personaJoin.persona as Persona)
      }

      return showcase
    })
  }

  async findIdBySlug(slug: string): Promise<string> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.showcases.findFirst({
      where: eq(showcases.slug, slug),
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No showcase found for slug: ${slug}`))
    }

    return result.id
  }
}

export default ShowcaseRepository
