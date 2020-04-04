import React, { Component } from "react";
import axios from "axios";
import _ from "lodash";
import Chart from "chart.js";
import moment from "moment";
import numeral from "numeral";
import ChartDataLabels from "chartjs-plugin-datalabels";

const url =
  process.env.NODE_ENV === "production"
    ? "https://corona.blloc.com/"
    : "http://localhost:2019/";
export default class Home extends Component {
  static async getInitialProps({ query, req }) {
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
    options: ["confirmed", "recovered", "deaths"]
  };
  getData = async (country = this.state.country || this.props.country) => {
    if (!this.props.countries.includes(country))
      return console.log("Country not found");
    const { data } = await axios.get(url + "historic?country=" + country);
    this.setState({ data }, this.updateCharts);
  };

  componentDidMount = async () => {
    require("chartjs-plugin-zoom");
    await this.getData();
    this.chart = new Chart(this.ctx, this.chartParams());
    this.barChart = new Chart(this.ctxBarChart, this.barChartParams());
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

  getFullCountryName = () =>
    `${this.state.country}${
      this.state.selectedState && this.state.selectedState != "federal"
        ? ", " + this.state.selectedState
        : ""
    }`;

  getTitle = () => `Covid-19 Historic data for ${this.getFullCountryName()}`;

  getDeltaChartTitle = () =>
    `Day-to-day delta for ${this.getFullCountryName()}`;

  getYAxisScale = () => (this.state.yLogScale ? "logarithmic" : "linear");

  deltaFromDataSets(datasets) {
    let deltaDatasets = Array.from(datasets);
    deltaDatasets.forEach((dataset, idx) => {
      dataset = Object.assign({}, datasets[idx]);
      for (let idx = dataset["data"].length - 1; idx > 0; idx -= 1) {
        dataset["data"][idx] -= dataset["data"][idx - 1];
      }
    });
    return deltaDatasets;
  }

  barChartParams = () => ({
    type: "bar",
    data: {
      labels: this.getLabels(),
      datasets: this.deltaFromDataSets(this.getDataSets())
    },
    options: {
      maintainAspectRatio: false,
      title: {
        display: true,
        text: this.getDeltaChartTitle()
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true
            }
          }
        ]
      }
    }
  });

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
        },
        zoom: {
          pan: {
            enabled: true,
            mode: "x"
          },
          zoom: {
            enabled: true,
            mode: "x"
          }
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

  updateLineChart = () => {
    if (!this.chart) return;
    this.chart.data.datasets = this.getDataSets();
    this.chart.options.title.text = this.getTitle();
    this.chart.data.labels = this.getLabels();
    this.chart.options.scales.yAxes[0] = { type: this.getYAxisScale() };
    this.chart.update();
  };

  updateBarChart = () => {
    if (!this.barChart) return;
    this.barChart.data.datasets = this.deltaFromDataSets(this.getDataSets());
    this.barChart.options.title.text = this.getDeltaChartTitle();
    this.barChart.data.labels = this.getLabels();
    this.barChart.options.scales.yAxes[0] = { type: this.getYAxisScale() };
    this.barChart.update();
  };
  updateCharts = () => {
    this.updateLineChart();
    this.updateBarChart();
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
        <canvas
          style={{ padding: "5px 30px" }}
          ref={r => (this.ctxBarChart = r)}
        />
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
