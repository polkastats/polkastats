
<template>
  <article :color="options.color">
	  <header>
		  <h1>{{ options.title }}</h1>
	  </header>
	  <b-table v-if="items && items.length > 0" borderless :items="items" :fields="fields">
		<template v-for="(_, slotName) of $scopedSlots" v-slot:[slotName]="scope">
			<slot :name="slotName" v-bind="scope"/>
		</template>
	  </b-table>
	  <footer v-if="items && items.length > 0">
		  <a :href="options.link" icon="more">more</a>
	  </footer>
	  <Loading v-else />
  </article>
</template>

<script>
import Loading from '@/components/Loading.vue'

export default {
	components: [Loading],
	props: ['items', 'fields', 'options'],
}
</script>

<style lang="scss" scoped>
	@use '/assets/scss/polkadot/variables/colors/colors.scss' as COLOR;
	@use '/assets/scss/polkadot/variables/fonts/families.scss' as FONT;
	
	/**
	
	// TODO: Cambiar el scroll a la tabla dejando fuera el titulo
	
	*/

	article
	{
		text-align: center;

		> header
		{
			margin: 1.6em 0;

			> h1
			{
				font-size: 1.6em;
				text-transform: uppercase;
				font-weight: bold;

				&::before,
				&::after
				{
					content: '';
					background-color: COLOR.$fourth;
					margin: 0 0.8em;
					margin-top: -0.2em;
					width: 1.8em;
					height: 0.2em;
					border-radius: 0.2em;
					display: inline-block;
					vertical-align: middle;
				}
			}
		}

		> footer
		{
			text-align: right;

			[icon="more"]
			{
				font-weight: bold;
			}
		}


		::v-deep table
		{
			border-collapse:separate; 
			border-spacing: 0 1em;
			white-space: nowrap;
			text-align: center;
			margin: 0;

			thead
			{
				text-transform: uppercase;
				font-weight: 700;

				> tr
				{
					> th.important,
					> th:first-of-type
					{
						font-size: 1.2em;
						font-weight: 900;
					}

					th
					{
						padding: 0.8em 1.2em;
					}
				}
			}

			tbody
			{
				font-size: 1.2em;

				> tr
				{
					> td
					{
						background-color: rgba(COLOR.$secondary, 0.1);
						vertical-align: middle;
						padding: 0.6em 1.2em;
						width: min-content;

						&:first-of-type
						{
							border-radius: 0.4em 0 0 0.4;
						}

						&:last-of-type
						{
							border-radius: 0 0.4em 0.4em 0;
						}

						p
						{
							margin: 0;
						}

						a
						{
							font-size: 1em;
						}

						.tag
						{
							font-size: 1em;
							color: COLOR.$fifth;
							border-radius: 0.4em;
							background-color: COLOR.$fourth;
							padding: 0 1.2em;
							display: table;
							margin-right: 0.8em;
							width: calc(100% - 0.8em);
							width: -webkit-fill-available;
							position: relative;
						}

						a.tag
						{
							&:hover
							{
								transform: scale(1.2);
							}
						}

						[icon]::before
						{
							margin-right: 0.2em;
						}

						> span
						{
							display: block;
							position: relative;
							text-align: left;
							line-height: 0.8em;
							text-transform: capitalize;

							&:not(:last-of-type)
							{
								margin-bottom: 0.6em;
							}

							&::before
							{
								content: '';
								position: absolute;
								top: 0;
								right: 100%;
								border-radius: 50%;
								padding: 0.2em;
								margin-right: 0.4em;
								background-color: COLOR.$primary;
								border: 0.2em solid COLOR.$primary;
							}

							&:not(:first-of-type)::before
							{
								background-color: transparent;
							}

							&:not(:last-of-type)::after
							{
								content: '';
								position: absolute;
								top: 0;
								right: 100%;
								margin-right: 0.7em;
								margin-top: 0.8em;
								width: 0.2em;
								height: 100%;
								background-color: COLOR.$primary;
							}
						}
					}
				}
			}
		}

		&:not([color])
		{
			::v-deep table
			{
				thead
				{
					tr
					{
						th
						{
							// FIX: Agregar clase para elegir cual columna alargar
							&:last-of-type
							{
								text-align: left;
							}
						}
					}
				}

				tbody
				{
					> tr
					{
						> td.important,
						> td:first-of-type
						{
							font-family: FONT.$secondary;
							font-weight: 900;
						}

						// FIX: Agregar clase para elegir cual columna alargar
						> td:last-of-type
						{
							width: 100%;
						}
					}
				}
			}
		}

		&[color]
		{
			::v-deep table
			{
				thead
				{
					tr
					{
						th:first-of-type
						{
							padding-right: 1.8em;
						}
					}
				}

				tbody
				{
					> tr
					{
						td
						{
							background-color: rgba(COLOR.$fourth, 0.1);

							&:nth-child(2)
							{
								border-radius: 0.4em 0 0 0.4em;
							}
						}

						> td.important,
						> td:first-of-type
						{
							font-size: 0.8em;
							color: COLOR.$fifth;
							border-radius: 0.4em;
							background-color: transparent;
							padding: 0;
						}
					}
				}
			}
		}

		&[color="primary"]
		{
			::v-deep table
			{
				thead
				{
					> tr
					{
						> th.important,
						> th:first-of-type
						{
							color: COLOR.$primary;
						}
					}
				}

				.tag
				{
					background-color: COLOR.$primary;
				}
			}
		}

		&[color="fourth"]
		{
			::v-deep table
			{
				.tag
				{
					background-color: COLOR.$fourth;
				}
			}
		}
	}

</style>

