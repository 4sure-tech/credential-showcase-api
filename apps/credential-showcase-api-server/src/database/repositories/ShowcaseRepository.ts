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
  Issuer,
  NewShowcase,
  Persona,
  RelyingParty,
  RepositoryDefinition,
  Scenario,
  Showcase,
  ShowcaseExpand,
  Step,
} from '../../types'

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
              ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) ? { icon: true } : {}),
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
                          ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) ? { icon: true } : {}),
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
                          ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) ? { icon: true } : {}),
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
    }

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

    // Process scenarios if they are to be expanded
    if (expandSet.has(ShowcaseExpand.SCENARIOS) && 'scenarios' in result && Array.isArray(result.scenarios)) {
      // Create a properly typed array for scenarios
      const scenariosArray: Scenario[] = []

      for (const scenarioJoin of result.scenarios) {
        if (!scenarioJoin.scenario) continue

        // Create a type-safe copy of the scenario data
        const scenarioObj = scenarioJoin.scenario

        // Process steps if they exist
        let processedSteps: Step[] = []
        if (scenarioObj.steps) {
          processedSteps = sortSteps(scenarioObj.steps) as Step[]
        }

        // Process relying party if it exists
        let processedRelyingParty: RelyingParty | undefined = undefined
        if (scenarioObj.relyingParty) {
          processedRelyingParty = {
            ...scenarioObj.relyingParty,
            credentialDefinitions: scenarioObj.relyingParty.cds.map((cd: { cd: CredentialDefinition }) => cd.cd),
          } as RelyingParty
        }

        // Process issuer if it exists
        let processedIssuer: Issuer | undefined = undefined
        if (scenarioObj.issuer) {
          processedIssuer = {
            ...scenarioObj.issuer,
            credentialDefinitions: scenarioObj.issuer.cds.map((cd: { cd: CredentialDefinition }) => cd.cd),
            credentialSchemas: scenarioObj.issuer.css.map((cs: { cs: CredentialSchema }) => cs.cs),
          } as Issuer
        }

        // Process personas if they exist
        let processedPersonas: Persona[] = []
        if (scenarioObj.personas) {
          processedPersonas = scenarioObj.personas.map((p: { persona: Persona }) => p.persona)
        }

        // Create the final scenario object with explicit typing
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

        scenariosArray.push(finalScenario)
      }

      showcase.scenarios = scenariosArray
    }

    // Process credential definitions if they should be expanded
    if (expandSet.has(ShowcaseExpand.CREDENTIAL_DEFINITIONS) && 'credentialDefinitions' in result && Array.isArray(result.credentialDefinitions)) {
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
    }

    // Process personas if they should be expanded
    if (expandSet.has(ShowcaseExpand.PERSONAS) && 'personas' in result && Array.isArray(result.personas)) {
      const personasArray: Persona[] = []

      for (const personaJoin of result.personas) {
        if (!personaJoin.persona) continue

        personasArray.push(personaJoin.persona as Persona)
      }

      showcase.personas = personasArray
    }

    return showcase
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
              ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) ? { icon: true } : {}),
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
                          ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) ? { icon: true } : {}),
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
                          ...(expandSet.has(ShowcaseExpand.ASSET_CONTENT) ? { icon: true } : {}),
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
        const scenariosArray: Scenario[] = []

        for (const scenarioJoin of scenarioItems) {
          if (!scenarioJoin.scenario) continue

          const scenarioObj = scenarioJoin.scenario

          // Process steps
          let processedSteps: Step[] = []
          if (scenarioObj.steps) {
            processedSteps = sortSteps(scenarioObj.steps) as Step[]
          }

          // Process relying party
          let processedRelyingParty: RelyingParty | undefined = undefined
          if (scenarioObj.relyingParty) {
            processedRelyingParty = {
              ...scenarioObj.relyingParty,
              credentialDefinitions: scenarioObj.relyingParty.cds.map((cd: { cd: CredentialDefinition }) => cd.cd),
            } as RelyingParty
          }

          // Process issuer
          let processedIssuer: Issuer | undefined = undefined
          if (scenarioObj.issuer) {
            processedIssuer = {
              ...scenarioObj.issuer,
              credentialDefinitions: scenarioObj.issuer.cds.map((cd: { cd: CredentialDefinition }) => cd.cd),
              credentialSchemas: scenarioObj.issuer.css.map((cs: { cs: CredentialSchema }) => cs.cs),
            } as Issuer
          }

          // Process personas
          let processedPersonas: Persona[] = []
          if (scenarioObj.personas) {
            processedPersonas = scenarioObj.personas.map((p: { persona: Persona }) => p.persona)
          }

          // Create the final scenario object
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

          scenariosArray.push(finalScenario)
        }

        showcase.scenarios = scenariosArray
      }

      // Process credential definitions if they should be expanded
      if (expandSet.has(ShowcaseExpand.CREDENTIAL_DEFINITIONS)) {
        const cdItems = credDefMap.get(showcaseData.id) || []
        const credentialDefinitionsArray: CredentialDefinition[] = []

        for (const cdJoin of cdItems) {
          if (!cdJoin.credentialDefinition) continue

          const cdObj = cdJoin.credentialDefinition

          credentialDefinitionsArray.push({
            ...cdObj,
            credentialSchema: cdObj.cs,
          } as CredentialDefinition)
        }

        showcase.credentialDefinitions = credentialDefinitionsArray
      }

      // Process personas if they should be expanded
      if (expandSet.has(ShowcaseExpand.PERSONAS)) {
        const personaItems = personasMap.get(showcaseData.id) || []
        const personasArray: Persona[] = []

        for (const personaJoin of personaItems) {
          if (!personaJoin.persona) continue

          personasArray.push(personaJoin.persona as Persona)
        }

        showcase.personas = personasArray
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
