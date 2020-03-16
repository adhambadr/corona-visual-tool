import numeral from "numeral";
import ChartDataLabels from "chartjs-plugin-datalabels";

export const options = {
	title: {
		display: true,
		text: "Covid-19 Historic data for " + this.props.country
	},
	tooltips: {
		enabled: true
	},
	plugins: {
		datalabels: {
			align: "top",
			formatter: (val, context) => numeral(val).format("0,0")
		}
	},
	scales: {
		xAxes: [
			{
				gridLines: {
					display: false
				}
			}
		],
		yAxes: [
			{
				ticks: {
					beginAtZero: true,
					callback: (label, index, labels) =>
						numeral(label).format("0,0")
				},
				gridLines: {
					display: false
				}
			}
		]
	}
};
