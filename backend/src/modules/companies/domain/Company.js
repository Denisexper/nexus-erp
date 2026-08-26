export class Company {
  constructor({
    id,
    name,
    commercialName,
    slug,
    nit,
    nrc,
    commercialLine1,
    commercialLine2,
    commercialLine3,
    address,
    department,
    municipality,
    district,
    phone,
    email,
    webSite,
    logo,
    isActive = true,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.name = name;
    this.commercialName = commercialName;
    this.slug = slug;
    this.nit = nit;
    this.nrc = nrc;
    this.commercialLine1 = commercialLine1;
    this.commercialLine2 = commercialLine2;
    this.commercialLine3 = commercialLine3;
    this.address = address;
    this.department = department; // id de Department, o subdocumento poblado
    this.municipality = municipality; // id de Municipality, o subdocumento poblado
    this.district = district; // id de District, o subdocumento poblado
    this.phone = phone;
    this.email = email;
    this.webSite = webSite;
    this.logo = logo ?? null;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
