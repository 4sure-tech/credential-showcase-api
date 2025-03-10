import { eq } from 'drizzle-orm'
import slugify from 'slugify'
import { GenerateSlugArgs } from '../types'

export const generateSlug = async (args: GenerateSlugArgs): Promise<string> => {
  const { value, connection, schema } = args
  const { nanoid } = await import('nanoid')
  let slug = slugify(value.replace(/_/g, '-'), { lower: true, strict: true })
  while ((await connection.select().from(schema).where(eq(schema.slug, slug)).execute()).length > 0) {
    slug = `${slug}-${nanoid(6)}`
  }

  return slug
}
