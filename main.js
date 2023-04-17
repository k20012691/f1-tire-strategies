var weatherCSV = 'csv/weather_data.csv';
var circuitInfoCSV = 'csv/event_info.csv';
var tireStrategiesCSV = 'csv/tire-strategies.csv';

Papa.parse(tireStrategiesCSV, {
    download: true,
    header: true,
    complete: function (results) {
        var data = results.data
        var yearDropdown = document.getElementById('year');
        var circuitDropdown = document.getElementById('circuit')

        var years = []
        for (var y = 0; y < data.length; y++) {
            years.push(data[y].Year)
        }
        years = [...new Set(years)]

        var circuits = []
        for (var r = 0; r < data.length; r++) {
            circuits.push(data[r].Race)
        }
        circuits = [...new Set(circuits)]

        for (var i = 0; i < years.length; i++) {
            var option = document.createElement('option');
            option.value = years[i]
            option.text = years[i]
            yearDropdown.add(option);
        }

        for (var j = 0; j < circuits.length; j++) {
            var circuitOption = document.createElement('option');
            console.log(circuits[j])
            circuitOption.value = circuits[j]
            circuitOption.text = circuits[j]
            circuitDropdown.add(circuitOption);
        }
        changeImage();
        updateOptions();

    }
    }
)

function updateOptions() {
    var yearDropdown = document.getElementById('year');
    var selectedYear = yearDropdown.value;
    var circuitDropdown = document.getElementById('circuit');
    circuitDropdown.innerHTML = ''; // clear existing options
    if (selectedYear === '') {
        return; // no year selected, nothing to do
    }
    // Populate options from CSV rows with selected year
    Papa.parse(tireStrategiesCSV, {
        download: true,
        header: true,
        complete: function(results) {
            var races = new Set();
            results.data.forEach(function(row) {
                if (row.Year === selectedYear) {
                    races.add(row.Race);
                }
            });
            races.forEach(function(option) {
                var optionElem = document.createElement('option');
                optionElem.text = option;
                optionElem.value = option;
                circuitDropdown.add(optionElem);
            });
        }
    });
    changeImage();
}

function changeImage() {
    var yearDropdown = document.getElementById('year')
    var currentYear = yearDropdown.value
    console.log(currentYear)
    if (currentYear == 2018) {
        document.getElementById('tires').src='style/img/tires-2018.svg'
    }
    else {
        document.getElementById('tires').src='style/img/tires.svg'
    }
    console.log(document.getElementById('tires').src)
}