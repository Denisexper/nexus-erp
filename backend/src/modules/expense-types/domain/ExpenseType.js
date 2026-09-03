export class ExpenseType {
  constructor({ id, company, name, description, isActive = true, createdAt, updatedAt }) {
    this.id = id;
    this.company = company; // id de Company, o subdocumento poblado
    this.name = name;
    this.description = description;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
