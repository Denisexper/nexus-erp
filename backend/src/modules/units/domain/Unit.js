export class Unit {
  constructor({ id, company, name, type, isActive = true, createdAt, updatedAt }) {
    this.id = id;
    this.company = company; // id de Company, o subdocumento poblado
    this.name = name;
    this.type = type;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
