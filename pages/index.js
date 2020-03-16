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
const url =
  process.env.NODE_ENV === "production"
    ? "https://corona.blloc.com/"
    : "http://localhost:2019/";
export default class Home extends Component {
  static async getInitialProps({ query }) {
    const country = query.country || "Germany";
    const { data } = await axios.get(url + "countries");
    return {
      country,
      countries: _.sortBy(data)
    };
  }
  state = {
    selectedState: "federal",
    country: this.props.country,
    options: ["confirmed", "recovered", "deaths"]
  };
  getData = async (country = this.state.country || this.props.country) => {
    const { data } = await axios.get(url + "historic?country=" + country);
    this.setState({ data }, this.updateCharts);
  };

  componentDidMount = async () => {
    await this.getData();
    this.chart = new Chart(this.ctx, this.chartParams());
  };
  getDataSets = () =>
    _.map(this.state.options, (option, i) => ({
      label: "# " + option + " cases",
      data: _.concat(
        _.map(
          _.get(this.state, "data." + this.state.selectedState, []),
          option
        ),
        null
      ),
      backgroundColor: backgrounds[i],
      borderColor: borders[i],
      borderWidth: 1
    }));
  getLabels = () =>
    _.map(
      _.get(this.state, "data." + this.state.selectedState, []),
      ({ date }) => new moment(date).format("DD.MM.YY")
    );

  chartParams = () => ({
    type: "line",
    data: {
      labels: [...this.getLabels(), ""],
      datasets: this.getDataSets()
    },
    options: {
      title: {
        display: true,
        text:
          "Covid-19 Historic data for " +
          this.props.country +
          ", " +
          this.state.selectedState
      },
      tooltips: {
        enabled: true
      },
      plugins: {
        datalabels: {
          align: "top",
          display: "auto",
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
  });
  updateCharts = () => {
    if (!this.chart) return;
    this.chart.data.datasets = this.getDataSets();
    this.chart.data.labels = this.getLabels();
    this.chart.update();
  };

  addCountry = country => {};
  changeCountry = country => {
    this.setState({ country, selectedState: "federal" }, this.getData);
  };
  changeState = state => {
    this.setState({ selectedState: state }, this.updateCharts);
  };
  stateSelecter = () => (
    <select onChange={({ target }) => this.changeState(target.value)}>
      <option value="federal">all</option>
      {_.map(_.sortBy(_.keys(_.get(this.state, "data"))), (state, i) => (
        <option key={i} value={state}>
          {state}
        </option>
      ))}
    </select>
  );
  countrySelector = () => (
    <select
      onChange={({ target }) => this.changeCountry(target.value)}
      value={this.state.country}
    >
      {_.map(this.props.countries, (state, i) => (
        <option key={i} value={state}>
          {state}
        </option>
      ))}
    </select>
  );
  render = () => (
    <>
      <div>
        {this.countrySelector()}
        {this.stateSelecter()}
      </div>
      <div>
        <canvas i ref={r => (this.ctx = r)} width="400" height="400" />
      </div>
    </>
  );

  select = () => (
    <select
      onChange={({ target }) => this.setState({ selectedState: target.value })}
    ></select>
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
