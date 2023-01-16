const statuses = {
  HEALTHY: 'healthy',
};

class Status {
  constructor(names) {
    this.apps = [];
    names.forEach((name) => {
      this.apps.push({
        name,
        status: statuses.HEALTHY,
      });
    });
  }

  set(name, status) {
    this.apps.find((item) => item.name === name).status = status;
  }

  getAll() {
    return this.apps;
  }

  isHealthy() {
    return !this.apps.find((app) => app.status !== statuses.HEALTHY);
  }
}

module.exports = {
  statuses,
  Status,
};
