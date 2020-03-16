import React, { Component } from "react";
import axios from "axios";
import _ from "lodash";
import Chart from "chart.js";
import moment from "moment";
export default class Home extends Component {
  static async getInitialProps({ query }) {
    const country = query.country || "Germany";
    const url = "http://localhost:2019/historic?country=" + country;
    const { data } = await axios.get(url);
    return {
      data,
      country
    };
  }
  state = {
    selectedState: "federal"
  };
  chartParams = {
    type: "line",
    data: {
      labels: _.map(
        _.get(this.props, "data." + this.state.selectedState, []),
        ({ date }) => new moment(date).format("DD.MM.YY")
      ),
      datasets: [
        {
          label: "# of Confirmed cases",
          data: _.map(
            _.get(this.props, "data." + this.state.selectedState, []),
            "confirmed"
          ),
          backgroundColor: ["rgba(255, 99, 132, 0.2)"],
          borderColor: ["rgba(255, 99, 132, 1)"],
          borderWidth: 1
        }
      ]
    },
    options: {
      gridLines: {
        display: false
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
              beginAtZero: true
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
      <h4>{this.props.country}</h4>
      <canvas i ref={r => (this.ctx = r)} width="400" height="400" />
    </div>
  );
}
