export class LogoutUseCase {
  constructor(writeLogEntryUseCase) {
    this.writeLogEntryUseCase = writeLogEntryUseCase;
  }

  async execute({ userId, userName, companyId, ipAddress, userAgent }) {
    try {
      await this.writeLogEntryUseCase.execute({
        company: companyId,
        user: userId,
        action: 'logout',
        resource: 'auth',
        entityId: userId,
        entityModel: 'userModel',
        entityName: userName || 'Usuario',
        details: 'Logout exitoso',
        ipAddress,
        userAgent,
        statusCode: 200,
      });
    } catch (error) {
      console.error('Error creating logout log:', error);
    }
  }
}
