var weatherCSV = 'csv/weather_data.csv';
var circuitInfoCSV = 'csv/event_info.csv';
var tireStrategiesCSV = 'csv/tire-strategies.csv';

var yearDropdown = document.getElementById('year');
var circuitDropdown = document.getElementById('circuit');
var circuitsByYear = {};
var selectedRace;
var driverStintData = {};
var colourScheme = [];
var stackedChart;

var colourSchemes = [
    {
        'HYPERSOFT': '#FEB4C3',
        'ULTRASOFT': '#B24BA6',
        'SUPERSOFT': '#BF2626',
        'SOFT': '#CFB01C',
        'MEDIUM': '#F5F5F5',
        'HARD': '#4491D2',
        'SUPERHARD': '#FF7F3E',
        'INTERMEDIATE': '#3AC82C',
        'WET': '#0CACE3'
    },
    {
        'SOFT': '#BF2626',
        'MEDIUM': '#CFB01C',
        'HARD': '#F5F5F5',
        'INTERMEDIATE': '#3AC82C',
        'WET': '#0CACE3'
    }
]

function updateCircuitDropdown() {
    const selectedYear = yearDropdown.value;
    circuitDropdown.innerHTML = '';
    circuitsByYear[selectedYear].forEach((circuit) => {
        const option = document.createElement('option');
        option.text = circuit;
        option.value = circuit;
        circuitDropdown.appendChild(option);
    });
    console.log(circuitDropdown.value);
    console.log(yearDropdown.value);
    changeImage();
}

window.addEventListener('load', function() {
    Papa.parse(tireStrategiesCSV, {
        download: true,
        header: true,
        complete: function (results) {
            var data = results.data;
            var years = new Set();

            for (var i = 0; i < data.length; i++) {
                years.add(data[i].Year);
            }
            years = [...years];
            console.log(years);

            for (var year = 0; year < years.length; year++) {
                var option = document.createElement('option');
                option.text = years[year];
                option.value = years[year];
                yearDropdown.add(option);
            }

            data.forEach((row) => {
                if (!circuitsByYear[row.Year]) {
                    circuitsByYear[row.Year] = [];
                }
                if (!circuitsByYear[row.Year].includes(row.Race)) {
                    circuitsByYear[row.Year].push(row.Race);
                }
            });

            // Populate circuitDropdown with options for first year
            const firstYear = years[0];
            circuitDropdown.innerHTML = '';
            circuitsByYear[firstYear].forEach((circuit) => {
                const option = document.createElement('option');
                option.text = circuit;
                option.value = circuit;
                circuitDropdown.appendChild(option);
            });
            updateCircuitDropdown();
        },
    });

    yearDropdown.addEventListener('change', function () {
        updateCircuitDropdown();
        updateEventInfo();
        updateWeatherInfo();
        createChart();
    });
    circuitDropdown.addEventListener('change', function() {
        var selectedCircuit = circuitDropdown.value;
        console.log(selectedCircuit);
        updateEventInfo();
        updateWeatherInfo();
        createChart();
    });
    updateWeatherInfo();
    updateEventInfo();
    createChart();
});

function updateEventInfo() {
    Papa.parse(circuitInfoCSV, {
        download: true,
        header: true,
        complete: function (results) {
            var data = results.data;
            var selectedRace = data.filter(function (row) {
                return (row.Year === yearDropdown.value && row.Name === circuitDropdown.value)
            })
            // console.log(selectedRace)
            document.getElementById('country').textContent = selectedRace[0].Country
            document.getElementById('location').textContent = selectedRace[0].Location
            document.getElementById('laps').textContent = selectedRace[0].Laps
        }
    })
}

function updateWeatherInfo() {
    Papa.parse(weatherCSV, {
        download: true,
        header: true,
        complete: function (results) {
            var data = results.data;
            selectedRace = data.filter(function (row) {
                return (row.Year === yearDropdown.value && row.Name === circuitDropdown.value)
            })
            console.log(selectedRace)
            document.getElementById('temp').textContent = selectedRace[0].Temperature
            document.getElementById('humidity').textContent = selectedRace[0].Humidity
            document.getElementById('pressure').textContent = selectedRace[0].Pressure
            document.getElementById('wind').textContent = selectedRace[0].Wind
        }
    })
}

