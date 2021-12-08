const API_BASE_URI = 'http://health.uustal.ee/heart-rate';
const SMOOTHING_AVG = 2;
let latestHeartRates = [];

let pfx = ["webkit", "moz", "MS", "o", ""]; // Allow browser prefixes to work for PrefixedEvent

function PrefixedEvent(element, type, callback) { // Allow one JS listener based on browser
    for (let p = 0; p < pfx.length; p++) {
        if (!pfx[p]) type = type.toLowerCase();
        element.addEventListener(pfx[p] + type, callback, false);
    }
}

function formatString(value) {
    if (value === 0 || value === undefined) {
        return "DED 💀"
    }
    return "❤  " + value + " BPM";
}

function calculatePulseSpeed(latestHr) {
    let seconds = 1;
    if (latestHeartRates.length === SMOOTHING_AVG) {
        let sum = 0;
        for (const hr of latestHeartRates) {
            sum += hr;
        }
        seconds = 60 / (sum / SMOOTHING_AVG);
        latestHeartRates.shift()
        console.log("Last " + SMOOTHING_AVG + " HR values: " + latestHeartRates + " average: " + Math.round(sum / SMOOTHING_AVG));
    }

    latestHeartRates.push(latestHr);
    return seconds;
}

function formatAverage(time, average) {
    if (average === undefined) {
        return "N/A"
    }
    return time + "h avg<br>" + average + " bpm";
}

function formatRssi(rssi) {
    if (rssi === undefined) {
        return "N/A"
    }
    return "rssi<br>" + rssi + " db"
}

function loop() {
    setTimeout(() => {
        $.ajax({
            url: API_BASE_URI,
            global: false,
            type: "GET",
            dataType: "json"
        }).done(function (data) {
            const pulseInterval = calculatePulseSpeed(data.heartRate);
            const refreshRate = Math.round(pulseInterval * 1000);
            let $hrate = $('.hrate');
            // let $stats = $('.stats');
            let $rssi = $('.rssi');
            let $avg60min = $('.avg60min');
            let $avg360min = $('.avg360min');

            console.log(data);
            console.log("ms per beat: " + refreshRate);

            $hrate.text(formatString(data.heartRate));
            $avg60min.html(formatAverage(1, data.hourlyAverage))
            $avg360min.html(formatAverage(6, data.sixHourAverage))
            $rssi.html(formatRssi(data.rssi))

            PrefixedEvent($hrate[0], "AnimationIteration", function () { // Apply the listener based on browser
                let el = $(this),
                    newOne = el.clone(true).css({'animation': 'pulse ' + refreshRate + 'ms infinite'});
                el.before(newOne);
                $("." + el.attr("class") + ":last").remove(); // Remove old element
                loop();
            });
        });
    }, 750);
}

$(function () {
    loop();
})
