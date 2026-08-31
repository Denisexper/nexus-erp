export class Supplier {
  constructor({ id, company, code, country, name, address, phone, email, website, isActive = true, createdAt, updatedAt }) {
    this.id = id;
    this.company = company; // id de Company, o subdocumento poblado
    this.code = code;
    this.country = country; // id de Country, o subdocumento poblado
    this.name = name;
    this.address = address;
    this.phone = phone;
    this.email = email;
    this.website = website;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
