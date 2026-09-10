import { BaseEntity } from "./base.entity.js";

export class UserEntity extends BaseEntity {
  static tableName = "users";

  constructor(data = {}) {
    super({
      id: data.id,
      name: data.name ?? null,
      email: data.email,
      role: data.role || "CUSTOMER",
      roleId: data.roleId ?? data.role_id ?? null,
      createdAt: data.createdAt ?? data.created_at ?? null,
      updatedAt: data.updatedAt ?? data.updated_at ?? null,
    });
  }
}
