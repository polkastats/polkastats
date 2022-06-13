import THEME from 'assets/scss/exports/polkastats.scss'; 

export class ChartLineOptions
{
	constructor(x, y, variant)
	{
		this.setAxes(x, y);
		this.setVariant(variant);
		this.setRounded(THEME.enableRounded == 'true' ? 0.5 : 0);
	}

	setLabels(labels)
	{
		this.data.labels = labels;
	}

	setData(data, index = 0)
	{
		this.data.datasets[index].data = data;
	}

	setAxes(x, y, index = 0)
	{
		if(x)
			this.options.scales.xAxes[index].scaleLabel.labelString = x;
		else
			this.options.scales.xAxes[index].scaleLabel.display = false;

		if(y)
			this.options.scales.yAxes[index].scaleLabel.labelString = y;
		else
			this.options.scales.yAxes[index].scaleLabel.display = false;
	}

	setVariant(variant = 'Primary', index = 0)
	{
		if(THEME['color' + variant])
		{
			this.data.datasets[index].borderColor = THEME['color' + variant] + '80';
			this.data.datasets[index].backgroundColor = THEME['color' + variant] + '40';
			this.data.datasets[index].pointBorderColor = THEME['color' + variant];
		}
	}

	setRounded(tension, index = 0)
	{
		this.data.datasets[index].tension = tension;
	}

	getDataSeed(variant = 'Primary')
	{
		let dataseed =
		{
			borderWidth: 1,
			pointBackgroundColor: 'transparent',
			hoverBackgroundColor: 'transparent',
			hoverBorderColor: THEME.colorFourth,
			pointRadius: 0,
			pointStyle: 'rect',
			hoverBorderWidth: 3,
			hoverRadius: 6,
		}

		if(THEME['color' + variant])
		{
			dataseed.borderColor = THEME['color' + variant] + '80';
			dataseed.backgroundColor = THEME['color' + variant] + '40';
			dataseed.pointBorderColor = THEME['color' + variant];
		}

		return dataseed;
	}

	data = 
	{
		datasets:
		[
			this.getDataSeed('Primary')
		]
	}

	options = 
	{
		responsive: true,
		maintainAspectRatio: false,
		legend:
		{
			display: false,
		},
		hover: 
		{
			intersect: false
		},
		tooltips:
		{
			intersect: false,
			backgroundColor: THEME.colorFourth,
			displayColors: false,
			titleFontColor: THEME.colorPrimary,
			titleFontStyle: '700',
			titleFontSize: 14,
			titleFontFamily: THEME.fontSecondary,
			titleMarginBottom: 4,
			titleSpacing: 0,
			bodyFontColor: THEME.colorFifth,
			bodyFontFamily: THEME.fontSecondary,
			bodyFontSize: 12,
			bodyFontStyle: 500,
			bodySpacing: 0,
			footerSpacing: 0,
			footerMarginTop: 0,
			yPadding: 6,
			xPadding: 8,
			cornerRadius: 0,
			caretSize: 6,
			caretPadding: 10,
		},
		scales:
		{
			xAxes:
			[
				{
					ticks:
					{
						beginAtZero: false,
						fontSize: 10,
						fontColor: THEME.colorFourth,
						fontFamily: THEME.fontSecondary,
						autoSkipPadding: 6,
						padding: 6,
					},
					gridLines:
					{
						display: true,
						color: THEME.colorFourth + '80',
						lineWidth: 0.2,
						zeroLineWidth: 2,
						zeroLineBorderDash: [5, 5],
						zeroLineColor: THEME.colorFourth,
					},
					scaleLabel:
					{
						display: true,
						fontSize: 16,
						fontStyle: '500',
						fontColor: THEME.colorFourthB,
						fontFamily: THEME.fontPrimary,
						padding: 16,
					},
				},
			],
			yAxes:
			[
				{
					ticks:
					{
						suggestedMin: 0,
						fontColor: THEME.colorFourth,
						autoSkipPadding: 12,
						padding: 6,
						fontSize: 10,
						fontFamily: THEME.fontSecondary,
					},
					gridLines:
					{
						color: THEME.colorFourth + '80',
						lineWidth: 0,
						zeroLineWidth: 2,
						zeroLineBorderDash: [5, 5],
						zeroLineColor: THEME.colorFourth,
					},
					scaleLabel:
					{
						display: true,
						fontSize: 16,
						fontStyle: '500',
						fontColor: THEME.colorFourthB,
						fontFamily: THEME.fontPrimary,
						padding: 16,
					}
				}
			]
		}
	}
}