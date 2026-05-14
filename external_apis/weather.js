async function get_forecasts() {
    try {
        const response = await fetch("https://meteo.report/var/data/forecasts/e0c04e2d-8221-48d3-92b9-56e26e743213.json")
        const data = await response.json()
        return data
    } catch (error) {
        console.log(error)
    }
}

async function get_bulletin() {
    try {
        const response = await fetch("https://meteo.report/var/data/forecasts/bulletin.json")
        const data = await response.json()
        return data
    } catch (error) {
        console.log(error)
    }
}

async function get_weather_labels() {
    try {
        const response = await fetch("https://manager.meteo.report/api/sky_conditions/")
        const data = await response.json()
        return data
    } catch (error) {
        console.log(error)
    }
}

function match_labels(sky_condition, labels) {
    const label = labels.find(item => item.id === sky_condition.toLowerCase())
    return label.name_ita
}

async function clean_weather_data() { //prendo i valori delle prossime 3 ore
    try {
        const now = new Date(Date.now())
        const forecasts = await get_forecasts()
        const bulletin = await get_bulletin()
        const labels = await get_weather_labels()

        let next_3hrs_id 
        for (obj of bulletin.instant) {
            const obj_date = new Date(obj.start)
            if (now < obj_date) {
                const hr_diff = Math.abs((now - obj_date)/(1000*60*60))
                if (hr_diff < 1.5) {
                    next_3hrs_id = obj.id
                } else {
                    next_3hrs_id = obj.id - 180
                }
                break
            }
        }
        if (!next_3hrs_id) {
            throw new Error("Non ci sono dati disponibili")
        }
        const forecast_3hrs = forecasts['180'][next_3hrs_id]
        return {temperature: forecast_3hrs.temperature, label: match_labels(forecast_3hrs.sky_condition, labels)}
    } catch (error) {
        console.log(error)
    }
}

module.exports = clean_weather_data