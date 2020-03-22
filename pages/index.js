import React, { Component } from "react";
import axios from "axios";
import _ from "lodash";
import Chart from "chart.js";
import moment from "moment";
import numeral from "numeral";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Range } from "rc-slider";
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
    options: ["confirmed", "recovered", "deaths"],
    addedCountries: [],
    comparisonPoint: "confirmed"
  };
  getData = async () => {
    const mainCountry = this.state.country || this.props.country;
    let data = { [mainCountry]: await this.getCountryData(mainCountry) };
    for (const country of this.state.addedCountries)
      if (!data[country]) data[country] = await this.getCountryData(country);
    //if(_.size(this.stat.addedCountries))
    data = this.normalizeData(data);
    this.setState({ data }, this.updateCharts);
  };

  // only from 2 countries comparison
  normalizeData = data => {
    let max = 0;
    _.map(data, ({ federal }, country) => {
      if (_.size(federal) > max) max = _.size(federal);
    });
    const emptyPoint = {
      confirmed: 0,
      deaths: 0,
      recovered: 0
    };
    _.map(data, ({ federal }, country) => {
      if (_.size(federal) < max)
        data[country].federal = [
          ..._.map(_.range(max - _.size(federal)), f => emptyPoint),
          ...federal
        ];
    });
    return data;
  };
  isInDataRange = ({ date }) => {
    const { selectedRange = {} } = this.state;
    const { min, max } = selectedRange;
    if (!min && !max) return true;
    const rangeData = _.chain(this.state.data)
      .get(this.state.country)
      .get("federal")
      .map("date")
      .value();
    const minValue = rangeData[min];
    const maxValue = rangeData[max];
    return date >= minValue && date <= maxValue;
  };
  dateRange = () => {
    if (!_.size(this.state.data)) return;
    const rangeData = _.chain(this.state.data)
      .get(this.state.country)
      .get("federal")
      .map("date")
      .map(d => new moment(d).format("DD.MM"))
      .value();
    const marks = _.mapValues(
      _.mapKeys(rangeData, (date, n) => n),
      date => ({
        label: date,
        style: { transform: "rotate(-45deg)", "margin-left": "-25px" }
      })
    );

    const min = 0;
    const max = _.size(rangeData) - 1;
    const selectedRange = [
      _.get(this.state, "selectedRange.min", min),
      _.get(this.state, "selectedRange.max", max)
    ];
    // console.log(min, max);
    return (
      <div style={{ marginBottom: "25px", padding: "0 25px" }}>
        <p style={{ textAlign: "center", margin: 0 }}>
          {rangeData[selectedRange[0]] +
            ".2020 - " +
            rangeData[selectedRange[1]] +
            ".2020"}
        </p>
        <Range
          min={min}
          allowCross={false}
          max={max}
          step={1}
          marks={marks}
          defaultValue={[min, max]}
          onChange={range =>
            this.setState(
              {
                selectedRange: { min: _.first(range), max: _.last(range) }
              },
              this.updateCharts
            )
          }
        />
      </div>
    );
  };

  getCountryData = async country => {
    if (!this.props.countries.includes(country)) return []; // console.log("Country not found");
    const { data } = await axios.get(url + "historic?country=" + country);
    return data;
  };

  componentDidMount = async () => {
    await this.getData();

    this.chart = new Chart(this.ctx, this.chartParams());
  };
  getGraph = (data, option, i, country = "") => ({
    label: "# " + (country + " ") + option,
    data: _.map(_.filter(data, this.isInDataRange), option),
    backgroundColor: backgrounds[i % backgrounds.length],
    borderColor: borders[i % borders.length],
    borderWidth: 1
  });
  getDataSet = (data, index = 0) =>
    _.map(this.state.options, (option, i) => this.getGraph(data, option, i));
  getDataSets = () =>
    _.size(this.state.addedCountries) > 0
      ? _.map(
          [...this.state.addedCountries, this.state.country],
          (country, i) =>
            this.getGraph(
              this.state.data[country].federal,
              this.state.comparisonPoint,
              i,
              country
            )
        )
      : this.getDataSet(
          _.get(
            this.state,
            "data." + this.state.country + "." + this.state.selectedState,
            []
          )
        );

  getLabels = () =>
    _.chain(this.state)
      .get("data." + this.state.country + "." + this.state.selectedState, [])
      .filter(this.isInDataRange)
      .map(({ date }) => new moment(date).format("DD.MM.YY"))
      .concat("")
      .value();

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

  addCountry = country => {
    this.setState(
      {
        addedCountries: [...this.state.addedCountries, "World"]
      },
      this.getData
    );
  };
  removeCountry = index => {
    this.setState(
      {
        addedCountries: _.filter(
          this.state.addedCountries,
          (val, i) => i !== index - 1
        )
      },
      this.updateCharts
    );
  };
  changeCountry = (country, index) => {
    if (index === 0)
      return this.setState({ country, selectedState: "federal" }, this.getData);

    const addedCountries = this.state.addedCountries;
    addedCountries[index - 1] = country;

    this.setState(
      {
        addedCountries
      },
      this.getData
    );
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
  countrySelector = ({ countries = this.props.countries, index = 0 } = {}) => (
    <select
      onChange={({ target }) => this.changeCountry(target.value, index)}
      value={
        index == 0 ? this.state.country : this.state.addedCountries[index - 1]
      }
    >
      <option value="World">Worldwide - Select a country</option>
      {_.map(
        _.filter(countries, country => !_.eq(country, "global")),
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

  selectors = () =>
    _.map(
      [this.state.country, ...this.state.addedCountries],
      (country, index) => (
        <div className="row" key={index}>
          <div className="column">{this.countrySelector({ index })}</div>
          {index === 0 && <div className="column">{this.stateSelecter()}</div>}
          {index === 0 ? (
            <div className="column">{this.yLogScaleCheckbox()}</div>
          ) : (
            <button
              style={{ maxWidth: "25px", fontSize: "25" }}
              className="button"
              onClick={() => this.removeCountry(index)}
            >
              -
            </button>
          )}
        </div>
      )
    );

  comparisonSelector = () => (
    <>
      <select
        onChange={({ target }) =>
          this.setState({ comparisonPoint: target.value }, this.updateCharts)
        }
        value={this.state.comparisonPoint}
        style={{ maxWidth: "150px" }}
      >
        <option value="confirmed">Compare confirmed</option>
        <option value="recovered">Compare recovered</option>
        <option value="deaths">Compare deaths</option>
      </select>
    </>
  );

  render = () => (
    <div className="container">
      <div className="row">
        <div className="selectors-container">
          {_.size(this.state.addedCountries) > 0 && this.comparisonSelector()}
          {this.selectors()}
        </div>
      </div>

      <button
        style={{ maxWidth: "25px", fontSize: "25" }}
        className="button"
        onClick={this.addCountry}
      >
        +
      </button>
      <div>{this.dateRange()}</div>
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
}

const backgrounds = [
  "rgba(255, 99, 132, 0.2)",
  "rgba(54, 162, 235, 0.2)",
  "rgba(0, 0, 0, 0.2)",
  "rgba(75, 192, 192, 0.2)",
  "rgba(235, 64, 52 , 0.2",
  "rgba(52, 235, 89 , 0.2"
];
const borders = [
  "rgba(255, 99, 132, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(0, 0, 0, 1)",
  "rgba(75, 192, 192, 1)",
  "rgba(153, 102, 255, 1)",
  "rgba(255, 159, 64, 1)"
];
