import React, { Component } from "react";
import _ from "lodash";
import geolocation from "geolocation";
import axios from "axios";
import CountriesSelector from "../components/countrySelector.js";
const url = process.env.URL || "https://corona.blloc.com/";
export default class Home extends Component {
  static async getInitialProps({ req }) {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const countries = await axios.get(url + "countries");
    const { data } = await axios.get("http://ip-api.com/json/" + ip);

    return {
      country: _.get(data, "country", null),
      countries: _.sortBy(countries.data)
    };
  }
  state = {
    queried: false,
    result: "NO",
    country: this.props.country,
    suggestions: [
      "#StayAtHome",
      "#StayTheFuckHome",
      "#QuarantineAndChill",
      "#stayhome",
      "#wirbleibenzuhause"
    ]
  };
  componentDidMount = async () => {
    console.log(this.state.country);
  };
  getLocation = async () => {
    // console.log("Getting location");
    try {
      const location = await getLocation();
    } catch (e) {}
  };
  countrySelected = country => {
    this.setState({ country, queried: true });
  };
  renderSelector = () => (
    <CountriesSelector
      countries={this.props.countries}
      onChange={this.countrySelected}
    />
  );
  render = () => (
    <div className="main">
      {this.state.queried ? (
        <>
          <h2>{this.state.result}</h2>
          <h4>{_.sample(this.state.suggestions)}</h4>
          <h5>{this.state.country}</h5>
          <button
            className="outlnied"
            onClick={() => this.setState({ queried: false })}
          >
            try another country
          </button>
        </>
      ) : (
        <>
          <div className="contianer">
            <h2>Where do you live?</h2>
            {this.renderSelector()}
          </div>
        </>
      )}
    </div>
  );
}

const getLocation = async () => {
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(function(err, position) {
      if (err) return reject(err);
      resolve(position);
    });
  });
};
