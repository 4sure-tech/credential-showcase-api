import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'

class TestDbContainer {
  private static instance: TestDbContainer
  private container: StartedPostgreSqlContainer | null = null
  private isInitialized = false
  private useCount = 0

  private constructor() {}

  public static getInstance(): TestDbContainer {
    if (!TestDbContainer.instance) {
      TestDbContainer.instance = new TestDbContainer()
    }
    return TestDbContainer.instance
  }

  public async start(): Promise<void> {
    this.useCount++

    if (this.isInitialized) {
      return
    }

    this.container = await new PostgreSqlContainer().start()

    process.env.DB_URL = this.container.getConnectionUri()
    process.env.DB_USERNAME = 'postgres'
    process.env.DB_PASSWORD = 'postgres'
    process.env.DB_HOST = this.container.getHost()
    process.env.DB_PORT = this.container.getMappedPort(5432).toString()
    process.env.DB_NAME = 'postgres'

    this.isInitialized = true
  }

  public async stop(): Promise<void> {
    this.useCount--

    // Only stop if no one is using it - could also add a force parameter
    if (this.useCount <= 0 && this.container) {
      await this.container.stop()
      this.container = null
      this.isInitialized = false
      this.useCount = 0
    }
  }
}

export default TestDbContainer.getInstance()
