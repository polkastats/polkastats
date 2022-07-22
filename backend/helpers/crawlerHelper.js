module.exports = {
  getEnabledCrawlerNames: (crawlersConfig) => {
    const crawlersNames = [];

    crawlersConfig.forEach((crawlerConfig) => {
      if (!crawlerConfig.enabled) {
        return;
      }

      crawlersNames.push(crawlerConfig.name);
    });

    return crawlersNames;
  },
};
