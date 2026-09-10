export class BaseEntity {
  static tableName = "";

  constructor(data = {}) {
    Object.assign(this, data);
  }

  toJSON() {
    return { ...this };
  }
}
