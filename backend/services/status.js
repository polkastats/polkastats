const statuses = {
  HEALTHY: 'healthy',
};

class Status {
  constructor(crawlersConfig) {
    this.initAppStatuses(crawlersConfig);
  }

  initAppStatuses(crawlersConfig) {
    this.apps = [];
    crawlersConfig.forEach((crawlerConfig) => {
      if (!crawlerConfig.enabled) {
        return;
      }

      this.apps.push({
        name: crawlerConfig.name,
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

module.exports = Status;
