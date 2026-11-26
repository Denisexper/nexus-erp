export class Employee {
  constructor({
    id,
    branch,
    firstName,
    lastName,
    email,
    phone,
    dui,
    position,
    isActive = true,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.branch = branch; // id de Branch, o subdocumento poblado
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.phone = phone;
    this.dui = dui;
    this.position = position;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
