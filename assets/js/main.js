const selectUf = document.querySelector('#select-uf');
const selectCity = document.querySelector('#select-city');
const selectDate = document.querySelector('#select-date');

const apiKey = 'e77d706b5d60460faef234037242910';

document.addEventListener('DOMContentLoaded', () => {

    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
        .then(response => {
            if (!response.ok) throw new Error('Erro');

            return response.json();
        })
        .then(data => {

            data.sort((a, b) => a.nome.localeCompare(b.nome))

            data.forEach(uf => {
                const optUf = document.createElement('option');
                optUf.textContent = uf.nome;
                optUf.value = uf.sigla;

                selectUf.appendChild(optUf);
            });
        });

    selectDate.value = (new Date()).toLocaleDateString("pt-BR");
})

function loadCities() {
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectUf.value}/municipios`)
        .then(response => {
            if (!response.ok) throw new Error('Erro');

            return response.json();
        })
        .then(data => {

            data.sort((a, b) => a.nome.localeCompare(b.nome))

            while (selectCity.children.length > 1) {
                if (selectCity.firstChild.id !== 'placeholder') {
                    selectCity.removeChild(selectCity.firstChild);
                }
            }

            data.forEach(city => {
                const optCity = document.createElement('option');
                optCity.textContent = city.nome;
                optCity.value = city.nome;

                selectCity.appendChild(optCity);
            });
        });
}

function getClimateData() {

    const city = setCityValue(selectCity.value);

    fetch(`http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=1&aqi=yes&alerts=no`)
        .then(response => {
            if (!response.ok) throw new Error('Erro');

            return response.json();
        })
        .then(data => {
            const keysAirQuality = Object.keys(data.current.air_quality);
            const airQualityIndex = data.current.air_quality["us-epa-index"];

            const teste = document.querySelector('.quality');

            function airQuality(index) {
                if (index >= 0 && index < 51) return 'Bom';
                if (index >= 51 && index < 151) return 'Moderado';
                if (index >= 101 && index < 151) return 'Insalubre para grupos de risco';
                if (index >= 151 && index < 201) return 'Insalubre';
                if (index >= 201 && index < 301) return 'Muito Insalubre';
                if (index >= 301) return 'Perigoso';
            }

            teste.innerHTML = airQuality(airQualityIndex);

            keysAirQuality.forEach(key => {
                if (document.getElementById(`${key}`)) {
                    document.getElementById(`${key}`).innerHTML = data.current.air_quality[`${key}`];
                }
            })

            const tbody = document.querySelector('#tbody');

            while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

            const time = data.forecast.forecastday[0].hour;
            time.forEach(c => {
                infoIntroduction(selectCity.value, selectUf.value)
                fillTable(c)
            })
        });
}

function infoIntroduction(city, uf) {
    const date = new Date();
    const pInfo = document.querySelector('#p-info');

    const today = date.toLocaleDateString("pt-BR");
    const h = date.getHours();
    const min = date.getMinutes();

    pInfo.innerHTML = `No dia <b>${today} às ${formatHours(h)}:${formatHours(min)}</b> foram coletados dados climáticos de <b>${city} - ${uf}</b> presentes no quadro abaixo.`
}

function fillTable(c) {
    // const tableBody = document.querySelector('#table');
    const tbody = document.querySelector('#tbody');

    const tr = document.createElement('tr');

    function addCell(content) {
        const td = document.createElement('td');
        td.textContent = content
        tr.appendChild(td);
    }

    addCell(c.time.split(' ')[1]);      // Hora
    addCell(c.condition.text);          // Condição do clima
    addCell(c.chance_of_rain);          // Chance de chuva
    addCell(c.temp_c);                  // Temperatura
    addCell(c.windchill_c);             // Sensação térmica
    addCell(c.humidity);                // Umidade
    addCell(c.wind_kph);                // Velocidade do vento

    tbody.appendChild(tr)
}

// Remove o acento e substiu o espaço (' ') por um hífen - (nome da cidade)
function setCityValue(city) {
    const notAccent = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return notAccent.includes(' ') ? notAccent.split(' ').join('-') : notAccent;
}

// Formata as horas e minutos
function formatHours(value) {
    return value < 10 ? '0' + value : value;
}

async function savePDF() {

    const elemento = document.getElementById("table")

    const options = {
        margin: [10, 10, 10, 10],
        filename: "relatorio.pdf",
        image: { type: 'png', quality: 1 },
        html2canvas: { scale: 1 },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'landscape',
        }
    }
    html2pdf().set(options).from(elemento).save()
}