
// TODO: Detect and adapt to available block size
// const w = client.screenWidth - ( margin.left + margin.right );

/**
 * Reference: https://d3-graph-gallery.com/graph/arc_highlight.html
 */

// set the dimensions and margins of the graph
var margin = {top: 20, right: 30, bottom: 20, left: 30},
  width = 800 - margin.left - margin.right,
  height = 450 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");


function update(data) {

  // List of node names
  var allNodes = data.nodes.map(function(d){return d.name})

  // A linear scale to position the nodes on the X axis
  var x = d3.scalePoint()
    .range([0, width])
    .domain(allNodes)

  // Add the circle for the nodes
  var nodes = svg
    .selectAll("mynodes")
    .data(data.nodes)
    .enter()
    .append("circle")
      .attr("cx", function(d){ return(x(d.name))})
      .attr("cy", height-30)
      .attr("r", 8)
      .style("fill", "#ccc")

  // And give them a label
  var labels = svg
    .selectAll("mylabels")
    .data(data.nodes)
    .enter()
    .append("text")
      .attr("x", function(d){ return(x(d.name))})
      .attr("y", height-5)
      // .text(function(d){ return(d.name)})
      .text(function(d) {
        const firstName = d.name.split(' ')[0]
        return firstName
      })
      .style("text-anchor", "middle")

  // Add hash map between IDs and their nodes
  var idToNode = {};
  data.nodes.forEach(function (n) {
    idToNode[n.id] = n;
  });

  // Add the links
  var links = svg
    .selectAll('mylinks')
    .data(data.links)
    .enter()
    .append('path')
    .attr('d', function (d) {
      let start = x(idToNode[d.source].name)    // X position of start node on the X axis
      let end = x(idToNode[d.target].name)      // X position of end node
      return ['M', start, height-30,    // the arc starts at the coordinate x=start, y=height-30 (where the starting node is)
        'A',                            // This means we're gonna build an elliptical arc
        (start - end)/2, ',',    // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
        (start - end)/2, 0, 0, ',',
        start < end ? 1 : 0, end, ',', height-30] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
        .join(' ');
    })
    .style("fill", "none")
    .attr("stroke", "#ccc")
    .attr("stroke-width", function(d) { return d.weight })

    // Add the highlighting functionality
    nodes
      .on('mouseover', function (d) {
        // Highlight the nodes: every node is green except of him
        nodes.style('fill', "#ccc")
        d3.select(this).style('fill', 'orange')
        // Highlight the connections
        links
          .style('stroke', function (link_d) { return link_d.source === d.id || link_d.target === d.id ? 'orange' : '#ccc';})
        //   .style('stroke-width', function (link_d) { return link_d.source === d.id || link_d.target === d.id ? 4 : 1;})
      })
      .on('mouseout', function (d) {
        nodes.style('fill', "#ccc")
        links
          .style('stroke', '#ccc')
        //   .style('stroke-width', '1')
      })
}

export {
    update
};
