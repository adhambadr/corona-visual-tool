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
    const country = query.country || "World";
    const { data } = await axios.get(url + "countries");
    return {
      country,
      countries: _.sortBy(data)
    };
  }
  state = {
    selectedState: "federal",
    country: this.props.country,
    options: ["confirmed", "recovered", "deaths", "predicted"]
  };
  getData = async (country = this.state.country || this.props.country) => {
    if (!this.props.countries.includes(country))
      return console.log("Country not found");
    const { data } = await axios.get(url + "historic?country=" + country);
    this.setState({ data }, this.updateCharts);
  };

  componentDidMount = async () => {
    await this.getData();
    this.chart = new Chart(this.ctx, this.chartParams());
  };
  getDataSets = () =>
    _.map(this.state.options, (option, i) => ({
      label: "# " + option,
      data: _.map(
        _.get(this.state, "data." + this.state.selectedState, []),
        option
      ),
      backgroundColor: backgrounds[i],
      borderColor: borders[i],
      borderWidth: 1
    }));
  getLabels = () =>
    _.concat(
      _.map(
        _.get(this.state, "data." + this.state.selectedState, []),
        ({ date }) => new moment(date).format("DD.MM.YY")
      ),
      [""] // Spacing the graph to see last number
    );

  getTitle = () =>
    `Covid-19 Historic data for ${this.state.country}${
      this.state.selectedState && this.state.selectedState != "federal"
        ? ", " + this.state.selectedState
        : ""
    }`;

  getYAxisScale = () => (this.state.yLogScale ? "logarithmic" : "linear");

  chartParams = () => ({
    type: "line",
    data: {
      labels: this.getLabels(),
      datasets: this.getDataSets()
    },
    options: {
      maintainAspectRatio: false,
      title: {
        display: true,
        text: this.getTitle()
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
              display: true
            }
          }
        ]
      }
    }
  });
  updateCharts = () => {
    if (!this.chart) return;
    this.chart.data.datasets = this.getDataSets();
    this.chart.options.title.text = this.getTitle();
    this.chart.data.labels = this.getLabels();
    this.chart.options.scales.yAxes[0] = { type: this.getYAxisScale() };
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
      <option value="federal">All - Select a state</option>
      {_.chain(this.state)
        .get("data")
        .keys()
        .sortBy()
        .filter(s => !_.eq(s, "federal"))
        .map((state, i) => (
          <option key={i} value={state}>
            {state}
          </option>
        ))
        .value()}
    </select>
  );
  countrySelector = () => (
    <select
      onChange={({ target }) => this.changeCountry(target.value)}
      value={this.state.country}
    >
      <option value="World">Worldwide - Select a country</option>
      {_.map(
        _.filter(this.props.countries, country => !_.eq(country, "global")),
        (state, i) => (
          <option key={i} value={state}>
            {state}
          </option>
        )
      )}
    </select>
  );

  changeYLogScale = yLogScale => {
    this.setState({ yLogScale }, this.updateCharts);
  };

  yLogScaleCheckbox = () => (
    <div>
      <input
        type="checkbox"
        onChange={({ target }) => this.changeYLogScale(target.checked)}
      />
      <label className="label-inline">logscale</label>
    </div>
  );

  render = () => (
    <div className="container">
      <div className="row">
        <div className="column">{this.countrySelector()}</div>
        <div className="column">{this.stateSelecter()}</div>
        <div className="column column-20">{this.yLogScaleCheckbox()}</div>
      </div>
      <div>
        <canvas style={{ padding: "5px 30px" }} ref={r => (this.ctx = r)} />
      </div>
      <div>
        <h6>
          {"Berlin | "}
          <a target="blank" href="https://github.com/adhambadr/corona-api">
            Adham Badr
          </a>
        </h6>
      </div>
    </div>
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
  "rgba(0, 0, 0, 0.2)",
  "rgba(75, 192, 192, 0.2)"
];
const borders = [
  "rgba(255, 99, 132, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(0, 0, 0, 1)",
  "rgba(75, 192, 192, 1)",
  "rgba(153, 102, 255, 1)",
  "rgba(255, 159, 64, 1)"
];
