// const API_BASE_URI = 'http://192.168.1.198/events';
const API_BASE_URI = 'http://health.uustal.ee/events';
const source = new EventSource(API_BASE_URI);

let data = [];
let ded = false;
source.addEventListener('SSE_EVENT', function (e) {
    console.log("SSE_EVENT " + e.data);
    data = JSON.parse(e.data);
}, false);
source.addEventListener('open', function (e) {
}, false);

source.addEventListener('error', function (e) {
    if (e.readyState === EventSource.CLOSED) {
        ded = true;
    }
}, false);

let pfx = ["webkit", "moz", "MS", "o", ""]; // Allow browser prefixes to work for PrefixedEvent
function PrefixedEvent(element, type, callback) { // Allow one JS listener based on browser
    for (let p = 0; p < pfx.length; p++) {
        if (!pfx[p]) {
            type = type.toLowerCase();
        }
        element.addEventListener(pfx[p] + type, callback, false);
    }
}

let hr = 0;
let rssi = 0;
let timestamp = 0;
let hourlyAverage = 0;
let sixHourAverage = 0;

function animate() {
    if (ded) {
        data = undefined;
    }
    if (data !== undefined) {
        hr = data.heartRate;
        rssi = data.rssi;
        timestamp = data.timestamp;
        hourlyAverage = data.hourlyAverage;
        sixHourAverage = data.sixHourAverage;
    }

    let $hrate = $('.hrate');
    let $rssi = $('.rssi');
    let $avg60min = $('.avg60min');
    let $avg360min = $('.avg360min');

    const refreshRate = calculateRefreshRate(hr);
    console.log("ms per beat: " + refreshRate);

    $hrate.text(formatString(hr));
    $avg60min.html(formatAverage(1, hourlyAverage))
    $avg360min.html(formatAverage(6, sixHourAverage))
    $rssi.html(formatRssi(rssi))

    if ($hrate[0] === undefined) {
        return;
    }
    PrefixedEvent($hrate[0], "AnimationIteration", function () { // Apply the listener based on browser
        let el = $(this),
            newOne = el.clone(true).css({'animation': 'pulse ' + refreshRate + 'ms infinite'});
        el.before(newOne);
        $("." + el.attr("class") + ":last").remove(); // Remove old element
        animate()
    });
}

$(function () {
    animate();
})

function calculateRefreshRate(latestHr) {
    return Math.round(60 / latestHr * 1000);
}

function formatAverage(time, average) {
    if (average === undefined) {
        return "N/A"
    }
    return time + "h avg<br>" + average + " bpm";
}

function formatString(value) {
    if (value === 0 || value === undefined) {
        return "DED 💀"
    }
    return "❤  " + value + " BPM";
}

function formatRssi(rssi) {
    if (rssi === undefined) {
        return "N/A"
    }
    return "rssi<br>" + rssi + " db"
}
