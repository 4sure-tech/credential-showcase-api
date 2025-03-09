const path = require('path')
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { Service } from 'typedi'
import * as schema from '../database/schema'

@Service()
export class DatabaseService {
  private db?: NodePgDatabase<typeof schema>

  private getDbUrl(): string {
    return (
      process.env.DB_URL ??
      `postgresql://${process.env.DB_USERNAME}${process.env.DB_PASSWORD && `:${process.env.DB_PASSWORD}`}${process.env.DB_HOST && `@${process.env.DB_HOST}`}${process.env.DB_PORT && `:${process.env.DB_PORT}`}/${process.env.DB_NAME}`
    )
  }

  public async getConnection(): Promise<NodePgDatabase<typeof schema>> {
    if (!this.db) {
      const pool = new Pool({ connectionString: this.getDbUrl() })
      this.db = drizzle(pool, { schema })

      const migrationsFolder = path.resolve(__dirname, '../database/migrations')
      await migrate(this.db, { migrationsFolder })
    }

    return this.db
  }

  public async runMigrations(): Promise<void> {
    try {
      // Get database connection
      const db = await this.getConnection()

      // Path to migrations folder
      const migrationsFolder = path.resolve(__dirname, '../database/migrations')

      // Run migrations
      await migrate(db, { migrationsFolder })

      console.log('Database migrations completed successfully')
    } catch (error) {
      console.error('Error running database migrations:', error)
      // return Promise.reject(Error("Failed to run database migrations")) // TODO test with enabled later
    }
  }
}

export default DatabaseService
