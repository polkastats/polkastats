class Status {
  constructor(names) {
    this.apps = [];
    names.forEach((name) => {
      this.apps.push({
        name,
        status: 'healthy',
      });
    });
  }

  set(name, status) {
    this.apps.find((item) => item.name === name).status = status;
  }

  getAll() {
    return this.apps;
  }

  allIsHealthy() {
    return !this.apps.find((app) => app.status !== 'healthy');
  }
}

module.exports = Status;