function changeImage() {
    var currentYear = yearDropdown.value
    if (currentYear == 2018) {
        document.getElementById('tires').src='style/img/tires-2018.svg'
        colourScheme = colourSchemes[0];
        console.log(colourScheme)
    }
    else {
        document.getElementById('tires').src='style/img/tires.svg'
        colourScheme = colourSchemes[1];
        console.log(colourScheme)
    }
    console.log(document.getElementById('tires').src)
}

function getDriverStrategies() {
    return new Promise((resolve, reject) => {
        // Wait for selectedRace to be defined
        const checkSelectedRace = setInterval(() => {
            if (selectedRace) {
                clearInterval(checkSelectedRace);
                // selectedRace is defined, proceed with processing tire data
                var tireData = Papa.parse(tireStrategiesCSV, {
                    download: true,
                    header: true,
                    complete: function (results) {
                        var raceData = results.data.filter(function (row) {
                            return (row.Year === selectedRace[0].Year && row.Race === selectedRace[0].Name)
                        })
                        driverStintData = raceData.reduce(function (acc, row) {
                            if (!acc[row.Driver]) {
                                acc[row.Driver] = {
                                    compounds: [],
                                }
                            }

                            // acc[row.Driver].stints.push(row.Stint)
                            // acc[row.Driver].laps.push(row.StintLength)
                            acc[row.Driver].compounds.push(
                                {'name': row.Compound, 'laps': row.StintLength}
                            )
                            return acc;
                        }, {})
                        console.log(driverStintData)
                        resolve();
                    }
                })
            }
        }, 100)
    })
}

function createChart() {
    getDriverStrategies().then(() => {
        const data = Object.entries(driverStintData).map(([driver, { compounds }]) => ({
            driver,
            compounds,
        }));
        d3.select('#chart').selectAll("*").remove();
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const width = 800 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ") scale(0.8)");

        const drivers = Object.keys(data);
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.driver))
            .range([0, width])
            .padding(0.1);

        console.log(Object.keys(data))

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(drivers, driver => {
                return data[driver].compounds.reduce((acc, compound) => {
                    return acc + parseInt(compound.laps);
                }, 0);
            })])
            .range([height, 0]);

        var compounds = Object.keys(colourScheme)

        const stackedData = d3.stack()
            .keys(compounds)
            .value((d, key) => {
                const compound = d.compounds.find(c => c.name === key);
                return compound ? compound.laps : 0;
            })
            (data);

        console.log(stackedData)

        svg.selectAll("g")
            .data(stackedData)
            .join("g")
            .attr("class", "driver")
            .attr("fill", d => colourScheme[d.key])
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => xScale(d.data.driver))
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]))
            .attr("ry", 2)
            .transition()
            .duration(1000)
            .attr("width", xScale.bandwidth() - 10);

        const xAxis = d3.axisBottom(xScale);

        svg.append("g")
            .attr("transform", "translate(0, 450)")
            .call(xAxis);

        const yAxis = d3.axisLeft(yScale);

        svg.append("g")
            .attr("transform", "translate(0, 0)")
            .call(yAxis);

        svg.append("text")
            .attr("x", 250)
            .attr("y", 490)
            .attr("text-anchor", "middle")
            .style("font-family", "Formula1 Display")
            .attr("fill", "white")
            .text("Driver");

        svg.append("text")
            .attr("x", -250)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .style("font-family", "Formula1 Display")
            .attr("fill", "white")
            .text("Number of Laps");

        svg.selectAll(".domain")
            .style("stroke", "white");

        svg.selectAll(".tick line")
            .style("stroke", "white");

        svg.selectAll(".tick text")
            .style("font-family", "Formula1 Display")
            .style("color", "white");
    })
}