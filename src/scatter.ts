import * as d3 from "d3";
import { Unit } from ".";
import "./styles.css"

/**
 * Creates a scatter plot based on different unit specifications selected by the user.
 * Uses a dropdown list per axis to pick attributes for comparison.
 */
export async function createScatter(data: Unit[]) {

    // Set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 20, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;
    d3.select("#scatter").selectAll("svg").remove();

    // Append the svg object to the body of the page
    const svg = d3.select("#scatter")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    d3.select("#dropdown_container_x").selectAll("select").remove();
    d3.select("#dropdown_container_y").selectAll("select").remove();

    // Clickable options in the dropdown list
    const dropdown_list = [
        "weapon damage", "weapon max range", "movement speed", 
        "gold costs", "attack duration", "armor",
        "modifier max value"
    ];
    
    createDropDown(dropdown_list, "x_selection", "x");
    createDropDown(dropdown_list.reverse(), "y_selection", "y");
    
    d3.select('#x_selection')
    .on('change', function() {
        updateScatterPlot(data, width, height, margin);       
    });

    d3.select('#y_selection')
    .on('change', function() {
        updateScatterPlot(data, width, height, margin);
    });

    updateScatterPlot(data, width, height, margin);

    return svg.node();
}

/**
 * Returns specific data to plot based on the selected option for a specific axis
 * @param  {Unit}   unit           unit to return data from
 * @param  {string} selection_name option selected in dropdown list
 * @return {number}             numerical value to plot in the scatterplot
 */
function returnData(unit: Unit, selection_name: string, debug = false): number {

    switch(selection_name) {
        case "weapon damage" : return unit.weapons.map(wp => wp.damage)[0];
        case "weapon max range" : return unit.weapons.map(wp => wp.range.max)[0];
        case "movement speed" : return unit.movement.speed;
        case "gold costs" : return unit.costs.gold;
        case "modifier max value" : {
            if (debug) console.log("WEAPONS: " + JSON.stringify(unit.weapons.map(wp => wp.modifiers)));

            return unit.weapons.map(wp => {
                const modifierValues = wp.modifiers.map(m => m.value === null ? 0 : m.value);
                return modifierValues[0];
            })[0];
        };
        case "attack duration" : return unit.weapons.map(wp => wp.durations.attack)[0];
        case "armor" : return unit.armor.map(arm => arm.value)[0]; // check if there are more types of armor
    }
}

/**
 * Make a dropdown list for a given axis.
 */
function createDropDown(data: string[], name: string, axisName: string) {
    var dropDown = d3.select("#dropdown_container_" + axisName)
        .append("select")
        .attr("class", "selection")
        .attr("id", name);

    var options = dropDown.selectAll("option")
        .data(data)
        .enter()
        .append("option");
        options.text(function(d) {
            return d;
        });
}

/**
 * Update the plot to show the data corresponding to the dropdown selection. 
 */
function updateScatterPlot(data: Unit[], width: any, height: any, margin: any) {

    d3.select("#scatter").selectAll("svg").remove();
    
    // Retrieve the selected axis option from the dropdown menus
    const xSelectedOptionText = d3.select("#x_selection option:checked").text();
    const ySelectedOptionText = d3.select("#y_selection option:checked").text();
    
    // Determine domains for axes based on selected options
    const selectedDataX = data.map(unit => returnData(unit, xSelectedOptionText));
    const xDomain = d3.extent(selectedDataX);
    
    const selectedDataY = data.map(unit => returnData(unit, ySelectedOptionText));
    const yDomain = d3.extent(selectedDataY);
    
    const svg = d3.select("#scatter")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // Add X axis
    var x = d3.scaleLinear().domain(xDomain).range([ 0, width ]);
    const xAxis = d3.axisBottom(x);
    svg.append("g").attr("transform", "translate(0," + height + ")")
        .attr("class", "xAxis")
        .call(xAxis);
     
    // Add Y axis
    var y = d3.scaleLinear().domain(yDomain).range([ height, 0]);
    const yAxis = d3.axisLeft(y);
    svg.append("g")
        .attr("class", "yAxis")
        .call(yAxis);
    
    // Add graph title
    d3.select("#scatterplot_title")
        .text(capitalize(ySelectedOptionText) + " vs " + capitalize(xSelectedOptionText));

    // Add units (dots) to the scatterplot
    svg.append("g").selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(returnData(d, xSelectedOptionText)); } )
        .attr("cy", function (d) { return y(returnData(d, ySelectedOptionText)); } );

    // Draw a grid
    d3.selectAll("g.yAxis g.tick")
        .append("line")
        .attr("class", "gridline")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", width)
        .attr("y2", 0);

    d3.selectAll("g.xAxis g.tick")
        .append("line")
        .attr("class", "gridline")
        .attr("x1", 0)
        .attr("y1", -height)
        .attr("x2", 0)
        .attr("y2", 0);
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}