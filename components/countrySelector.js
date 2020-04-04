import _ from "lodash";

export default ({ onChange, defaultCountry, countries }) => (
	<select
		onChange={({ target }) => onChange(target.value)}
		value={defaultCountry}
	>
		<option value="World">Worldwide - Select your country</option>
		{_.map(
			_.filter(countries, country => !_.eq(country, "null")),
			(state, i) => (
				<option key={i} value={state}>
					{state}
				</option>
			)
		)}
	</select>
);
