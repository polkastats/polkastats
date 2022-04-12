<template>
	<footer class="layout">
		<article>
			<div>
				<div>
					<h2>
						<!-- <a href="#" icon="facebook"></a>
						<a href="#" icon="instagram"></a> -->
						<a href="https://github.com/Colm3na/polkastats-ng" icon="github" tooltip="View source code"></a>
					</h2>
					<h1 brand>
						<!-- <a href="#"> -->
							<!-- <span>
								<img src="/brand/logo.svg" alt="Brand Logo" height="40">
							</span> -->
							<img src="/brand/logo.svg" alt="Brand Logo" height="40" logo>
							<img src="/brand/text.svg" alt="Brand Text" height="40" text>
						<!-- </a> -->
					</h1>
				</div>
			</div>
			<nav aria-labelledby="Secondary Menu">
				<ul>
					<li v-for="item of menu" :key="item.name"><a :href="item.link">{{ item.name }}</a></li>
					<!-- <li><a href="#">Privacy Policy</a></li>
					<li><a href="#">Conditions of Use</a></li> -->
					<li v-for="item of legend" :key="item.name"><a :href="item.link">{{ item.name }}</a></li>
				</ul>
			</nav>
		</article>
		<address>
			<p color="fourth">
				<span v-for="info of address" :key="info.name" :icon="info.icon">{{ info.name }}</span>
				<!-- <span icon="email">polkastats@protonmail.com</span>
				<span icon="key">PGP: 14C5 91D0 8ABA 03B7</span> -->
			</p>
			<p color="primary">
				<img src="/brand/grant_badge.png" alt="FFFFF" height="64" />
			</p>
		</address>
	</footer>
</template>


<script>
export default {
	data()
	{
		const lang = this.$t('layout.default');

		const menu =
		[
			{ name: lang.about_us, link: '/team' },
			{ name: lang.support_polkastats, link: '/support-us' },
		]

		const legend =
		[
			{ name: lang.made_by, link: '/team' },
			{ name: lang.built_with + ' Basic Atttention Token', link: 'https://basicattentiontoken.org/', icon: 'built' },
			// { name: lang.view_source_code_on_github, link: 'https://github.com/Colm3na/polkastats-ng', icon: 'github' },
		]

		const address =
		[
			{ name: '@PolkaStats', icon: 'name', link: 'https://twitter.com/polkastats' },
			{ name: 'PGP: 14C5 91D0 8ABA 03B7', icon: 'key', link: 'mailto:polkastats@protonmail.com' },
			{ name: 'polkastats@protonmail.com', icon: 'email', link: 'https://keybase.io/encrypt#polkastats' },
		]

		return { menu: menu, legend: legend, address: address };
	}
}
</script>

<style lang="scss" scoped>

@use '/assets/scss/polkadot/variables/colors/colors.scss' as COLOR;

footer
{
	overflow: hidden;
	color: COLOR.$fifth;
	background-color: rgba(COLOR.$fourth, 0.9);
	display: flex;

	> article
	{
		padding: 2em;
		flex-grow: 5;
		display: flex;
		flex-direction: column;
		
		> div
		{
			margin: auto 0;

			> div
			{
				position: relative;
				left: 50%;
				display: inline-block;
				text-align: center;

				[brand]
				{
					font-size: 4em;
				}

				> h2
				{
					font-size: 1.2em;
					display: flex;
					justify-content: center;
					gap: 1em;
					margin: 1em;

					> [icon]
					{
						background-color: COLOR.$primary;
						background-color: COLOR.$fifth;
						color: COLOR.$fourth;
						border-radius: 50%;
						position: relative;
						width: 2.8em;
						height: 2.8em;

						&::before
						{
							position: absolute;
							top: 50%;
							left: 50%;
							transform: translate(-50%, -50%);
						}
						
						&:hover
						{
							background-color: COLOR.$fifth;
							background-color: COLOR.$primary;
							color: COLOR.$fifth;
						}
					}


					> [icon="github"]
					{
						background-color: transparent;
						color: COLOR.$primary;
						color: COLOR.$fifth;

						&:hover
						{
							background-color: transparent;
							color: COLOR.$fifth;
							color: COLOR.$primary;
						}
					}
				}
			}
		}

		> nav
		{
			> ul
			{
				text-align: left;
				text-transform: none;
				font-weight: 500;
			}
		}
	}

	> address
	{
		margin: 0;
		flex-grow: 1;
		display: flex;
    	flex-direction: column;
		
		> p
		{
			display: flex;
			flex-direction: column;
			justify-content: center;
			
			text-align: center;
			padding: 1.4em 2em;
			margin: 0;

			&[color="primary"]
			{
				background-color: COLOR.$primary;
			}

			&[color="fourth"]
			{
				background-color: COLOR.$fourth;
			}

			[icon]
			{
				display: block;
				padding: 0.6em 0;
				text-align: left;

				&::before
				{
					display: block;
					margin-bottom: 0.4em;
				}
			}

			> img
			{
				align-self: center;
				height: 6.4em;
			}
		}
	}
}

</style>