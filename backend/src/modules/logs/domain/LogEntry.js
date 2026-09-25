export class LogEntry {
  constructor({
    id,
    company,
    user,
    action,
    resource,
    entityId = null,
    entityModel = null,
    entityName = null,
    dataBefore = null,
    dataAfter = null,
    changedFields = [],
    details,
    ipAddress,
    userAgent,
    statusCode,
    createdAt,
  }) {
    this.id = id;
    this.company = company;
    this.user = user;
    this.action = action;
    this.resource = resource;
    this.entityId = entityId;
    this.entityModel = entityModel;
    this.entityName = entityName;
    this.dataBefore = dataBefore;
    this.dataAfter = dataAfter;
    this.changedFields = changedFields;
    this.details = details;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    this.statusCode = statusCode;
    this.createdAt = createdAt;
  }
}
