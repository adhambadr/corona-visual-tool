import React, { Component } from "react";
import axios from "axios";
import _ from "lodash";
import Chart from "chart.js";
import moment from "moment";
import numeral from "numeral";
import ChartDataLabels from "chartjs-plugin-datalabels";
// numeral.register("locale", "de", {
//   delimiters: {
//     thousands: ".",
//     decimal: ","
//   }
// });
// numeral.locale("de");
export default class Home extends Component {
  static async getInitialProps({ query }) {
    const country = query.country || "Germany";
    const url =
      (process.env.NODE_ENV === "production"
        ? "https://corona.blloc.com/history?country="
        : "http://localhost:2019/historic?country=") + country;
    const { data } = await axios.get(url);
    return {
      data,
      country
    };
  }
  state = {
    selectedState: "federal",
    options: ["confirmed", "recovered", "deaths"]
  };
  getDataSets = () =>
    _.map(this.state.options, (option, i) => ({
      label: "# " + option + " cases",
      data: _.map(
        _.get(this.props, "data." + this.state.selectedState, []),
        option
      ),
      backgroundColor: backgrounds[i],
      borderColor: borders[i],
      borderWidth: 1
    }));
  chartParams = {
    type: "line",
    data: {
      labels: _.map(
        _.get(this.props, "data." + this.state.selectedState, []),
        ({ date }) => new moment(date).format("DD.MM.YY")
      ),
      datasets: this.getDataSets()
    },
    options: {
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
              callback: (label, index, labels) => numeral(label).format("0,0")
            },
            gridLines: {
              display: false
            }
          }
        ]
      }
    }
  };
  componentDidMount = () => {
    console.log(this.props.data);
    const myChart = new Chart(this.ctx, this.chartParams);
  };
  render = () => (
    <div>
      <canvas i ref={r => (this.ctx = r)} width="400" height="400" />
    </div>
  );

  select = () => (
    <select
      onChange={({ target }) => this.setState({ selectedState: target.value })}
    >
      <option value="federal">all</option>
      {_.map(_.sortBy(_.keys(_.get(this.props, "data"))), (state, i) => (
        <option key={i} value={state}>
          {state}
        </option>
      ))}
    </select>
  );
}

const backgrounds = [
  "rgba(255, 99, 132, 0.2)",
  "rgba(54, 162, 235, 0.2)",
  "rgba(255, 206, 86, 0.2)",
  "rgba(75, 192, 192, 0.2)"
];
const borders = [
  "rgba(255, 99, 132, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(255, 206, 86, 1)",
  "rgba(75, 192, 192, 1)",
  "rgba(153, 102, 255, 1)",
  "rgba(255, 159, 64, 1)"
];
