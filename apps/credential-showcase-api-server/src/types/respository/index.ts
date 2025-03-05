export type RepositoryDefinition<T, U> = {
    findById(id: string): Promise<T>;
    findAll(filter?: Record<string, any>): Promise<T[]>;
    create(item: U): Promise<T>;
    update(id: string, item: U): Promise<T>;
    delete(id: string): Promise<void>;
};
