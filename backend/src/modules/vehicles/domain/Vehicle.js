export class Vehicle {
  constructor({
    id,
    employee,
    plate,
    brand,
    model,
    year,
    isActive = true,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.employee = employee; // id de Employee (conductor responsable), o subdocumento poblado
    this.plate = plate;
    this.brand = brand;
    this.model = model;
    this.year = year;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
