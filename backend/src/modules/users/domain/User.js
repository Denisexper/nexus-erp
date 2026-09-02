export class User {
  constructor({ id, name, email, password, role, company, isActive = true, lastLogin, failedLoginAttempts = 0, lockedUntil = null, createdAt, updatedAt }) {
    this.id = id;
    this.name = name;
    this.email = email?.toLowerCase();
    this.password = password; // hash, nunca se expone en las respuestas HTTP
    this.role = role; // id del Role, o el subdocumento poblado según la consulta
    this.company = company; // id de Company: el tenant al que pertenece este usuario
    this.isActive = isActive;
    this.lastLogin = lastLogin;
    this.failedLoginAttempts = failedLoginAttempts; // RN-005: se resetea en cada login exitoso
    this.lockedUntil = lockedUntil; // RN-005: cuenta bloqueada hasta esta fecha, null si no está bloqueada
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
