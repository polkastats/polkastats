<template>
  <div id="footer" class="container-fluid footer mt-2">
    <footer class="text-muted">
      <div class="container">
        <div class="d-flex align-items-center justify-content-center mt-2 pt-1">
          <div>
            <a href="https://cere.network/">
              <img src="/img/cere-logo.png" class="cere-logo" />
            </a>
          </div>
          <a href="https://cere.network/" style="text-decoration: none">
            <div class="cere-title">Cere Network</div>
          </a>
        </div>
        <div class="row pt-2">
          <div
            class="col-xs-12 col-sm-12 col-md-4 mt-sm-2 text-center text-white"
            data-testid="footer-getInContact"
          >
            <h3 class="mb-1" style="font-size: 16px">
              {{ $t('layout.default.get_in_contact') }}
            </h3>
            <hr />
            <ul class="list-unstyled social text-center">
              <li data-testid="footer-twitter">
                <a target="_blank" href="https://twitter.com/cerenetwork">
                  <font-awesome-icon :icon="['fab', 'twitter']" />
                  @cerenetwork
                </a>
              </li>
              <li data-testid="footer-twitter">
                <a target="_blank" href="https://t.me/cerenetwork_official">
                  <font-awesome-icon :icon="['fab', 'telegram']" />
                  Cere Network
                </a>
              </li>
              <li data-testid="footer-pgp">
                <a target="_blank" href="https://discord.gg/A5pCWaYQ92">
                  <font-awesome-icon :icon="['fab', 'discord']" />
                  Cere Network
                </a>
              </li>
              <li data-testid="footer-email">
                <a target="_blank" href="mailto:team@cere.network"
                  ><font-awesome-icon icon="envelope" /> team@cere.network</a
                >
              </li>
            </ul>
          </div>
          <div
            class="col-xs-12 col-sm-12 col-md-4 mt-sm-2 text-center text-white"
            data-testid="footer-polkadot"
          >
            <h3 class="mb-1" style="font-size: 16px">Explore</h3>
            <hr />
            <ul class="list-unstyled text-center">
              <li>
                <a target="_blank" href="https://block-viewer.cere.network/"
                  >Block Viewer</a
                >
              </li>
              <li>
                <a target="_blank" href="https://bridge.cere.network">Bridge</a>
              </li>
              <li>
                <a
                  target="_blank"
                  href="https://github.com/Cerebellum-Network/cerestats"
                  >GitHub</a
                >
              </li>
            </ul>
          </div>
          <div
            class="col-xs-12 col-sm-12 col-md-4 mt-sm-2 text-center text-white"
            data-testid="footer-builtFor"
          >
            <h3 class="mb-1" style="font-size: 16px">
              {{ $t('layout.default.built_with') }}
            </h3>
            <hr />
            <a href="https://polkastats.io/" target="_blank">
              <img
                src="/img/polkastats_logo_light@2x.png"
                class="grant-badge"
                alt="Polkastats"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
<script>
export default {}
</script>

<style>
.cere-logo {
  max-width: 50px;
  max-height: auto;
}
.cere-title {
  font-size: 20px;
}
.grant-badge {
  max-width: 150px;
}
</style>
