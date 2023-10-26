import type { Client, Repository, Entity, Schema } from 'redis-om'

export default abstract class ServiceBase<T extends Entity> {
  public repo!: Repository<T>
  public schema!: Schema<T>
  public client!: Client

  async init(client: Client, schema: Schema<T>) {
    if (this.repo) throw new Error('Repo already initialized')
    this.client = client
    this.schema = schema
    this.repo = client.fetchRepository(schema)
    await this.repo.createIndex()

    return this.repo
  }
}
