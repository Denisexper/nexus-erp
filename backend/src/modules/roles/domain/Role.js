export class Role {
  constructor({
    id,
    company,
    name,
    displayName,
    description,
    permissions = [],
    isSystem = false,
    isActive = true,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.company = company;
    this.name = name?.toLowerCase();
    this.displayName = displayName;
    this.description = description;
    this.permissions = permissions;
    this.isSystem = isSystem;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
