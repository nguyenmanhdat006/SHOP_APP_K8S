import { BaseEntity } from "./base.entity.js";

export class RoleEntity extends BaseEntity {
  static tableName = "roles";

  constructor(data = {}) {
    super({
      id: data.id,
      code: data.code,
      name: data.name,
      createdAt: data.createdAt ?? data.created_at ?? null,
    });
  }
}
