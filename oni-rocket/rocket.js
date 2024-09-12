"use strict";

var fuels = {
    "steam": 20,
    "petroleum": 40,
    "hydrogen": 60
};

var oxidisers = {
    "oxylite": 1.0,
    "oxygen": 1.33
};

var engines = {
    "steam": 2000,
    "petroleum": 200,
    "hydrogen": 500
};

var boundary_mass = 4009.456088116749;

function penalty(mass)
{
    return Math.max(mass, Math.pow(mass/300,3.2));
}

function near_fuel(distance, dry_mass, efficiency, scalar)
{
    // dist = fuel * efficiency - (mass + fuel*scalar)
    // dist = fuel * efficiency - mass - fuel*scalar
    // dist = fuel * (efficiency-scalar) - mass
    // dist+mass = fuel * (efficiency-2)
    return (distance + dry_mass) / (efficiency-scalar);
}

function dist_func(dry_mass, efficiency, fuel, scalar)
{
    return fuel * efficiency - penalty(dry_mass+scalar*fuel);
}

function far_fuel(distance, dry_mass, efficiency, max_fuel, scalar)
{
    var f0 = 0.0;
    var f1 = max_fuel;
    for (var i = 0; i < 30; i++) {
        var f = (f0 + f1)/2;
        var d = dist_func(dry_mass, efficiency, f, scalar);
        if (d > distance)
            f1 = f;
        else
            f0 = f;
        if (f1-f0 < 1)
            break;
    }
    return f1;
}

function calculate()
{
    var fuel_type      = document.getElementById("fuel_type").value;
    var oxidiser       = document.getElementById("oxidiser").value;
    var fuel_tanks     = Number(document.getElementById("fuel_tanks").value);
    var oxidiser_tanks = Number(document.getElementById("oxidiser_tanks").value);
    var research       = Number(document.getElementById("research").value);
    var cargo          = Number(document.getElementById("cargo").value);
    var sightseeing    = Number(document.getElementById("sightseeing").value);
    var oxidation;
    var scalar;
    var max_fuel;
    if (fuel_type == "steam") {
        oxidation = 1.0;
        scalar    = 1;
        max_fuel  = 900;
    }
    else {
        oxidation = oxidisers[oxidiser];
        scalar    = 2;
        max_fuel  = Math.min(fuel_tanks * 900, oxidiser_tanks * 2700);
    }

    var efficiency = fuels[fuel_type] * oxidation;
    var dry_mass = 200; // command module
    dry_mass += engines[fuel_type];
    dry_mass += (fuel_tanks + oxidiser_tanks) * 100;
    dry_mass += research * 200;
    dry_mass += cargo * 2000;
    dry_mass += sightseeing * 200;

    // D = e*f - ((2*f+dm)/300)^3.2
    // => dD/df = e - (2/300)*3.2*((2*f+dm)/300)^2.2
    // => dD/df=0 => ((2*f+dm)/300)^2.2 = 300/(2*3.2)*e
    var limit_fuel = (300*Math.pow(efficiency*46.875,1/2.2)-dry_mass)/2;
    var range_fuel = Math.min(max_fuel, limit_fuel);
    var max_range = dist_func(dry_mass, efficiency, range_fuel, scalar);
    var results = [];

    if (max_range > 0) {
        var boundary_fuel = (boundary_mass - dry_mass)/2;
        var boundary_range = boundary_fuel * efficiency - boundary_mass;

        var distance;
        for (distance = 10000; distance < max_range; distance += 10000) {
            var fuel = (distance < boundary_range)
                ? near_fuel(distance, dry_mass, efficiency, scalar)
                : far_fuel(distance, dry_mass, efficiency, range_fuel, scalar);
            if (fuel > max_fuel)
                break;
            results.push([distance, fuel]);
        }
    }

    var node = document.getElementById("dry_mass");
    node.replaceChild(document.createTextNode(dry_mass.toFixed(0) + " kg"), node.firstChild);
    node = document.getElementById("max_fuel");
    node.replaceChild(document.createTextNode(max_fuel.toFixed(0) + " kg"), node.firstChild);
    node = document.getElementById("max_range");
    node.replaceChild(document.createTextNode(max_range.toFixed(0) + " km"), node.firstChild);

    var output = document.getElementById("results");
    while (output.hasChildNodes())
        output.removeChild(output.firstChild);
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var row = document.createElement("tr");
        var dist = document.createElement("td");
        dist.setAttribute("class", "distance");
        dist.textContent = result[0].toFixed(0);
        row.appendChild(dist);
        var fuel = document.createElement("td");
        fuel.setAttribute("class", "fuel");
        fuel.textContent = result[1].toFixed(1);
        row.appendChild(fuel);
        output.appendChild(row);
    }
}
