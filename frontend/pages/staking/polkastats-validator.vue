<template>

	<main>

		<header-component color="i-gradient-secondary-5">
			<search-section variant="i-gradient-primary">

				<b-row class="text-left text-nowrap py-4">

					<b-col md="6" class="text-left mb-md-0 mb-5">
						<header class="mb-4" v-if="$i18n.locale == 'en'">
							<h2 class="display-4 mb-2">
								<b-badge variant="i-fourth" icon="polkadot" class="p-2" />
							</h2>
							<h1 class="h5">Polkadot validators</h1>
							<p>
								<nuxt-link to="/how-to-stake/polkadot/">
									<!-- <font-awesome-icon icon="arrow-left" classs="mr-2 float-md-right ml-md-2 mr-md-0" /> -->
									How to nominate on Polkadot
								</nuxt-link>
							</p>
						</header>
						<header class="mb-4" v-if="$i18n.locale == 'es'">
							<h2 class="display-4 mb-2">
								<b-badge variant="i-fourth" icon="polkadot" class="p-2" />
							</h2>
							<h1 class="h5">Validadores Polkadot</h1>
							<p>
								<nuxt-link to="/how-to-stake/polkadot/">
									Como nominar en Polkadot
								</nuxt-link>
							</p>
						</header>
						<div>
							<p class="mb-2">
								<Identicon class="mr-2" address="15psTaipmWG86U5vNkF7Guv9TRPMRLKHkGS8cXT74v3RCC5t" />
								<small>15psTaipmWG86U5vNkF7Guv9TRPMRLKHkGS8cXT74v3RCC5t</small>
							</p>
							<p>
								<Identicon class="mr-2" address="13dPstbBatxBkKJzP19KF3ETBrGfat6F5rgUStVjjpRrNPrv" />
								<small>13dPstbBatxBkKJzP19KF3ETBrGfat6F5rgUStVjjpRrNPrv</small>
							</p>
						</div>
					</b-col>

					<b-col md="6" class="text-md-right">
						<header class="mb-4" v-if="$i18n.locale == 'en'">
							<h2 class="display-4 mb-2">
								<b-badge variant="i-fourth" icon="kusama" class="p-2" />
							</h2>
							<h1 class="h5">Kusama validators</h1>
							<p>
								<nuxt-link to="/how-to-stake/kusama/">
									<!-- <font-awesome-icon icon="arrow-left" class="d-md-none" /> -->
									How to nominate on Kusama
									<!-- <font-awesome-icon icon="arrow-right" class="d-none d-md-inline-block" /> -->
								</nuxt-link>
							</p>
						</header>
						<header class="mb-4" v-if="$i18n.locale == 'es'">
							<h2 class="display-4 mb-2">
								<b-badge variant="i-fourth" icon="kusama" class="p-2" />
							</h2>
							<h1 class="h5">Validadores Kusama</h1>
							<p>
								<nuxt-link to="/how-to-stake/kusama/">
									Como nominar en Kusama
								</nuxt-link>
							</p>
						</header>
						<div>
							<p>
								<Identicon class="mb-2 mr-2 float-md-right ml-md-2 mr-md-0" address="GTzRQPzkcuynHgkEHhsPBFpKdh4sAacVRsnd8vYfPpTMeEY" />
								<small>GTzRQPzkcuynHgkEHhsPBFpKdh4sAacVRsnd8vYfPpTMeEY</small>
							</p>
							<p style="clear: both;">
								<Identicon class="mr-2 float-md-right ml-md-2 mr-md-0" address="EPStAMtjApGg8Ap6xKe9gyuinjmetz1MNhzu1cPmLQkWKUA" />
								<small>EPStAMtjApGg8Ap6xKe9gyuinjmetz1MNhzu1cPmLQkWKUA</small>
							</p>
						</div>
					</b-col>
				</b-row>

			</search-section>
		</header-component>

		<section class="section section-validator-details" color="i-third-2">

			<b-row align-v="center" v-if="$i18n.locale == 'en'">
				<b-col md="4" cols="12" order-md="2" class="text-i-primary text-center">
					<h1 class="display-4">Why?</h1>
					<h2 class="h6">Why nominate in polkastats?</h2>
				</b-col>

				<b-col md="4" sm="6" cols="12" order-md="1" class="row text-md-right">
					<b-col cols="12">
						<h6>
							<font-awesome-icon icon="server" class="mr-2 float-md-right ml-md-2 mr-md-0" />
							High availability
						</h6>
						<p>
							To ensure maximum availability and security our validators run
							behind sentry nodes using a private network.
						</p>
					</b-col>
					<b-col cols="12">
						<h6>
							<font-awesome-icon icon="user-clock" class="mr-2 float-md-right ml-md-2 mr-md-0" />
							24/7 moritoring
						</h6>
						<p>
							We monitor our infrastructure 24/7 using state-of-the-art
							monitoring tools to proactively detect problems.
						</p>
					</b-col>
					<b-col cols="12">
						<h6>
							<font-awesome-icon icon="hand-holding-usd" class="mr-2 float-md-right ml-md-2 mr-md-0" />
							Daily reward payout
						</h6>
						<p>
							Nominate to PolkaStats and don't waste your time or funds
							claiming your rewards, we do it for you on a daily basis.
						</p>
					</b-col>
				</b-col>

				<b-col md="4" sm="6" cols="12" order-md="3" class="row">
					<b-col cols="12">
						<h6>
							<font-awesome-icon icon="users" class="mr-2" />
							Team
						</h6>
						<p>
							Passionate web3 developers and sysadmins that are active part of
							the community.
						</p>
					</b-col>
					<b-col cols="12">
						<h6>
							<font-awesome-icon icon="crown" class="mr-2" />
							Polkadot Bounty winner
						</h6>
						<p>
							We strongly believe in the Substrate ecosystem contributing with
							<a target="_blank" href="https://polkastats.io">PolkaStats</a>
							and
							<a target="_blank" href="https://polkapulse.polkastats.io"
							>PolkaPulse</a
							>
							(3rd prize in
							<a
							href="https://polkadot.network/build-polkadot-network-launch-bounty-challenges/"
							target="_blank"
							>Polkadot Launch Bounty Challenges</a
							>
							/ Visualization category).
						</p>
					</b-col>
					<b-col cols="12">
						<h6>
							<font-awesome-icon icon="shield-alt" class="mr-2" />
							Early Polkadot supporter
						</h6>
						<p>
							We support substrate networks since Alexander testnet, been an
							Polkadot and Substrate community member.
						</p>
					</b-col>
				</b-col>
			</b-row>

			<b-row align-v="center" v-if="$i18n.locale == 'es'">
				<b-col md="4" cols="12" order-md="2" class="text-i-primary text-center">
					<h1 class="display-4">¿Por que?</h1>
					<h2 class="h6">¿Por qué nominar a PolkaStats?</h2>
				</b-col>

				<b-col md="4" sm="6" cols="12" order-md="1" class="row text-md-right">
					<b-col cols="12">
						<h6>
							<font-awesome-icon icon="server" class="mr-2 float-md-right ml-md-2 mr-md-0" />
							Alta disponibilidad
						</h6>
						<p>
							Para garantizar la máxima disponibilidad y la seguridad de
							nuestros validadores utilizamos nodos Sentry conectados a través
							de una red privada.
						</p>
					</b-col>
					<b-col cols="12">
						<h6>
							<font-awesome-icon icon="user-clock" class="mr-2 float-md-right ml-md-2 mr-md-0" />
							Monitorización 24/7
						</h6>
						<p>
							Monitorizamos nuestra infraestructura 24/7 usando las mejores
							herramientas de monitorización disponibles en el mercado para
							detectar proactivamente cualquier incidencia.
						</p>
					</b-col>
					<b-col cols="12">
						<h6>
							<font-awesome-icon icon="hand-holding-usd" class="mr-2 float-md-right ml-md-2 mr-md-0" />
							Pago diario de recompensas
						</h6>
						<p>
							Nomina a PolkaStats y olvídate de malgastar tu tiempo o fondos
							reclamando tus recompensas, nosotros lo hacemos diariamente por
							ti.
						</p>
					</b-col>
				</b-col>

				<b-col md="4" sm="6" cols="12" order-md="3"  class="row">
					<b-col cols="12">
						<h6>
							<font-awesome-icon icon="users" />
							Nuestro equipo
						</h6>
						<p>
							Nuestro equipo de desarrolladores y administradores de sistemas
							son parte activa de la comunidad web3.
						</p>
					</b-col>
					<b-col cols="12">
						<h6>
							<font-awesome-icon icon="crown" />
							Ganadores Polkadot Bounty
						</h6>
						<p>
							Creemos firmemente en el ecosistema Substrate contribuyendo con
							<a target="_blank" href="https://polkastats.io">PolkaStats</a>
							y
							<a target="_blank" href="https://polkapulse.polkastats.io"
							>PolkaPulse</a
							>
							(3er premio en la
							<a
							href="https://polkadot.network/build-polkadot-network-launch-bounty-challenges/"
							target="_blank"
							>Polkadot Launch Bounty Challenge</a
							>
							en la categoría de Visualización).
						</p>
					</b-col>
					<b-col cols="12">
						<h6>
							<font-awesome-icon icon="shield-alt" />
							Desde el inicio con Polkadot
						</h6>
						<p>
							Formando parte de Polkadot desde la testnet Alexander, siendo un
							miembro activo de la comunidad Polkadot y Substrate.
						</p>
					</b-col>
				</b-col>
			</b-row>

		</section>

	</main>

  <!-- <div>
    <section>
      <b-container class="main py-5 validator-page">
        English content
        <div v-if="$i18n.locale == 'en'">
          <b-row>
            <b-col md="6" class="mb-4">
              <b-card>
                <h4 class="mb-4">Polkadot validators</h4>
                <p>
                  <Identicon
                    address="15psTaipmWG86U5vNkF7Guv9TRPMRLKHkGS8cXT74v3RCC5t"
                    :size="25"
                  />
                  <span>15psTaipmWG86U5vNkF7Guv9TRPMRLKHkGS8cXT74v3RCC5t</span>
                </p>
                <p>
                  <Identicon
                    address="13dPstbBatxBkKJzP19KF3ETBrGfat6F5rgUStVjjpRrNPrv"
                    :size="25"
                  />
                  <span>13dPstbBatxBkKJzP19KF3ETBrGfat6F5rgUStVjjpRrNPrv</span>
                </p>
                <p class="text-right mb-0 pt-4">
                  <nuxt-link to="/how-to-stake/polkadot/" class="btn btn-stake">
                    How to nominate on Polkadot
                  </nuxt-link>
                </p>
              </b-card>
            </b-col>
            <b-col md="6" class="mb-4">
              <b-card>
                <h4 class="mb-4">Kusama validators</h4>
                <p>
                  <Identicon
                    address="GTzRQPzkcuynHgkEHhsPBFpKdh4sAacVRsnd8vYfPpTMeEY"
                    :size="25"
                  />
                  <span>GTzRQPzkcuynHgkEHhsPBFpKdh4sAacVRsnd8vYfPpTMeEY</span>
                </p>
                <p>
                  <Identicon
                    address="EPStAMtjApGg8Ap6xKe9gyuinjmetz1MNhzu1cPmLQkWKUA"
                    :size="25"
                  />
                  <span>EPStAMtjApGg8Ap6xKe9gyuinjmetz1MNhzu1cPmLQkWKUA</span>
                </p>
                <p class="text-right mb-0 pt-4">
                  <nuxt-link to="/how-to-stake/kusama/" class="btn btn-stake">
                    How to nominate on Kusama
                  </nuxt-link>
                </p>
              </b-card>
            </b-col>
          </b-row>

          <h2 class="text-center my-4">Why?</h2>

          <b-row class="pt-4">
            <b-col md="4" class="mb-4">
              <h3>High availability</h3>
              <hr />
              <p>
                To ensure maximum availability and security our validators run
                behind sentry nodes using a private network.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>24/7 moritoring</h3>
              <hr />
              <p>
                We monitor our infrastructure 24/7 using state-of-the-art
                monitoring tools to proactively detect problems.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Daily reward payout</h3>
              <hr />
              <p>
                Nominate to PolkaStats and don't waste your time or funds
                claiming your rewards, we do it for you on a daily basis.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Team</h3>
              <hr />
              <p>
                Passionate web3 developers and sysadmins that are active part of
                the community.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Polkadot Bounty winner</h3>
              <hr />
              <p>
                We strongly believe in the Substrate ecosystem contributing with
                <a target="_blank" href="https://polkastats.io">PolkaStats</a>
                and
                <a target="_blank" href="https://polkapulse.polkastats.io"
                  >PolkaPulse</a
                >
                (3rd prize in
                <a
                  href="https://polkadot.network/build-polkadot-network-launch-bounty-challenges/"
                  target="_blank"
                  >Polkadot Launch Bounty Challenges</a
                >
                / Visualization category).
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Early Polkadot supporter</h3>
              <hr />
              <p>
                We support substrate networks since Alexander testnet, been an
                Polkadot and Substrate community member.
              </p>
            </b-col>
          </b-row>
        </div>
        Spanish content
        <div v-if="$i18n.locale == 'es'">
          <b-row>
            <b-col md="6" class="mb-4">
              <b-card>
                <h4 class="mb-4">Validadores Polkadot</h4>
                <p>
                  <Identicon
                    address="15psTaipmWG86U5vNkF7Guv9TRPMRLKHkGS8cXT74v3RCC5t"
                    :size="25"
                  />
                  <span>15psTaipmWG86U5vNkF7Guv9TRPMRLKHkGS8cXT74v3RCC5t</span>
                </p>
                <p>
                  <Identicon
                    address="13dPstbBatxBkKJzP19KF3ETBrGfat6F5rgUStVjjpRrNPrv"
                    :size="25"
                  />
                  <span>13dPstbBatxBkKJzP19KF3ETBrGfat6F5rgUStVjjpRrNPrv</span>
                </p>
                <p class="text-right mb-0 pt-4">
                  <nuxt-link to="/how-to-stake/polkadot/" class="btn btn-stake">
                    Como nominar en Polkadot
                  </nuxt-link>
                </p>
              </b-card>
            </b-col>
            <b-col md="6" class="mb-4">
              <b-card>
                <h4 class="mb-4">Validadores Kusama</h4>
                <p>
                  <Identicon
                    address="GTzRQPzkcuynHgkEHhsPBFpKdh4sAacVRsnd8vYfPpTMeEY"
                    :size="25"
                  />
                  <span>GTzRQPzkcuynHgkEHhsPBFpKdh4sAacVRsnd8vYfPpTMeEY</span>
                </p>
                <p>
                  <Identicon
                    address="EPStAMtjApGg8Ap6xKe9gyuinjmetz1MNhzu1cPmLQkWKUA"
                    :size="25"
                  />
                  <span>EPStAMtjApGg8Ap6xKe9gyuinjmetz1MNhzu1cPmLQkWKUA</span>
                </p>
                <p class="text-right mb-0 pt-4">
                  <nuxt-link to="/how-to-stake/kusama/" class="btn btn-stake">
                    Como nominar en Kusama
                  </nuxt-link>
                </p>
              </b-card>
            </b-col>
          </b-row>

          <h2 class="text-center my-4">¿Por qué nominar a PolkaStats?</h2>

          <b-row class="pt-4">
            <b-col md="4" class="mb-4">
              <h3>Alta disponibilidad</h3>
              <hr />
              <p>
                Para garantizar la máxima disponibilidad y la seguridad de
                nuestros validadores utilizamos nodos Sentry conectados a través
                de una red privada.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Monitorización 24/7</h3>
              <hr />
              <p>
                Monitorizamos nuestra infraestructura 24/7 usando las mejores
                herramientas de monitorización disponibles en el mercado para
                detectar proactivamente cualquier incidencia.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Pago diario de recompensas</h3>
              <hr />
              <p>
                Nomina a PolkaStats y olvídate de malgastar tu tiempo o fondos
                reclamando tus recompensas, nosotros lo hacemos diariamente por
                ti.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Nuestro equipo</h3>
              <hr />
              <p>
                Nuestro equipo de desarrolladores y administradores de sistemas
                son parte activa de la comunidad web3.
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Ganadores Polkadot Bounty</h3>
              <hr />
              <p>
                Creemos firmemente en el ecosistema Substrate contribuyendo con
                <a target="_blank" href="https://polkastats.io">PolkaStats</a>
                y
                <a target="_blank" href="https://polkapulse.polkastats.io"
                  >PolkaPulse</a
                >
                (3er premio en la
                <a
                  href="https://polkadot.network/build-polkadot-network-launch-bounty-challenges/"
                  target="_blank"
                  >Polkadot Launch Bounty Challenge</a
                >
                en la categoría de Visualización).
              </p>
            </b-col>
            <b-col md="4" class="mb-4">
              <h3>Desde el inicio con Polkadot</h3>
              <hr />
              <p>
                Formando parte de Polkadot desde la testnet Alexander, siendo un
                miembro activo de la comunidad Polkadot y Substrate.
              </p>
            </b-col>
          </b-row>
        </div>
      </b-container>
    </section>
  </div> -->
</template>
<script>
import { config } from '@/frontend.config.js'
import HeaderComponent from '@/components/more/headers/HeaderComponent.vue'
import SearchSection from '@/components/more/headers/SearchSection.vue'

export default {
	layout: 'AuthLayout',
	components: { HeaderComponent, SearchSection },
  data() {
    return {
      config,
    }
  },
  head() {
    return {
      title: this.$t('pages.polkastats_validator.head_title', {
        networkName: config.name,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.polkastats_validator.head_content', {
            networkName: config.name,
          }),
        },
      ],
    }
  },
}
</script>
<style>
.validator-page .clipboard {
  display: inline-block;
}
.validator-page .identicon {
  margin-right: 0.2rem;
  cursor: copy;
}
.validator-page .btn-stake {
  color: white !important;
  background-color: #c51062 !important;
  border-color: #c51062 !important;
  box-shadow: none !important;
}
.validator-page .btn-stake:hover,
.validator-page .btn-stake:active,
.validator-page .btn-stake:visited {
  background-color: #ef1073 !important;
  border-color: #ef1073 !important;
  box-shadow: 0 0 0 0.2rem rgba(239, 16, 115, 0.5) !important;
}
</style>
